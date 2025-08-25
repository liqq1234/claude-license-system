/**
 * 管理员相关路由
 */

const express = require('express')
const router = express.Router()
const tokenPoolService = require('../services/tokenPoolService')
const activationService = require('../services/activationService')
const { User, UserActivation, UsageRecord, TokenPool } = require('../models')

const { validateRequest } = require('../middleware/validation')
const { body, query, param } = require('express-validator')
const { Op } = require('sequelize')
const logger = require('../utils/logger')

// ========== Token池管理 ==========

// 添加Token到池中
router.post('/token-pool/add',
  [
    body('serviceType').isIn(['gamma', 'figma', 'canva']).withMessage('无效的服务类型'),
    body('accountAlias').notEmpty().withMessage('账号别名不能为空'),
    body('accessToken').notEmpty().withMessage('访问令牌不能为空'),
    body('maxConcurrentUsers').optional().isInt({ min: 1, max: 50 }).withMessage('最大并发用户数必须在1-50之间'),
    body('maxDailyUsage').optional().isInt({ min: 1, max: 1000 }).withMessage('每日最大使用次数必须在1-1000之间')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const {
        serviceType,
        accountAlias,
        accessToken,
        refreshToken,
        cookies,
        maxConcurrentUsers,
        maxDailyUsage,
        expiresAt
      } = req.body

      const result = await tokenPoolService.addToken({
        serviceType,
        accountAlias,
        accessToken,
        refreshToken,
        cookies,
        maxConcurrentUsers,
        maxDailyUsage,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      })

      res.json({
        status: 0,
        message: 'Token添加成功',
        data: result
      })
    } catch (error) {
      logger.error('添加Token失败:', error)
      res.status(500).json({
        status: 1,
        message: error.message || '添加Token失败'
      })
    }
  }
)

// 获取Token池状态
router.get('/token-pool/status',
  [
    query('serviceType').optional().isIn(['gamma', 'figma', 'canva']).withMessage('无效的服务类型')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { serviceType } = req.query
      const result = await tokenPoolService.getTokenPoolStatus(serviceType)

      res.json({
        status: 0,
        data: result
      })
    } catch (error) {
      logger.error('获取Token池状态失败:', error)
      res.status(500).json({
        status: 1,
        message: error.message || '获取Token池状态失败'
      })
    }
  }
)

// 更新Token状态
router.put('/token-pool/:tokenId/status',
  [
    param('tokenId').isUUID().withMessage('无效的Token ID'),
    body('status').isIn(['active', 'disabled', 'expired']).withMessage('无效的状态'),
    body('reason').optional().isLength({ max: 200 }).withMessage('原因不能超过200字符')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { tokenId } = req.params
      const { status, reason } = req.body

      await tokenPoolService.updateTokenStatus(tokenId, status, reason)

      res.json({
        status: 0,
        message: 'Token状态更新成功'
      })
    } catch (error) {
      logger.error('更新Token状态失败:', error)
      res.status(500).json({
        status: 1,
        message: error.message || '更新Token状态失败'
      })
    }
  }
)

// 删除Token
router.delete('/token-pool/:tokenId',
  [
    param('tokenId').isUUID().withMessage('无效的Token ID')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { tokenId } = req.params
      await tokenPoolService.deleteToken(tokenId)

      res.json({
        status: 0,
        message: 'Token删除成功'
      })
    } catch (error) {
      logger.error('删除Token失败:', error)
      res.status(500).json({
        status: 1,
        message: error.message || '删除Token失败'
      })
    }
  }
)

// ========== 用户管理 ==========

