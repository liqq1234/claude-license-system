'use strict'

const express = require('express')
const router = express.Router()
const logger = require('../utils/logger')
const errors = require('../constants/errors')
const UserService = require('../services/userService')
const { authenticateToken } = require('../middleware/auth')

const userService = new UserService()

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: 用户名
 *           example: "testuser"
 *         email:
 *           type: string
 *           format: email
 *           description: 邮箱地址
 *           example: "test@example.com"
 *         password:
 *           type: string
 *           minLength: 6
 *           description: 密码
 *           example: "password123"
 *     
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: 邮箱地址
 *           example: "test@example.com"
 *         password:
 *           type: string
 *           description: 密码
 *           example: "password123"
 *     
 *     EmailCodeRequest:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: 邮箱地址
 *           example: "test@example.com"
 *         type:
 *           type: string
 *           enum: [register, reset_password, change_email]
 *           description: 验证码类型
 *           example: "register"
 *     
 *     AuthResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: integer
 *           description: 状态码
 *         message:
 *           type: string
 *           description: 响应消息
 *         data:
 *           type: object
 *           description: 响应数据
 */

/**
 * @swagger
 * /auth/send-code:
 *   post:
 *     tags: [1. 用户认证]
 *     summary: 发送邮箱验证码
 *     description: 向指定邮箱发送验证码
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmailCodeRequest'
 *     responses:
 *       200:
 *         description: 验证码发送成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 */
router.post('/send-code', async (req, res) => {
  try {
    const { email, type = 'register' } = req.body

    // 参数验证
    if (!email) {
      return res.json({
        status: errors.INVALID_INPUT,
        message: '邮箱地址不能为空'
      })
    }

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.json({
        status: errors.INVALID_INPUT,
        message: '邮箱格式不正确'
      })
    }

    // 邮箱后缀验证
    const allowedDomains = ['@qq.com', '@gmail.com', '@163.com', '@126.com', '@outlook.com', '@foxmail.com']
    const emailDomain = '@' + email.split('@')[1].toLowerCase()
    if (!allowedDomains.includes(emailDomain)) {
      return res.json({
        status: errors.INVALID_INPUT,
        message: `发送失败，本站仅允许以下邮箱后缀：${allowedDomains.join(',')}`
      })
    }

    const result = await userService.sendEmailVerificationCode(email, type)
    
    res.json({
      status: result.code,
      message: result.message,
      data: result.data
    })

  } catch (error) {
    logger.error('发送验证码接口错误:', error)
    res.json({
      status: errors.INTERNAL_ERROR,
      message: '服务器内部错误'
    })
  }
})

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [1. 用户认证]
 *     summary: 用户注册
 *     description: 注册新用户账户
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       200:
 *         description: 注册成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, verificationCode } = req.body

    // 参数验证
    if (!username || !email || !password) {
      return res.json({
        status: errors.INVALID_INPUT,
        message: '用户名、邮箱和密码不能为空'
      })
    }

    // 用户名验证
    if (username.length < 3 || username.length > 20) {
      return res.json({
        status: errors.INVALID_INPUT,
        message: '用户名长度必须在3-20个字符之间'
      })
    }

    // 密码强度验证
    if (password.length < 6) {
      return res.json({
        status: errors.INVALID_INPUT,
        message: '密码长度不能少于6个字符'
      })
    }

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.json({
        status: errors.INVALID_INPUT,
        message: '邮箱格式不正确'
      })
    }

    // 邮箱后缀验证
    const allowedDomains = ['@qq.com', '@gmail.com', '@163.com', '@126.com', '@outlook.com', '@foxmail.com']
    const emailDomain = '@' + email.split('@')[1].toLowerCase()
    if (!allowedDomains.includes(emailDomain)) {
      return res.json({
        status: errors.INVALID_INPUT,
        message: `注册失败，本站仅允许以下邮箱后缀：${allowedDomains.join(',')}`
      })
    }

    const result = await userService.register({
      username,
      email,
      password,
      verificationCode
    })

    res.json({
      status: result.code,
      message: result.message,
      data: result.data
    })

  } catch (error) {
    logger.error('用户注册接口错误:', error)
    res.json({
      status: errors.INTERNAL_ERROR,
      message: '服务器内部错误'
    })
  }
})

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [1. 用户认证]
 *     summary: 用户登录
 *     description: 使用邮箱和密码登录获取访问令牌
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: 登录成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // 参数验证
    if (!email || !password) {
      return res.json({
        status: errors.INVALID_INPUT,
        message: '邮箱和密码不能为空'
      })
    }

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.json({
        status: errors.INVALID_INPUT,
        message: '邮箱格式不正确'
      })
    }

    // 获取客户端信息
    const clientInfo = {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      deviceInfo: {
        platform: req.get('X-Platform') || 'unknown',
        version: req.get('X-App-Version') || 'unknown'
      }
    }

    const result = await userService.login({ email, password }, clientInfo)

    res.json({
      status: result.code,
      message: result.message,
      data: result.data
    })

  } catch (error) {
    logger.error('用户登录接口错误:', error)
    res.json({
      status: errors.INTERNAL_ERROR,
      message: '服务器内部错误'
    })
  }
})

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [1. 用户认证]
 *     summary: 用户登出
 *     description: 用户登出，销毁会话
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 登出成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 */
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.get('Authorization')
    const token = authHeader ? authHeader.replace('Bearer ', '') : null

    if (!token) {
      return res.json({
        status: errors.INVALID_INPUT,
        message: '缺少访问令牌'
      })
    }

    const result = await userService.logout(token)

    res.json({
      status: result.code,
      message: result.message
    })

  } catch (error) {
    logger.error('用户登出接口错误:', error)
    res.json({
      status: errors.INTERNAL_ERROR,
      message: '服务器内部错误'
    })
  }
})

