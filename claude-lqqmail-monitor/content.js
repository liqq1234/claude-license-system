// content.js - 页面内容脚本，显示API状态
(function() {
  console.log('🔧 Claude LQQMail 内容脚本启动');
  
  let statusDisplay = null;
  let requestCount = 0;
  let lastStatus = null;
  
  // 创建状态显示
  function createStatusDisplay() {
    if (statusDisplay) return statusDisplay;
    
    statusDisplay = document.createElement('div');
    statusDisplay.id = 'claude-lqqmail-status';
    statusDisplay.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #ffffff;
      border: 2px solid #007bff;
      border-radius: 8px;
      padding: 12px;
      z-index: 10000;
      font-family: monospace;
      font-size: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      min-width: 280px;
      max-width: 400px;
    `;
    
    statusDisplay.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px; color: #007bff;">
        📡 Claude LQQMail API Monitor
      </div>
      <div id="status-content">等待 API 请求...</div>
    `;
    
    document.body.appendChild(statusDisplay);
    return statusDisplay;
  }
  
  // 更新状态显示
  function updateStatus(data) {
    const statusContent = document.getElementById('status-content');
    if (!statusContent) return;
    
    requestCount++;
    lastStatus = data;
    
    const time = new Date(data.timestamp).toLocaleTimeString();
    const statusColor = getStatusColor(data.statusCode);
    
    let statusHtml = `
      <div style="margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: ${statusColor}; font-weight: bold;">
            ${data.statusCode} ${data.statusLine || ''}
          </span>
          <span style="color: #666; font-size: 10px;">${time}</span>
        </div>
        <div style="font-size: 10px; color: #666; margin-top: 2px;">
          ${getShortUrl(data.url)}
        </div>
      </div>
    `;
    
    // 429 错误的特殊显示
    if (data.statusCode === 429 && data.parsedHeaders) {
      statusHtml += `
        <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 8px; margin: 8px 0;">
          <div style="color: #856404; font-weight: bold; margin-bottom: 4px;">
            🚫 请求被限制
          </div>
      `;
      
      if (data.parsedHeaders.retryAfter) {
        statusHtml += `<div style="color: #856404; font-size: 10px;">重试等待: ${data.parsedHeaders.retryAfter}秒</div>`;
      }
      
      if (data.parsedHeaders.xServer) {
        statusHtml += `<div style="color: #856404; font-size: 10px;">服务器: ${data.parsedHeaders.xServer}</div>`;
      }
      
      if (data.parsedHeaders.xShouldRetry) {
        statusHtml += `<div style="color: #856404; font-size: 10px;">建议重试: ${data.parsedHeaders.xShouldRetry}</div>`;
      }
      
      statusHtml += `</div>`;
    }
    
    statusHtml += `
      <div style="border-top: 1px solid #eee; padding-top: 8px; margin-top: 8px;">
        <div style="color: #666; font-size: 10px;">
          总请求: ${requestCount} | 
          <span onclick="clearStatus()" style="color: #007bff; cursor: pointer; text-decoration: underline;">清除</span>
        </div>
      </div>
    `;
    
    statusContent.innerHTML = statusHtml;
  }
  
  // 获取状态颜色
  function getStatusColor(status) {
    if (status >= 200 && status < 300) return '#28a745'; // 绿色
    if (status >= 300 && status < 400) return '#ffc107'; // 黄色
    if (status === 429) return '#fd7e14'; // 橙色
    if (status >= 400) return '#dc3545'; // 红色
    return '#6c757d'; // 灰色
  }
  
  // 获取短URL
  function getShortUrl(url) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      return `.../${pathParts[pathParts.length - 1]}`;
    } catch {
      return url.substring(url.length - 30);
    }
  }
  
  // 清除状态
  window.clearStatus = function() {
    requestCount = 0;
    const statusContent = document.getElementById('status-content');
    if (statusContent) {
      statusContent.innerHTML = '状态已清除，等待新请求...';
    }
  };
  
  // 监听来自后台脚本的消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'API_STATUS_UPDATE') {
      console.log('📊 收到API状态更新:', message.data);
      
      // 创建显示区域
      if (!statusDisplay) {
        createStatusDisplay();
      }
      
      // 更新状态
      updateStatus(message.data);
    }
  });
  
  // 注入页面脚本（可选，用于更深层的监听）
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('inject.js');
  script.onload = function() {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);
  
  console.log('✅ Claude LQQMail 内容脚本初始化完成');
})();
