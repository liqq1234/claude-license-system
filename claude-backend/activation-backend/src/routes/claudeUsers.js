/**
 * Claude用户管理相关路由
 */

const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/auth')
const { validateRequest } = require('../middleware/validation')
const { body } = require('express-validator')
const logger = require('../utils/logger')

/**
 * 验证用户访问权限 - 前端频繁调用的核心API
 */
router.get('/validate-access', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    logger.info(`用户 ${userId} 请求验证访问权限`);

    // 验证用户会员状态
    const userMembership = req.user.membership;
    const currentTime = new Date();

    if (!userMembership || !userMembership.membership_expires_at) {
      return res.json({
        status: 0,
        data: {
          hasAccess: false,
          reason: 'no_membership',
          message: '用户未激活会员'
        }
      });
    }

    const expiresAt = new Date(userMembership.membership_expires_at);
    const isValidMembership = expiresAt > currentTime;

    if (!isValidMembership) {
      return res.json({
        status: 0,
        data: {
          hasAccess: false,
          reason: 'membership_expired',
          message: '会员已过期',
          expiresAt: expiresAt.toISOString()
        }
      });
    }

    // 返回有效的访问权限
    res.json({
      status: 0,
      data: {
        hasAccess: true,
        expiresAt: expiresAt.toISOString(),
        membershipType: userMembership.membership_type || 'premium',
        remainingDays: Math.ceil((expiresAt - currentTime) / (1000 * 60 * 60 * 24))
      }
    });

  } catch (error) {
    logger.error('验证访问权限失败:', error);
    res.status(500).json({
      status: 1,
      message: '验证访问权限时发生错误'
    });
  }
});

/**
 * 获取Claude用户列表
 */
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    logger.info(`用户 ${userId} 请求获取Claude用户列表`);

    // 验证用户权限 - 根据过期时间动态判断
    const userMembership = req.user.membership;
    const currentTime = new Date();
    const isValidMembership = userMembership &&
      userMembership.membership_expires_at &&
      new Date(userMembership.membership_expires_at) > currentTime;

    if (!isValidMembership) {
      logger.info(`用户 ${userId} 会员已过期或无效`);
      return res.json({
        status: 1,
        message: '您的会员已过期，请先激活会员'
      });
    }


    // 过滤掉敏感信息，只返回前端需要的数据
    const safeUserList = claudeUsers.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      avatar: user.avatar
    }));

    res.json({
      status: 0,
      message: '获取Claude用户列表成功',
      data: safeUserList
    });

  } catch (error) {
    logger.error('获取Claude用户列表失败:', error);
    res.status(500).json({
      status: 1,
      message: '服务器内部错误'
    });
  }
});

/**
 * 请求Claude访问权限
 */
router.post('/access', 
  authenticateToken,
  [
    body('accountId').notEmpty().withMessage('账号ID不能为空'),
    body('accountEmail').isEmail().withMessage('账号邮箱格式不正确')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { accountId, accountEmail } = req.body;
      const userId = req.user.id;

      logger.info(`用户 ${userId} 请求访问Claude账号: ${accountEmail} (ID: ${accountId})`);

      // 验证用户权限 - 根据过期时间动态判断会员状态
      const userMembership = req.user.membership;
      const currentTime = new Date();
      const isValidMembership = userMembership &&
        userMembership.membership_expires_at &&
        new Date(userMembership.membership_expires_at) > currentTime;

      if (!isValidMembership) {
        logger.info(`用户 ${userId} 会员已过期或无效`);
        return res.json({
          status: 1,
          message: '您的激活码已过期，请联系管理员续费或重新激活'
        });
      }

      // 验证账号信息
      if (!accountId || !accountEmail) {
        return res.json({
          status: 1,
          message: '账号信息不完整'
        });
      }

      // 模拟从数据库获取Claude账号的session key
      // 在实际实现中，这里应该从pool-backend数据库中获取对应的session key
      const claudeAccount = await getClaudeAccountById(accountId);
      
      if (!claudeAccount || !claudeAccount.sessionKey) {
        return res.json({
          status: 1,
          message: '所选账号暂时不可用，请选择其他账号或稍后重试'
        });
      }

      // 生成跳转链接
      // 这里可以是直接跳转到Claude官网，或者跳转到代理域名
      const redirectUrl = generateClaudeRedirectUrl(claudeAccount.sessionKey);

      // 记录访问日志
      await logClaudeAccess(userId, accountId, accountEmail);

      res.json({
        status: 0,
        message: '获取访问权限成功',
        data: {
          redirectUrl: redirectUrl,
          accountEmail: accountEmail,
          expiresAt: userMembership.membership_expires_at
        }
      });

    } catch (error) {
      logger.error('请求Claude访问权限失败:', error);
      res.status(500).json({
        status: 1,
        message: '服务器内部错误'
      });
    }
  }
);