/**
 * @swagger
 * /auth/verify:
 *   get:
 *     tags: [1. 用户认证]
 *     summary: 验证访问令牌
 *     description: 验证当前访问令牌是否有效
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 令牌验证结果
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 */
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.get('Authorization')
    const token = authHeader ? authHeader.replace('Bearer ', '') : null

    if (!token) {
      return res.json({
        status: errors.INVALID_INPUT,
        message: '缺少访问令牌'
      })
    }

    const result = await userService.verifyToken(token)

    if (result) {
      res.json({
        status: errors.SUCCESS,
        message: '令牌有效',
        data: {
          user: {
            id: result.userId,
            username: result.username,
            email: result.email,
            avatar: result.user ? result.user.avatar : null
          }
        }
      })
    } else {
      res.json({
        status: errors.INVALID_TOKEN,
        message: '令牌无效或已过期'
      })
    }

  } catch (error) {
    logger.error('验证令牌接口错误:', error)
    res.json({
      status: errors.INTERNAL_ERROR,
      message: '服务器内部错误'
    })
  }
})

/**
 * @swagger
 * /auth/my-devices:
 *   get:
 *     tags: [1. 用户认证]
 *     summary: 获取用户设备列表
 *     description: 获取当前用户绑定的所有设备信息
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 设备列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 0
 *                 message:
 *                   type: string
 *                   example: "获取设备列表成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     devices:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           device_id:
 *                             type: string
 *                             example: "device-12345"
 *                           activation_code:
 *                             type: string
 *                             example: "ABC123-DEF456"
 *                           activated_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-07-30T14:30:00Z"
 *                           expires_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-08-30T14:30:00Z"
 *                           last_validated_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-07-30T15:30:00Z"
 *                           status:
 *                             type: string
 *                             example: "active"
 *                           validation_count:
 *                             type: integer
 *                             example: 15
 *                     total:
 *                       type: integer
 *                       example: 2
 */
