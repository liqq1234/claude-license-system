// src/utils/claudeApiChecker.ts
/**
 * Claude API 状态检测器
 * 主动发送POST请求到Claude API检测429限流状态
 */

export interface ClaudeApiCheckResult {
  isAvailable: boolean;
  statusCode: number;
  isRateLimited: boolean;
  cooldownTime?: number;
  retryAfter?: number;
  responseTime: number;
  errorMessage?: string;
  serverInfo?: string;
  requestId?: string;
  shouldRetry?: boolean;
  timestamp: string;
}

export interface ClaudeApiCheckOptions {
  timeout?: number;
  testMessage?: string;
}

export interface AccountApiInfo {
  id: string;
  email: string;
  sessionKey: string;
  organizationId: string;
  conversationId: string;
}

/**
 * 检测单个Claude API状态
 */
export async function checkClaudeApiStatus(
  account: AccountApiInfo,
  baseUrl: string = 'https://claude.lqqmail.xyz',
  options: ClaudeApiCheckOptions = {}
): Promise<ClaudeApiCheckResult> {
  const startTime = Date.now();
  const { timeout = 10000, testMessage = 'Hello' } = options;
  
  const apiUrl = `${baseUrl}/api/organizations/${account.organizationId}/chat_conversations/${account.conversationId}/completion`;
  
  console.log(`🤖 开始主动检测 Claude API 状态: ${account.email} (${account.id})`);
  console.log(`📍 API URL: ${apiUrl}`);
  
  try {
    // 构造请求体
    const requestBody = {
      completion: {
        prompt: testMessage,
        timezone: "Asia/Shanghai",
        model: "claude-3-5-sonnet-20241022"
      },
      organization_uuid: account.organizationId,
      conversation_uuid: account.conversationId,
      text: testMessage,
      attachments: []
    };

    // 发送POST请求
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `sessionKey=${account.sessionKey}`,
        'Authorization': `Bearer ${account.sessionKey}`,
        'Origin': baseUrl,
        'Referer': `${baseUrl}/chat/${account.conversationId}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(timeout)
    });

    const responseTime = Date.now() - startTime;
    const statusCode = response.status;
    
    // 获取响应头信息
    const retryAfter = response.headers.get('retry-after');
    const shouldRetry = response.headers.get('x-should-retry');
    const serverInfo = response.headers.get('server');
    const requestId = response.headers.get('x-request-id') || response.headers.get('request-id');

    console.log(`🤖${statusCode === 200 ? '✅' : '🚫'} [HTTP拦截] Claude API 请求${statusCode === 200 ? '成功' : '失败'}: POST ${apiUrl} - ${statusCode} (${responseTime}ms)`);

    // 检查是否是429限流
    if (statusCode === 429) {
      let cooldownTime = retryAfter ? parseInt(retryAfter) : 300; // 默认5分钟
      let resetTimestamp: number | undefined;
      let limitType = 'unknown';

      // 尝试解析响应体获取精确的重置时间
      try {
        const errorData = await response.json();

        if (errorData.resetsAt) {
          resetTimestamp = errorData.resetsAt * 1000; // 转换为毫秒
          cooldownTime = Math.ceil((resetTimestamp - Date.now()) / 1000);
          limitType = errorData.representativeClaim || 'five_hour';

          console.log(`🎯 获取到精确重置时间: ${new Date(resetTimestamp).toLocaleString('zh-CN')}`);
          console.log(`🎯 限制类型: ${limitType}`);
        }
      } catch (parseError) {
        console.log(`⚠️ 无法解析429响应体，使用默认冷却时间`);
      }

      const cooldownMinutes = Math.ceil(cooldownTime / 60);
      
      console.log(`🤖🚫🚫 [Claude API 主动检测 - 限流] 🚫🚫🤖`);
      console.log(`👤 账户: ${account.email} (ID: ${account.id})`);
      console.log(`📍 API URL: ${apiUrl}`);
      console.log(`⏰ 检测时间: ${new Date().toLocaleString('zh-CN')}`);
      console.log(`🕒 响应时间: ${responseTime}ms`);
      console.log(`❄️ 冷却时间: ${cooldownTime}秒 (${cooldownMinutes}分钟)`);
      
      if (retryAfter) {
        console.log(`🔄 Retry-After: ${retryAfter}秒`);
      }
      if (shouldRetry) {
        console.log(`✅ x-should-retry: ${shouldRetry} (服务器建议重试)`);
      }
      if (serverInfo) {
        console.log(`🖥️ 服务器: ${serverInfo}`);
      }
      if (requestId) {
        console.log(`🆔 请求ID: ${requestId}`);
      }
      
      console.log(`💬 错误信息: Claude API Rate Limited (429)`);
      console.log(`💡 建议: 账户 ${account.email} 被限流，请等待 ${cooldownMinutes} 分钟后重试`);
      console.log(`🤖🚫🚫 [Claude API 主动检测结束] 🚫🚫🤖`);

      return {
        isAvailable: false,
        statusCode,
        isRateLimited: true,
        cooldownTime,
        retryAfter: retryAfter ? parseInt(retryAfter) : undefined,
        responseTime,
        errorMessage: 'Claude API Rate Limited (429)',
        serverInfo: serverInfo || undefined,
        requestId: requestId || undefined,
        shouldRetry: shouldRetry === 'true',
        timestamp: new Date().toISOString()
      };
    }

    // 检查其他错误状态
    if (statusCode >= 400) {
      let errorMessage = `HTTP ${statusCode}`;
      
      try {
        const errorText = await response.text();
        if (errorText) {
          errorMessage += ` - ${errorText}`;
        }
      } catch (e) {
        // 忽略解析错误
      }

      console.log(`🤖❌ [HTTP拦截] Claude API 请求失败: POST ${apiUrl} - ${statusCode} (${responseTime}ms)`);

      return {
        isAvailable: false,
        statusCode,
        isRateLimited: false,
        responseTime,
        errorMessage,
        serverInfo: serverInfo || undefined,
        requestId: requestId || undefined,
        shouldRetry: shouldRetry === 'true',
        timestamp: new Date().toISOString()
      };
    }

    // 成功响应
    console.log(`✅ 账户 ${account.email} API 状态正常`);

    return {
      isAvailable: true,
      statusCode,
      isRateLimited: false,
      responseTime,
      serverInfo: serverInfo || undefined,
      requestId: requestId || undefined,
      shouldRetry: shouldRetry === 'true',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.log(`🤖💥 [HTTP拦截] Claude API 请求异常: POST ${apiUrl} - ${errorMessage} (${responseTime}ms)`);

    return {
      isAvailable: false,
      statusCode: 0,
      isRateLimited: false,
      responseTime,
      errorMessage,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 批量检测多个账户的Claude API状态
 */
export async function checkMultipleClaudeApiStatus(
  accounts: AccountApiInfo[],
  baseUrl: string = 'https://claude.lqqmail.xyz',
  options: ClaudeApiCheckOptions = {}
): Promise<Map<string, ClaudeApiCheckResult>> {
  console.log(`🤖 开始批量检测 ${accounts.length} 个账户的 Claude API 状态`);
  
  const results = new Map<string, ClaudeApiCheckResult>();
  
  // 并发检测所有账户
  const promises = accounts.map(async (account) => {
    try {
      const result = await checkClaudeApiStatus(account, baseUrl, options);
      results.set(account.id, result);
      return { accountId: account.id, result };
    } catch (error) {
      const errorResult: ClaudeApiCheckResult = {
        isAvailable: false,
        statusCode: 0,
        isRateLimited: false,
        responseTime: 0,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
      results.set(account.id, errorResult);
      return { accountId: account.id, result: errorResult };
    }
  });

  await Promise.all(promises);
  
  // 统计结果
  let available = 0;
  let rateLimited = 0;
  let errors = 0;
  
  for (const result of results.values()) {
    if (result.isAvailable) {
      available++;
    } else if (result.isRateLimited) {
      rateLimited++;
    } else {
      errors++;
    }
  }
  
  console.log(`🤖 批量检测完成: ${available} 正常, ${rateLimited} 限流, ${errors} 错误`);
  
  return results;
}

/**
 * 从登录URL中提取对话ID
 */
export function extractConversationIdFromUrl(chatUrl: string): string | null {
  try {
    // 匹配 /chat/{conversation_id} 格式
    const match = chatUrl.match(/\/chat\/([a-f0-9-]+)/);
    return match ? match[1] : null;
  } catch (error) {
    console.error('提取对话ID失败:', error);
    return null;
  }
}

/**
 * 生成默认的对话ID
 */
export function generateDefaultConversationId(): string {
  // 生成一个类似 Claude 对话ID 的 UUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
