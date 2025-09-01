/**
 * Token池管理服务
 */

const crypto = require('crypto')
const { TokenPool, ProxySession, UsageRecord } = require('../models')
const { Op } = require('sequelize')
const logger = require('../utils/logger')

class TokenPoolService {
  constructor() {
    this.encryptionKey = process.env.TOKEN_ENCRYPTION_KEY || 'default-key-change-in-production'
  }

  /**
   * 加密敏感数据
   */
  encrypt(text) {
    if (!text) return null
    try {
      const algorithm = 'aes-256-gcm'
      const key = crypto.scryptSync(this.encryptionKey, 'salt', 32)
      const iv = crypto.randomBytes(16)
      const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey)

      let encrypted = cipher.update(text, 'utf8', 'hex')
      encrypted += cipher.final('hex')

      return encrypted
    } catch (error) {
      logger.error('加密失败:', error)
      return null
    }
  }

  /**
   * 解密敏感数据
   */
  decrypt(encryptedText) {
    if (!encryptedText) return null
    try {
      const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey)
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      return decrypted
    } catch (error) {
      logger.error('解密失败:', error)
      return null
    }
  }

  /**
   * 添加新的Token到池中
   */
  async addToken({
    serviceType,
    accountAlias,
    accessToken,
    refreshToken = null,
    cookies = null,
    maxConcurrentUsers = 5,
    maxDailyUsage = 100,
    expiresAt = null
  }) {
    try {
      const token = await TokenPool.create({
        service_type: serviceType,
        account_alias: accountAlias,
        access_token: this.encrypt(accessToken),
        refresh_token: refreshToken ? this.encrypt(refreshToken) : null,
        cookies: cookies ? this.encrypt(cookies) : null,
        max_concurrent_users: maxConcurrentUsers,
        max_daily_usage: maxDailyUsage,
        expires_at: expiresAt,
        status: 'active'
      })

      logger.info(`Token池添加成功: ${serviceType} - ${accountAlias}`)
      return {
        id: token.id,
        serviceType: token.service_type,
        accountAlias: token.account_alias,
        status: token.status
      }
    } catch (error) {
      logger.error('添加Token失败:', error)
      throw new Error('添加Token失败')
    }
  }

  /**
   * 获取可用的Token
   */
  async getAvailableToken(serviceType) {
    try {
      const token = await TokenPool.findOne({
        where: {
          service_type: serviceType,
          status: 'active',
          current_users: {
            [Op.lt]: TokenPool.sequelize.col('max_concurrent_users')
          },
          daily_usage: {
            [Op.lt]: TokenPool.sequelize.col('max_daily_usage')
          },
          [Op.or]: [
            { expires_at: null },
            { expires_at: { [Op.gt]: new Date() } }
          ]
        },
        order: [
          ['current_users', 'ASC'],
          ['daily_usage', 'ASC'],
          ['last_used_at', 'ASC']
        ]
      })

      if (!token) {
        logger.warn(`没有可用的Token: ${serviceType}`)
        return null
      }

      return {
        id: token.id,
        serviceType: token.service_type,
        accountAlias: token.account_alias,
        accessToken: this.decrypt(token.access_token),
        refreshToken: this.decrypt(token.refresh_token),
        cookies: this.decrypt(token.cookies)
      }
    } catch (error) {
      logger.error('获取可用Token失败:', error)
      throw new Error('获取可用Token失败')
    }
  }

  /**
   * 标记Token为使用中
   */
  async markTokenInUse(tokenId, userId) {
    try {
      const token = await TokenPool.findByPk(tokenId)
      if (!token) {
        throw new Error('Token不存在')
      }

      await token.increment('current_users')
      await token.increment('daily_usage')
      await token.update({
        last_used_at: new Date(),
        status: token.current_users + 1 >= token.max_concurrent_users ? 'in_use' : 'active'
      })

      logger.info(`Token标记为使用中: ${tokenId} by user ${userId}`)
      return true
    } catch (error) {
      logger.error('标记Token使用失败:', error)
      throw new Error('标记Token使用失败')
    }
  }

  /**
   * 释放Token使用
   */
  async releaseToken(tokenId, userId) {
    try {
      const token = await TokenPool.findByPk(tokenId)
      if (!token) {
        throw new Error('Token不存在')
      }

      if (token.current_users > 0) {
        await token.decrement('current_users')
        await token.update({
          status: 'active'
        })
      }

      logger.info(`Token释放: ${tokenId} by user ${userId}`)
      return true
    } catch (error) {
      logger.error('释放Token失败:', error)
      throw new Error('释放Token失败')
    }
  }

  /**
   * 获取Token池状态
   */
  async getTokenPoolStatus(serviceType = null) {
    try {
      const whereClause = serviceType ? { service_type: serviceType } : {}
      
      const tokens = await TokenPool.findAll({
        where: whereClause,
        attributes: [
          'id', 'service_type', 'account_alias', 'status',
          'current_users', 'max_concurrent_users',
          'daily_usage', 'max_daily_usage',
          'last_used_at', 'expires_at'
        ],
        order: [['service_type', 'ASC'], ['account_alias', 'ASC']]
      })

      const summary = {
        totalTokens: tokens.length,
        activeTokens: tokens.filter(t => t.status === 'active').length,
        inUseTokens: tokens.filter(t => t.status === 'in_use').length,
        expiredTokens: tokens.filter(t => t.status === 'expired').length,
        disabledTokens: tokens.filter(t => t.status === 'disabled').length
      }

      return {
        summary,
        tokens: tokens.map(token => ({
          id: token.id,
          serviceType: token.service_type,
          accountAlias: token.account_alias,
          status: token.status,
          currentUsers: token.current_users,
          maxConcurrentUsers: token.max_concurrent_users,
          dailyUsage: token.daily_usage,
          maxDailyUsage: token.max_daily_usage,
          lastUsedAt: token.last_used_at,
          expiresAt: token.expires_at
        }))
      }
    } catch (error) {
      logger.error('获取Token池状态失败:', error)
      throw new Error('获取Token池状态失败')
    }
  }

  /**
   * 更新Token状态
   */
  async updateTokenStatus(tokenId, status, reason = null) {
    try {
      const token = await TokenPool.findByPk(tokenId)
      if (!token) {
        throw new Error('Token不存在')
      }

      await token.update({ status })
      
      logger.info(`Token状态更新: ${tokenId} -> ${status}`, { reason })
      return true
    } catch (error) {
      logger.error('更新Token状态失败:', error)
      throw new Error('更新Token状态失败')
    }
  }

  /**
   * 清理过期Token和会话
   */
  async cleanupExpiredTokens() {
    try {
      // 标记过期的Token
      const expiredCount = await TokenPool.update(
        { status: 'expired' },
        {
          where: {
            expires_at: { [Op.lt]: new Date() },
            status: { [Op.ne]: 'expired' }
          }
        }
      )

      // 清理过期的代理会话
      const expiredSessions = await ProxySession.update(
        { status: 'expired' },
        {
          where: {
            expires_at: { [Op.lt]: new Date() },
            status: 'active'
          }
        }
      )

      // 重置每日使用计数（如果是新的一天）
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      await TokenPool.update(
        { daily_usage: 0 },
        {
          where: {
            last_used_at: { [Op.lt]: today }
          }
        }
      )

      logger.info(`清理完成: ${expiredCount[0]} 个过期Token, ${expiredSessions[0]} 个过期会话`)
      return { expiredTokens: expiredCount[0], expiredSessions: expiredSessions[0] }
    } catch (error) {
      logger.error('清理过期Token失败:', error)
      throw new Error('清理过期Token失败')
    }
  }

  /**
   * 删除Token
   */
  async deleteToken(tokenId) {
    try {
      const token = await TokenPool.findByPk(tokenId)
      if (!token) {
        throw new Error('Token不存在')
      }

      // 检查是否有活跃会话
      const activeSessions = await ProxySession.count({
        where: {
          token_id: tokenId,
          status: 'active'
        }
      })

      if (activeSessions > 0) {
        throw new Error('Token正在使用中，无法删除')
      }

      await token.destroy()
      logger.info(`Token删除成功: ${tokenId}`)
      return true
    } catch (error) {
      logger.error('删除Token失败:', error)
      throw error
    }
  }
}

module.exports = new TokenPoolService()
