// test-monitor-integration.js
/**
 * 测试 claude-api-monitor 与 pool-backend 的集成
 * 模拟完整的发送和接收流程
 */

const fetch = require('node-fetch');

// 测试配置
const SERVER_URL = 'http://localhost:3457';

// 颜色输出函数
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 模拟 claude-api-monitor 发送数据
async function simulateMonitorSend(testData, testName) {
  colorLog('cyan', `\n🔄 模拟 claude-api-monitor 发送: ${testName}`);
  
  try {
    console.log('📤 发送数据到后端...');
    console.log(`📍 后端地址: ${SERVER_URL}/api/rate-limit`);
    
    const startTime = Date.now();
    
    const response = await fetch(`${SERVER_URL}/api/rate-limit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
      signal: AbortSignal.timeout(5000) // 5秒超时
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      const result = await response.json();
      
      colorLog('green', '✅ 后端接收成功');
      console.log(`⏱️ 响应时间: ${responseTime}ms`);
      console.log('📊 响应数据:', JSON.stringify(result, null, 2));
      
      // 显示详细的处理结果（模拟 claude-api-monitor 的输出）
      if (result.data) {
        colorLog('blue', '📊 处理结果详情:');
        console.log(`   📍 来源: ${result.data.source}`);
        console.log(`   🏷️ 限制类型: ${result.data.limitType}`);
        if (result.data.resetTime) {
          console.log(`   🕐 重置时间: ${result.data.resetTime}`);
        }
        if (result.data.cooldownSeconds) {
          const minutes = Math.ceil(result.data.cooldownSeconds / 60);
          console.log(`   ⏳ 冷却时间: ${result.data.cooldownSeconds}秒 (${minutes}分钟)`);
        }
        if (result.data.organizationId) {
          console.log(`   🏢 组织ID: ${result.data.organizationId}`);
        }
      }
      
      return { success: true, result, responseTime };
      
    } else {
      const errorText = await response.text();
      
      colorLog('red', '❌ 后端响应错误');
      console.log(`📊 状态码: ${response.status} ${response.statusText}`);
      console.log(`⏱️ 响应时间: ${responseTime}ms`);
      console.log('💬 错误详情:', errorText);
      
      return { success: false, error: errorText, responseTime };
    }
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    colorLog('red', '💥 发送到后端失败');
    console.log(`⏱️ 响应时间: ${responseTime}ms`);
    console.log('💥 错误详情:');
    console.log(`   🌐 后端地址: ${SERVER_URL}/api/rate-limit`);
    console.log(`   ⏱️ 超时时间: 5000ms`);
    console.log(`   🔧 错误类型: ${error.name}`);
    console.log(`   💬 错误信息: ${error.message}`);
    
    if (error.name === 'AbortError') {
      console.log('   ⚠️ 请求超时，请检查后端服务是否正常运行');
    } else if (error.message.includes('fetch')) {
      console.log('   ⚠️ 网络连接失败，请检查后端地址是否正确');
    }
    
    return { success: false, error: error.message, responseTime };
  }
}

// 测试场景1：Claude API 429响应
async function testClaudeApi429() {
  const testData = {
    type: 'rate_limit_detected',
    timestamp: Date.now(),
    url: 'https://claude.lqqmail.xyz/api/organizations/7b8556b4-d293-4e5c-af82-ba03e4d26238/chat_conversations/4dcc96ed-c1d1-4a92-90ac-d84f444249b1/completion',
    status: 429,
    statusText: 'Too Many Requests',
    resetsAt: 1755147600, // 你提到的时间戳
    resetTime: new Date(1755147600 * 1000).toISOString(),
    limitType: 'five_hour',
    source: 'api_response',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    hostname: 'claude.lqqmail.xyz',
    rawResponse: {
      type: 'exceeded_limit',
      resetsAt: 1755147600,
      remaining: null,
      perModelLimit: false,
      representativeClaim: 'five_hour'
    }
  };
  
  return await simulateMonitorSend(testData, 'Claude API 429响应');
}

// 测试场景2：页面限制消息
async function testPageMessage() {
  const testData = {
    type: 'rate_limit_detected',
    timestamp: Date.now(),
    url: 'https://claude.lqqmail.xyz/chat/new',
    resetsAt: Math.floor(Date.now() / 1000) + 1800, // 30分钟后
    resetTime: new Date(Date.now() + 1800000).toISOString(),
    limitType: 'free_messages',
    source: 'page_message',
    originalText: 'You are out of free messages until 2:30 PM',
    parsedTime: '2:30 PM',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    hostname: 'claude.lqqmail.xyz'
  };
  
  return await simulateMonitorSend(testData, '页面限制消息');
}

// 测试场景3：网络错误模拟
async function testNetworkError() {
  colorLog('cyan', '\n🔄 模拟网络错误: 错误的后端地址');
  
  try {
    console.log('📤 发送数据到错误地址...');
    console.log('📍 错误地址: http://localhost:9999/api/rate-limit');
    
    const testData = {
      type: 'rate_limit_detected',
      timestamp: Date.now(),
      url: 'https://claude.lqqmail.xyz/api/test'
    };
    
    const response = await fetch('http://localhost:9999/api/rate-limit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
      signal: AbortSignal.timeout(3000) // 3秒超时
    });
    
    return { success: false, error: 'Should not reach here' };
    
  } catch (error) {
    colorLog('red', '💥 发送失败 (预期结果)');
    console.log('💥 错误详情:');
    console.log(`   🌐 后端地址: http://localhost:9999/api/rate-limit`);
    console.log(`   ⏱️ 超时时间: 3000ms`);
    console.log(`   🔧 错误类型: ${error.name}`);
    console.log(`   💬 错误信息: ${error.message}`);
    
    if (error.name === 'AbortError') {
      console.log('   ⚠️ 请求超时，请检查后端服务是否正常运行');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('   ⚠️ 连接被拒绝，后端服务未运行');
    }
    
    return { success: false, error: error.message };
  }
}

// 测试服务器健康状态
async function testServerHealth() {
  colorLog('cyan', '\n🔍 测试服务器健康状态...');
  
  try {
    const response = await fetch(`${SERVER_URL}/health`);
    const result = await response.json();
    
    if (response.ok && result.status === 'healthy') {
      colorLog('green', '✅ 服务器健康状态正常');
      return true;
    } else {
      colorLog('red', '❌ 服务器健康状态异常');
      console.log('结果:', result);
      return false;
    }
  } catch (error) {
    colorLog('red', '💥 服务器健康检查失败:', error.message);
    colorLog('yellow', '请确保服务器正在运行: npm run dev');
    return false;
  }
}

// 主测试函数
async function runIntegrationTests() {
  colorLog('bright', '🚀 开始测试 claude-api-monitor 与 pool-backend 集成');
  colorLog('blue', `📡 服务器地址: ${SERVER_URL}`);
  
  // 测试服务器健康状态
  const isHealthy = await testServerHealth();
  if (!isHealthy) {
    colorLog('red', '❌ 服务器不健康，停止测试');
    return;
  }
  
  const results = [];
  
  // 测试场景1：Claude API 429响应
  await new Promise(resolve => setTimeout(resolve, 2000));
  const result1 = await testClaudeApi429();
  results.push({ name: 'Claude API 429响应', ...result1 });
  
  // 测试场景2：页面限制消息
  await new Promise(resolve => setTimeout(resolve, 2000));
  const result2 = await testPageMessage();
  results.push({ name: '页面限制消息', ...result2 });
  
  // 测试场景3：网络错误
  await new Promise(resolve => setTimeout(resolve, 2000));
  const result3 = await testNetworkError();
  results.push({ name: '网络错误模拟', ...result3 });
  
  // 显示测试总结
  colorLog('bright', '\n📊 测试结果总结:');
  
  let successCount = 0;
  results.forEach((result, index) => {
    const icon = result.success ? '✅' : '❌';
    const status = result.success ? '成功' : '失败';
    
    console.log(`${index + 1}. ${icon} ${result.name}: ${status}`);
    
    if (result.responseTime) {
      console.log(`   ⏱️ 响应时间: ${result.responseTime}ms`);
    }
    
    if (result.success) {
      successCount++;
    } else if (result.error) {
      console.log(`   💬 错误: ${result.error}`);
    }
  });
  
  colorLog('bright', `\n🎯 测试完成: ${successCount}/${results.length} 成功`);
  
  colorLog('yellow', '\n💡 使用说明:');
  colorLog('yellow', '1. claude-api-monitor 会在检测到429时自动发送数据');
  colorLog('yellow', '2. pool-backend 会解析数据并在控制台显示详细信息');
  colorLog('yellow', '3. 发送成功时会显示处理结果详情');
  colorLog('yellow', '4. 发送失败时会显示详细的错误信息');
  
  colorLog('blue', '\n🔧 claude-api-monitor 配置确认:');
  colorLog('blue', `• 后端地址: ${SERVER_URL}/api/rate-limit`);
  colorLog('blue', '• 启用状态: enabled: true');
  colorLog('blue', '• 超时时间: timeout: 5000ms');
}

// 运行测试
if (require.main === module) {
  runIntegrationTests().catch(error => {
    colorLog('red', '💥 测试运行失败:', error.message);
    process.exit(1);
  });
}

module.exports = {
  simulateMonitorSend,
  testClaudeApi429,
  testPageMessage,
  testNetworkError
};
