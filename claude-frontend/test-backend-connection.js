// 后端连接测试脚本
// 在浏览器控制台中运行此脚本来测试后端连接

console.log('🔧 开始测试后端连接...');

// 测试配置
const POOL_BACKEND_URL = 'http://localhost:3457';
const TEST_EMAIL = 'test@example.com';

// 测试函数
async function testBackendConnection() {
    console.log('='.repeat(50));
    console.log('🚀 后端连接测试开始');
    console.log('='.repeat(50));
    
    // 1. 测试健康检查
    try {
        console.log('📡 1. 测试健康检查...');
        const healthResponse = await fetch(`${POOL_BACKEND_URL}/health`);
        if (healthResponse.ok) {
            const healthText = await healthResponse.text();
            console.log('✅ 健康检查成功:', healthText);
        } else {
            console.log('❌ 健康检查失败:', healthResponse.status);
        }
    } catch (error) {
        console.log('❌ 健康检查异常:', error.message);
    }
    
    // 2. 测试获取所有账户状态
    try {
        console.log('📡 2. 测试获取所有账户状态...');
        const statusResponse = await fetch(`${POOL_BACKEND_URL}/api/accounts-status`);
        if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            console.log('✅ 获取状态成功:', statusData);
            console.log(`📊 共获取到 ${statusData.length} 个账户状态`);
        } else {
            console.log('❌ 获取状态失败:', statusResponse.status);
            const errorText = await statusResponse.text();
            console.log('❌ 错误详情:', errorText);
        }
    } catch (error) {
        console.log('❌ 获取状态异常:', error.message);
    }
    
    // 3. 测试记录账户使用
    try {
        console.log(`📡 3. 测试记录账户使用 (${TEST_EMAIL})...`);
        const usageResponse = await fetch(`${POOL_BACKEND_URL}/api/account-usage/${TEST_EMAIL}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_ip: 'test-ip',
                user_agent: 'test-agent'
            })
        });
        
        if (usageResponse.ok) {
            const usageData = await usageResponse.json();
            console.log('✅ 记录使用成功:', usageData);
        } else {
            console.log('❌ 记录使用失败:', usageResponse.status);
            const errorText = await usageResponse.text();
            console.log('❌ 错误详情:', errorText);
        }
    } catch (error) {
        console.log('❌ 记录使用异常:', error.message);
    }
    
    // 4. 测试获取单个账户状态
    try {
        console.log(`📡 4. 测试获取单个账户状态 (${TEST_EMAIL})...`);
        const singleStatusResponse = await fetch(`${POOL_BACKEND_URL}/api/account-status/${TEST_EMAIL}`);
        if (singleStatusResponse.ok) {
            const singleStatusData = await singleStatusResponse.json();
            console.log('✅ 获取单个状态成功:', singleStatusData);
        } else {
            console.log('❌ 获取单个状态失败:', singleStatusResponse.status);
            const errorText = await singleStatusResponse.text();
            console.log('❌ 错误详情:', errorText);
        }
    } catch (error) {
        console.log('❌ 获取单个状态异常:', error.message);
    }
    
    console.log('='.repeat(50));
    console.log('🏁 后端连接测试完成');
    console.log('='.repeat(50));
}

// 测试前端API封装
async function testFrontendAPI() {
    console.log('='.repeat(50));
    console.log('🎯 前端API封装测试开始');
    console.log('='.repeat(50));
    
    try {
        // 动态导入API模块
        const { claudePoolService } = await import('./src/api/claude-pool.js');
        
        // 测试获取所有状态
        console.log('📡 测试 getAllAccountsStatus...');
        const allStatus = await claudePoolService.getAllAccountsStatus();
        console.log('✅ getAllAccountsStatus 成功:', allStatus);
        
        // 测试记录使用
        console.log(`📡 测试 recordAccountUsage (${TEST_EMAIL})...`);
        const recordResult = await claudePoolService.recordAccountUsage(TEST_EMAIL);
        console.log('✅ recordAccountUsage 成功:', recordResult);
        
        // 测试获取单个状态
        console.log(`📡 测试 getAccountStatus (${TEST_EMAIL})...`);
        const singleStatus = await claudePoolService.getAccountStatus(TEST_EMAIL);
        console.log('✅ getAccountStatus 成功:', singleStatus);
        
    } catch (error) {
        console.log('❌ 前端API测试失败:', error.message);
        console.log('❌ 错误详情:', error);
    }
    
    console.log('='.repeat(50));
    console.log('🏁 前端API封装测试完成');
    console.log('='.repeat(50));
}

// 完整测试流程
async function runAllTests() {
    await testBackendConnection();
    await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
    await testFrontendAPI();
}

// 导出测试函数
window.testBackendConnection = testBackendConnection;
window.testFrontendAPI = testFrontendAPI;
window.runAllTests = runAllTests;

console.log('✅ 测试脚本已加载');
console.log('💡 使用方法:');
console.log('  - testBackendConnection() // 测试后端直接连接');
console.log('  - testFrontendAPI() // 测试前端API封装');
console.log('  - runAllTests() // 运行所有测试');

// 自动运行测试（可选）
// runAllTests();
