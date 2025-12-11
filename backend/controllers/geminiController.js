const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY || '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',
    baseURL: 'https://integrate.api.nvidia.com/v1',
});

exports.chat = async (req, res) => {
    try {
        const { messages, code, language, consoleOutput, executionError, testResults } = req.body;
        console.log(`[Gemini Chat] Received request. Code length: ${code?.length || 0}, Language: ${language}`);
        const stream = req.query.stream === 'true' || req.headers.accept === 'text/event-stream';

        // Construct the system prompt for Whiteboard Interviewer
        let systemPrompt = `You are a technical interviewer conducting a whiteboard interview.
        
CONTEXT:
The candidate's current code is provided below. YOU MUST READ AND REFERENCE THIS CODE in your response.

=== START CANDIDATE CODE ===
${code ? code : '(No code written yet)'}
=== END CANDIDATE CODE ===

Language: ${language || 'javascript'}

Execution Output:
${consoleOutput ? consoleOutput : '(No output)'}

Execution Error:
${executionError ? executionError : '(No error)'}

Test Results:
${testResults ? JSON.stringify(testResults, null, 2) : '(No tests run)'}

CRITICAL RULES:
1. Format your response as a markdown bulleted list.
2. Start every new thought with "-".
3. **Analyze the code above.** If the user asks "what's wrong?", refer to the specific lines in the code block.
4. If the code is empty, ask them to start coding.
5. Be concise. No spoilers. Ask guiding questions.`;

        // Prepare messages: prepend system prompt or use the user's /think trigger if intended, 
        // but combining Persona + Thinking capability usually works by just setting the persona 
        // and enabling the extra_body params. 
        const apiMessages = [
            { role: "system", content: systemPrompt },
            ...messages.map(m => ({ role: m.role, content: m.content }))
        ];

        if (stream) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            const completion = await openai.chat.completions.create({
                model: "nvidia/nvidia-nemotron-nano-9b-v2",
                messages: apiMessages,
                temperature: 0.6,
                top_p: 0.95,
                max_tokens: 2048,
                stream: true,
                extra_body: {
                    min_thinking_tokens: 0,
                    max_thinking_tokens: 1024 // Enabling thinking/reasoning
                }
            });

            for await (const chunk of completion) {
                // Handling Nemotron reasoning content if available
                const reasoning = chunk.choices[0]?.delta?.reasoning_content;
                // Currently we are only sending 'content' to the frontend. 
                // If we want to show reasoning, we'd need to modify the frontend to accept it.
                // For now, we'll log it or just focus on the main content to avoid breaking the UI.
                if (reasoning) {
                    // Optional: Send as a special event or comment? 
                    // console.log("Reasoning:", reasoning);
                }

                const content = chunk.choices[0]?.delta?.content;
                if (content) {
                    res.write(`data: ${JSON.stringify({ content: content, done: false })}\n\n`);
                }
            }
            res.write(`data: ${JSON.stringify({ content: '', done: true })}\n\n`);
            res.end();

        } else {
            // Non-streaming fallback
            const completion = await openai.chat.completions.create({
                model: "nvidia/nvidia-nemotron-nano-9b-v2",
                messages: apiMessages,
                temperature: 0.6,
                top_p: 0.95,
                max_tokens: 2048,
                stream: false,
                extra_body: {
                    min_thinking_tokens: 0,
                    max_thinking_tokens: 1024
                }
            });

            const text = completion.choices[0].message.content;
            res.json({ message: { role: 'assistant', content: text } });
        }

    } catch (err) {
        console.error('Nemotron AI Error:', err);
        if (!res.headersSent) {
            res.status(500).json({ error: err.message });
        } else {
            res.end();
        }
    }
};
