const { Ollama } = require('ollama');

const ollama = new Ollama({ host: 'http://127.0.0.1:11434' });

exports.chat = async (req, res) => {
    try {
        const { messages, code } = req.body;
        const stream = req.query.stream === 'true' || req.headers.accept === 'text/event-stream';

        // Optimized system prompt - shorter and more focused
        const systemPrompt = `You are a technical interviewer. Candidate is coding in ${req.body.language || 'javascript'}. 
Code:
\`\`\`${code}\`\`\`
Provide concise feedback, ask questions, or guide them. Use bullet points. Be professional and encouraging.`;

        const chatMessages = [
            { role: 'system', content: systemPrompt },
            ...messages
        ];

        if (stream) {
            // Set headers for Server-Sent Events (SSE)
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            const streamResponse = await ollama.chat({
                model: 'llama3.2',
                messages: chatMessages,
                stream: true,
            });

            for await (const chunk of streamResponse) {
                if (chunk.message?.content) {
                    res.write(`data: ${JSON.stringify({ content: chunk.message.content, done: false })}\n\n`);
                }
            }
            res.write(`data: ${JSON.stringify({ content: '', done: true })}\n\n`);
            res.end();
        } else {
            // Non-streaming fallback
            const response = await ollama.chat({
                model: 'llama3.2',
                messages: chatMessages,
                options: {
                    temperature: 0.7,
                    num_predict: 200, // Limit response length for faster responses
                }
            });

            res.json({ message: response.message });
        }
    } catch (err) {
        console.error('AI Error:', err);
        res.status(500).send('AI Error');
    }
};
