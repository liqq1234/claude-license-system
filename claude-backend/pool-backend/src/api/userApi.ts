// src/api/userApi.ts
/**
 * 用户API路由
 */

import { Router, Request, Response } from 'express';
import { DatabaseManager } from '../database';
import { verifyToken } from '../middleware/auth';
import { getClientIP, getUserAgent } from '../utils/request';
import { maskEmail } from '../utils/helpers';
import { generateSecureLoginToken, buildClaudeUrl } from '../auth/tokenService';

export function createUserRouter(db: DatabaseManager) {
  const router = Router();

  /**
   * @swagger
   * /api/emails:
   *   get:
   *     summary: 获取可用账号列表
   *     description: 获取脱敏处理的可用Claude账号列表
   *     tags: [User]
   *     responses:
   *       200:
   *         description: 成功获取账号列表
   */
  router.get('/emails', async (req: Request, res: Response) => {
    try {
      const accounts = await db.getAllAccounts();

      const maskedAccounts = accounts.map((account: any) => ({
        id: account.id,
        email: maskEmail(account.email),
        status: account.status,
        last_used: account.last_used_at,
        usage_count: account.usage_count
      }));

      res.json({
        success: true,
        accounts: maskedAccounts,
        total: accounts.length
      });
    } catch (error) {
      console.error('获取账号列表失败:', error);
      res.status(500).json({
        success: false,
        error: '获取账号列表失败'
      });
    }
  });

  /**
   * @swagger
   * /api/login:
   *   post:
   *     summary: 用户登录
   *     description: 用户使用token登录获取Claude账号
   *     tags: [User]
   *     security:
   *       - bearerAuth: []
   */
  router.post('/login', verifyToken, async (req: Request, res: Response) => {
    try {
      const { email, expires_in } = req.body;
      const clientIP = getClientIP(req);
      const userAgent = getUserAgent(req);

      if (!email) {
        return res.status(400).json({
          success: false,
          error: '邮箱是必需的'
        });
      }

      // 获取账户信息
      const account = await db.getAccountByEmail(email);
      if (!account) {
        return res.status(404).json({
          success: false,
          error: '账户不存在'
        });
      }

      if (account.status !== 1) {
        return res.status(403).json({
          success: false,
          error: '账户不可用'
        });
      }

      // 更新最后使用时间
      await db.updateAccountUsage(email);

      // 记录使用日志
      await db.logUsage({
        account_id: account.id!,
        email: email,
        login_mode: 'specific',
        client_ip: clientIP,
        user_agent: userAgent,
        success: true
      });

      // 生成唯一名称
      const uniqueName = `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      // 生成安全登录token
      const loginTokenPayload = {
        userId: account.id!.toString(),
        accountId: account.id!,
        sessionKey: account.session_key,
        uniqueName: uniqueName,
        expiresIn: expires_in || 0,
        email: email
      };
      const loginToken = await generateSecureLoginToken(loginTokenPayload);
      const claudeUrl = buildClaudeUrl(account.session_key, uniqueName, expires_in);

      res.json({
        success: true,
        message: '登录成功',
        claude_url: claudeUrl,
        account: {
          email: maskEmail(account.email),
          usage_count: account.usage_count
        }
      });
    } catch (error) {
      console.error('用户登录失败:', error);
      res.status(500).json({
        success: false,
        error: '登录失败'
      });
    }
  });

  /**
   * @swagger
   * /api/account-status/{snowflakeId}:
   *   get:
   *     summary: 获取账户状态
   *     description: 使用雪花ID获取账户状态
   *     tags: [User]
   */
  router.get('/account-status/:snowflakeId', async (req: Request, res: Response) => {
    try {
      const { snowflakeId } = req.params;

      if (!snowflakeId) {
        return res.status(400).json({
          success: false,
          error: '雪花ID是必需的'
        });
      }

      const account = await db.getAccountBySnowflakeId(snowflakeId);
      if (!account) {
        return res.status(404).json({
          success: false,
          error: '账户不存在'
        });
      }

      const status = calculateAccountStatus(account);

      res.json({
        success: true,
        account: {
          id: account.snowflake_id,
          email: maskEmail(account.email),
          status: status.status,
          message: status.message,
          available: status.available,
          last_used: account.last_used_at,
          usage_count: account.usage_count
        }
      });
    } catch (error) {
      console.error('获取账户状态失败:', error);
      res.status(500).json({
        success: false,
        error: '获取账户状态失败'
      });
    }
  });

  /**
   * @swagger
   * /api/accounts-status:
   *   get:
   *     summary: 获取所有账户状态
   *     description: 获取所有Claude账户的状态信息
   *     tags: [User]
   */
  router.get('/accounts-status', async (req: Request, res: Response) => {
    try {
      const accounts = await db.getAllAccounts();
      
      const accountsWithStatus = accounts.map(account => {
        const status = calculateAccountStatus(account);
        return {
          id: account.snowflake_id,
          email: maskEmail(account.email),
          status: status.status,
          message: status.message,
          available: status.available,
          last_used: account.last_used_at,
          usage_count: account.usage_count
        };
      });

      const availableCount = accountsWithStatus.filter(acc => acc.available).length;

      res.json({
        success: true,
        accounts: accountsWithStatus,
        total: accounts.length,
        available: availableCount,
        unavailable: accounts.length - availableCount
      });
    } catch (error) {
      console.error('获取账户状态失败:', error);
      res.status(500).json({
        success: false,
        error: '获取账户状态失败'
      });
    }
  });

  /**
   * @swagger
   * /api/account-usage/{identifier}:
   *   post:
   *     summary: 记录账户使用
   *     description: 记录账户使用情况（兼容雪花ID和邮箱）
   *     tags: [User]
   */
  router.post('/account-usage/:identifier', async (req: Request, res: Response) => {
    try {
      const { identifier } = req.params;
      const { action, details } = req.body;
      const clientIP = getClientIP(req);
      const userAgent = getUserAgent(req);

      if (!identifier) {
        return res.status(400).json({
          success: false,
          error: '账户标识符是必需的'
        });
      }

      // 尝试通过雪花ID或邮箱查找账户
      let account;
      if (identifier.includes('@')) {
        account = await db.getAccountByEmail(identifier);
      } else {
        account = await db.getAccountBySnowflakeId(identifier);
      }

      if (!account) {
        return res.status(404).json({
          success: false,
          error: '账户不存在'
        });
      }

      // 记录使用日志
      await db.logUsage({
        account_id: account.id!,
        email: account.email,
        login_mode: 'specific',
        client_ip: clientIP,
        user_agent: userAgent,
        success: true
      });

      // 更新最后使用时间
      await db.updateAccountUsage(account.email);

      res.json({
        success: true,
        message: '使用记录已保存'
      });
    } catch (error) {
      console.error('记录账户使用失败:', error);
      res.status(500).json({
        success: false,
        error: '记录使用失败'
      });
    }
  });

  return router;
}

// 计算账户状态的辅助函数
function calculateAccountStatus(account: any) {
  const currentTime = new Date();
  
  if (account.status === 'disabled') {
    return {
      status: 'disabled',
      message: '账户已禁用',
      available: false
    };
  }

  if (account.expires_at && new Date(account.expires_at) < currentTime) {
    return {
      status: 'expired',
      message: 'Session已过期',
      available: false
    };
  }

  if (account.last_used) {
    const lastUsed = new Date(account.last_used);
    const hoursSinceLastUse = (currentTime.getTime() - lastUsed.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLastUse < 1) {
      return {
        status: 'recently_used',
        message: '最近使用过',
        available: true,
        last_used_hours: Math.round(hoursSinceLastUse * 10) / 10
      };
    }
  }

  return {
    status: 'available',
    message: '可用',
    available: true
  };
}
