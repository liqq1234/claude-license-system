// test-claude-status.js
/**
 * 测试 Claude 状态检测功能
 * 使用方法: node test-claude-status.js
 */

const fetch = require('node-fetch');

// 测试配置
const SERVER_URL = 'http://localhost:3457';
const TEST_URLS = [
  'https://claude.ai',
  'https://claude.lqqmail.xyz',
  'https://invalid-url-for-testing.com'
];

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

// 测试单个网站状态检测
async function testSingleStatus() {
  colorLog('cyan', '\n🔍 测试单个网站状态检测...');
  
  try {
    const response = await fetch(`${SERVER_URL}/api/claude-status?url=https://claude.lqqmail.xyz&timeout=10000`);
    const result = await response.json();
    
    if (response.ok) {
      colorLog('green', '✅ 单个状态检测成功');
      console.log('结果:', JSON.stringify(result, null, 2));
      
      if (result.isRateLimited) {
        colorLog('yellow', `⚠️ 网站被限流，冷却时间: ${result.cooldownTime}秒`);
      } else if (result.isAvailable) {
        colorLog('green', `✅ 网站可用，响应时间: ${result.responseTime}ms`);
      } else {
        colorLog('red', `❌ 网站不可用: ${result.errorMessage}`);
      }
    } else {
      colorLog('red', '❌ 单个状态检测失败');
      console.log('错误:', result);
    }
  } catch (error) {
    colorLog('red', '💥 单个状态检测异常:', error.message);
  }
}

// 测试批量网站状态检测
async function testBatchStatus() {
  colorLog('cyan', '\n🔍 测试批量网站状态检测...');
  
  try {
    const response = await fetch(`${SERVER_URL}/api/claude-status/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        urls: TEST_URLS,
        timeout: 10000
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      colorLog('green', '✅ 批量状态检测成功');
      console.log('摘要:', JSON.stringify(result.summary, null, 2));
      
      colorLog('blue', '\n详细结果:');
      for (const [url, status] of Object.entries(result.results)) {
        console.log(`\n🌐 ${url}:`);
        if (status.isRateLimited) {
          colorLog('yellow', `  ⚠️ 被限流 (${status.statusCode}) - 冷却时间: ${status.cooldownTime}秒`);
        } else if (status.isAvailable) {
          colorLog('green', `  ✅ 可用 (${status.statusCode}) - 响应时间: ${status.responseTime}ms`);
        } else {
          colorLog('red', `  ❌ 不可用 (${status.statusCode}) - ${status.errorMessage}`);
        }
      }
    } else {
      colorLog('red', '❌ 批量状态检测失败');
      console.log('错误:', result);
    }
  } catch (error) {
    colorLog('red', '💥 批量状态检测异常:', error.message);
  }
}

// 测试获取可用网站
async function testAvailableSites() {
  colorLog('cyan', '\n🔍 测试获取可用网站...');
  
  try {
    const response = await fetch(`${SERVER_URL}/api/claude-status/available`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        urls: TEST_URLS,
        timeout: 10000
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      colorLog('green', '✅ 获取可用网站成功');
      console.log('结果:', JSON.stringify(result, null, 2));
      
      if (result.count > 0) {
        colorLog('green', `🎉 找到 ${result.count} 个可用网站:`);
        result.availableUrls.forEach(url => {
          colorLog('green', `  ✅ ${url}`);
        });
      } else {
        colorLog('yellow', '⚠️ 没有找到可用的网站');
      }
    } else {
      colorLog('red', '❌ 获取可用网站失败');
      console.log('错误:', result);
    }
  } catch (error) {
    colorLog('red', '💥 获取可用网站异常:', error.message);
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
      console.log('服务器信息:', {
        版本: result.version,
        数据库状态: result.database.status,
        时间戳: result.timestamp
      });
    } else {
      colorLog('red', '❌ 服务器健康状态异常');
      console.log('结果:', result);
    }
  } catch (error) {
    colorLog('red', '💥 服务器健康检查失败:', error.message);
    colorLog('yellow', '请确保服务器正在运行: npm run dev');
  }
}

// 主测试函数
async function runTests() {
  colorLog('bright', '🚀 开始测试 Claude 状态检测功能');
  colorLog('blue', `📡 服务器地址: ${SERVER_URL}`);
  colorLog('blue', `🌐 测试网站: ${TEST_URLS.join(', ')}`);
  
  // 测试服务器健康状态
  await testServerHealth();
  
  // 等待一秒
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 测试单个网站状态检测
  await testSingleStatus();
  
  // 等待一秒
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 测试批量网站状态检测
  await testBatchStatus();
  
  // 等待一秒
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 测试获取可用网站
  await testAvailableSites();
  
  colorLog('bright', '\n🎉 所有测试完成！');
}

// 运行测试
if (require.main === module) {
  runTests().catch(error => {
    colorLog('red', '💥 测试运行失败:', error.message);
    process.exit(1);
  });
}

module.exports = {
  testSingleStatus,
  testBatchStatus,
  testAvailableSites,
  testServerHealth
};
