// src/api/adminApi.ts
/**
 * 管理员API路由
 */

import { Router, Request, Response } from 'express';
import { DatabaseManager } from '../database';

import { getClientIP, getUserAgent } from '../utils/request';
import { maskEmail } from '../utils/helpers';

export function createAdminRouter(db: DatabaseManager) {
  const router = Router();

  /**
   * @swagger
   * /api/admin/list:
   *   post:
   *     summary: 获取账户列表
   *     description: 管理员获取所有Claude账户列表
   *     tags: [Admin]
   *     security:
   *       - adminPassword: []
   *     responses:
   *       200:
   *         description: 成功获取账户列表
   */
    router.post('/list', async (req: Request, res: Response) => {
    try {
      const accounts = await db.getAllAccounts();
      
      const accountsWithStatus = accounts.map(account => ({
        ...account,
        masked_email: maskEmail(account.email),
        status: calculateAccountStatus(account)
      }));

      res.json({
        success: true,
        accounts: accountsWithStatus,
        total: accounts.length
      });
    } catch (error) {
      console.error('获取账户列表失败:', error);
      res.status(500).json({
        success: false,
        error: '获取账户列表失败'
      });
    }
  });

  /**
   * @swagger
   * /api/admin/add:
   *   post:
   *     summary: 添加账户
   *     description: 管理员添加新的Claude账户
   *     tags: [Admin]
   *     security:
   *       - adminPassword: []
   */
    router.post('/add', async (req: Request, res: Response) => {
    try {
      const { email, session_key, notes } = req.body;

      if (!email || !session_key) {
        return res.status(400).json({
          success: false,
          error: '邮箱和session_key是必需的'
        });
      }

      // 检查邮箱是否已存在
      const existingAccount = await db.getAccountByEmail(email);
      if (existingAccount) {
        return res.status(400).json({
          success: false,
          error: '该邮箱已存在'
        });
      }

      const accountData = {
        email,
        session_key,
        status: 1, // 1 for active, 0 for inactive
        created_by: 'admin',
        notes: notes || null
      };

      const result = await db.addAccount(accountData);

      // 记录管理员操作日志
      await db.logAdminAction({
        action: 'add',
        target_email: email,
        admin_ip: getClientIP(req),
        user_agent: getUserAgent(req),
        success: true,
        new_data: { email, session_key: session_key.substring(0, 10) + '...' }
      });

      res.json({
        success: true,
        message: '账户添加成功',
        account_id: result
      });
    } catch (error) {
      console.error('添加账户失败:', error);
      res.status(500).json({
        success: false,
        error: '添加账户失败'
      });
    }
  });

  /**
   * @swagger
   * /api/admin/delete:
   *   post:
   *     summary: 删除账户
   *     description: 管理员删除Claude账户
   *     tags: [Admin]
   *     security:
   *       - adminPassword: []
   */
    router.post('/delete', async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: '邮箱是必需的'
        });
      }

      const account = await db.getAccountByEmail(email);
      if (!account) {
        return res.status(404).json({
          success: false,
          error: '账户不存在'
        });
      }

      await db.deleteAccount(email);

      // 记录管理员操作日志
      await db.logAdminAction({
        action: 'delete',
        target_email: email,
        admin_ip: getClientIP(req),
        user_agent: getUserAgent(req),
        success: true
      });

      res.json({
        success: true,
        message: '账户删除成功'
      });
    } catch (error) {
      console.error('删除账户失败:', error);
      res.status(500).json({
        success: false,
        error: '删除账户失败'
      });
    }
  });

  /**
   * @swagger
   * /api/admin/update:
   *   post:
   *     summary: 更新账户
   *     description: 管理员更新Claude账户信息
   *     tags: [Admin]
   *     security:
   *       - adminPassword: []
   */
    router.post('/update', async (req: Request, res: Response) => {
    try {
      const { email, session_key, refresh_token, expires_at, status } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: '邮箱是必需的'
        });
      }

      const account = await db.getAccountByEmail(email);
      if (!account) {
        return res.status(404).json({
          success: false,
          error: '账户不存在'
        });
      }

      const updateData: any = {
        updated_at: new Date()
      };

      if (session_key !== undefined) updateData.session_key = session_key;
      if (refresh_token !== undefined) updateData.refresh_token = refresh_token;
      if (expires_at !== undefined) updateData.expires_at = expires_at ? new Date(expires_at) : null;
      if (status !== undefined) updateData.status = status;

      await db.updateAccount(email, updateData);

      // 记录管理员操作日志
      await db.logAdminAction({
        action: 'update',
        target_email: email,
        admin_ip: getClientIP(req),
        user_agent: getUserAgent(req),
        success: true,
        new_data: updateData
      });

      res.json({
        success: true,
        message: '账户更新成功'
      });
    } catch (error) {
      console.error('更新账户失败:', error);
      res.status(500).json({
        success: false,
        error: '更新账户失败'
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
