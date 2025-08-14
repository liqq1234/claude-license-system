// test-account-status.js
/**
 * 测试账户状态管理功能
 * 模拟账户状态变化：空闲 → 繁忙(限流) → 空闲
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

// 格式化时间
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

// 测试获取所有账户状态
async function testGetAllAccountStatus() {
  colorLog('cyan', '\n📊 测试获取所有账户状态...');
  
  try {
    const response = await fetch(`${SERVER_URL}/api/account-status`);
    const result = await response.json();
    
    if (response.ok) {
      colorLog('green', '✅ 获取账户状态成功');
      
      console.log('\n📈 状态统计:');
      console.log(`  🟢 空闲: ${result.stats.idle}`);
      console.log(`  🔴 繁忙: ${result.stats.busy}`);
      console.log(`  🚫 限流: ${result.stats.rateLimited}`);
      console.log(`  ⚫ 错误: ${result.stats.error}`);
      console.log(`  📊 总计: ${result.stats.total}`);
      
      if (result.accounts && result.accounts.length > 0) {
        console.log('\n📋 账户详情:');
        result.accounts.forEach((account, index) => {
          const statusIcon = {
            'idle': '🟢',
            'busy': '🔴',
            'error': '⚫'
          }[account.status] || '❓';
          
          console.log(`\n${index + 1}. ${statusIcon} ${account.email}`);
          console.log(`   状态: ${account.status}`);
          
          if (account.status === 'busy' && account.remainingSeconds > 0) {
            console.log(`   重置时间: ${formatTime(account.remainingSeconds)}`);
            console.log(`   重置于: ${account.resetTime}`);
          }
          
          if (account.errorCount > 0) {
            console.log(`   错误次数: ${account.errorCount}`);
            if (account.lastErrorMessage) {
              console.log(`   最后错误: ${account.lastErrorMessage}`);
            }
          }
        });
      } else {
        colorLog('yellow', '⚠️ 没有找到账户状态信息');
      }
      
    } else {
      colorLog('red', '❌ 获取账户状态失败');
      console.log('错误:', result);
    }
  } catch (error) {
    colorLog('red', '💥 获取账户状态异常:', error.message);
  }
}

// 测试获取单个账户状态
async function testGetSingleAccountStatus(accountId) {
  colorLog('cyan', `\n🔍 测试获取单个账户状态: ${accountId}...`);
  
  try {
    const response = await fetch(`${SERVER_URL}/api/account-status/${accountId}`);
    const result = await response.json();
    
    if (response.ok) {
      colorLog('green', '✅ 获取单个账户状态成功');
      
      const statusIcon = {
        'idle': '🟢',
        'busy': '🔴',
        'error': '⚫'
      }[result.status] || '❓';
      
      console.log(`\n${statusIcon} 账户: ${result.email}`);
      console.log(`状态: ${result.status}`);
      
      if (result.isRateLimited && result.remainingSeconds > 0) {
        console.log(`重置倒计时: ${formatTime(result.remainingSeconds)}`);
        console.log(`重置时间: ${result.resetTime}`);
      }
      
      if (result.errorCount > 0) {
        console.log(`错误次数: ${result.errorCount}`);
      }
      
    } else if (response.status === 404) {
      colorLog('yellow', '⚠️ 账户未找到');
    } else {
      colorLog('red', '❌ 获取单个账户状态失败');
      console.log('错误:', result);
    }
  } catch (error) {
    colorLog('red', '💥 获取单个账户状态异常:', error.message);
  }
}

// 测试手动重置账户状态
async function testResetAccountStatus(accountId) {
  colorLog('cyan', `\n🔄 测试手动重置账户状态: ${accountId}...`);
  
  try {
    const response = await fetch(`${SERVER_URL}/api/account-status/${accountId}/reset`, {
      method: 'POST'
    });
    const result = await response.json();
    
    if (response.ok) {
      colorLog('green', '✅ 手动重置账户状态成功');
      console.log('结果:', result.message);
    } else if (response.status === 404) {
      colorLog('yellow', '⚠️ 账户未找到');
    } else {
      colorLog('red', '❌ 手动重置账户状态失败');
      console.log('错误:', result);
    }
  } catch (error) {
    colorLog('red', '💥 手动重置账户状态异常:', error.message);
  }
}

// 测试状态统计
async function testGetStatusStats() {
  colorLog('cyan', '\n📈 测试获取状态统计...');
  
  try {
    const response = await fetch(`${SERVER_URL}/api/account-status/stats`);
    const result = await response.json();
    
    if (response.ok) {
      colorLog('green', '✅ 获取状态统计成功');
      
      console.log('\n📊 详细统计:');
      console.log(`🟢 空闲账户: ${result.availableCount}`);
      console.log(`🔴 限流账户: ${result.rateLimitedCount}`);
      
      if (result.availableAccounts.length > 0) {
        console.log('\n🟢 可用账户:');
        result.availableAccounts.forEach((acc, index) => {
          console.log(`  ${index + 1}. ${acc.email}`);
        });
      }
      
      if (result.rateLimitedAccounts.length > 0) {
        console.log('\n🔴 限流账户:');
        result.rateLimitedAccounts.forEach((acc, index) => {
          console.log(`  ${index + 1}. ${acc.email} - 重置: ${formatTime(acc.remainingSeconds)}`);
        });
      }
      
    } else {
      colorLog('red', '❌ 获取状态统计失败');
      console.log('错误:', result);
    }
  } catch (error) {
    colorLog('red', '💥 获取状态统计异常:', error.message);
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
  colorLog('bright', '🚀 开始测试账户状态管理功能');
  colorLog('blue', `📡 服务器地址: ${SERVER_URL}`);
  
  // 测试服务器健康状态
  await testServerHealth();
  
  // 等待 2 秒
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 测试获取所有账户状态
  await testGetAllAccountStatus();
  
  // 等待 2 秒
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 测试状态统计
  await testGetStatusStats();
  
  // 等待 2 秒
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 测试获取单个账户状态（使用示例ID）
  await testGetSingleAccountStatus('1');
  
  // 等待 2 秒
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 测试手动重置账户状态
  await testResetAccountStatus('1');
  
  colorLog('bright', '\n🎉 所有测试完成！');
  colorLog('yellow', '\n💡 提示:');
  colorLog('yellow', '   - 账户状态会在用户登录时自动更新');
  colorLog('yellow', '   - 检测到429限流时，状态会变为繁忙并显示重置时间');
  colorLog('yellow', '   - 重置时间到期后，状态会自动变回空闲');
  colorLog('yellow', '   - 可以通过 API 手动重置账户状态');
}

// 运行测试
if (require.main === module) {
  runTests().catch(error => {
    colorLog('red', '💥 测试运行失败:', error.message);
    process.exit(1);
  });
}

module.exports = {
  testGetAllAccountStatus,
  testGetSingleAccountStatus,
  testResetAccountStatus,
  testGetStatusStats,
  testServerHealth
};