router.get('/my-devices', async (req, res) => {
  try {
    const authHeader = req.get('Authorization')
    const token = authHeader ? authHeader.replace('Bearer ', '') : null

    if (!token) {
      return res.json({
        status: errors.UNAUTHORIZED,
        message: '缺少访问令牌'
      })
    }

    const result = await userService.getUserDevices(token)

    res.json({
      status: result.code,
      message: result.message,
      data: result.data
    })

  } catch (error) {
    logger.error('获取用户设备列表错误:', error)
    res.json({
      status: errors.INTERNAL_ERROR,
      message: '服务器内部错误'
    })
  }
})

/**
 * @swagger
 * /auth/devices/{deviceId}:
 *   delete:
 *     tags: [1. 用户认证]
 *     summary: 解绑设备
 *     description: 用户主动解绑指定设备
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: 设备ID
 *         example: "device-12345"
 *     responses:
 *       200:
 *         description: 解绑结果
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 0
 *                 message:
 *                   type: string
 *                   example: "设备解绑成功"
 */
router.delete('/devices/:deviceId', async (req, res) => {
  try {
    const authHeader = req.get('Authorization')
    const token = authHeader ? authHeader.replace('Bearer ', '') : null
    const { deviceId } = req.params

    if (!token) {
      return res.json({
        status: errors.UNAUTHORIZED,
        message: '缺少访问令牌'
      })
    }

    if (!deviceId) {
      return res.json({
        status: errors.INVALID_INPUT,
        message: '设备ID不能为空'
      })
    }

    const result = await userService.unbindDevice(token, deviceId)

    res.json({
      status: result.code,
      message: result.message
    })

  } catch (error) {
    logger.error('解绑设备接口错误:', error)
    res.json({
      status: errors.INTERNAL_ERROR,
      message: '服务器内部错误'
    })
  }
})

