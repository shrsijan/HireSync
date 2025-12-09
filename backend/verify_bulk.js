const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

const API_URL = 'http://localhost:5001/api';

async function verifyBulkUpload() {
    try {
        // 1. Login/Get Token (Simulated or Hardcoded for dev environment if possible, or use Recruiter Login flow)
        // Since we don't have a quick login script, let's assume we can get a token or bypass auth for testing if we disable it temporarily.
        // Actually, let's try to login first if the user exists from previous setup.

        let token;
        try {
            const loginRes = await axios.post(`${API_URL}/auth/login`, {
                email: 'recruiter@example.com',
                password: 'password123'
            });
            token = loginRes.data.accessToken;
            console.log('Login successful');
        } catch (e) {
            console.log('Login failed, creating recruiter...');
            await axios.post(`${API_URL}/auth/register`, {
                name: 'Recruiter',
                email: 'recruiter@example.com',
                password: 'password123',
                role: 'recruiter'
            });
            const loginRes = await axios.post(`${API_URL}/auth/login`, {
                email: 'recruiter@example.com',
                password: 'password123'
            });
            token = loginRes.data.accessToken;
        }

        // 2. Create Assessment
        const assessmentRes = await axios.post(`${API_URL}/assessments`, {
            title: 'Bulk Test Assessment',
            role: 'Developer',
            timeLimit: 60,
            expiryDate: new Date(Date.now() + 86400000).toISOString(),
            questions: []
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const assessmentId = assessmentRes.data.assessment._id;
        console.log('Assessment created:', assessmentId);

        // 3. Create dummy CSV
        const csvContent = `FirstName,LastName,Email\nJohn,Doe,john@example.com\nJane,Smith,jane@example.com`;
        const csvPath = path.join(__dirname, 'test_candidates.csv');
        fs.writeFileSync(csvPath, csvContent);

        // 4. Upload CSV
        const formData = new FormData();
        formData.append('file', fs.createReadStream(csvPath));
        formData.append('assessmentId', assessmentId);

        const uploadRes = await axios.post(`${API_URL}/invitations/bulk`, formData, {
            headers: {
                ...formData.getHeaders(),
                Authorization: `Bearer ${token}`
            }
        });

        console.log('Bulk Upload Response:', uploadRes.data);

        if (uploadRes.data.count === 2) {
            console.log('SUCCESS: Bulk upload verified.');
        } else {
            console.error('FAILURE: Counts do not match.');
        }

        // Cleanup
        fs.unlinkSync(csvPath);

    } catch (err) {
        console.error('Verification Failed:', err.response ? err.response.data : err.message);
    }
}

verifyBulkUpload();