// 获取用户列表
router.get('/users',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须大于0'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    query('search').optional().isLength({ max: 50 }).withMessage('搜索关键词不能超过50字符'),
    query('status').optional().isIn(['active', 'suspended', 'deleted']).withMessage('无效的状态')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        status
      } = req.query

      const whereClause = {}
      if (status) whereClause.status = status
      if (search) {
        whereClause[Op.or] = [
          { username: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } }
        ]
      }

      const { count, rows } = await User.findAndCountAll({
        where: whereClause,
        attributes: ['id', 'username', 'email', 'role', 'status', 'created_at', 'last_login_at'],
        include: [
          {
            model: UserActivation,
            as: 'activations',
            attributes: ['service_type', 'status', 'expires_at'],
            required: false
          }
        ],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        order: [['created_at', 'DESC']]
      })

      // 统计每个用户的跳转次数
      const userIds = rows.map(user => user.id)
      const jumpCounts = await UsageRecord.findAll({
        attributes: [
          'user_id',
          [UsageRecord.sequelize.fn('COUNT', '*'), 'total_jumps']
        ],
        where: {
          user_id: { [Op.in]: userIds },
          action: 'jump'
        },
        group: ['user_id']
      })

      const jumpCountMap = {}
      jumpCounts.forEach(item => {
        jumpCountMap[item.user_id] = parseInt(item.dataValues.total_jumps)
      })

      const users = rows.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        registeredAt: user.created_at,
        lastLoginAt: user.last_login_at,
        activatedServices: user.activations.filter(a => a.status === 'active').map(a => a.service_type),
        totalJumps: jumpCountMap[user.id] || 0
      }))

      res.json({
        status: 0,
        data: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit)),
          users
        }
      })
    } catch (error) {
      logger.error('获取用户列表失败:', error)
      res.status(500).json({
        status: 1,
        message: error.message || '获取用户列表失败'
      })
    }
  }
)

// 更新用户状态
router.put('/users/:userId/status',
  [
    param('userId').isUUID().withMessage('无效的用户ID'),
    body('status').isIn(['active', 'suspended', 'deleted']).withMessage('无效的状态'),
    body('reason').optional().isLength({ max: 200 }).withMessage('原因不能超过200字符')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { userId } = req.params
      const { status, reason } = req.body
      const adminUserId = req.user.id

      const user = await User.findByPk(userId)
      if (!user) {
        return res.status(404).json({
          status: 1,
          message: '用户不存在'
        })
      }

      await user.update({ status })

      // 记录操作日志
      logger.info(`用户状态更新: ${userId} -> ${status} by admin ${adminUserId}`, { reason })

      res.json({
        status: 0,
        message: '用户状态更新成功'
      })
    } catch (error) {
      logger.error('更新用户状态失败:', error)
      res.status(500).json({
        status: 1,
        message: error.message || '更新用户状态失败'
      })
    }
  }
)

// ========== 系统统计 ==========

// 获取系统概览统计
router.get('/analytics/overview',
  async (req, res) => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // 用户统计
      const totalUsers = await User.count()
      const activeUsers = await User.count({ where: { status: 'active' } })
      
      // 激活码统计
      const totalActivationCodes = await require('../models').ActivationCode.count()
      const usedActivationCodes = await require('../models').ActivationCode.count({ 
        where: { status: 'used' } 
      })
      
      // 今日统计
      const todayActivations = await UserActivation.count({
        where: { activated_at: { [Op.gte]: today } }
      })
      
      const todayJumps = await UsageRecord.count({
        where: { 
          action: 'jump',
          created_at: { [Op.gte]: today }
        }
      })

      // Token池统计
      const tokenPoolStatus = await tokenPoolService.getTokenPoolStatus()

      res.json({
        status: 0,
        data: {
          totalUsers,
          activeUsers,
          totalActivationCodes,
          usedActivationCodes,
          todayActivations,
          todayJumps,
          tokenPoolStatus: tokenPoolStatus.summary
        }
      })
    } catch (error) {
      logger.error('获取系统统计失败:', error)
      res.status(500).json({
        status: 1,
        message: error.message || '获取系统统计失败'
      })
    }
  }
)

