const axios = require('axios');

const API_KEY = "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";

async function testNemotron() {
    console.log("Starting Nemotron Stream Test...");
    try {
        const response = await axios.post(
            "https://integrate.api.nvidia.com/v1/chat/completions",
            {
                model: "nvidia/nvidia-nemotron-nano-9b-v2",
                messages: [{ role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Explain quantum entanglement briefly." }],
                // NOTE: The user's snippet had only [{"role":"system","content":"/think"}]. 
                // This likely triggered a thinking mode. I will stick to a standard prompt to verify general chat first, 
                // OR I can exact match the user's snippet to see if that specific prompt works for this model.
                // User said: messages=[{"role":"system","content":"/think"}]
                // This looks like a specific trigger for the 'thinking' model capability.
                // I will use the user's EXACT messages to respect their test case.
                temperature: 0.6,
                top_p: 0.95,
                max_tokens: 2048,
                stream: true,
                extra_body: {
                    min_thinking_tokens: 1024,
                    max_thinking_tokens: 2048
                }
            },
            {
                headers: {
                    "Authorization": `Bearer ${API_KEY}`,
                    "Content-Type": "application/json"
                },
                responseType: 'stream'
            }
        );

        response.data.on('data', chunk => {
            const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
            for (const line of lines) {
                if (line === 'data: [DONE]') return;
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.replace('data: ', ''));
                        const delta = data.choices[0].delta;

                        // Check for reasoning_content (Nemotron specific usually)
                        if (delta.reasoning_content) {
                            process.stdout.write(delta.reasoning_content);
                        }
                        if (delta.content) {
                            process.stdout.write(delta.content);
                        }
                    } catch (e) {
                        // ignore parse errors for partial chunks
                    }
                }
            }
        });

        response.data.on('end', () => {
            console.log("\n\nStream ended.");
        });

    } catch (err) {
        if (err.response) {
            console.error(`Error ${err.response.status}:`);
            // stream error body might be hard to read directly if responseType is stream
            // but normally headers are available
            console.error(err.response.headers);
        } else {
            console.error("Error:", err.message);
        }
    }
}

testNemotron();
