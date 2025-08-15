// inject.js - 页面注入脚本，用于更深层的fetch拦截
(function() {
  console.log('🔧 [Inject] Claude LQQMail Fetch 拦截器启动');
  console.log('🔧 [Inject] 当前页面URL:', window.location.href);
  console.log('🔧 [Inject] 原始fetch函数:', typeof window.fetch);

  const originalFetch = window.fetch;
  
  // 拦截 fetch 请求
  window.fetch = async function(...args) {
    const [url, options] = args;

    // 检查是否是目标API
    if (url.includes('claude.lqqmail.xyz') &&
        url.includes('/chat_conversations/') &&
        url.includes('/completion')) {

      const startTime = Date.now();
      console.log('🚀 [Inject] 拦截到 Claude API 请求:', url);
      console.log('🚀 [Inject] 请求方法:', options?.method || 'GET');
      
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
          console.log('🚫 [Inject] 检测到 429 错误!');
          console.log('🔍 [Inject] 响应URL:', url);
          console.log('📊 [Inject] 响应状态:', response.status, response.statusText);

          try {
            // 尝试读取响应体
            const responseClone = response.clone();
            const responseText = await responseClone.text();

            console.log('📄 [Inject] 响应体长度:', responseText.length);
            console.log('📄 [Inject] 响应体内容:', responseText.substring(0, 200) + '...');

            let responseData = null;
            let rateLimitData = null;

            try {
              responseData = JSON.parse(responseText);
              console.log('✅ [Inject] JSON解析成功');
              console.log('🔍 [Inject] 响应数据结构:', Object.keys(responseData));

              // 提取限流信息
              if (responseData.error && responseData.error.message) {
                console.log('🔍 [Inject] 找到error.message:', responseData.error.message.substring(0, 100) + '...');

                try {
                  // 解析嵌套的JSON字符串
                  const limitInfo = JSON.parse(responseData.error.message);
                  console.log('✅ [Inject] 嵌套JSON解析成功');
                  console.log('🔍 [Inject] 限流信息键:', Object.keys(limitInfo));
                  console.log('🕒 [Inject] resetsAt值:', limitInfo.resetsAt);

                  rateLimitData = {
                    type: limitInfo.type,
                    resetsAt: limitInfo.resetsAt,
                    remaining: limitInfo.remaining,
                    perModelLimit: limitInfo.perModelLimit,
                    representativeClaim: limitInfo.representativeClaim,
                    overageStatus: limitInfo.overageStatus,
                    overageResetsAt: limitInfo.overageResetsAt
                  };

                  // 计算重置时间
                  if (rateLimitData.resetsAt) {
                    const resetDate = new Date(rateLimitData.resetsAt * 1000);
                    const now = new Date();
                    const waitMinutes = Math.ceil((resetDate - now) / (1000 * 60));
                    rateLimitData.resetDateFormatted = resetDate.toLocaleString('zh-CN');
                    rateLimitData.waitMinutes = waitMinutes;
                    rateLimitData.waitHours = Math.ceil(waitMinutes / 60);

                    console.log('🕒 [Inject] 重置时间计算完成:', {
                      resetsAt: rateLimitData.resetsAt,
                      resetDate: rateLimitData.resetDateFormatted,
                      waitMinutes: rateLimitData.waitMinutes,
                      waitHours: rateLimitData.waitHours
                    });
                  }

                  console.log('🕒 [Inject] 限流详细信息:', rateLimitData);
                } catch (parseError) {
                  console.warn('⚠️ [Inject] 解析限流信息失败:', parseError);
                  console.warn('⚠️ [Inject] 原始message:', responseData.error.message);
                }
              } else {
                console.warn('⚠️ [Inject] 未找到error.message结构');
                console.log('🔍 [Inject] 完整响应数据:', responseData);
              }
            } catch (e) {
              console.error('❌ [Inject] JSON解析失败:', e);
              console.log('📄 [Inject] 原始响应文本:', responseText);
              responseData = { rawText: responseText.substring(0, 500) };
            }

            const rateLimitInfo = {
              ...responseInfo,
              responseBody: responseData,
              rateLimitData: rateLimitData, // 新增：结构化的限流数据
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

            // 发送到background script
            if (rateLimitData && chrome.runtime) {
              chrome.runtime.sendMessage({
                type: 'RATE_LIMIT_DATA',
                data: rateLimitInfo
              }).catch(err => console.log('发送限流数据到background失败:', err));
            }

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
