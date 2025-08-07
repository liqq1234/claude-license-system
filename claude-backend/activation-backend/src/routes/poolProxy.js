/**
 * Pool Backend 代理路由
 * 为前端提供统一的API接口，代理访问pool-backend
 */

const express = require('express')
const router = express.Router()
const axios = require('axios')
const { authenticateToken } = require('../middleware/auth')
const logger = require('../utils/logger')

// Pool-backend配置
const POOL_BACKEND_URL = process.env.POOL_BACKEND_URL || 'http://localhost:3457'

// 创建axios实例用于代理请求
const poolApi = axios.create({
  baseURL: POOL_BACKEND_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

/**
 * 验证用户会员权限的中间件
 */
const validateMembership = (req, res, next) => {
  const userMembership = req.user.membership
  const currentTime = new Date()
  const isValidMembership = userMembership &&
    userMembership.membership_expires_at &&
    new Date(userMembership.membership_expires_at) > currentTime

  if (!isValidMembership) {
    return res.status(403).json({
      status: 1,
      message: '您的会员已过期，请先激活会员'
    })
  }
  
  next()
}

/**
 * 代理获取可用邮箱列表
 */
router.get('/emails', authenticateToken, validateMembership, async (req, res) => {
  try {
    const userId = req.user.id
    
    // 代理请求到pool-backend
    const response = await poolApi.get('/api/emails')
    
    logger.info(`用户 ${userId} 获取邮箱列表成功`)
    
    res.json(response.data)
  } catch (error) {
    logger.error('代理获取邮箱列表失败:', error)
    res.status(500).json({
      status: 1,
      message: '获取邮箱列表失败',
      error: error.message
    })
  }
})

/**
 * 代理随机登录请求
 */
router.post('/login/random', authenticateToken, validateMembership, async (req, res) => {
  try {
    const userId = req.user.id
    
    // 代理请求到pool-backend
    const response = await poolApi.post('/api/login/random', req.body)
    
    logger.info(`用户 ${userId} 随机登录请求成功`)
    
    res.json(response.data)
  } catch (error) {
    logger.error('代理随机登录失败:', error)
    res.status(500).json({
      status: 1,
      message: '随机登录失败',
      error: error.message
    })
  }
})

/**
 * 代理特定账户登录请求
 */
router.post('/login/specific', authenticateToken, validateMembership, async (req, res) => {
  try {
    const userId = req.user.id
    
    // 代理请求到pool-backend
    const response = await poolApi.post('/api/login/specific', req.body)
    
    logger.info(`用户 ${userId} 特定账户登录请求成功`)
    
    res.json(response.data)
  } catch (error) {
    logger.error('代理特定账户登录失败:', error)
    res.status(500).json({
      status: 1,
      message: '特定账户登录失败',
      error: error.message
    })
  }
})

/**
 * 代理pool-backend状态检查
 */
router.get('/status', async (req, res) => {
  try {
    const response = await poolApi.get('/api/status')
    res.json(response.data)
  } catch (error) {
    logger.error('代理状态检查失败:', error)
    res.status(500).json({
      status: 1,
      message: 'Pool-backend连接失败',
      error: error.message
    })
  }
})

module.exports = router
