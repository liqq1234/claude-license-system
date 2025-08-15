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
  
  // 显示429错误弹窗
  function show429Alert(rateLimitData) {
    let message = '🚫 请求被限制！';
    let waitSeconds = 0;

    if (rateLimitData) {
      if (rateLimitData.waitMinutes > 0) {
        waitSeconds = rateLimitData.waitMinutes * 60;
        if (rateLimitData.waitHours >= 1) {
          message += `\n\n⏰ 需要等待: ${rateLimitData.waitHours}小时 (${waitSeconds}秒)`;
        } else {
          message += `\n\n⏰ 需要等待: ${rateLimitData.waitMinutes}分钟 (${waitSeconds}秒)`;
        }
      }

      if (rateLimitData.resetDateFormatted) {
        message += `\n🕒 恢复时间: ${rateLimitData.resetDateFormatted}`;
      }

      if (rateLimitData.representativeClaim) {
        message += `\n📊 限制类型: ${rateLimitData.representativeClaim}`;
      }
    }

    // 创建自定义弹窗
    createCustomAlert(message, waitSeconds);

    // 同时在控制台输出详细信息
    console.log('🚫 [Alert] 429限流提醒:', {
      message: message,
      waitSeconds: waitSeconds,
      rateLimitData: rateLimitData
    });
  }

  // 创建自定义弹窗
  function createCustomAlert(message, waitSeconds) {
    // 移除已存在的弹窗
    const existingAlert = document.getElementById('claude-429-alert');
    if (existingAlert) {
      existingAlert.remove();
    }

    // 创建弹窗容器
    const alertDiv = document.createElement('div');
    alertDiv.id = 'claude-429-alert';
    alertDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #ffffff;
      border: 3px solid #dc3545;
      border-radius: 12px;
      padding: 20px;
      z-index: 99999;
      font-family: monospace;
      font-size: 14px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      max-width: 400px;
      min-width: 300px;
      text-align: center;
    `;

    // 创建倒计时显示
    let countdown = waitSeconds;

    alertDiv.innerHTML = `
      <div style="color: #dc3545; font-weight: bold; margin-bottom: 15px; font-size: 16px;">
        ${message.split('\n')[0]}
      </div>
      <div style="color: #666; margin-bottom: 15px; white-space: pre-line;">
        ${message.split('\n').slice(1).join('\n')}
      </div>
      <div id="countdown-display" style="color: #007bff; font-weight: bold; margin-bottom: 15px;">
        ${countdown > 0 ? `⏱️ 倒计时: ${countdown}秒` : ''}
      </div>
      <button onclick="document.getElementById('claude-429-alert').remove()"
              style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px;">
        确定
      </button>
    `;

    document.body.appendChild(alertDiv);

    // 启动倒计时
    if (countdown > 0) {
      const countdownInterval = setInterval(() => {
        countdown--;
        const countdownDisplay = document.getElementById('countdown-display');
        if (countdownDisplay) {
          if (countdown > 0) {
            countdownDisplay.textContent = `⏱️ 倒计时: ${countdown}秒`;
          } else {
            countdownDisplay.textContent = '✅ 可以重试了！';
            countdownDisplay.style.color = '#28a745';
            clearInterval(countdownInterval);
          }
        } else {
          clearInterval(countdownInterval);
        }
      }, 1000);
    }
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

    // 429 错误的特殊处理
    if (data.statusCode === 429) {
      // 显示弹窗提醒
      if (data.rateLimitData) {
        show429Alert(data.rateLimitData);
      } else {
        show429Alert(null);
      }

      statusHtml += `
        <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 8px; margin: 8px 0;">
          <div style="color: #856404; font-weight: bold; margin-bottom: 4px;">
            🚫 请求被限制
          </div>
      `;

      // 显示限流详细信息（来自响应体）
      if (data.rateLimitData) {
        const rld = data.rateLimitData;

        if (rld.resetDateFormatted) {
          statusHtml += `<div style="color: #856404; font-size: 10px; margin: 2px 0;">
            🕒 重置时间: ${rld.resetDateFormatted}
          </div>`;
        }

        if (rld.waitMinutes > 0) {
          const waitSeconds = rld.waitMinutes * 60;
          if (rld.waitHours >= 1) {
            statusHtml += `<div style="color: #856404; font-size: 10px; margin: 2px 0;">
              ⏰ 等待时间: ${rld.waitHours}小时 (${rld.waitMinutes}分钟) = ${waitSeconds}秒
            </div>`;
          } else {
            statusHtml += `<div style="color: #856404; font-size: 10px; margin: 2px 0;">
              ⏰ 等待时间: ${rld.waitMinutes}分钟 = ${waitSeconds}秒
            </div>`;
          }
        }

        if (rld.representativeClaim) {
          statusHtml += `<div style="color: #856404; font-size: 10px; margin: 2px 0;">
            📊 限制类型: ${rld.representativeClaim}
          </div>`;
        }

        if (rld.type) {
          statusHtml += `<div style="color: #856404; font-size: 10px; margin: 2px 0;">
            🔍 错误类型: ${rld.type}
          </div>`;
        }
      }

      // 显示响应头信息（备用）
      if (data.parsedHeaders) {
        if (data.parsedHeaders.retryAfter) {
          statusHtml += `<div style="color: #856404; font-size: 10px; margin: 2px 0;">重试等待: ${data.parsedHeaders.retryAfter}秒</div>`;
        }

        if (data.parsedHeaders.xServer) {
          statusHtml += `<div style="color: #856404; font-size: 10px; margin: 2px 0;">服务器: ${data.parsedHeaders.xServer}</div>`;
        }

        if (data.parsedHeaders.xShouldRetry) {
          statusHtml += `<div style="color: #856404; font-size: 10px; margin: 2px 0;">建议重试: ${data.parsedHeaders.xShouldRetry}</div>`;
        }
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
  
  // 直接拦截页面中的fetch请求来查找resetsAt
  function interceptFetchForResetsAt() {
    console.log('🔧 [Content] 开始拦截fetch请求查找resetsAt');

    // 保存原始fetch
    const originalFetch = window.fetch;

    // 重写fetch函数
    window.fetch = async function(...args) {
      const [url, options] = args;

      // 检查是否是Claude API请求
      if (typeof url === 'string' &&
          url.includes('claude.lqqmail.xyz') &&
          url.includes('/chat_conversations/') &&
          url.includes('/completion')) {

        console.log('🚀 [Content] 拦截到Claude API请求:', url);

        try {
          // 执行原始请求
          const response = await originalFetch.apply(this, args);

          // 如果是429错误，尝试提取resetsAt
          if (response.status === 429) {
            console.log('🚫 [Content] 检测到429错误，开始提取resetsAt');

            try {
              // 克隆响应以避免消费原始响应体
              const responseClone = response.clone();
              const responseText = await responseClone.text();

              console.log('📄 [Content] 429响应体:', responseText);

              // 解析JSON
              const responseData = JSON.parse(responseText);

              if (responseData.error && responseData.error.message) {
                console.log('🔍 [Content] 找到error.message:', responseData.error.message);

                // 解析嵌套的JSON字符串
                const limitInfo = JSON.parse(responseData.error.message);

                if (limitInfo.resetsAt) {
                  console.log('🎯 [Content] 找到resetsAt:', limitInfo.resetsAt);

                  // 计算重置时间
                  const resetDate = new Date(limitInfo.resetsAt * 1000);
                  const now = new Date();
                  const waitMinutes = Math.ceil((resetDate - now) / (1000 * 60));
                  const waitHours = Math.ceil(waitMinutes / 60);

                  const rateLimitData = {
                    type: limitInfo.type,
                    resetsAt: limitInfo.resetsAt,
                    remaining: limitInfo.remaining,
                    representativeClaim: limitInfo.representativeClaim,
                    resetDateFormatted: resetDate.toLocaleString('zh-CN'),
                    waitMinutes: waitMinutes,
                    waitHours: waitHours
                  };

                  console.log('✅ [Content] resetsAt数据提取成功:', rateLimitData);

                  // 创建增强的状态数据
                  const enhancedData = {
                    type: 'request_completed',
                    url: url,
                    method: options?.method || 'POST',
                    statusCode: 429,
                    statusLine: response.statusText,
                    timestamp: Date.now(),
                    timestampISO: new Date().toISOString(),
                    rateLimitData: rateLimitData,
                    source: 'content_script_fetch'
                  };

                  // 直接更新显示
                  if (!statusDisplay) {
                    createStatusDisplay();
                  }
                  updateStatus(enhancedData);

                } else {
                  console.warn('⚠️ [Content] 未找到resetsAt字段');
                }
              } else {
                console.warn('⚠️ [Content] 响应格式不符合预期');
              }

            } catch (parseError) {
              console.error('❌ [Content] 解析429响应失败:', parseError);
            }
          }

          return response;

        } catch (error) {
          console.error('❌ [Content] fetch请求失败:', error);
          throw error;
        }
      }

      // 对于非目标请求，直接执行原始fetch
      return originalFetch.apply(this, args);
    };
  }

  // 监听来自后台脚本的消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'API_STATUS_UPDATE') {
      console.log('📊 [Content] 收到API状态更新:', message.data);

      // 创建显示区域
      if (!statusDisplay) {
        createStatusDisplay();
      }

      // 更新状态
      updateStatus(message.data);
    }
  });
  
  // 监听页面中的自定义事件（来自inject.js）
  window.addEventListener('claude429Detected', (event) => {
    console.log('🚨 [Content] 收到页面级429事件:', event.detail);

    if (event.detail && event.detail.rateLimitData) {
      console.log('✅ [Content] 从页面事件获取到resetsAt数据');

      // 创建显示区域
      if (!statusDisplay) {
        createStatusDisplay();
      }

      // 更新状态显示
      updateStatus(event.detail);
    }
  });

  // 拦截XMLHttpRequest（备用方法）
  function interceptXHRForResetsAt() {
    console.log('🔧 [Content] 开始拦截XMLHttpRequest查找resetsAt');

    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      this._url = url;
      this._method = method;
      return originalXHROpen.apply(this, [method, url, ...args]);
    };

    XMLHttpRequest.prototype.send = function(data) {
      const xhr = this;

      // 检查是否是Claude API请求
      if (xhr._url && xhr._url.includes('claude.lqqmail.xyz') &&
          xhr._url.includes('/chat_conversations/') &&
          xhr._url.includes('/completion')) {

        console.log('🚀 [Content-XHR] 拦截到Claude API请求:', xhr._url);

        // 监听响应
        xhr.addEventListener('readystatechange', function() {
          if (xhr.readyState === 4 && xhr.status === 429) {
            console.log('🚫 [Content-XHR] 检测到429错误');

            try {
              const responseText = xhr.responseText;
              console.log('📄 [Content-XHR] 429响应体:', responseText);

              const responseData = JSON.parse(responseText);

              if (responseData.error && responseData.error.message) {
                const limitInfo = JSON.parse(responseData.error.message);

                if (limitInfo.resetsAt) {
                  console.log('🎯 [Content-XHR] 找到resetsAt:', limitInfo.resetsAt);

                  // 计算重置时间
                  const resetDate = new Date(limitInfo.resetsAt * 1000);
                  const now = new Date();
                  const waitMinutes = Math.ceil((resetDate - now) / (1000 * 60));
                  const waitHours = Math.ceil(waitMinutes / 60);

                  const rateLimitData = {
                    type: limitInfo.type,
                    resetsAt: limitInfo.resetsAt,
                    remaining: limitInfo.remaining,
                    representativeClaim: limitInfo.representativeClaim,
                    resetDateFormatted: resetDate.toLocaleString('zh-CN'),
                    waitMinutes: waitMinutes,
                    waitHours: waitHours
                  };

                  console.log('✅ [Content-XHR] resetsAt数据提取成功:', rateLimitData);

                  // 创建增强的状态数据
                  const enhancedData = {
                    type: 'request_completed',
                    url: xhr._url,
                    method: xhr._method,
                    statusCode: 429,
                    statusLine: xhr.statusText,
                    timestamp: Date.now(),
                    timestampISO: new Date().toISOString(),
                    rateLimitData: rateLimitData,
                    source: 'content_script_xhr'
                  };

                  // 直接更新显示
                  if (!statusDisplay) {
                    createStatusDisplay();
                  }
                  updateStatus(enhancedData);
                }
              }
            } catch (error) {
              console.error('❌ [Content-XHR] 解析429响应失败:', error);
            }
          }
        });
      }

      return originalXHRSend.apply(this, arguments);
    };
  }

  // 启动所有拦截方法
  interceptFetchForResetsAt();
  interceptXHRForResetsAt();

  // 注入页面脚本（可选，用于更深层的监听）
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('inject.js');
  script.onload = function() {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);

  // 添加测试函数到全局作用域
  window.testResetsAtExtraction = function(testData) {
    console.log('🧪 [Content] 测试resetsAt提取功能');

    const sampleResponse = testData || {
      "type": "error",
      "error": {
        "type": "rate_limit_error",
        "message": "{\"type\": \"exceeded_limit\", \"resetsAt\": 1755183600, \"remaining\": null, \"perModelLimit\": false, \"representativeClaim\": \"five_hour\"}"
      }
    };

    try {
      const limitInfo = JSON.parse(sampleResponse.error.message);

      if (limitInfo.resetsAt) {
        const resetDate = new Date(limitInfo.resetsAt * 1000);
        const now = new Date();
        const waitMinutes = Math.ceil((resetDate - now) / (1000 * 60));
        const waitHours = Math.ceil(waitMinutes / 60);

        const rateLimitData = {
          type: limitInfo.type,
          resetsAt: limitInfo.resetsAt,
          remaining: limitInfo.remaining,
          representativeClaim: limitInfo.representativeClaim,
          resetDateFormatted: resetDate.toLocaleString('zh-CN'),
          waitMinutes: waitMinutes,
          waitHours: waitHours
        };

        console.log('✅ [Content] 测试成功，resetsAt数据:', rateLimitData);

        // 创建测试显示数据
        const testDisplayData = {
          type: 'request_completed',
          url: 'https://claude.lqqmail.xyz/api/test/completion',
          method: 'POST',
          statusCode: 429,
          statusLine: 'Too Many Requests',
          timestamp: Date.now(),
          timestampISO: new Date().toISOString(),
          rateLimitData: rateLimitData,
          source: 'test_function'
        };

        // 显示测试结果
        if (!statusDisplay) {
          createStatusDisplay();
        }
        updateStatus(testDisplayData);

        return rateLimitData;
      }
    } catch (error) {
      console.error('❌ [Content] 测试失败:', error);
    }
  };

  console.log('✅ Claude LQQMail 内容脚本初始化完成');
  console.log('🧪 可以在控制台运行 testResetsAtExtraction() 来测试功能');
})();
