// 测试激活状态API
const axios = require('axios');

async function testActivationStatus() {
    try {
        // 这里需要用实际的用户token
        const response = await axios.get('http://localhost:8888/activation/status', {
            headers: {
                'Authorization': 'Bearer YOUR_TOKEN_HERE',
                'Content-Type': 'application/json'
            }
        });
        
        console.log('API Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('API Error:', error.response?.data || error.message);
    }
}

testActivationStatus();
