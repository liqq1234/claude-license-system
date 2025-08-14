// inject.js - 页面注入脚本，用于更深层的fetch拦截
(function() {
  console.log('🔧 Claude LQQMail Fetch 拦截器启动');
  
  const originalFetch = window.fetch;
  
  // 拦截 fetch 请求
  window.fetch = async function(...args) {
    const [url, options] = args;
    
    // 检查是否是目标API
    if (url.includes('claude.lqqmail.xyz') && 
        url.includes('/chat_conversations/') && 
        url.includes('/completion')) {
      
      const startTime = Date.now();
      console.log('🚀 拦截到 Claude API 请求:', url);
      
      try {
        const response = await originalFetch.apply(this, args);
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // 收集响应信息
        const responseInfo = {
          url: url,
          method: options?.method || 'GET',
          status: response.status,
          statusText: response.statusText,
          duration: duration,
          timestamp: Date.now(),
          headers: {}
        };
        
        // 收集响应头
        response.headers.forEach((value, key) => {
          responseInfo.headers[key] = value;
        });
        
        console.log('📊 API 响应信息:', responseInfo);
        
        // 特别处理 429 错误
        if (response.status === 429) {
          console.log('🚫 检测到 429 错误!');
          
          try {
            // 尝试读取响应体
            const responseClone = response.clone();
            const responseText = await responseClone.text();
            
            let responseData = null;
            try {
              responseData = JSON.parse(responseText);
            } catch (e) {
              responseData = { rawText: responseText.substring(0, 500) };
            }
            
            const rateLimitInfo = {
              ...responseInfo,
              responseBody: responseData,
              retryAfter: response.headers.get('retry-after'),
              xServer: response.headers.get('x-server'),
              xShouldRetry: response.headers.get('x-should-retry'),
              requestId: response.headers.get('request-id')
            };
            
            console.log('🚫 429 详细信息:', rateLimitInfo);
            
            // 触发自定义事件
            window.dispatchEvent(new CustomEvent('claude429Detected', {
              detail: rateLimitInfo
            }));
            
          } catch (error) {
            console.error('❌ 解析429响应失败:', error);
          }
        }
        
        // 触发通用API响应事件
        window.dispatchEvent(new CustomEvent('claudeApiResponse', {
          detail: responseInfo
        }));
        
        return response;
        
      } catch (error) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.error('❌ API 请求失败:', error);
        
        const errorInfo = {
          url: url,
          method: options?.method || 'GET',
          error: error.message,
          duration: duration,
          timestamp: Date.now()
        };
        
        // 触发错误事件
        window.dispatchEvent(new CustomEvent('claudeApiError', {
          detail: errorInfo
        }));
        
        throw error;
      }
    }
    
    return originalFetch.apply(this, args);
  };
  
  // 监听自定义事件
  window.addEventListener('claude429Detected', (event) => {
    console.log('🚨 页面级429事件:', event.detail);
    
    // 可以在这里添加页面级的429处理逻辑
    // 比如显示用户友好的提示
  });
  
  window.addEventListener('claudeApiResponse', (event) => {
    console.log('📡 页面级API响应:', event.detail);
  });
  
  window.addEventListener('claudeApiError', (event) => {
    console.log('💥 页面级API错误:', event.detail);
  });
  
  console.log('✅ Claude LQQMail Fetch 拦截器初始化完成');
})();
