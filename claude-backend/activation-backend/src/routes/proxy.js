/**
 * 代理跳转相关路由
 */

const express = require('express')
const router = express.Router()
const proxyService = require('../services/proxyService')
const { authenticateToken } = require('../middleware/auth')
const { validateRequest } = require('../middleware/validation')
const { param, query } = require('express-validator')
const logger = require('../utils/logger')

// 卡片跳转代理
router.get('/jump/:serviceType/:cardId?',
  authenticateToken,
  [
    param('serviceType').isIn(['gamma', 'figma', 'canva']).withMessage('无效的服务类型')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { serviceType } = req.params
      const userId = req.user.id
      const ipAddress = req.ip || req.connection.remoteAddress
      const userAgent = req.get('User-Agent')

      // 创建代理会话
      const session = await proxyService.createProxySession(
        userId,
        serviceType,
        ipAddress,
        userAgent
      )

      // 直接重定向到目标服务
      res.redirect(session.redirectUrl)
    } catch (error) {
      logger.error('代理跳转失败:', error)
      
      // 根据错误类型返回不同的响应
      if (error.message.includes('访问被拒绝')) {
        res.status(403).json({
          status: 403,
          message: '访问被拒绝',
          error: error.message,
          redirectTo: '/dashboard?error=access_denied'
        })
      } else if (error.message.includes('暂无可用账号')) {
        res.status(503).json({
          status: 503,
          message: '服务暂时不可用',
          error: '暂无可用账号，请稍后再试',
          redirectTo: '/dashboard?error=service_unavailable'
        })
      } else {
        res.status(500).json({
          status: 500,
          message: '跳转失败',
          error: error.message,
          redirectTo: '/dashboard?error=jump_failed'
        })
      }
    }
  }
)

// 检查跳转权限
router.get('/check-access/:serviceType',
  authenticateToken,
  [
    param('serviceType').isIn(['gamma', 'figma', 'canva']).withMessage('无效的服务类型')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { serviceType } = req.params
      const userId = req.user.id

      const accessCheck = await proxyService.checkUserAccess(userId, serviceType)

      if (accessCheck.hasAccess) {
        res.json({
          status: 0,
          data: {
            hasAccess: true,
            serviceType,
            expiresAt: accessCheck.activation.expires_at,
            remainingUsage: accessCheck.activation.remaining_usage,
            availableTokens: accessCheck.availableTokens
          }
        })
      } else {
        res.json({
          status: 0,
          data: {
            hasAccess: false,
            serviceType,
            reason: accessCheck.reason,
            message: this.getAccessDeniedMessage(accessCheck.reason)
          }
        })
      }
    } catch (error) {
      logger.error('检查访问权限失败:', error)
      res.status(500).json({
        status: 1,
        message: error.message || '检查访问权限失败'
      })
    }
  }
)

// 获取用户可用服务
router.get('/user/available-services',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id
      const services = await proxyService.getUserAvailableServices(userId)

      res.json({
        status: 0,
        data: {
          services
        }
      })
    } catch (error) {
      logger.error('获取用户可用服务失败:', error)
      res.status(500).json({
        status: 1,
        message: error.message || '获取可用服务失败'
      })
    }
  }
)

// 终止代理会话
router.post('/session/:sessionId/terminate',
  authenticateToken,
  [
    param('sessionId').isUUID().withMessage('无效的会话ID')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { sessionId } = req.params
      const userId = req.user.id

      await proxyService.terminateSession(sessionId, userId)

      res.json({
        status: 0,
        message: '会话终止成功'
      })
    } catch (error) {
      logger.error('终止会话失败:', error)
      res.status(500).json({
        status: 1,
        message: error.message || '终止会话失败'
      })
    }
  }
)

// 获取用户使用记录
router.get('/user/usage-history',
  authenticateToken,
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('限制数量必须在1-100之间'),
    query('offset').optional().isInt({ min: 0 }).withMessage('偏移量必须大于等于0')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const userId = req.user.id
      const { limit = 50, offset = 0 } = req.query

      const result = await proxyService.getUserUsageHistory(
        userId,
        parseInt(limit),
        parseInt(offset)
      )

      res.json({
        status: 0,
        data: result
      })
    } catch (error) {
      logger.error('获取使用记录失败:', error)
      res.status(500).json({
        status: 1,
        message: error.message || '获取使用记录失败'
      })
    }
  }
)

// 获取服务配置信息
router.get('/services/config',
  async (req, res) => {
    try {
      const services = [
        {
          type: 'gamma',
          name: 'Gamma设计工具',
          description: 'AI驱动的演示文稿和网页设计平台',
          icon: 'https://gamma.app/favicon.ico',
          features: ['AI设计', '模板丰富', '协作编辑', '一键发布'],
          category: 'design'
        },
        {
          type: 'figma',
          name: 'Figma设计工具',
          description: '专业的界面设计和原型制作工具',
          icon: 'https://figma.com/favicon.ico',
          features: ['界面设计', '原型制作', '团队协作', '插件生态'],
          category: 'design'
        },
        {
          type: 'canva',
          name: 'Canva设计平台',
          description: '简单易用的图形设计平台',
          icon: 'https://canva.com/favicon.ico',
          features: ['模板设计', '素材丰富', '社交媒体', '品牌套件'],
          category: 'design'
        }
      ]

      res.json({
        status: 0,
        data: {
          services
        }
      })
    } catch (error) {
      logger.error('获取服务配置失败:', error)
      res.status(500).json({
        status: 1,
        message: '获取服务配置失败'
      })
    }
  }
)

// 辅助方法：获取访问拒绝消息
function getAccessDeniedMessage(reason) {
  const messages = {
    no_activation: '您还没有激活此服务，请先兑换激活码',
    no_available_tokens: '服务暂时不可用，请稍后再试',
    expired: '您的服务已过期，请重新激活',
    suspended: '您的账号已被暂停，请联系客服',
    insufficient_usage: '您的使用次数已用完，请重新激活'
  }
  
  return messages[reason] || '访问被拒绝'
}

module.exports = router
