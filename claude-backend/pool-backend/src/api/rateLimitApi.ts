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

// 新的前端发送格式
interface RateLimitRequest {
  orgId: string;               // 组织ID (必需)
  resetAt: number;             // 重置时间戳 (秒) (必需)
  timestamp: number;           // 检测时间戳 (毫秒) (必需)
}

// 兼容旧格式的接口
interface LegacyRateLimitData {
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
 *     description: 接收来自 claude-lqqmail-monitor 扩展的429限流检测数据
 *     tags: [Rate Limit]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orgId
 *               - resetAt
 *               - timestamp
 *             properties:
 *               orgId:
 *                 type: string
 *                 description: 组织ID
 *                 example: "org_abc123def456"
 *               resetAt:
 *                 type: number
 *                 description: 限制重置时间戳 (秒)
 *                 example: 1755147600
 *               timestamp:
 *                 type: number
 *                 description: 检测时间戳 (毫秒)
 *                 example: 1640995200000
 *     responses:
 *       200:
 *         description: 成功接收限流数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     orgId:
 *                       type: string
 *                     resetAt:
 *                       type: number
 *                     resetTime:
 *                       type: string
 *                     cooldownSeconds:
 *                       type: number
 *                     email:
 *                       type: string
 *                     accountFound:
 *                       type: boolean
 *       400:
 *         description: 请求数据格式错误
 */
// POST /api/rate-limit: 接收429限流数据 (新格式)
router.post('/', async (req: Request, res: Response) => {
  console.log('🚀 [DEBUG] 进入 /api/rate-limit POST 路由');
  console.log('🚀 [DEBUG] 请求方法:', req.method);
  console.log('🚀 [DEBUG] 请求路径:', req.path);
  console.log('🚀 [DEBUG] 请求头:', JSON.stringify(req.headers, null, 2));
  console.log('🚀 [DEBUG] 原始请求体:', JSON.stringify(req.body, null, 2));

  try {
    const requestData: RateLimitRequest = req.body;

    console.log('📥 [新格式] 接收到429限流数据:', JSON.stringify(requestData, null, 2));

    // 验证必要字段
    if (!requestData.orgId || !requestData.resetAt || !requestData.timestamp) {
      return res.status(400).json({
        error: 'Invalid data format',
        message: 'Missing required fields: orgId, resetAt, timestamp'
      });
    }

    // 验证数据格式
    if (typeof requestData.orgId !== 'string' ||
        typeof requestData.resetAt !== 'number' ||
        typeof requestData.timestamp !== 'number') {
      return res.status(400).json({
        error: 'Invalid data types',
        message: 'orgId must be string, resetAt and timestamp must be numbers'
      });
    }

    // 处理限流数据
    const processResult = await processNewRateLimitData(requestData, db);

    res.json({
      success: true,
      message: 'Rate limit data received and processed successfully',
      data: {
        orgId: requestData.orgId,
        resetAt: requestData.resetAt,
        resetTime: new Date(requestData.resetAt * 1000).toLocaleString('zh-CN'),
        cooldownSeconds: processResult.cooldownSeconds,
        email: processResult.email,
        accountFound: processResult.accountFound,
        statusUpdated: processResult.statusUpdated
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
  statusUpdated?: boolean;
}

/**
 * 处理新格式的限流数据
 */
async function processNewRateLimitData(data: RateLimitRequest, db: DatabaseManager): Promise<ProcessResult> {
  try {
    console.log('\n🚨🚨🚨 [429 限流检测 - 新格式] 🚨🚨🚨');
    console.log(`🏢 组织ID: ${data.orgId}`);
    console.log(`⏰ 检测时间: ${new Date(data.timestamp).toLocaleString('zh-CN')}`);
    console.log(`🎯 重置时间戳: ${data.resetAt}`);

    // 计算重置时间和冷却时间
    const resetTimestamp = data.resetAt * 1000; // 转换为毫秒
    const resetDate = new Date(resetTimestamp);
    const cooldownSeconds = Math.max(0, Math.ceil((resetTimestamp - Date.now()) / 1000));

    console.log(`🕐 重置时间: ${resetDate.toLocaleString('zh-CN')}`);
    console.log(`❄️ 冷却时间: ${cooldownSeconds} 秒`);

    // 格式化冷却时间显示
    const cooldownMinutes = Math.ceil(cooldownSeconds / 60);
    const cooldownHours = Math.floor(cooldownMinutes / 60);
    const remainingMinutes = cooldownMinutes % 60;

    if (cooldownHours > 0) {
      console.log(`⏳ 格式化时间: ${cooldownHours}小时 ${remainingMinutes}分钟`);
    } else {
      console.log(`⏳ 格式化时间: ${cooldownMinutes}分钟`);
    }

    let email: string | undefined;
    let accountFound = false;
    let statusUpdated = false;

    // 根据组织ID查找对应的账户
    try {
      const account = await db.getAccountByOrganizationId(data.orgId);
      if (account) {
        email = account.email;
        accountFound = true;
        console.log(`✅ 找到对应账户: ${email}`);

        // 更新账户的限流状态
        const success = await db.updateAccountRateLimit(email, resetDate);

        if (success) {
          console.log(`🔄 已更新账户 ${email} 的限流状态:`);
          console.log(`   - 重置时间: ${resetDate.toLocaleString('zh-CN')}`);

          // 同时将账户状态设置为繁忙
          statusUpdated = await db.updateAccountStatus(email, 'busy');
          if (statusUpdated) {
            console.log(`🚫 已将账户 ${email} 状态设置为繁忙`);
          } else {
            console.warn(`⚠️ 更新账户 ${email} 状态为繁忙失败`);
          }
        } else {
          console.error(`❌ 更新账户 ${email} 限流状态失败`);
        }

      } else {
        console.log(`⚠️ 未找到组织ID ${data.orgId} 对应的账户`);
      }
    } catch (dbError) {
      console.error(`💥 数据库操作失败:`, dbError);
    }

    console.log('🚨🚨🚨 [429 限流检测结束 - 新格式] 🚨🚨🚨\n');

    return {
      cooldownSeconds,
      organizationId: data.orgId,
      resetTime: resetDate.toLocaleString('zh-CN'),
      email,
      accountFound,
      statusUpdated
    };

  } catch (error) {
    console.error('💥 处理新格式限流数据异常:', error);
    return {
      cooldownSeconds: 300,
      organizationId: data.orgId,
      resetTime: undefined,
      accountFound: false,
      statusUpdated: false
    };
  }
}

/**
 * 处理限流数据 (兼容旧格式)
 */
async function processRateLimitData(data: LegacyRateLimitData, db: DatabaseManager): Promise<ProcessResult> {
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
        const account = organizationId ? await db.getAccountByOrganizationId(organizationId) : null;
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
// POST /api/rate-limit/test: 测试接口 (新格式)
router.post('/test', async (_req: Request, res: Response) => {
  try {
    console.log('🧪 执行429限流数据测试 (新格式)...');

    // 模拟前端扩展发送的新格式数据
    const testData: RateLimitRequest = {
      orgId: 'org_7b8556b4-d293-4e5c-af82-ba03e4d26238',
      resetAt: Math.floor(Date.now() / 1000) + 300, // 5分钟后重置
      timestamp: Date.now()
    };

    console.log('🧪 测试数据:', testData);

    // 处理测试数据
    const result = await processNewRateLimitData(testData, db);

    res.json({
      success: true,
      message: 'Test rate limit data processed successfully (new format)',
      testData,
      result,
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

// POST /api/rate-limit/legacy: 兼容旧格式的接口
router.post('/legacy', async (req: Request, res: Response) => {
  try {
    const rateLimitData: LegacyRateLimitData = req.body;

    console.log('📥 [旧格式] 接收到429限流数据:', JSON.stringify(rateLimitData, null, 2));

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
      message: 'Legacy rate limit data received and processed successfully',
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
    console.error('💥 处理旧格式429限流数据失败:', error);
    res.status(500).json({
      error: 'Process legacy rate limit data failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

  return router;
}

// 保持向后兼容的默认导出
export default createRateLimitRouter;