// 获取使用趋势
router.get('/analytics/trends',
  [
    query('period').optional().isIn(['7d', '30d', '90d']).withMessage('无效的时间周期'),
    query('serviceType').optional().isIn(['gamma', 'figma', 'canva']).withMessage('无效的服务类型')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { period = '30d', serviceType } = req.query
      
      const days = parseInt(period.replace('d', ''))
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const whereClause = {
        created_at: { [Op.gte]: startDate }
      }
      if (serviceType) whereClause.service_type = serviceType

      // 激活趋势
      const activationTrends = await UserActivation.findAll({
        attributes: [
          [UserActivation.sequelize.fn('DATE', UserActivation.sequelize.col('activated_at')), 'date'],
          [UserActivation.sequelize.fn('COUNT', '*'), 'activations']
        ],
        where: whereClause,
        group: [UserActivation.sequelize.fn('DATE', UserActivation.sequelize.col('activated_at'))],
        order: [[UserActivation.sequelize.fn('DATE', UserActivation.sequelize.col('activated_at')), 'ASC']]
      })

      // 跳转趋势
      const jumpTrends = await UsageRecord.findAll({
        attributes: [
          [UsageRecord.sequelize.fn('DATE', UsageRecord.sequelize.col('created_at')), 'date'],
          [UsageRecord.sequelize.fn('COUNT', '*'), 'jumps']
        ],
        where: {
          ...whereClause,
          action: 'jump'
        },
        group: [UsageRecord.sequelize.fn('DATE', UsageRecord.sequelize.col('created_at'))],
        order: [[UsageRecord.sequelize.fn('DATE', UsageRecord.sequelize.col('created_at')), 'ASC']]
      })

      res.json({
        status: 0,
        data: {
          period,
          serviceType,
          trends: {
            activations: activationTrends.map(item => ({
              date: item.dataValues.date,
              count: parseInt(item.dataValues.activations)
            })),
            jumps: jumpTrends.map(item => ({
              date: item.dataValues.date,
              count: parseInt(item.dataValues.jumps)
            }))
          }
        }
      })
    } catch (error) {
      logger.error('获取使用趋势失败:', error)
      res.status(500).json({
        status: 1,
        message: error.message || '获取使用趋势失败'
      })
    }
  }
)

// ========== 管理员统计API ==========

// 获取系统统计数据
router.get('/stats', async (req, res) => {
  try {
    const stats = await activationService.getSystemStats()

    res.json({
      status: 0,
      message: '获取统计数据成功',
      data: stats
    })
  } catch (error) {
    logger.error('获取统计数据失败:', error)
    res.status(500).json({
      status: 1,
      message: error.message || '获取统计数据失败'
    })
  }
})

// 获取图表数据
router.get('/chart-data', async (req, res) => {
  try {
    const chartData = await activationService.getChartData()

    res.json({
      status: 0,
      message: '获取图表数据成功',
      data: chartData
    })
  } catch (error) {
    logger.error('获取图表数据失败:', error)
    res.status(500).json({
      status: 1,
      message: error.message || '获取图表数据失败'
    })
  }
})

// 获取激活码列表（支持分页和筛选）
router.get('/codes', async (req, res) => {
  try {
    // 设置缓存控制头，防止浏览器缓存
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    console.log("🔍 [BACKEND DEBUG] 收到获取激活码列表请求");
    console.log("🔍 [BACKEND DEBUG] 请求路径:", req.path);
    console.log("🔍 [BACKEND DEBUG] 请求方法:", req.method);
    console.log("🔍 [BACKEND DEBUG] 查询参数:", req.query);
    
    const { page = 1, limit = 20, status, type, search } = req.query

    const requestParams = {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      type,
      search
    };
    console.log("🔍 [BACKEND DEBUG] 处理后的参数:", requestParams);

    const codes = await activationService.getActivationCodes(requestParams);
    console.log("🔍 [BACKEND DEBUG] 从service获取的数据:", codes);
    console.log("🔍 [BACKEND DEBUG] codes类型:", typeof codes);
    console.log("🔍 [BACKEND DEBUG] codes.codes长度:", codes.codes ? codes.codes.length : 'undefined');

    const responseData = {
      status: 0,
      message: '获取激活码列表成功',
      data: codes
    };
    console.log("🔍 [BACKEND DEBUG] 最终响应数据:", responseData);
    
    res.json(responseData);
  } catch (error) {
    logger.error('获取激活码列表失败:', error)
    res.status(500).json({
      status: 1,
      message: error.message || '获取激活码列表失败'
    })
  }
})

module.exports = router