/**
 * 验证用户访问权限
 */
router.get('/validate-access', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    logger.info(`用户 ${userId} 请求验证访问权限`);

    // 检查用户会员状态 - 根据过期时间动态判断
    const userMembership = req.user.membership;
    const currentTime = new Date();

    let isValid = false;
    let membershipStatus = 'expired';
    let remainingDays = 0;

    if (userMembership && userMembership.membership_expires_at) {
      const expiresAt = new Date(userMembership.membership_expires_at);
      isValid = expiresAt > currentTime;
      membershipStatus = isValid ? 'active' : 'expired';

      if (isValid) {
        remainingDays = Math.ceil((expiresAt - currentTime) / (1000 * 60 * 60 * 24));
      }

      logger.info(`用户 ${userId} 会员状态: ${membershipStatus}, 过期时间: ${userMembership.membership_expires_at}, 剩余天数: ${remainingDays}`);
    } else {
      logger.info(`用户 ${userId} 没有会员信息`);
    }

    res.json({
      status: 0,
      message: '权限验证完成',
      data: {
        hasAccess: isValid,
        membershipStatus: membershipStatus,
        expiresAt: userMembership ? userMembership.membership_expires_at : null,
        remainingDays: remainingDays,
        userId: userId,
        username: req.user.username || req.user.email
      }
    });

  } catch (error) {
    logger.error('验证用户访问权限失败:', error);
    res.status(500).json({
      status: 1,
      message: '服务器内部错误'
    });
  }
});

// 辅助函数：从数据库获取Claude账号信息
async function getClaudeAccountById(accountId) {
  // 模拟数据库查询
  // 在实际实现中，这里应该查询pool-backend的数据库
  const mockAccounts = {
    'claude_user_1': {
      id: 'claude_user_1',
      email: 'claude.ai.user1@example.com',
      sessionKey: 'sk-ant-api03-example-session-key-1',
      status: 'active'
    },
    'claude_user_2': {
      id: 'claude_user_2',
      email: 'claude.ai.user2@example.com',
      sessionKey: 'sk-ant-api03-example-session-key-2',
      status: 'active'
    },
    'claude_user_3': {
      id: 'claude_user_3',
      email: 'claude.ai.user3@example.com',
      sessionKey: 'sk-ant-api03-example-session-key-3',
      status: 'offline'
    }
  };

  return mockAccounts[accountId] || null;
}

// 辅助函数：生成Claude跳转链接
function generateClaudeRedirectUrl(sessionKey) {
  // 这里可以生成直接跳转到Claude官网的链接
  // 或者跳转到配置的代理域名
  const proxyDomain = process.env.CLAUDE_PROXY_DOMAIN || 'claude.ai';
  
  // 如果有代理域名，使用代理域名
  if (proxyDomain !== 'claude.ai') {
    return `https://${proxyDomain}`;
  }
  
  // 否则直接跳转到Claude官网
  // 注意：直接跳转到Claude官网需要用户手动登录
  return 'https://claude.ai/chats';
}

// 辅助函数：记录Claude访问日志
async function logClaudeAccess(userId, accountId, accountEmail) {
  try {
    // 这里应该记录到数据库
    logger.info(`Claude访问记录: 用户${userId} 访问账号${accountEmail}(${accountId}) 时间:${new Date().toISOString()}`);
    
    // 在实际实现中，可以将访问记录保存到数据库
    // await db.claudeAccessLogs.create({
    //   userId,
    //   accountId,
    //   accountEmail,
    //   accessTime: new Date(),
    //   ipAddress: req.ip
    // });
    
  } catch (error) {
    logger.error('记录Claude访问日志失败:', error);
  }
}

module.exports = router;
