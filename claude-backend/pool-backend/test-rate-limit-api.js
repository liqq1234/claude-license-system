// test-rate-limit-api.js
/**
 * 测试限流API接收功能
 * 模拟 claude-api-monitor 发送429限流数据
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

// 测试限流API - 基本功能
async function testBasicRateLimitApi() {
  colorLog('cyan', '\n📡 测试基本限流API接收...');
  
  const testData = {
    type: 'rate_limit_detected',
    timestamp: Date.now(),
    url: 'https://claude.lqqmail.xyz/api/organizations/7b8556b4-d293-4e5c-af82-ba03e4d26238/chat_conversations/4dcc96ed-c1d1-4a92-90ac-d84f444249b1/completion',
    status: 429,
    statusText: 'Too Many Requests',
    resetsAt: Math.floor(Date.now() / 1000) + 300, // 5分钟后重置
    limitType: 'five_hour',
    source: 'api_response',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    hostname: 'claude.lqqmail.xyz'
  };
  
  try {
    console.log('📤 发送测试数据:', JSON.stringify(testData, null, 2));
    
    const response = await fetch(`${SERVER_URL}/api/rate-limit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      colorLog('green', '✅ 基本限流API测试成功');
      console.log('响应:', result);
    } else {
      colorLog('red', '❌ 基本限流API测试失败');
      console.log('错误:', result);
    }
  } catch (error) {
    colorLog('red', '💥 基本限流API测试异常:', error.message);
  }
}

// 测试限流API - Claude特有格式
async function testClaudeSpecificFormat() {
  colorLog('cyan', '\n🎯 测试Claude特有格式限流数据...');
  
  const testData = {
    type: 'rate_limit_detected',
    timestamp: Date.now(),
    url: 'https://claude.lqqmail.xyz/api/organizations/0cf4053c-2e11-46de-ab1c-c3e47b26e756/chat_conversations/2d6ada74-ed64-4ed0-9620-a3c38c1db6b0/completion',
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
      representativeClaim: 'five_hour',
      overageStatus: null,
      overageResetsAt: null,
      debug_req_est_usage: null,
      debug_req_actual_usage: null,
      debug_five_hour_used: null,
      debug_five_hour_total_limit: null,
      debug_five_hour_claim_status: null,
      debug_seven_day_used: null,
      debug_seven_day_total_limit: null,
      debug_seven_day_claim_status: null,
      debug_overage_used: null,
      debug_overage_total_limit: null,
      debug_overage_claim_status: null
    }
  };
  
  try {
    console.log('📤 发送Claude特有格式数据...');
    console.log(`🕐 重置时间戳: ${testData.resetsAt}`);
    console.log(`🕐 转换后时间: ${new Date(testData.resetsAt * 1000).toLocaleString('zh-CN')}`);
    
    const response = await fetch(`${SERVER_URL}/api/rate-limit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      colorLog('green', '✅ Claude特有格式测试成功');
      console.log('响应:', result);
    } else {
      colorLog('red', '❌ Claude特有格式测试失败');
      console.log('错误:', result);
    }
  } catch (error) {
    colorLog('red', '💥 Claude特有格式测试异常:', error.message);
  }
}

// 测试限流API - 页面消息格式
async function testPageMessageFormat() {
  colorLog('cyan', '\n📄 测试页面消息格式限流数据...');
  
  const testData = {
    type: 'rate_limit_detected',
    timestamp: Date.now(),
    url: 'https://claude.lqqmail.xyz/chat/new',
    resetsAt: Math.floor(Date.now() / 1000) + 1800, // 30分钟后重置
    resetTime: new Date(Date.now() + 1800000).toISOString(),
    limitType: 'free_messages',
    source: 'page_message',
    originalText: 'You are out of free messages until 2:30 PM',
    parsedTime: '2:30 PM',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    hostname: 'claude.lqqmail.xyz'
  };
  
  try {
    console.log('📤 发送页面消息格式数据...');
    console.log(`📄 原始文本: ${testData.originalText}`);
    console.log(`🕐 解析时间: ${testData.parsedTime}`);
    
    const response = await fetch(`${SERVER_URL}/api/rate-limit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      colorLog('green', '✅ 页面消息格式测试成功');
      console.log('响应:', result);
    } else {
      colorLog('red', '❌ 页面消息格式测试失败');
      console.log('错误:', result);
    }
  } catch (error) {
    colorLog('red', '💥 页面消息格式测试异常:', error.message);
  }
}

// 测试内置测试接口
async function testBuiltinTestApi() {
  colorLog('cyan', '\n🧪 测试内置测试接口...');
  
  try {
    const response = await fetch(`${SERVER_URL}/api/rate-limit/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (response.ok) {
      colorLog('green', '✅ 内置测试接口成功');
      console.log('响应:', result);
    } else {
      colorLog('red', '❌ 内置测试接口失败');
      console.log('错误:', result);
    }
  } catch (error) {
    colorLog('red', '💥 内置测试接口异常:', error.message);
  }
}

// 测试错误处理
async function testErrorHandling() {
  colorLog('cyan', '\n❌ 测试错误处理...');
  
  const invalidData = {
    // 缺少必要字段
    invalid: 'data'
  };
  
  try {
    console.log('📤 发送无效数据...');
    
    const response = await fetch(`${SERVER_URL}/api/rate-limit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invalidData)
    });
    
    const result = await response.json();
    
    if (response.status === 400) {
      colorLog('green', '✅ 错误处理测试成功 (正确返回400错误)');
      console.log('错误响应:', result);
    } else {
      colorLog('red', '❌ 错误处理测试失败 (应该返回400错误)');
      console.log('响应:', result);
    }
  } catch (error) {
    colorLog('red', '💥 错误处理测试异常:', error.message);
  }
}

// 主测试函数
async function runTests() {
  colorLog('bright', '🚀 开始测试限流API接收功能');
  colorLog('blue', `📡 服务器地址: ${SERVER_URL}`);
  
  // 测试服务器健康状态
  const isHealthy = await testServerHealth();
  if (!isHealthy) {
    colorLog('red', '❌ 服务器不健康，停止测试');
    return;
  }
  
  // 等待2秒
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 测试基本功能
  await testBasicRateLimitApi();
  
  // 等待2秒
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 测试Claude特有格式
  await testClaudeSpecificFormat();
  
  // 等待2秒
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 测试页面消息格式
  await testPageMessageFormat();
  
  // 等待2秒
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 测试内置测试接口
  await testBuiltinTestApi();
  
  // 等待2秒
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 测试错误处理
  await testErrorHandling();
  
  colorLog('bright', '\n🎉 所有测试完成！');
  
  colorLog('yellow', '\n💡 使用说明:');
  colorLog('yellow', '1. claude-api-monitor 会自动发送429数据到 /api/rate-limit');
  colorLog('yellow', '2. 后端会解析时间戳并计算重置时间');
  colorLog('yellow', '3. 控制台会显示详细的限流信息');
  colorLog('yellow', '4. 账户状态会自动更新为繁忙状态');
  
  colorLog('blue', '\n🔧 配置 claude-api-monitor:');
  colorLog('blue', '• 修改 inject-simple.js 中的 BACKEND_CONFIG.url');
  colorLog('blue', '• 设置为: http://localhost:3457/api/rate-limit');
  colorLog('blue', '• 确保 enabled: true');
}

// 运行测试
if (require.main === module) {
  runTests().catch(error => {
    colorLog('red', '💥 测试运行失败:', error.message);
    process.exit(1);
  });
}

module.exports = {
  testBasicRateLimitApi,
  testClaudeSpecificFormat,
  testPageMessageFormat,
  testBuiltinTestApi,
  testErrorHandling
};
