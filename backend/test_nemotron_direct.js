const axios = require('axios');

const API_KEY = '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';

async function testNemotron() {
    try {
        console.log("Listing Nemotron Models...");
        const response = await axios.get(
            'https://integrate.api.nvidia.com/v1/models',
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Accept': 'application/json'
                }
            }
        );

        const models = response.data.data.map(m => m.id);
        const nemotronModels = models.filter(id => id.toLowerCase().includes('nemotron'));
        console.log("Nemotron Models:", nemotronModels);
    } catch (error) {
        console.error("Error testing Nemotron:");
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error('Data:', error.response.data);

            // If 404/400, maybe model name is wrong. Let's try listing models if this fails? 
            // Or try another model name backup.
        } else {
            console.error(error.message);
        }
    }
}

testNemotron();
