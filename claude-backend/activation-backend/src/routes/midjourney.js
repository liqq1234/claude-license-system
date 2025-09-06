/**
 * Midjourney相关路由
 */

const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/auth')
const { UserActivation } = require('../models')
const logger = require('../utils/logger')

/**
 * 检查用户Midjourney权限
 */
router.get('/check-permission', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    // 访客用户无权限
    if (userId === 'guest') {
      return res.json({
        success: false,
        hasPermission: false,
        message: '请先登录账号'
      })
    }

    // 查询用户的Midjourney激活状态
    const activation = await UserActivation.findOne({
      where: {
        user_id: userId,
        service_type: 'midjourney',
        status: 'active'
      },
      order: [['created_at', 'DESC']]
    })

    if (!activation) {
      return res.json({
        success: true,
        hasPermission: false,
        message: '您还未激活Midjourney服务',
        needActivation: true
      })
    }

    // 检查是否过期
    if (new Date() > new Date(activation.expires_at)) {
      return res.json({
        success: true,
        hasPermission: false,
        message: 'Midjourney服务已过期',
        expired: true,
        expiredAt: activation.expires_at
      })
    }

    // 检查使用次数
    if (activation.remaining_usage <= 0) {
      return res.json({
        success: true,
        hasPermission: false,
        message: 'Midjourney使用次数已用完',
        noUsage: true,
        maxUsage: activation.max_usage
      })
    }

    return res.json({
      success: true,
      hasPermission: true,
      message: 'Midjourney服务可用',
      activation: {
        id: activation.id,
        expiresAt: activation.expires_at,
        remainingUsage: activation.remaining_usage,
        maxUsage: activation.max_usage,
        activatedAt: activation.activated_at
      }
    })

  } catch (error) {
    logger.error('检查Midjourney权限失败:', error)
    res.status(500).json({
      success: false,
      message: '检查权限失败'
    })
  }
})

/**
 * 生成Midjourney访问链接
 */
router.post('/generate-access-url', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    // 访客用户无权限
    if (userId === 'guest') {
      return res.status(403).json({
        success: false,
        message: '请先登录账号'
      })
    }

    // 再次验证权限
    const activation = await UserActivation.findOne({
      where: {
        user_id: userId,
        service_type: 'midjourney',
        status: 'active'
      },
      order: [['created_at', 'DESC']]
    })

    if (!activation || new Date() > new Date(activation.expires_at) || activation.remaining_usage <= 0) {
      return res.status(403).json({
        success: false,
        message: 'Midjourney服务不可用'
      })
    }

    // 生成访问令牌（可以是JWT或简单的UUID）
    const accessToken = require('crypto').randomBytes(32).toString('hex')
    
    // 构造Midjourney访问链接
    const mjBaseUrl = process.env.MIDJOURNEY_BASE_URL || 'http://localhost:6015'
    const accessUrl = `${mjBaseUrl}?access_token=${accessToken}&user_id=${userId}`

    // 可以在这里记录访问日志或临时存储access_token
    logger.info(`用户 ${userId} 生成Midjourney访问链接: ${accessUrl}`)

    return res.json({
      success: true,
      accessUrl: accessUrl,
      expiresIn: 3600, // 1小时有效期
      message: '访问链接生成成功'
    })

  } catch (error) {
    logger.error('生成Midjourney访问链接失败:', error)
    res.status(500).json({
      success: false,
      message: '生成访问链接失败'
    })
  }
})

/**
 * 记录Midjourney使用
 */
router.post('/record-usage', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { action = 'generate', details = {} } = req.body

    if (userId === 'guest') {
      return res.status(403).json({
        success: false,
        message: '访客用户无法记录使用'
      })
    }

    // 查找用户激活记录
    const activation = await UserActivation.findOne({
      where: {
        user_id: userId,
        service_type: 'midjourney',
        status: 'active'
      },
      order: [['created_at', 'DESC']]
    })

    if (!activation || activation.remaining_usage <= 0) {
      return res.status(403).json({
        success: false,
        message: 'Midjourney服务不可用或使用次数已用完'
      })
    }

    // 减少使用次数
    await activation.update({
      remaining_usage: Math.max(0, activation.remaining_usage - 1)
    })

    // 记录使用日志
    const { UsageRecord } = require('../models')
    await UsageRecord.create({
      user_id: userId,
      service_type: 'midjourney',
      action: action,
      details: details
    })

    logger.info(`用户 ${userId} 使用Midjourney服务, 剩余次数: ${activation.remaining_usage - 1}`)

    return res.json({
      success: true,
      remainingUsage: activation.remaining_usage - 1,
      message: '使用记录成功'
    })

  } catch (error) {
    logger.error('记录Midjourney使用失败:', error)
    res.status(500).json({
      success: false,
      message: '记录使用失败'
    })
  }
})

module.exports = router
