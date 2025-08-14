// src/api/rateLimitApi.ts
/**
 * 限流监控API
 * 接收来自 claude-api-monitor 的429限流数据
 */

import { Router, Request, Response } from 'express';
import { DatabaseManager } from '../database';

// 创建路由的工厂函数
export function createRateLimitRouter(db: DatabaseManager) {
  const router = Router();

interface RateLimitData {
  type: string;
  timestamp: number;
  url: string;
  status?: number;
  statusText?: string;
  resetsAt?: number;           // Claude 重置时间戳 (秒)
  resetTime?: string;          // ISO 时间字符串
  resetTimestamp?: number;     // 重置时间戳 (秒)
  limitType?: string;          // 限制类型 (five_hour, free_messages 等)
  retryAfter?: number;         // Retry-After 头部 (秒)
  retryAfterDate?: string;     // Retry-After 计算的日期
  remaining?: number;          // 剩余次数
  limit?: number;              // 总限制数
  errorMessage?: string;       // 错误消息
  source?: string;             // 数据来源 (api_response, page_message)
  userAgent?: string;          // 用户代理
  hostname?: string;           // 主机名
  rawResponse?: any;           // 原始响应数据
  originalText?: string;       // 原始页面文本
  parsedTime?: string;         // 解析的时间字符串
}

/**
 * @swagger
 * /api/rate-limit:
 *   post:
 *     summary: 接收429限流数据
 *     description: 接收来自 claude-api-monitor 的429限流检测数据
 *     tags: [Rate Limit]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 example: "rate_limit_detected"
 *               timestamp:
 *                 type: number
 *                 example: 1640995200000
 *               url:
 *                 type: string
 *                 example: "https://claude.ai/api/organizations/.../completion"
 *               resetsAt:
 *                 type: number
 *                 example: 1755147600
 *               limitType:
 *                 type: string
 *                 example: "five_hour"
 *               source:
 *                 type: string
 *                 example: "api_response"
 *     responses:
 *       200:
 *         description: 成功接收限流数据
 *       400:
 *         description: 请求数据格式错误
 */
// POST /api/rate-limit: 接收429限流数据
router.post('/', async (req: Request, res: Response) => {
  try {
    const rateLimitData: RateLimitData = req.body;
    
    console.log('📥 接收到429限流数据:', JSON.stringify(rateLimitData, null, 2));
    
    // 验证必要字段
    if (!rateLimitData.type || !rateLimitData.timestamp) {
      return res.status(400).json({
        error: 'Invalid data format',
        message: 'Missing required fields: type, timestamp'
      });
    }
    
    // 处理限流数据
    const processResult = await processRateLimitData(rateLimitData, db);

    res.json({
      success: true,
      message: 'Rate limit data received and processed successfully',
      data: {
        source: rateLimitData.source || 'unknown',
        limitType: rateLimitData.limitType || 'unknown',
        resetsAt: rateLimitData.resetsAt,
        resetTime: rateLimitData.resetsAt ? new Date(rateLimitData.resetsAt * 1000).toLocaleString('zh-CN') : undefined,
        cooldownSeconds: processResult?.cooldownSeconds,
        organizationId: processResult?.organizationId,
        email: processResult?.email,
        accountFound: processResult?.accountFound
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('💥 处理429限流数据失败:', error);
    res.status(500).json({
      error: 'Process rate limit data failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

interface ProcessResult {
  cooldownSeconds: number;
  organizationId?: string;
  resetTime?: string;
  email?: string;
  accountFound?: boolean;
}

/**
 * 处理限流数据
 */
async function processRateLimitData(data: RateLimitData, db: DatabaseManager): Promise<ProcessResult> {
  try {
    console.log('\n🚨🚨🚨 [429 限流检测] 🚨🚨🚨');
    console.log(`📍 来源: ${data.source || 'unknown'}`);
    console.log(`🌐 URL: ${data.url}`);
    console.log(`⏰ 检测时间: ${new Date(data.timestamp).toLocaleString('zh-CN')}`);
    
    // 计算重置时间
    let resetTimestamp: number | undefined;
    let cooldownSeconds = 300; // 默认5分钟
    
    // 优先使用 resetsAt (Claude 特有格式)
    if (data.resetsAt) {
      resetTimestamp = data.resetsAt * 1000; // 转换为毫秒
      cooldownSeconds = Math.ceil((resetTimestamp - Date.now()) / 1000);
      
      console.log(`🎯 Claude 重置时间戳: ${data.resetsAt}`);
      console.log(`🕐 重置时间: ${new Date(resetTimestamp).toLocaleString('zh-CN')}`);
      
    } else if (data.resetTimestamp) {
      resetTimestamp = data.resetTimestamp * 1000;
      cooldownSeconds = Math.ceil((resetTimestamp - Date.now()) / 1000);
      
      console.log(`🎯 重置时间戳: ${data.resetTimestamp}`);
      console.log(`🕐 重置时间: ${new Date(resetTimestamp).toLocaleString('zh-CN')}`);
      
    } else if (data.retryAfter) {
      cooldownSeconds = data.retryAfter;
      resetTimestamp = Date.now() + (data.retryAfter * 1000);
      
      console.log(`🔄 Retry-After: ${data.retryAfter} 秒`);
      console.log(`🕐 预计重置时间: ${new Date(resetTimestamp).toLocaleString('zh-CN')}`);
    }
    
    // 显示冷却时间信息
    const cooldownMinutes = Math.ceil(cooldownSeconds / 60);
    const cooldownHours = Math.floor(cooldownMinutes / 60);
    const remainingMinutes = cooldownMinutes % 60;
    
    console.log(`❄️ 冷却时间: ${cooldownSeconds} 秒`);
    
    if (cooldownHours > 0) {
      console.log(`⏳ 格式化时间: ${cooldownHours}小时 ${remainingMinutes}分钟`);
    } else {
      console.log(`⏳ 格式化时间: ${cooldownMinutes}分钟`);
    }
    
    // 显示限制类型
    if (data.limitType) {
      const limitTypeMap: Record<string, string> = {
        'five_hour': '5小时限制',
        'free_messages': '免费消息限制',
        'daily': '每日限制',
        'monthly': '每月限制'
      };
      
      const limitTypeName = limitTypeMap[data.limitType] || data.limitType;
      console.log(`🏷️ 限制类型: ${limitTypeName}`);
    }
    
    // 显示剩余信息
    if (data.remaining !== undefined) {
      console.log(`📊 剩余次数: ${data.remaining}`);
    }
    
    if (data.limit !== undefined) {
      console.log(`📈 总限制数: ${data.limit}`);
    }
    
    // 显示错误信息
    if (data.errorMessage) {
      console.log(`💬 错误信息: ${data.errorMessage}`);
    }
    
    // 显示原始响应数据
    if (data.rawResponse) {
      console.log(`📋 原始响应:`, JSON.stringify(data.rawResponse, null, 2));
    }
    
    // 尝试从URL中提取组织ID
    let organizationId: string | undefined;
    let email: string | undefined;
    let accountFound = false;

    const orgMatch = data.url.match(/\/organizations\/([a-f0-9-]{36})\//);
    if (orgMatch) {
      organizationId = orgMatch[1];
      console.log(`🏢 提取到组织ID: ${organizationId}`);

      // 根据组织ID查找对应的账户
      try {
        const account = await db.getAccountByOrganizationId(organizationId);
        if (account) {
          email = account.email;
          accountFound = true;
          console.log(`✅ 找到对应账户: ${email}`);

          // 更新账户的限流状态
          if (resetTimestamp) {
            const resetDate = new Date(resetTimestamp);
            const success = await db.updateAccountRateLimit(email, resetDate);

            if (success) {
              console.log(`🔄 已更新账户 ${email} 的限流状态:`);
              console.log(`   - 重置时间: ${resetDate.toLocaleString('zh-CN')}`);

              // 同时将账户状态设置为繁忙
              const statusUpdated = await db.updateAccountStatus(email, 'busy');
              if (statusUpdated) {
                console.log(`🚫 已将账户 ${email} 状态设置为繁忙`);
              }
            } else {
              console.error(`❌ 更新账户 ${email} 限流状态失败`);
            }
          }

        } else {
          console.log(`⚠️ 未找到组织ID ${organizationId} 对应的账户`);
        }
      } catch (dbError) {
        console.error(`💥 数据库操作失败:`, dbError);
      }
    } else {
      console.log(`⚠️ 无法从URL中提取组织ID: ${data.url}`);
    }

    console.log('🚨🚨🚨 [429 限流检测结束] 🚨🚨🚨\n');

    return {
      cooldownSeconds,
      organizationId,
      resetTime: resetTimestamp ? new Date(resetTimestamp).toLocaleString('zh-CN') : undefined,
      email,
      accountFound
    };

  } catch (error) {
    console.error('💥 处理限流数据异常:', error);
    return {
      cooldownSeconds: 300,
      organizationId: undefined,
      resetTime: undefined
    };
  }
}



/**
 * @swagger
 * /api/rate-limit/test:
 *   post:
 *     summary: 测试429限流数据接收
 *     description: 发送测试数据来验证限流处理功能
 *     tags: [Rate Limit]
 *     responses:
 *       200:
 *         description: 测试数据发送成功
 */
// POST /api/rate-limit/test: 测试接口
router.post('/test', async (req: Request, res: Response) => {
  try {
    console.log('🧪 执行429限流数据测试...');
    
    // 模拟 claude-api-monitor 发送的数据
    const testData: RateLimitData = {
      type: 'rate_limit_detected',
      timestamp: Date.now(),
      url: 'https://claude.lqqmail.xyz/api/organizations/7b8556b4-d293-4e5c-af82-ba03e4d26238/chat_conversations/4dcc96ed-c1d1-4a92-90ac-d84f444249b1/completion',
      status: 429,
      statusText: 'Too Many Requests',
      resetsAt: Math.floor(Date.now() / 1000) + 300, // 5分钟后重置
      limitType: 'five_hour',
      source: 'api_response',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      hostname: 'claude.lqqmail.xyz',
      rawResponse: {
        type: 'exceeded_limit',
        resetsAt: Math.floor(Date.now() / 1000) + 300,
        remaining: null,
        perModelLimit: false,
        representativeClaim: 'five_hour'
      }
    };
    
    // 处理测试数据
    await processRateLimitData(testData, db);
    
    res.json({
      success: true,
      message: 'Test rate limit data processed successfully',
      testData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('💥 测试429限流数据失败:', error);
    res.status(500).json({
      error: 'Test rate limit data failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

  return router;
}

// 保持向后兼容的默认导出
export default createRateLimitRouter;
