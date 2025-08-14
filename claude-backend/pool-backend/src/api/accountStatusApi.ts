// src/api/accountStatusApi.ts
/**
 * 账户状态 API 端点
 * 提供账户状态查询、更新等功能
 */

import { Router, Request, Response } from 'express';
import { accountStatusManager, AccountStatus } from '../managers/accountStatusManager';

const router = Router();

/**
 * @swagger
 * /api/account-status:
 *   get:
 *     summary: 获取所有账户状态
 *     description: 获取所有账户的当前状态，包括空闲、繁忙、限流等信息
 *     tags: [Account Status]
 *     responses:
 *       200:
 *         description: 账户状态列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accounts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       accountId:
 *                         type: string
 *                       email:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [idle, busy, error]
 *                       rateLimitUntil:
 *                         type: number
 *                       cooldownSeconds:
 *                         type: number
 *                       remainingSeconds:
 *                         type: number
 *                       resetTime:
 *                         type: string
 *                       lastCheckTime:
 *                         type: number
 *                 stats:
 *                   type: object
 *                   properties:
 *                     idle:
 *                       type: integer
 *                     busy:
 *                       type: integer
 *                     rateLimited:
 *                       type: integer
 *                     error:
 *                       type: integer
 *                     total:
 *                       type: integer
 */
// GET /api/account-status: 获取所有账户状态
router.get('/', async (req: Request, res: Response) => {
  try {
    console.log('📊 获取所有账户状态');
    
    const allStatuses = accountStatusManager.getAllAccountStatuses();
    const stats = accountStatusManager.getStatusStats();
    
    const accounts = Array.from(allStatuses.values()).map(status => {
      const countdown = accountStatusManager.getResetCountdown(status.accountId);
      
      return {
        accountId: status.accountId,
        email: status.email,
        status: status.status,
        rateLimitUntil: status.rateLimitUntil,
        cooldownSeconds: status.cooldownSeconds,
        remainingSeconds: countdown.remainingSeconds,
        resetTime: countdown.resetTime,
        lastCheckTime: status.lastCheckTime,
        errorCount: status.errorCount,
        lastErrorMessage: status.lastErrorMessage
      };
    });
    
    res.json({
      accounts,
      stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('💥 获取账户状态失败:', error);
    res.status(500).json({
      error: 'Get account status failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/account-status/stats:
 *   get:
 *     summary: 获取账户状态统计
 *     description: 获取各种状态的账户数量统计
 *     tags: [Account Status]
 *     responses:
 *       200:
 *         description: 状态统计信息
 */
// GET /api/account-status/stats: 获取状态统计
router.get('/stats', async (req: Request, res: Response) => {
  try {
    console.log('📈 获取账户状态统计');

    const stats = accountStatusManager.getStatusStats();
    const availableAccounts = accountStatusManager.getAvailableAccounts();
    const rateLimitedAccounts = accountStatusManager.getRateLimitedAccounts();

    res.json({
      stats,
      availableCount: availableAccounts.length,
      rateLimitedCount: rateLimitedAccounts.length,
      availableAccounts: availableAccounts.map(acc => ({
        accountId: acc.accountId,
        email: acc.email
      })),
      rateLimitedAccounts: rateLimitedAccounts.map(acc => {
        const countdown = accountStatusManager.getResetCountdown(acc.accountId);
        return {
          accountId: acc.accountId,
          email: acc.email,
          remainingSeconds: countdown.remainingSeconds,
          resetTime: countdown.resetTime
        };
      }),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 获取状态统计失败:', error);
    res.status(500).json({
      error: 'Get status stats failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/account-status/{accountId}:
 *   get:
 *     summary: 获取单个账户状态
 *     description: 获取指定账户的详细状态信息
 *     tags: [Account Status]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: 账户ID
 *     responses:
 *       200:
 *         description: 账户状态详情
 *       404:
 *         description: 账户未找到
 */
// GET /api/account-status/:accountId: 获取单个账户状态
router.get('/:accountId', async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    
    console.log(`📊 获取账户状态: ${accountId}`);
    
    const status = accountStatusManager.getAccountStatus(accountId);
    
    if (!status) {
      return res.status(404).json({
        error: 'Account not found',
        message: `Account ${accountId} not found in status cache`
      });
    }
    
    const countdown = accountStatusManager.getResetCountdown(accountId);
    
    const result = {
      accountId: status.accountId,
      email: status.email,
      status: status.status,
      rateLimitUntil: status.rateLimitUntil,
      cooldownSeconds: status.cooldownSeconds,
      remainingSeconds: countdown.remainingSeconds,
      resetTime: countdown.resetTime,
      lastCheckTime: status.lastCheckTime,
      errorCount: status.errorCount,
      lastErrorMessage: status.lastErrorMessage,
      isRateLimited: countdown.isRateLimited
    };
    
    res.json(result);
    
  } catch (error) {
    console.error('💥 获取单个账户状态失败:', error);
    res.status(500).json({
      error: 'Get account status failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/account-status/{accountId}/reset:
 *   post:
 *     summary: 手动重置账户状态
 *     description: 手动将账户状态重置为空闲
 *     tags: [Account Status]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: 账户ID
 *     responses:
 *       200:
 *         description: 重置成功
 *       404:
 *         description: 账户未找到
 */
// POST /api/account-status/:accountId/reset: 手动重置账户状态
router.post('/:accountId/reset', async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    
    console.log(`🔄 手动重置账户状态: ${accountId}`);
    
    const status = accountStatusManager.getAccountStatus(accountId);
    
    if (!status) {
      return res.status(404).json({
        error: 'Account not found',
        message: `Account ${accountId} not found in status cache`
      });
    }
    
    accountStatusManager.setAccountIdle(accountId, status.email);
    
    console.log(`✅ 账户 ${status.email} 状态已手动重置为空闲`);
    
    res.json({
      success: true,
      message: `Account ${status.email} status reset to idle`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('💥 重置账户状态失败:', error);
    res.status(500).json({
      error: 'Reset account status failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
