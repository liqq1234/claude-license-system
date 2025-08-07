/**
 * Claude代理访问路由
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * 获取Claude代理访问链接
 */
router.post('/access', authenticateToken, async (req, res) => {
  try {
    const { accountId, accountName } = req.body;
    const userId = req.user.id;

    logger.info(`用户 ${userId} 请求访问Claude账号: ${accountName} (ID: ${accountId})`);

    // 验证用户权限
    const userMembership = req.user.membership;
    if (!userMembership || new Date(userMembership.membership_expires_at) <= new Date()) {
      return res.status(403).json({
        success: false,
        message: '您的会员已过期，请先激活会员'
      });
    }

    // 验证账号可用性
    if (!accountId || !accountName) {
      return res.status(400).json({
        success: false,
        message: '账号信息不完整'
      });
    }

    // 生成代理访问链接
    const proxyDomain = process.env.CLAUDE_PROXY_DOMAIN || 'claude-mirror.yourdomain.com';
    const proxyUrl = `https://${proxyDomain}`;
    
    // 记录访问日志
    await logClaudeAccess(userId, accountId, accountName);

    // 返回代理链接
    res.json({
      success: true,
      proxyUrl: proxyUrl,
      accountName: accountName,
      message: `正在为您准备${accountName}的Claude访问`
    });

  } catch (error) {
    logger.error('获取Claude代理访问失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 获取用户的Claude访问记录
 */
router.get('/access-logs', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const logs = await getClaudeAccessLogs(userId, page, limit);

    res.json({
      success: true,
      data: logs
    });

  } catch (error) {
    logger.error('获取Claude访问记录失败:', error);
    res.status(500).json({
      success: false,
      message: '获取访问记录失败'
    });
  }
});

/**
 * 获取可用的Claude账号列表
 */
router.get('/accounts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 验证用户权限
    const userMembership = req.user.membership;
    if (!userMembership || new Date(userMembership.membership_expires_at) <= new Date()) {
      return res.status(403).json({
        success: false,
        message: '您的会员已过期，请先激活会员'
      });
    }

    // 模拟账号数据（实际应该从数据库获取）
    const accounts = [
      {
        id: 1,
        name: "admin y4",
        type: "Claude Max",
        status: "idle",
        expireDate: "2025-12-31",
        recoveryTime: null,
      },
      {
        id: 2,
        name: "dat233d",
        type: "Claude Max",
        status: "normal",
        expireDate: "2025-12-31",
        recoveryTime: null,
      },
      {
        id: 3,
        name: "hqp99k",
        type: "Claude Max",
        status: "idle",
        expireDate: "2025-12-31",
        recoveryTime: null,
      },
      {
        id: 4,
        name: "sqqcjr",
        type: "Claude Max",
        status: "normal",
        expireDate: "2025-12-31",
        recoveryTime: null,
      },
      {
        id: 5,
        name: "cxzngwm2",
        type: "Claude Max",
        status: "recovering",
        expireDate: "2025-12-31",
        recoveryTime: 2552,
      },
      {
        id: 6,
        name: "kgxbhbz",
        type: "Claude Max",
        status: "normal",
        expireDate: "2025-12-31",
        recoveryTime: null,
      },
      {
        id: 7,
        name: "22hcrlqv",
        type: "Claude Max",
        status: "normal",
        expireDate: "2025-12-31",
        recoveryTime: null,
      },
      {
        id: 8,
        name: "ry8u3gts",
        type: "Claude Max",
        status: "busy",
        expireDate: "2025-12-31",
        recoveryTime: null,
      },
    ];

    res.json({
      success: true,
      data: accounts
    });

  } catch (error) {
    logger.error('获取Claude账号列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取账号列表失败'
    });
  }
});

/**
 * 记录Claude访问日志
 */
async function logClaudeAccess(userId, accountId, accountName) {
  try {
    // 这里应该记录到数据库
    logger.info(`Claude访问记录: 用户${userId} 访问账号${accountName}(${accountId})`);
    
    // 可以扩展为记录到数据库
    // await ClaudeAccessLog.create({
    //   user_id: userId,
    //   account_id: accountId,
    //   account_name: accountName,
    //   access_time: new Date(),
    //   ip_address: req.ip
    // });
    
  } catch (error) {
    logger.error('记录Claude访问日志失败:', error);
  }
}

/**
 * 获取Claude访问记录
 */
async function getClaudeAccessLogs(userId, page, limit) {
  try {
    // 模拟数据（实际应该从数据库查询）
    const logs = [
      {
        id: 1,
        accountName: 'admin y4',
        accessTime: new Date(),
        duration: '15分钟',
        status: 'completed'
      },
      {
        id: 2,
        accountName: 'dat233d',
        accessTime: new Date(Date.now() - 3600000),
        duration: '32分钟',
        status: 'completed'
      }
    ];

    return {
      logs,
      total: logs.length,
      page: parseInt(page),
      limit: parseInt(limit)
    };
    
  } catch (error) {
    logger.error('获取Claude访问记录失败:', error);
    throw error;
  }
}

module.exports = router;
