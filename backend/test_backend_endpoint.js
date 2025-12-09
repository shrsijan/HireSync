const axios = require('axios');

async function testBackend() {
    try {
        console.log("Testing Backend Chat Endpoint...");
        const response = await axios.post('http://localhost:5001/api/ai/gemini-chat', {
            messages: [
                { role: 'user', content: 'Hello, pretend you are an interviewer.' }
            ],
            code: 'console.log("Hello")',
            language: 'javascript'
        });

        console.log('Status:', response.status);
        console.log('Response Data:', response.data);
    } catch (error) {
        if (error.response) {
            console.error('Error Status:', error.response.status);
            console.error('Error Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testBackend();
