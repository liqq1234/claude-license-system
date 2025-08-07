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
    const authHeader = req.get('Authorization')
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null

    if (!token) {
      return res.status(401).json({
        status: errors.UNAUTHORIZED,
        message: '缺少访问令牌'
      })
    }

    const result = await userService.verifyToken(token)
    
    if (!result) {
      return res.status(401).json({
        status: errors.INVALID_TOKEN,
        message: '令牌无效或已过期'
      })
    }

    // 将用户信息添加到请求对象中
    req.user = result
    req.token = token

    next()
  } catch (error) {
    logger.error('认证中间件错误:', error)
    return res.status(500).json({
      status: errors.INTERNAL_ERROR,
      message: '服务器内部错误'
    })
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
  if (!req.user) {
    return res.status(401).json({
      status: errors.UNAUTHORIZED,
      message: '未认证'
    })
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      status: errors.FORBIDDEN,
      message: '需要管理员权限'
    })
  }

  next()
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
