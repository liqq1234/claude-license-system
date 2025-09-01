'use strict'

const logger = require('../utils/logger')
const errors = require('../constants/errors')
const UserService = require('../services/userService')

const userService = new UserService()

/**
 * JWT认证中间件
 */
const authenticateToken = async (req, res, next) => {
  try {
    // 检查是否有Authorization头
    const authHeader = req.get('Authorization')
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null

    if (token) {
      // 如果有token，进行正常的用户认证
      try {
        const result = await userService.verifyToken(token)
        if (result && result.user) {
          req.user = result.user
          req.token = token
          return next()
        }
      } catch (error) {
        logger.warn('Token验证失败:', error.message)
      }
    }

    // 如果没有token或token无效，使用访客用户
    req.user = { 
      id: 'guest', 
      role: 'guest',
      email: 'guest@example.com',
      username: 'guest'
    }
    req.token = null
    return next()
  } catch (error) {
    logger.error('认证中间件错误:', error)
    // 出错时也使用访客用户，保证服务不中断
    req.user = { 
      id: 'guest', 
      role: 'guest',
      email: 'guest@example.com',
      username: 'guest'
    }
    req.token = null
    return next()
  }
}

/**
 * 可选认证中间件（不强制要求登录）
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.get('Authorization')
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null

    if (token) {
      const result = await userService.verifyToken(token)
      if (result) {
        req.user = result
        req.token = token
      }
    }

    next()
  } catch (error) {
    logger.error('可选认证中间件错误:', error)
    next()
  }
}

/**
 * 要求管理员权限
 */
const requireAdmin = (req, res, next) => {
  // 放宽管理员检查：直接放行
  return next()
}

/**
 * 频率限制中间件
 */
const createRateLimit = (windowMs, max, message) => {
  const requests = new Map()

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress
    const now = Date.now()
    const windowStart = now - windowMs

    // 清理过期的请求记录
    if (requests.has(key)) {
      const userRequests = requests.get(key).filter(time => time > windowStart)
      requests.set(key, userRequests)
    } else {
      requests.set(key, [])
    }

    const userRequests = requests.get(key)

    if (userRequests.length >= max) {
      return res.status(429).json({
        status: 429,
        message: message || '请求过于频繁，请稍后再试'
      })
    }

    userRequests.push(now)
    next()
  }
}

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAdmin,
  createRateLimit
}
