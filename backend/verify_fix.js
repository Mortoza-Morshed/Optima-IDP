const axios = require('axios');
const jwt = require('jsonwebtoken');

const API_URL = 'http://localhost:5000/api';

async function verifyFix() {
    try {
        // 1. Register a temporary user
        const email = `test_Verify_${Date.now()}@example.com`;
        const password = 'Password123!';
        const name = 'Test User';
        const company = 'TestCorp';

        console.log(`Registering user ${email}...`);
        await axios.post(`${API_URL}/auth/register`, {
            name,
            email,
            password,
            company
        });

        // 2. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email,
            password
        });

        const token = loginRes.data.accessToken;
        console.log('Token received:', token ? 'YES' : 'NO');

        // 3. Decode token manually (without secret, just to check payload)
        const parts = token.split('.');
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

        console.log('Decoded Payload Keys:', Object.keys(payload));
        console.log('Payload:', payload);

        // 4. Verify fields
        if (payload.company === company && payload._id === payload.id) {
            console.log('SUCCESS: Token contains company and _id!');
        } else {
            console.error('FAILURE: Token missing required fields.');
            process.exit(1);
        }

    } catch (err) {
        console.error('Verification failed:', err.response ? err.response.data : err.message);
        process.exit(1);
    }
}

verifyFix();
