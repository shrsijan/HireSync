const { Ollama } = require('ollama');

const ollama = new Ollama({ host: 'http://127.0.0.1:11434' });

exports.chat = async (req, res) => {
    try {
        const { messages, code } = req.body;

        // Construct the system prompt
        const systemPrompt = `You are an expert technical interviewer. 
    The candidate is writing code in ${req.body.language || 'javascript'}.
    Here is their current code:
    \`\`\`
    ${code}
    \`\`\`
    Analyze the code and the user's latest message. 
    Provide feedback, ask follow-up questions, or guide them if they are stuck.
    Be professional but encouraging.
    IMPORTANT: Format your response using bullet points for clarity and readability. Keep answers concise.`;

        const chatMessages = [
            { role: 'system', content: systemPrompt },
            ...messages
        ];

        const response = await ollama.chat({
            model: 'llama3.2', // Or whatever model the user has
            messages: chatMessages,
        });

        res.json({ message: response.message });
    } catch (err) {
        console.error(err);
        res.status(500).send('AI Error');
    }
};
