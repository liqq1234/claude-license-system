// test-org-id-extraction.js
/**
 * 测试组织ID提取功能
 */

const fetch = require('node-fetch');

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

// 模拟组织ID提取函数（从 TypeScript 转换）
function isValidUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

function extractOrgIdFromCookie(cookieString) {
  try {
    const cookies = cookieString.split('; ');
    const lastActiveOrgCookie = cookies.find(cookie => cookie.startsWith('lastActiveOrg='));
    
    if (lastActiveOrgCookie) {
      const orgId = lastActiveOrgCookie.split('=')[1];
      
      if (orgId && isValidUUID(orgId)) {
        return {
          organizationId: orgId,
          source: 'cookie',
          confidence: 'high'
        };
      }
    }
    
    return {
      organizationId: null,
      source: 'cookie',
      confidence: 'low',
      error: 'lastActiveOrg cookie not found or invalid format'
    };
    
  } catch (error) {
    return {
      organizationId: null,
      source: 'cookie',
      confidence: 'low',
      error: error.message
    };
  }
}

function extractOrgIdFromUrl(url) {
  try {
    // 匹配 /organizations/{orgId}/ 格式
    const orgMatch = url.match(/\/organizations\/([a-f0-9-]{36})\//);
    
    if (orgMatch && orgMatch[1]) {
      const orgId = orgMatch[1];
      
      if (isValidUUID(orgId)) {
        return {
          organizationId: orgId,
          source: 'url',
          confidence: 'high'
        };
      }
    }
    
    // 尝试通过 URL 分割的方式
    const urlParts = url.split('/');
    const orgIndex = urlParts.indexOf('organizations');
    
    if (orgIndex !== -1 && urlParts[orgIndex + 1]) {
      const orgId = urlParts[orgIndex + 1];
      
      if (isValidUUID(orgId)) {
        return {
          organizationId: orgId,
          source: 'url',
          confidence: 'medium'
        };
      }
    }
    
    return {
      organizationId: null,
      source: 'url',
      confidence: 'low',
      error: 'Organization ID not found in URL'
    };
    
  } catch (error) {
    return {
      organizationId: null,
      source: 'url',
      confidence: 'low',
      error: error.message
    };
  }
}

// 测试 Cookie 提取
function testCookieExtraction() {
  colorLog('cyan', '\n🍪 测试从 Cookie 中提取组织ID...');
  
  const testCases = [
    {
      name: '有效的 lastActiveOrg Cookie',
      cookie: 'sessionKey=sk-ant-sid01-xxx; lastActiveOrg=7b8556b4-d293-4e5c-af82-ba03e4d26238; other=value',
      expected: '7b8556b4-d293-4e5c-af82-ba03e4d26238'
    },
    {
      name: '无效的 UUID 格式',
      cookie: 'sessionKey=sk-ant-sid01-xxx; lastActiveOrg=invalid-uuid; other=value',
      expected: null
    },
    {
      name: '缺少 lastActiveOrg Cookie',
      cookie: 'sessionKey=sk-ant-sid01-xxx; other=value',
      expected: null
    },
    {
      name: '空 Cookie 字符串',
      cookie: '',
      expected: null
    }
  ];
  
  testCases.forEach((testCase, index) => {
    console.log(`\n${index + 1}. ${testCase.name}`);
    console.log(`   Cookie: ${testCase.cookie}`);
    
    const result = extractOrgIdFromCookie(testCase.cookie);
    
    console.log(`   结果: ${JSON.stringify(result, null, 2)}`);
    
    if (result.organizationId === testCase.expected) {
      colorLog('green', '   ✅ 测试通过');
    } else {
      colorLog('red', '   ❌ 测试失败');
      console.log(`   期望: ${testCase.expected}, 实际: ${result.organizationId}`);
    }
  });
}

// 测试 URL 提取
function testUrlExtraction() {
  colorLog('cyan', '\n🔗 测试从 URL 中提取组织ID...');
  
  const testCases = [
    {
      name: 'Claude API completion URL',
      url: 'https://claude.lqqmail.xyz/api/organizations/7b8556b4-d293-4e5c-af82-ba03e4d26238/chat_conversations/4dcc96ed-c1d1-4a92-90ac-d84f444249b1/completion',
      expected: '7b8556b4-d293-4e5c-af82-ba03e4d26238'
    },
    {
      name: 'Claude 组织设置 URL',
      url: 'https://claude.ai/api/organizations/0cf4053c-2e11-46de-ab1c-c3e47b26e756/settings',
      expected: '0cf4053c-2e11-46de-ab1c-c3e47b26e756'
    },
    {
      name: '不包含组织ID的 URL',
      url: 'https://claude.ai/chat/new',
      expected: null
    },
    {
      name: '无效的组织ID格式',
      url: 'https://claude.ai/api/organizations/invalid-id/settings',
      expected: null
    }
  ];
  
  testCases.forEach((testCase, index) => {
    console.log(`\n${index + 1}. ${testCase.name}`);
    console.log(`   URL: ${testCase.url}`);
    
    const result = extractOrgIdFromUrl(testCase.url);
    
    console.log(`   结果: ${JSON.stringify(result, null, 2)}`);
    
    if (result.organizationId === testCase.expected) {
      colorLog('green', '   ✅ 测试通过');
    } else {
      colorLog('red', '   ❌ 测试失败');
      console.log(`   期望: ${testCase.expected}, 实际: ${result.organizationId}`);
    }
  });
}

// 测试 UUID 验证
function testUUIDValidation() {
  colorLog('cyan', '\n🔍 测试 UUID 格式验证...');
  
  const testCases = [
    { uuid: '7b8556b4-d293-4e5c-af82-ba03e4d26238', valid: true },
    { uuid: '0cf4053c-2e11-46de-ab1c-c3e47b26e756', valid: true },
    { uuid: 'invalid-uuid', valid: false },
    { uuid: '7b8556b4-d293-4e5c-af82-ba03e4d2623', valid: false }, // 少一位
    { uuid: '7b8556b4-d293-4e5c-af82-ba03e4d26238x', valid: false }, // 多一位
    { uuid: '', valid: false },
    { uuid: '7B8556B4-D293-4E5C-AF82-BA03E4D26238', valid: true } // 大写
  ];
  
  testCases.forEach((testCase, index) => {
    console.log(`\n${index + 1}. UUID: ${testCase.uuid}`);
    
    const result = isValidUUID(testCase.uuid);
    
    if (result === testCase.valid) {
      colorLog('green', `   ✅ 测试通过 (${result ? '有效' : '无效'})`);
    } else {
      colorLog('red', `   ❌ 测试失败`);
      console.log(`   期望: ${testCase.valid}, 实际: ${result}`);
    }
  });
}

// 实际场景测试
function testRealWorldScenarios() {
  colorLog('cyan', '\n🌍 测试实际场景...');
  
  console.log('\n1. 模拟浏览器请求场景');
  const browserCookie = 'sessionKey=sk-ant-sid01-abcdef123456; lastActiveOrg=7b8556b4-d293-4e5c-af82-ba03e4d26238; _ga=GA1.2.123456789';
  const apiUrl = 'https://claude.lqqmail.xyz/api/organizations/7b8556b4-d293-4e5c-af82-ba03e4d26238/chat_conversations/4dcc96ed-c1d1-4a92-90ac-d84f444249b1/completion';
  
  console.log('Cookie:', browserCookie);
  console.log('API URL:', apiUrl);
  
  const cookieResult = extractOrgIdFromCookie(browserCookie);
  const urlResult = extractOrgIdFromUrl(apiUrl);
  
  console.log('\nCookie 提取结果:', JSON.stringify(cookieResult, null, 2));
  console.log('URL 提取结果:', JSON.stringify(urlResult, null, 2));
  
  if (cookieResult.organizationId === urlResult.organizationId) {
    colorLog('green', '✅ Cookie 和 URL 提取的组织ID一致');
  } else {
    colorLog('red', '❌ Cookie 和 URL 提取的组织ID不一致');
  }
}

// 主测试函数
async function runTests() {
  colorLog('bright', '🚀 开始测试组织ID提取功能');
  
  // 测试 UUID 验证
  testUUIDValidation();
  
  // 测试 Cookie 提取
  testCookieExtraction();
  
  // 测试 URL 提取
  testUrlExtraction();
  
  // 测试实际场景
  testRealWorldScenarios();
  
  colorLog('bright', '\n🎉 所有测试完成！');
  
  colorLog('yellow', '\n💡 使用建议:');
  colorLog('yellow', '1. 优先使用 Cookie 中的 lastActiveOrg 字段');
  colorLog('yellow', '2. 如果 Cookie 不可用，从 API URL 中解析');
  colorLog('yellow', '3. 最后使用默认的组织ID作为备选');
  colorLog('yellow', '4. 始终验证提取的 UUID 格式是否正确');
  
  colorLog('blue', '\n📋 Claude Usage Extension 的方法:');
  colorLog('blue', '• Cookie: document.cookie 中的 lastActiveOrg 字段');
  colorLog('blue', '• URL: /organizations/{orgId}/ 路径解析');
  colorLog('blue', '• 拦截: HTTP 请求拦截获取 URL 参数');
}

// 运行测试
if (require.main === module) {
  runTests().catch(error => {
    colorLog('red', '💥 测试运行失败:', error.message);
    process.exit(1);
  });
}

module.exports = {
  extractOrgIdFromCookie,
  extractOrgIdFromUrl,
  isValidUUID,
  testCookieExtraction,
  testUrlExtraction,
  testUUIDValidation
};
