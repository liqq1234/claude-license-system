/**
 * 账户状态管理API
 * 管理Claude账户的状态：空闲、可用、繁忙
 */

import { Router, Request, Response } from 'express';
import { DatabaseManager } from '../database';

// 创建路由的工厂函数
export function createAccountStatusRouter(db: DatabaseManager) {
  const router = Router();

  /**
   * @swagger
   * /api/account-status/stats:
   *   get:
   *     summary: 获取账户状态统计
   *     description: 获取各种状态的账户数量统计
   *     tags: [Account Status]
   *     responses:
   *       200:
   *         description: 成功获取统计信息
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     idle:
   *                       type: number
   *                     available:
   *                       type: number
   *                     busy:
   *                       type: number
   *                     rate_limited:
   *                       type: number
   *                     total:
   *                       type: number
   */
  router.get('/stats', async (req: Request, res: Response) => {
    try {
      const stats = await db.getAccountStatusStats();
      
      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('获取账户状态统计失败:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get account status stats',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * @swagger
   * /api/account-status/list:
   *   get:
   *     summary: 根据状态获取账户列表
   *     description: 获取指定状态的账户列表
   *     tags: [Account Status]
   *     parameters:
   *       - in: query
   *         name: status
   *         required: true
   *         schema:
   *           type: string
   *           enum: [idle, available, busy]
   *         description: 账户状态
   *     responses:
   *       200:
   *         description: 成功获取账户列表
   */
  router.get('/list', async (req: Request, res: Response) => {
    try {
      const { status } = req.query;
      
      if (!status || !['idle', 'available', 'busy'].includes(status as string)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status parameter',
          message: 'Status must be one of: idle, available, busy'
        });
      }
      
      const accounts = await db.getAccountsByStatus(status as 'idle' | 'available' | 'busy');
      
      // 隐藏敏感信息
      const safeAccounts = accounts.map(account => ({
        id: account.id,
        email: account.email.replace(/(.{2}).*(@.*)/, '$1***$2'), // 邮箱脱敏
        account_status: account.account_status,
        last_used_at: account.last_used_at,
        usage_count: account.usage_count,
        rate_limit_reset_at: account.rate_limit_reset_at,
        created_at: account.created_at
      }));
      
      res.json({
        success: true,
        data: {
          status,
          count: safeAccounts.length,
          accounts: safeAccounts
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('获取账户列表失败:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get accounts by status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * @swagger
   * /api/account-status/update:
   *   post:
   *     summary: 更新账户状态
   *     description: 更新单个账户的状态
   *     tags: [Account Status]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *                 example: "user@example.com"
   *               status:
   *                 type: string
   *                 enum: [idle, available, busy]
   *                 example: "available"
   *     responses:
   *       200:
   *         description: 成功更新账户状态
   */
  router.post('/update', async (req: Request, res: Response) => {
    try {
      const { email, status } = req.body;
      
      if (!email || !status) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'Email and status are required'
        });
      }
      
      if (!['idle', 'available', 'busy'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status',
          message: 'Status must be one of: idle, available, busy'
        });
      }
      
      const success = await db.updateAccountStatus(email, status);
      
      if (success) {
        console.log(`✅ 账户 ${email} 状态已更新为: ${status}`);
        res.json({
          success: true,
          message: 'Account status updated successfully',
          data: { email, status }
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Account not found',
          message: 'No account found with the provided email'
        });
      }
    } catch (error) {
      console.error('更新账户状态失败:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update account status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * @swagger
   * /api/account-status/batch-update:
   *   post:
   *     summary: 批量更新账户状态
   *     description: 批量更新多个账户的状态
   *     tags: [Account Status]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               emails:
   *                 type: array
   *                 items:
   *                   type: string
   *                 example: ["user1@example.com", "user2@example.com"]
   *               status:
   *                 type: string
   *                 enum: [idle, available, busy]
   *                 example: "idle"
   *     responses:
   *       200:
   *         description: 成功批量更新账户状态
   */
  router.post('/batch-update', async (req: Request, res: Response) => {
    try {
      const { emails, status } = req.body;
      
      if (!emails || !Array.isArray(emails) || emails.length === 0 || !status) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'Emails array and status are required'
        });
      }
      
      if (!['idle', 'available', 'busy'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status',
          message: 'Status must be one of: idle, available, busy'
        });
      }
      
      const updatedCount = await db.batchUpdateAccountStatus(emails, status);
      
      console.log(`✅ 批量更新 ${updatedCount} 个账户状态为: ${status}`);
      res.json({
        success: true,
        message: 'Batch account status update completed',
        data: {
          requested_count: emails.length,
          updated_count: updatedCount,
          status
        }
      });
    } catch (error) {
      console.error('批量更新账户状态失败:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to batch update account status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * @swagger
   * /api/account-status/available:
   *   get:
   *     summary: 获取可用账户列表
   *     description: 获取当前可用于使用的账户列表（空闲或可用状态，且未被限流）
   *     tags: [Account Status]
   *     responses:
   *       200:
   *         description: 成功获取可用账户列表
   */
  router.get('/available', async (req: Request, res: Response) => {
    try {
      const accounts = await db.getAvailableAccountsForUse();
      
      // 隐藏敏感信息
      const safeAccounts = accounts.map(account => ({
        id: account.id,
        email: account.email.replace(/(.{2}).*(@.*)/, '$1***$2'), // 邮箱脱敏
        account_status: account.account_status,
        last_used_at: account.last_used_at,
        usage_count: account.usage_count
      }));
      
      res.json({
        success: true,
        data: {
          count: safeAccounts.length,
          accounts: safeAccounts
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('获取可用账户列表失败:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get available accounts',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
}

export default createAccountStatusRouter;
