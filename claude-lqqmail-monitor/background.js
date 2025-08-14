// background.js - 使用 webRequest API 监听网络请求
console.log('🔧 Claude LQQMail API Monitor 后台脚本启动');

// 后端配置
const BACKEND_CONFIG = {
  url: 'http://localhost:3000/api/claude-status', // 修改为您的后端地址
  enabled: true,
  timeout: 5000
};

// 发送数据到后端
async function sendToBackend(data) {
  if (!BACKEND_CONFIG.enabled) return;
  
  try {
    console.log('📤 发送API状态到后端:', data);
    
    const response = await fetch(BACKEND_CONFIG.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(BACKEND_CONFIG.timeout)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ 后端接收成功:', result);
      return result;
    } else {
      console.warn('⚠️ 后端响应错误:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ 发送到后端失败:', error);
  }
}

// 监听请求开始
chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    console.log('🚀 API 请求开始:', {
      url: details.url,
      method: details.method,
      timestamp: new Date().toISOString(),
      requestId: details.requestId
    });
    
    // 发送请求开始事件
    const requestData = {
      type: 'request_start',
      requestId: details.requestId,
      url: details.url,
      method: details.method,
      timestamp: Date.now(),
      timestampISO: new Date().toISOString(),
      tabId: details.tabId
    };
    
    sendToBackend(requestData);
  },
  {
    urls: [
      "*://claude.lqqmail.xyz/api/organizations/*/chat_conversations/*/completion",
      "*://claude.lqqmail.xyz/api/organizations/*/chat_conversations/*/retry_completion"
    ]
  },
  ["requestBody"]
);

// 监听请求完成
chrome.webRequest.onCompleted.addListener(
  function(details) {
    const responseData = {
      type: 'request_completed',
      requestId: details.requestId,
      url: details.url,
      method: details.method,
      statusCode: details.statusCode,
      statusLine: details.statusLine,
      timestamp: Date.now(),
      timestampISO: new Date().toISOString(),
      tabId: details.tabId,
      responseHeaders: details.responseHeaders || []
    };
    
    console.log('✅ API 请求完成:', {
      url: details.url,
      status: details.statusCode,
      statusLine: details.statusLine,
      timestamp: new Date().toISOString()
    });
    
    // 特别关注 429 状态
    if (details.statusCode === 429) {
      console.log('🚫 检测到 429 Too Many Requests!');
      responseData.is429 = true;
      
      // 提取有用的响应头
      const headers = {};
      if (details.responseHeaders) {
        details.responseHeaders.forEach(header => {
          headers[header.name.toLowerCase()] = header.value;
        });
      }
      
      responseData.parsedHeaders = {
        retryAfter: headers['retry-after'],
        contentType: headers['content-type'],
        server: headers['server'],
        xServer: headers['x-server'],
        xShouldRetry: headers['x-should-retry'],
        requestId: headers['request-id'],
        date: headers['date']
      };
    }
    
    // 发送响应数据
    sendToBackend(responseData);
    
    // 发送到内容脚本显示
    if (details.tabId && details.tabId > 0) {
      chrome.tabs.sendMessage(details.tabId, {
        type: 'API_STATUS_UPDATE',
        data: responseData
      }).catch(err => console.log('发送到内容脚本失败:', err));
    }
  },
  {
    urls: [
      "*://claude.lqqmail.xyz/api/organizations/*/chat_conversations/*/completion",
      "*://claude.lqqmail.xyz/api/organizations/*/chat_conversations/*/retry_completion"
    ]
  },
  ["responseHeaders"]
);

// 监听请求错误
chrome.webRequest.onErrorOccurred.addListener(
  function(details) {
    const errorData = {
      type: 'request_error',
      requestId: details.requestId,
      url: details.url,
      method: details.method,
      error: details.error,
      timestamp: Date.now(),
      timestampISO: new Date().toISOString(),
      tabId: details.tabId
    };
    
    console.log('❌ API 请求错误:', {
      url: details.url,
      error: details.error,
      timestamp: new Date().toISOString()
    });
    
    sendToBackend(errorData);
  },
  {
    urls: [
      "*://claude.lqqmail.xyz/api/organizations/*/chat_conversations/*/completion",
      "*://claude.lqqmail.xyz/api/organizations/*/chat_conversations/*/retry_completion"
    ]
  }
);

console.log('✅ Claude LQQMail API Monitor 后台脚本初始化完成');
