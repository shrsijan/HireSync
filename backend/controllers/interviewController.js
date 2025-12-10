const Interview = require('../models/Interview');
const Invitation = require('../models/Invitation');
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY || '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',
    baseURL: 'https://integrate.api.nvidia.com/v1',
});

exports.submitInterview = async (req, res) => {
    try {
        const { invitationId, code, language, messages } = req.body;
        console.log(`[submitInterview] Received submission for Invitation: ${invitationId}`);

        // 1. Find the invitation
        const invitation = await Invitation.findById(invitationId);
        if (!invitation) {
            console.log(`[submitInterview] Invitation not found: ${invitationId}`);
            return res.status(404).json({ msg: 'Invitation not found' });
        }
        console.log(`[submitInterview] Found Invitation. AssessmentId: ${invitation.assessmentId}`);

        // 2. Prepare context for AI Evaluation
        // We'll construct a prompt that asks Nemotron to evaluate.
        const transcript = messages.map(m => `${m.role}: ${m.content}`).join('\n');

        const evaluationPrompt = `
You are an expert Technical Hiring Manager evaluating a coding interview.
Context:
- Language: ${language}
- Final Code:
\`\`\`${language}
${code}
\`\`\`
- Interview Transcript:
${transcript}

Task:
Evaluate the candidate's performance based on the following **Best Practices**:

1. **Code Quality & Correctness (40 points)**
   - Does the code solve the problem correctly?
   - Is it clean, readable, and well-structured?
   - Did they handle edge cases?

2. **Problem Solving & Logic (30 points)**
   - Did they break down the problem before coding?
   - Did they think aloud and explain their thought process?
   - Did they use hints effectively without over-reliance?

3. **Communication & Collaboration (20 points)**
   - Were they professional, clear, and concise?
   - Did they ask clarifying questions?
   - Did they respond well to feedback?

4. **Verification & Testing (10 points)**
   - Did they dry-run or test their code?
   - Did they verify the logic against examples?

Output strictly in JSON format:
{
  "score": <number 0-100 (overall)>,
  "categoryScores": {
      "codeQuality": <number 0-40>,
      "problemSolving": <number 0-30>,
      "communication": <number 0-20>,
      "verification": <number 0-10>
  },
  "feedback": "<concise, professional summary for the recruiter highlighting key strengths and weaknesses>",
  "report": {
      "summary": "<1-2 sentence executive summary>",
      "strengths": ["<strength 1>", "<strength 2>", ...],
      "weaknesses": ["<weakness 1>", "<weakness 2>", ...],
      "codeAnalysis": "<comments on code structure, efficiency, and style>",
      "scoreExplanation": "<justification for the assigned score>"
  }
}
`;

        let score = 0;
        let categoryScores = {};
        let feedback = "Evaluation failed.";
        let report = {};

        try {
            const completion = await openai.chat.completions.create({
                model: "nvidia/nvidia-nemotron-nano-9b-v2",
                messages: [{ role: "user", content: evaluationPrompt }],
                temperature: 0.2, // Low temp for consistent scoring
                max_tokens: 1500,
                stream: false
            });

            const content = completion.choices[0].message.content;
            // Attempt to parse JSON. Models sometimes wrap in markdown code blocks.
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);
                score = result.score;
                categoryScores = result.categoryScores;
                feedback = result.feedback;
                report = result.report ? { ...result.report, generatedAt: new Date() } : {};
            } else {
                feedback = content; // Fallback if no JSON found
                score = 50; // Default fallback
                categoryScores = { codeQuality: 0, problemSolving: 0, communication: 0, verification: 0 };
            }

        } catch (aiError) {
            console.error("AI Evaluation Error:", aiError);
            feedback = "AI evaluation unavailable. Manual review required.";
        }

        // 3. Create or Update Interview Record
        // Check if an interview record already exists for this invitation
        let interview = await Interview.findOne({ invitationId });

        if (interview) {
            interview.code = code;
            interview.language = language;
            interview.messages = messages;
            interview.score = score;
            interview.categoryScores = categoryScores;
            interview.feedback = feedback;
            interview.report = report;
            interview.status = 'completed';
            interview.invitationId = invitationId; // Ensure link
            interview.token = invitation.token; // Save token
            // Determine assessmentId if not present (logic fix from previous step)
            if (!interview.assessmentId && invitation.assessmentId) {
                interview.assessmentId = invitation.assessmentId;
            }
            console.log(`[submitInterview] Updating existing interview. ID: ${interview._id} AssessmentID: ${interview.assessmentId} Token: ${interview.token}`);
            await interview.save();
        } else {
            console.log(`[submitInterview] Creating new interview. AssessmentID: ${invitation.assessmentId} Token: ${invitation.token}`);
            interview = new Interview({
                invitationId,
                assessmentId: invitation.assessmentId,
                candidateEmail: invitation.email,
                token: invitation.token, // Save token
                code,
                language,
                messages,
                score,
                categoryScores,
                feedback,
                report,
                status: 'completed'
            });
            await interview.save();
        }

        // 4. Update Invitation Status
        invitation.status = 'completed';
        await invitation.save();
        console.log(`[submitInterview] Completed successfully. Score: ${score}`);

        res.json({ success: true, score, feedback });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getInterviewsByAssessment = async (req, res) => {
    try {
        const { assessmentId } = req.params;
        console.log(`[getInterviewsByAssessment] Fetching for AssessmentID: ${assessmentId}`);
        const interviews = await Interview.find({ assessmentId, status: 'completed' }).sort({ createdAt: -1 });
        console.log(`[getInterviewsByAssessment] Found ${interviews.length} interviews.`);
        res.json(interviews);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
