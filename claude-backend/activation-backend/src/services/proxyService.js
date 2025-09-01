/**
 * 代理跳转服务
 */

const { v4: uuidv4 } = require('uuid')
const { UserActivation, ProxySession, UsageRecord } = require('../models')
const tokenPoolService = require('./tokenPoolService')
const logger = require('../utils/logger')
const { Op } = require('sequelize')

class ProxyService {
  constructor() {
    this.serviceConfigs = {
      gamma: {
        name: 'Gamma设计工具',
        baseUrl: 'https://gamma.app',
        loginPath: '/auto-login',
        icon: 'https://gamma.app/favicon.ico'
      },
      figma: {
        name: 'Figma设计工具',
        baseUrl: 'https://figma.com',
        loginPath: '/auto-login',
        icon: 'https://figma.com/favicon.ico'
      },
      canva: {
        name: 'Canva设计平台',
        baseUrl: 'https://canva.com',
        loginPath: '/auto-login',
        icon: 'https://canva.com/favicon.ico'
      }
    }
  }

  /**
   * 检查用户是否有访问权限
   */
  async checkUserAccess(userId, serviceType) {
    try {
      const activation = await UserActivation.findOne({
        where: {
          user_id: userId,
          service_type: serviceType,
          status: 'active',
          [Op.or]: [
            { expires_at: null },
            { expires_at: { [Op.gt]: new Date() } }
          ],
          remaining_usage: { [Op.gt]: 0 }
        }
      })

      if (!activation) {
        return {
          hasAccess: false,
          reason: 'no_activation'
        }
      }

      // 检查是否有可用的Token
      const availableToken = await tokenPoolService.getAvailableToken(serviceType)
      if (!availableToken) {
        return {
          hasAccess: false,
          reason: 'no_available_tokens'
        }
      }

      return {
        hasAccess: true,
        activation,
        availableTokens: 1 // 简化返回
      }
    } catch (error) {
      logger.error('检查用户访问权限失败:', error)
      throw new Error('检查访问权限失败')
    }
  }

  /**
   * 创建代理跳转会话
   */
  async createProxySession(userId, serviceType, ipAddress, userAgent) {
    try {
      // 检查访问权限
      const accessCheck = await this.checkUserAccess(userId, serviceType)
      if (!accessCheck.hasAccess) {
        throw new Error(`访问被拒绝: ${accessCheck.reason}`)
      }

      // 获取可用Token
      const token = await tokenPoolService.getAvailableToken(serviceType)
      if (!token) {
        throw new Error('暂无可用账号，请稍后再试')
      }

      // 标记Token为使用中
      await tokenPoolService.markTokenInUse(token.id, userId)

      // 创建代理会话
      const sessionId = uuidv4()
      const expiresAt = new Date(Date.now() + 3600000) // 1小时后过期

      const session = await ProxySession.create({
        session_id: sessionId,
        user_id: userId,
        token_id: token.id,
        service_type: serviceType,
        status: 'active',
        expires_at: expiresAt
      })

      // 减少用户剩余使用次数
      await UserActivation.decrement('remaining_usage', {
        where: {
          user_id: userId,
          service_type: serviceType,
          status: 'active'
        }
      })

      // 记录使用记录
      await UsageRecord.create({
        user_id: userId,
        service_type: serviceType,
        action: 'jump',
        token_id: token.id,
        session_id: sessionId,
        ip_address: ipAddress,
        user_agent: userAgent,
        details: {
          accountAlias: token.accountAlias
        }
      })

      // 生成跳转URL
      const redirectUrl = this.generateRedirectUrl(serviceType, token, sessionId)

      logger.info(`代理会话创建成功: ${sessionId} for user ${userId}`)

      return {
        sessionId,
        redirectUrl,
        expiresIn: 3600,
        serviceType,
        serviceName: this.serviceConfigs[serviceType]?.name || serviceType
      }
    } catch (error) {
      logger.error('创建代理会话失败:', error)
      throw error
    }
  }

  /**
   * 生成跳转URL
   */
  generateRedirectUrl(serviceType, token, sessionId) {
    const config = this.serviceConfigs[serviceType]
    if (!config) {
      throw new Error(`不支持的服务类型: ${serviceType}`)
    }

    // 这里需要根据不同服务的实际登录机制来实现
    // 示例实现，实际需要根据各服务的API文档调整
    switch (serviceType) {
      case 'gamma':
        return this.generateGammaLoginUrl(token, sessionId)
      case 'figma':
        return this.generateFigmaLoginUrl(token, sessionId)
      case 'canva':
        return this.generateCanvaLoginUrl(token, sessionId)
      default:
        throw new Error(`不支持的服务类型: ${serviceType}`)
    }
  }