/**
 * @swagger
 * /auth/send-verification-code:
 *   post:
 *     summary: 发送邮箱验证码
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - type
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 邮箱地址
 *               type:
 *                 type: string
 *                 enum: [register, reset_password]
 *                 description: 验证码类型
 *     responses:
 *       200:
 *         description: 验证码发送成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.post('/send-verification-code', async (req, res) => {
  try {
    const { email, type = 'register' } = req.body

    // 参数验证
    if (!email) {
      return res.json({
        status: errors.INVALID_INPUT,
        message: '邮箱不能为空'
      })
    }

    if (!['register', 'reset_password'].includes(type)) {
      return res.json({
        status: errors.INVALID_INPUT,
        message: '验证码类型无效'
      })
    }

    const result = await userService.sendEmailVerificationCode(email, type)

    res.json({
      status: result.code,
      message: result.message,
      data: result.data
    })

  } catch (error) {
    logger.error('发送验证码接口错误:', error)
    res.json({
      status: errors.INTERNAL_ERROR,
      message: '服务器内部错误'
    })
  }
})

/**
 * @swagger
 * /auth/verify-code:
 *   post:
 *     summary: 验证邮箱验证码
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *               - type
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 邮箱地址
 *               code:
 *                 type: string
 *                 description: 验证码
 *               type:
 *                 type: string
 *                 enum: [register, reset_password]
 *                 description: 验证码类型
 *     responses:
 *       200:
 *         description: 验证结果
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code, type = 'register' } = req.body

    // 参数验证
    if (!email || !code) {
      return res.json({
        status: errors.INVALID_INPUT,
        message: '邮箱和验证码不能为空'
      })
    }

    const isValid = await userService.verifyEmailCode(email, code, type)

    if (isValid) {
      res.json({
        status: errors.SUCCESS,
        message: '验证码验证成功'
      })
    } else {
      res.json({
        status: errors.INVALID_INPUT,
        message: '验证码错误或已过期'
      })
    }

  } catch (error) {
    logger.error('验证码验证接口错误:', error)
    res.json({
      status: errors.INTERNAL_ERROR,
      message: '服务器内部错误'
    })
  }
})

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags: [认证]
 *     summary: 忘记密码 - 发送重置验证码
 *     description: 向用户邮箱发送密码重置验证码
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 用户邮箱地址
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: 验证码发送成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 0
 *                 message:
 *                   type: string
 *                   example: "密码重置验证码已发送到您的邮箱"
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body

    // 参数验证
    if (!email) {
      return res.json({
        status: errors.INVALID_INPUT,
        message: '邮箱地址不能为空'
      })
    }

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.json({
        status: errors.INVALID_INPUT,
        message: '邮箱格式不正确'
      })
    }

    // 检查用户是否存在
    const userExists = await userService.checkUserExists(email)
    if (!userExists) {
      return res.json({
        status: errors.NOT_FOUND,
        message: '该邮箱未注册'
      })
    }

    // 发送密码重置验证码
    const result = await userService.sendEmailVerificationCode(email, 'reset_password')

    if (result.success) {
      res.json({
        status: 0,
        message: '密码重置验证码已发送到您的邮箱，请查收'
      })
    } else {
      res.json({
        status: result.code,
        message: result.message
      })
    }

  } catch (error) {
    logger.error('发送密码重置验证码失败:', error)
    res.json({
      status: errors.INTERNAL_ERROR,
      message: '发送验证码失败，请稍后重试'
    })
  }
})

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     tags: [认证]
 *     summary: 重置密码
 *     description: 使用验证码重置用户密码
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - verificationCode
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 用户邮箱地址
 *                 example: "user@example.com"
 *               verificationCode:
 *                 type: string
 *                 description: 邮箱验证码
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: 新密码
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: 密码重置成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 0
 *                 message:
 *                   type: string
 *                   example: "密码重置成功，请使用新密码登录"
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { email, verificationCode, newPassword } = req.body

    // 参数验证
    if (!email || !verificationCode || !newPassword) {
      return res.json({
        status: errors.INVALID_INPUT,
        message: '邮箱、验证码和新密码不能为空'
      })
    }

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.json({
        status: errors.INVALID_INPUT,
        message: '邮箱格式不正确'
      })
    }

    // 密码强度验证
    if (newPassword.length < 6) {
      return res.json({
        status: errors.INVALID_INPUT,
        message: '新密码长度不能少于6个字符'
      })
    }

    // 验证验证码
    const codeValid = await userService.verifyCode(email, verificationCode, 'reset_password')
    if (!codeValid) {
      return res.json({
        status: errors.INVALID_CODE,
        message: '验证码无效或已过期'
      })
    }

    // 重置密码
    const result = await userService.resetPassword(email, newPassword)

    if (result.success) {
      res.json({
        status: 0,
        message: '密码重置成功，请使用新密码登录'
      })
    } else {
      res.json({
        status: errors.INTERNAL_ERROR,
        message: result.message || '密码重置失败'
      })
    }

  } catch (error) {
    logger.error('密码重置失败:', error)
    res.json({
      status: errors.INTERNAL_ERROR,
      message: '密码重置失败，请稍后重试'
    })
  }
})

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: 用户修改密码
 *     tags: [认证]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: 当前密码
 *               newPassword:
 *                 type: string
 *                 description: 新密码
 *     responses:
 *       200:
 *         description: 密码修改结果
 */
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const userId = req.user.id

    // 参数验证
    if (!currentPassword || !newPassword) {
      return res.json({
        status: errors.INVALID_INPUT,
        message: '当前密码和新密码不能为空'
      })
    }

    // 新密码强度验证
    if (newPassword.length < 6) {
      return res.json({
        status: errors.INVALID_INPUT,
        message: '新密码长度不能少于6个字符'
      })
    }

    // 调用用户服务修改密码
    const result = await userService.changePassword(userId, currentPassword, newPassword)

    res.json({
      status: result.code,
      message: result.message
    })

  } catch (error) {
    logger.error('修改密码接口错误:', error)
    res.json({
      status: errors.INTERNAL_ERROR,
      message: '服务器内部错误'
    })
  }
})

module.exports = router
