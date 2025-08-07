'use strict'

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const { Op } = require('sequelize')
const config = require('../../config')
const logger = require('../utils/logger')
const errors = require('../constants/errors')
const { User, EmailVerificationCode, UserSession, OperationLog, DeviceBinding, ActivationCode, UserMembership } = require('../models')
const { generateUserAvatar } = require('../utils/avatarGenerator')
const emailService = require('./emailService')

class UserService {
  constructor() {
    this.jwtSecret = config.jwt_secret || 'your-secret-key'
    this.jwtExpiresIn = config.jwt_expires_in || '7d'
  }

  /**
   * 用户注册
   */
  async register(userData) {
    const { username, email, password, verificationCode } = userData

    try {
      // 1. 验证邮箱验证码
      if (verificationCode) {
        const isValidCode = await this.verifyEmailCode(email, verificationCode, 'register')
        if (!isValidCode) {
          return {
            success: false,
            code: errors.INVALID_INPUT,
            message: '验证码错误或已过期'
          }
        }
      }

      // 2. 检查用户名和邮箱是否已存在
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { username },
            { email }
          ]
        }
      })

      if (existingUser) {
        return {
          success: false,
          code: errors.DUPLICATE_DATA,
          message: existingUser.username === username ? '用户名已存在' : '邮箱已被注册'
        }
      }

      // 3. 加密密码
      const saltRounds = 12
      const passwordHash = await bcrypt.hash(password, saltRounds)

      // 4. 生成随机头像
      const avatar = generateUserAvatar({ username, email })

      // 5. 创建用户
      const user = await User.create({
        username,
        email,
        password_hash: passwordHash,
        avatar,
        status: 1
      })

      // 6. 记录操作日志
      await this.logOperation(user.id, 'user_register', `用户注册: ${username}`)

      logger.info(`用户注册成功: ${username} (${email})`)

      return {
        success: true,
        code: errors.SUCCESS,
        message: '注册成功',
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          created_at: user.created_at
        }
      }

    } catch (error) {
      logger.error('用户注册失败:', error)
      return {
        success: false,
        code: errors.INTERNAL_ERROR,
        message: '注册失败，请稍后重试'
      }
    }
  }

  /**
   * 用户登录
   */
  async login(loginData, clientInfo = {}) {
    const { email, password } = loginData
    const { ip, userAgent, deviceInfo } = clientInfo

    try {
      // 1. 查找用户（只支持邮箱登录）
      const user = await User.findOne({
        where: {
          email: email
        }
      })

      if (!user) {
        await this.logOperation(null, 'login_failed', `登录失败: 用户不存在 - ${email}`, ip, userAgent)
        return {
          success: false,
          code: errors.INVALID_CREDENTIALS,
          message: '邮箱或密码错误'
        }
      }

      // 2. 检查用户状态
      if (user.status !== 1) {
        await this.logOperation(user.id, 'login_failed', `登录失败: 用户已被禁用 - ${email}`, ip, userAgent)
        return {
          success: false,
          code: errors.ACCOUNT_DISABLED,
          message: '账户已被禁用'
        }
      }

      // 3. 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password_hash)
      if (!isPasswordValid) {
        await this.logOperation(user.id, 'login_failed', `登录失败: 密码错误 - ${email}`, ip, userAgent)
        return {
          success: false,
          code: errors.INVALID_CREDENTIALS,
          message: '邮箱或密码错误'
        }
      }

      // 4. 生成JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          username: user.username,
          email: user.email 
        },
        this.jwtSecret,
        { expiresIn: this.jwtExpiresIn }
      )

      // 5. 创建用户会话
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // 7天后过期

      const session = await UserSession.create({
        user_id: user.id,
        token,
        device_info: deviceInfo ? JSON.stringify(deviceInfo) : null,
        ip_address: ip,
        expires_at: expiresAt
      })

      // 6. 记录登录日志
      await this.logOperation(user.id, 'user_login', `用户登录成功 - ${email}`, ip, userAgent)

      logger.info(`用户登录成功: ${user.username} (${email})`)

      return {
        success: true,
        code: errors.SUCCESS,
        message: '登录成功',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            created_at: user.created_at
          },
          token,
          expires_at: expiresAt
        }
      }

    } catch (error) {
      logger.error('用户登录失败:', error)
      return {
        success: false,
        code: errors.INTERNAL_ERROR,
        message: '登录失败，请稍后重试'
      }
    }
  }

  /**
   * 发送邮箱验证码
   */
  async sendEmailVerificationCode(email, type = 'register') {
    try {
      // 1. 检查邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return {
          success: false,
          code: errors.INVALID_INPUT,
          message: '邮箱格式不正确'
        }
      }

      // 2. 检查是否频繁发送（1分钟内只能发送一次）
      const recentCode = await EmailVerificationCode.findOne({
        where: {
          email,
          type,
          created_at: {
            [Op.gte]: new Date(Date.now() - 60 * 1000) // 1分钟内
          }
        }
      })

      if (recentCode) {
        return {
          success: false,
          code: errors.TOO_FREQUENT,
          message: '发送过于频繁，请1分钟后再试'
        }
      }

      // 3. 生成6位数字验证码
      const code = emailService.generateVerificationCode()

      // 4. 设置过期时间（10分钟）
      const expiresAt = new Date()
      expiresAt.setMinutes(expiresAt.getMinutes() + 10)

      // 5. 删除该邮箱的旧验证码
      await EmailVerificationCode.destroy({
        where: {
          email,
          type,
          used: 0
        }
      })

      // 6. 创建新验证码
      await EmailVerificationCode.create({
        email,
        code,
        type,
        expires_at: expiresAt,
        used: 0
      })

      // 7. 发送邮件
      let emailSent = false
      if (type === 'register') {
        emailSent = await emailService.sendRegistrationCode(email, code)
      } else if (type === 'reset_password') {
        emailSent = await emailService.sendPasswordResetCode(email, code)
      }

      if (!emailSent) {
        // 开发环境下，即使邮件发送失败也继续，并在日志中显示验证码
        if (process.env.NODE_ENV === 'development') {
          logger.warn('⚠️  邮件发送失败，但开发环境继续执行')
          logger.info('🔢 ==================== 开发环境验证码 ====================')
          logger.info(`📧 邮箱: ${email}`)
          logger.info(`🔑 验证码: ${code}`)
          logger.info(`⏰ 有效期: 10分钟`)
          logger.info(`📝 类型: ${type}`)
          logger.info('🔢 ====================================================')
        } else {
          return {
            success: false,
            code: errors.INTERNAL_ERROR,
            message: '邮件发送失败，请稍后重试'
          }
        }
      }

      logger.info(`验证码发送成功: ${email} - ${code} (${type})`)

      // 开发环境下在日志中显示验证码
      if (process.env.NODE_ENV === 'development') {
        logger.info('🔢 ==================== 开发环境验证码 ====================')
        logger.info(`📧 邮箱: ${email}`)
        logger.info(`🔑 验证码: ${code}`)
        logger.info(`⏰ 有效期: 10分钟`)
        logger.info(`📝 类型: ${type}`)
        logger.info('🔢 ====================================================')
      }

      return {
        success: true,
        code: errors.SUCCESS,
        message: '验证码已发送到您的邮箱',
        data: {
          // 开发环境下返回验证码，生产环境不返回
          ...(process.env.NODE_ENV === 'development' && { code })
        }
      }

    } catch (error) {
      logger.error('发送邮箱验证码失败:', error)
      return {
        success: false,
        code: errors.INTERNAL_ERROR,
        message: '发送验证码失败，请稍后重试'
      }
    }
  }

  /**
   * 验证邮箱验证码
   */
  async verifyEmailCode(email, code, type = 'register') {
    try {
      const verificationCode = await EmailVerificationCode.findOne({
        where: {
          email,
          code,
          type,
          used: 0,
          expires_at: {
            [Op.gt]: new Date()
          }
        }
      })

      return !!verificationCode
    } catch (error) {
      logger.error('验证邮箱验证码失败:', error)
      return false
    }
  }

  /**
   * 标记验证码为已使用
   */
  async markEmailCodeAsUsed(email, code) {
    try {
      await EmailVerificationCode.update(
        { used: 1 },
        {
          where: {
            email,
            code,
            used: 0
          }
        }
      )
    } catch (error) {
      logger.error('标记验证码为已使用失败:', error)
    }
  }

  /**
   * 记录操作日志
   */
  async logOperation(userId, operationType, description, ipAddress = null, userAgent = null) {
    try {
      await OperationLog.create({
        user_id: userId,
        operation_type: operationType,
        operation_desc: description,
        ip_address: ipAddress,
        user_agent: userAgent
      })
    } catch (error) {
      logger.error('记录操作日志失败:', error)
    }
  }

  /**
   * 验证JWT token
   */
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret)
      
      // 检查会话是否存在且未过期
      const session = await UserSession.findOne({
        where: {
          token,
          expires_at: {
            [Op.gt]: new Date()
          }
        },
        include: [{
          model: User,
          as: 'user',
          include: [{
            model: UserMembership,
            as: 'membership',
            required: false // 左连接，即使没有会员信息也返回用户
          }]
        }]
      })

      if (!session) {
        return null
      }

      return {
        id: decoded.userId,
        userId: decoded.userId,
        username: decoded.username,
        email: decoded.email,
        user: session.user,
        membership: session.user.membership // 包含会员信息
      }
    } catch (error) {
      logger.error('验证token失败:', error)
      return null
    }
  }

  /**
   * 用户登出
   */
  async logout(token) {
    try {
      await UserSession.destroy({
        where: { token }
      })

      return {
        success: true,
        code: errors.SUCCESS,
        message: '登出成功'
      }
    } catch (error) {
      logger.error('用户登出失败:', error)
      return {
        success: false,
        code: errors.INTERNAL_ERROR,
        message: '登出失败'
      }
    }
  }

  /**
   * 获取用户设备列表
   */
  async getUserDevices(token) {
    try {
      // 1. 验证token并获取用户信息
      const userInfo = await this.verifyToken(token)
      if (!userInfo) {
        return {
          success: false,
          code: errors.INVALID_TOKEN,
          message: '令牌无效或已过期'
        }
      }

      // 2. 查询用户的所有设备绑定
      const devices = await DeviceBinding.findAll({
        where: {
          user_id: userInfo.userId
        },
        include: [{
          model: ActivationCode,
          as: 'activationCode',
          attributes: ['code', 'type', 'max_devices']
        }],
        order: [['activated_at', 'DESC']]
      })

      // 3. 格式化设备信息
      const deviceList = devices.map(device => ({
        id: device.id,
        device_id: device.device_id,
        activation_code: device.activation_code,
        activated_at: device.activated_at,
        expires_at: device.expires_at,
        last_validated_at: device.last_validated_at,
        validation_count: device.validation_count,
        status: device.status,
        ip_address: device.ip_address,
        user_agent: device.user_agent,
        activation_info: device.activationCode ? {
          type: device.activationCode.type,
          max_devices: device.activationCode.max_devices
        } : null
      }))

      return {
        success: true,
        code: errors.SUCCESS,
        message: '获取设备列表成功',
        data: {
          devices: deviceList,
          total: deviceList.length,
          user: {
            id: userInfo.userId,
            username: userInfo.username,
            email: userInfo.email
          }
        }
      }

    } catch (error) {
      logger.error('获取用户设备列表失败:', error)
      return {
        success: false,
        code: errors.INTERNAL_ERROR,
        message: '获取设备列表失败'
      }
    }
  }

  /**
   * 解绑用户设备
   */
  async unbindDevice(token, deviceId) {
    try {
      // 1. 验证token并获取用户信息
      const userInfo = await this.verifyToken(token)
      if (!userInfo) {
        return {
          success: false,
          code: errors.INVALID_TOKEN,
          message: '令牌无效或已过期'
        }
      }

      // 2. 查找设备绑定记录
      const device = await DeviceBinding.findOne({
        where: {
          user_id: userInfo.userId,
          device_id: deviceId
        }
      })

      if (!device) {
        return {
          success: false,
          code: errors.NOT_FOUND,
          message: '设备不存在或不属于当前用户'
        }
      }

      // 3. 删除设备绑定
      await device.destroy()

      // 4. 记录操作日志
      await this.logOperation(userInfo.userId, 'device_unbind', `解绑设备: ${deviceId}`)

      logger.info(`用户解绑设备成功: ${userInfo.email} - ${deviceId}`)

      return {
        success: true,
        code: errors.SUCCESS,
        message: '设备解绑成功'
      }

    } catch (error) {
      logger.error('解绑设备失败:', error)
      return {
        success: false,
        code: errors.INTERNAL_ERROR,
        message: '解绑设备失败'
      }
    }
  }
}

module.exports = UserService