  /**
   * 生成Gamma登录URL
   */
  generateGammaLoginUrl(token, sessionId) {
    // 实际实现需要根据Gamma的API文档
    // 这里是示例实现
    const baseUrl = this.serviceConfigs.gamma.baseUrl
    const params = new URLSearchParams({
      token: token.accessToken,
      session: sessionId,
      redirect: '/dashboard'
    })
    
    return `${baseUrl}/auto-login?${params.toString()}`
  }

  /**
   * 生成Figma登录URL
   */
  generateFigmaLoginUrl(token, sessionId) {
    // 示例实现
    const baseUrl = this.serviceConfigs.figma.baseUrl
    return `${baseUrl}/auto-login?token=${token.accessToken}&session=${sessionId}`
  }

  /**
   * 生成Canva登录URL
   */
  generateCanvaLoginUrl(token, sessionId) {
    // 示例实现
    const baseUrl = this.serviceConfigs.canva.baseUrl
    return `${baseUrl}/auto-login?token=${token.accessToken}&session=${sessionId}`
  }

  /**
   * 获取用户可用服务列表
   */
  async getUserAvailableServices(userId) {
    try {
      const activations = await UserActivation.findAll({
        where: {
          user_id: userId,
          status: 'active',
          [Op.or]: [
            { expires_at: null },
            { expires_at: { [Op.gt]: new Date() } }
          ],
          remaining_usage: { [Op.gt]: 0 }
        }
      })

      const services = []
      for (const activation of activations) {
        const config = this.serviceConfigs[activation.service_type]
        if (config) {
          // 检查是否有可用Token
          const hasAvailableToken = await tokenPoolService.getAvailableToken(activation.service_type)
          
          services.push({
            type: activation.service_type,
            name: config.name,
            description: `${config.name} - AI驱动的设计平台`,
            icon: config.icon,
            isActive: !!hasAvailableToken,
            expiresAt: activation.expires_at,
            remainingUsage: activation.remaining_usage,
            maxUsage: activation.max_usage
          })
        }
      }

      return services
    } catch (error) {
      logger.error('获取用户可用服务失败:', error)
      throw new Error('获取可用服务失败')
    }
  }

  /**
   * 终止代理会话
   */
  async terminateSession(sessionId, userId) {
    try {
      const session = await ProxySession.findOne({
        where: {
          session_id: sessionId,
          user_id: userId,
          status: 'active'
        }
      })

      if (!session) {
        throw new Error('会话不存在或已过期')
      }

      // 更新会话状态
      await session.update({ status: 'terminated' })

      // 释放Token
      await tokenPoolService.releaseToken(session.token_id, userId)

      // 记录使用记录
      await UsageRecord.create({
        user_id: userId,
        service_type: session.service_type,
        action: 'logout',
        token_id: session.token_id,
        session_id: sessionId,
        details: {
          reason: 'user_logout'
        }
      })

      logger.info(`代理会话终止: ${sessionId}`)
      return true
    } catch (error) {
      logger.error('终止代理会话失败:', error)
      throw error
    }
  }

  /**
   * 清理过期会话
   */
  async cleanupExpiredSessions() {
    try {
      const expiredSessions = await ProxySession.findAll({
        where: {
          status: 'active',
          expires_at: { [Op.lt]: new Date() }
        }
      })

      for (const session of expiredSessions) {
        // 释放Token
        await tokenPoolService.releaseToken(session.token_id, session.user_id)
        
        // 更新会话状态
        await session.update({ status: 'expired' })
      }

      logger.info(`清理过期会话: ${expiredSessions.length} 个`)
      return expiredSessions.length
    } catch (error) {
      logger.error('清理过期会话失败:', error)
      throw error
    }
  }

  /**
   * 获取用户使用记录
   */
  async getUserUsageHistory(userId, limit = 50, offset = 0) {
    try {
      const { count, rows } = await UsageRecord.findAndCountAll({
        where: { user_id: userId },
        limit,
        offset,
        order: [['created_at', 'DESC']],
        include: [
          {
            model: require('../models').TokenPool,
            as: 'token',
            attributes: ['account_alias']
          }
        ]
      })

      return {
        total: count,
        records: rows.map(record => ({
          id: record.id,
          serviceType: record.service_type,
          action: record.action,
          timestamp: record.created_at,
          details: record.details,
          accountAlias: record.token?.account_alias
        }))
      }
    } catch (error) {
      logger.error('获取用户使用记录失败:', error)
      throw new Error('获取使用记录失败')
    }
  }
}

module.exports = new ProxyService()
