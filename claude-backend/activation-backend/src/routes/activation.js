/**
 * 激活码相关路由
 */

const express = require('express')
const router = express.Router()
const activationService = require('../services/activationService')
const { authenticateToken, requireAdmin } = require('../middleware/auth')
const { validateRequest } = require('../middleware/validation')
const { body, query, param } = require('express-validator')
const logger = require('../utils/logger')

// 绑定激活码 - 前端调用的核心API
router.post('/bind',
  authenticateToken,
  [
    body('activationCode').notEmpty().withMessage('激活码不能为空')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { activationCode } = req.body
      const userId = req.user.id

      logger.info(`用户 ${userId} 尝试绑定激活码: ${activationCode}`)

      // 调用激活服务绑定激活码
      const result = await activationService.bindActivationCode(userId, activationCode)

      res.json({
        status: 0,
        message: '激活码绑定成功',
        data: result
      })
    } catch (error) {
      logger.error('绑定激活码失败:', error)
      res.status(400).json({
        status: 1,
        message: error.message || '绑定激活码失败'
      })
    }
  }
)

// 兑换激活码
router.post('/redeem', 
  authenticateToken,
  [
    body('code').notEmpty().withMessage('激活码不能为空'),
    body('serviceType').isIn(['gamma', 'figma', 'canva', 'premium']).withMessage('无效的服务类型')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { code, serviceType } = req.body
      const userId = req.user.id

      const result = await activationService.redeemActivationCode(userId, code, serviceType)

      res.json({
        status: 0,
        message: '激活码兑换成功',
        data: result
      })
    } catch (error) {
      logger.error('兑换激活码失败:', error)
      res.status(400).json({
        status: 1,
        message: error.message || '兑换激活码失败'
      })
    }
  }
)

// 获取用户完整信息
router.get('/user-info', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    // 获取用户完整信息，包括会员状态
    const userInfo = await activationService.getUserCompleteInfo(userId)

    res.json({
      status: 0,
      message: '获取用户信息成功',
      data: userInfo
    })
  } catch (error) {
    logger.error('获取用户信息失败:', error)
    res.status(500).json({
      status: 1,
      message: error.message || '获取用户信息失败'
    })
  }
})

// 验证会员资格
router.post('/validate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    const validation = await activationService.validateMembership(userId)

    res.json({
      status: 0,
      message: '会员验证完成',
      data: validation
    })
  } catch (error) {
    logger.error('会员验证失败:', error)
    res.status(500).json({
      status: 1,
      message: error.message || '会员验证失败'
    })
  }
})

// 查询激活码状态
router.get('/status',
  authenticateToken,
  [
    query('code').notEmpty().withMessage('激活码不能为空')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { code } = req.query
      const result = await activationService.getActivationCodeStatus(code)

      res.json({
        status: 0,
        data: result
      })
    } catch (error) {
      logger.error('查询激活码状态失败:', error)
      res.status(500).json({
        status: 1,
        message: error.message || '查询激活码状态失败'
      })
    }
  }
)

// 获取用户激活记录
router.get('/user/activations',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id
      const result = await activationService.getUserActivations(userId)

      res.json({
        status: 0,
        data: result
      })
    } catch (error) {
      logger.error('获取用户激活记录失败:', error)
      res.status(500).json({
        status: 1,
        message: error.message || '获取激活记录失败'
      })
    }
  }
)

// ========== 管理员接口 ==========

// 生成激活码 (管理员)
router.post('/admin/generate',
  authenticateToken,
  requireAdmin,
  [
    body('count').isInt({ min: 1, max: 1000 }).withMessage('数量必须在1-1000之间'),
    body('serviceType').isIn(['gamma', 'figma', 'canva', 'premium']).withMessage('无效的服务类型'),
    body('validDays').optional().isInt({ min: 1, max: 365 }).withMessage('有效天数必须在1-365之间'),
    body('maxUsagePerCode').optional().isInt({ min: 1, max: 1000 }).withMessage('每码最大使用次数必须在1-1000之间'),
    body('description').optional().isLength({ max: 200 }).withMessage('描述不能超过200字符')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { count, serviceType, validDays, maxUsagePerCode, description } = req.body
      const adminUserId = req.user.id

      const result = await activationService.generateActivationCodes({
        count,
        serviceType,
        validDays,
        maxUsagePerCode,
        description,
        adminUserId
      })

      res.json({
        status: 0,
        message: '激活码生成成功',
        data: result
      })
    } catch (error) {
      logger.error('生成激活码失败:', error)
      res.status(500).json({
        status: 1,
        message: error.message || '生成激活码失败'
      })
    }
  }
)

// 获取激活码列表 (管理员)
router.get('/admin/codes',
  authenticateToken,
  requireAdmin,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须大于0'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    query('serviceType').optional().isIn(['gamma', 'figma', 'canva', 'premium']).withMessage('无效的服务类型'),
    query('status').optional().isIn(['unused', 'used', 'expired', 'disabled']).withMessage('无效的状态'),
    query('search').optional().isLength({ max: 50 }).withMessage('搜索关键词不能超过50字符')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        serviceType,
        status,
        batchId,
        search
      } = req.query

      const result = await activationService.getActivationCodes({
        page: parseInt(page),
        limit: parseInt(limit),
        serviceType,
        status,
        batchId,
        search
      })

      res.json({
        status: 0,
        data: result
      })
    } catch (error) {
      logger.error('获取激活码列表失败:', error)
      res.status(500).json({
        status: 1,
        message: error.message || '获取激活码列表失败'
      })
    }
  }
)

// 更新激活码状态 (管理员)
router.put('/admin/codes/:codeId/status',
  authenticateToken,
  requireAdmin,
  [
    param('codeId').isUUID().withMessage('无效的激活码ID'),
    body('status').isIn(['unused', 'used', 'expired', 'disabled']).withMessage('无效的状态'),
    body('reason').optional().isLength({ max: 200 }).withMessage('原因不能超过200字符')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { codeId } = req.params
      const { status } = req.body
      const adminUserId = req.user.id

      await activationService.updateActivationCodeStatus(codeId, status, adminUserId)

      res.json({
        status: 0,
        message: '激活码状态更新成功'
      })
    } catch (error) {
      logger.error('更新激活码状态失败:', error)
      res.status(500).json({
        status: 1,
        message: error.message || '更新激活码状态失败'
      })
    }
  }
)

// 获取激活统计 (管理员)
router.get('/admin/statistics',
  authenticateToken,
  requireAdmin,
  [
    query('days').optional().isInt({ min: 1, max: 365 }).withMessage('天数必须在1-365之间')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { days = 30 } = req.query
      const result = await activationService.getActivationStatistics(parseInt(days))

      res.json({
        status: 0,
        data: result
      })
    } catch (error) {
      logger.error('获取激活统计失败:', error)
      res.status(500).json({
        status: 1,
        message: error.message || '获取激活统计失败'
      })
    }
  }
)

module.exports = router
