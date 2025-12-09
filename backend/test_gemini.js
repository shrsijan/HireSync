const axios = require('axios');

async function testGemini() {
    try {
        const response = await axios.post('http://localhost:5001/api/ai/gemini-chat', {
            messages: [
                { role: 'user', content: 'Hello, pretend you are an interviewer.' }
            ],
            code: 'console.log("Hello World")',
            language: 'javascript'
        });

        console.log('Status:', response.status);
        console.log('Response:', response.data);
    } catch (error) {
        if (error.response) {
            console.error('Error Status:', error.response.status);
            console.error('Error Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testGemini();
