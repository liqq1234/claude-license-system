/**
 * 定时清理服务
 */

const tokenPoolService = require('./tokenPoolService')
const proxyService = require('./proxyService')
const { ActivationCode, UserActivation, ProxySession, UsageRecord } = require('../models')
const { Op } = require('sequelize')
const logger = require('../utils/logger')

class CleanupService {
  constructor() {
    this.isRunning = false
    this.intervals = {
      tokenCleanup: null,
      sessionCleanup: null,
      dataCleanup: null
    }
  }

  /**
   * 启动所有清理任务
   */
  start() {
    if (this.isRunning) {
      logger.warn('清理服务已在运行中')
      return
    }

    this.isRunning = true
    logger.info('🧹 启动清理服务...')

    // 每5分钟清理一次过期Token和会话
    this.intervals.tokenCleanup = setInterval(() => {
      this.cleanupExpiredTokensAndSessions()
    }, 5 * 60 * 1000)

    // 每小时重置Token使用计数
    this.intervals.sessionCleanup = setInterval(() => {
      this.resetDailyUsage()
    }, 60 * 60 * 1000)

    // 每天清理旧数据
    this.intervals.dataCleanup = setInterval(() => {
      this.cleanupOldData()
    }, 24 * 60 * 60 * 1000)

    // 立即执行一次清理
    setTimeout(() => {
      this.cleanupExpiredTokensAndSessions()
    }, 10000) // 10秒后执行

    logger.info('✅ 清理服务启动完成')
  }

  /**
   * 停止所有清理任务
   */
  stop() {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false
    
    Object.values(this.intervals).forEach(interval => {
      if (interval) {
        clearInterval(interval)
      }
    })

    this.intervals = {
      tokenCleanup: null,
      sessionCleanup: null,
      dataCleanup: null
    }

    logger.info('🛑 清理服务已停止')
  }

  /**
   * 清理过期的Token和会话
   */
  async cleanupExpiredTokensAndSessions() {
    try {
      logger.debug('🧹 开始清理过期Token和会话...')

      // 清理过期Token
      const tokenResult = await tokenPoolService.cleanupExpiredTokens()
      
      // 清理过期会话
      const sessionResult = await proxyService.cleanupExpiredSessions()

      // 清理过期激活码
      const expiredActivationCodes = await this.cleanupExpiredActivationCodes()

      // 清理过期用户激活记录
      const expiredUserActivations = await this.cleanupExpiredUserActivations()

      if (tokenResult.expiredTokens > 0 || sessionResult > 0 || 
          expiredActivationCodes > 0 || expiredUserActivations > 0) {
        logger.info('🧹 清理完成:', {
          expiredTokens: tokenResult.expiredTokens,
          expiredSessions: sessionResult,
          expiredActivationCodes,
          expiredUserActivations
        })
      }
    } catch (error) {
      logger.error('清理过期Token和会话失败:', error)
    }
  }

  /**
   * 清理过期激活码
   */
  async cleanupExpiredActivationCodes() {
    try {
      // 更新未使用的过期激活码
      const unusedResult = await ActivationCode.update(
        { status: 'expired' },
        {
          where: {
            expires_at: { [Op.lt]: new Date() },
            status: 'unused'
          }
        }
      )

      // 更新已使用但过期的激活码
      const usedResult = await ActivationCode.update(
        { status: 'expired' },
        {
          where: {
            expires_at: { [Op.lt]: new Date() },
            status: 'used'
          }
        }
      )

      const totalUpdated = (unusedResult[0] || 0) + (usedResult[0] || 0)

      if (totalUpdated > 0) {
        logger.debug(`更新过期激活码状态: 未使用${unusedResult[0] || 0}个, 已使用${usedResult[0] || 0}个`)
      }

      return totalUpdated
    } catch (error) {
      logger.error('清理过期激活码失败:', error)
      return 0
    }
  }

  /**
   * 清理过期用户激活记录
   */
  async cleanupExpiredUserActivations() {
    try {
      const result = await UserActivation.update(
        { status: 'expired' },
        {
          where: {
            expires_at: { [Op.lt]: new Date() },
            status: 'active'
          }
        }
      )

      return result[0] || 0
    } catch (error) {
      logger.error('清理过期用户激活记录失败:', error)
      return 0
    }
  }

  /**
   * 重置每日使用计数
   */
  async resetDailyUsage() {
    try {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      // 如果是新的一天，重置所有Token的每日使用计数
      if (now.getHours() === 0) {
        const { TokenPool } = require('../models')
        
        const result = await TokenPool.update(
          { daily_usage: 0 },
          {
            where: {
              daily_usage: { [Op.gt]: 0 }
            }
          }
        )

        if (result[0] > 0) {
          logger.info(`🔄 重置每日使用计数: ${result[0]} 个Token`)
        }
      }
    } catch (error) {
      logger.error('重置每日使用计数失败:', error)
    }
  }

  /**
   * 清理旧数据
   */
  async cleanupOldData() {
    try {
      logger.info('🧹 开始清理旧数据...')

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const ninetyDaysAgo = new Date()
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

      // 清理30天前的过期会话
      const expiredSessions = await ProxySession.destroy({
        where: {
          status: { [Op.in]: ['expired', 'terminated'] },
          created_at: { [Op.lt]: thirtyDaysAgo }
        }
      })

      // 清理90天前的使用记录（保留最近90天的数据用于统计）
      const oldUsageRecords = await UsageRecord.destroy({
        where: {
          created_at: { [Op.lt]: ninetyDaysAgo }
        }
      })

      // 清理90天前的已使用激活码
      const oldActivationCodes = await ActivationCode.destroy({
        where: {
          status: 'used',
          created_at: { [Op.lt]: ninetyDaysAgo }
        }
      })

      logger.info('🧹 旧数据清理完成:', {
        expiredSessions,
        oldUsageRecords,
        oldActivationCodes
      })
    } catch (error) {
      logger.error('清理旧数据失败:', error)
    }
  }

  /**
   * 手动执行完整清理
   */
  async runFullCleanup() {
    try {
      logger.info('🧹 开始执行完整清理...')

      await this.cleanupExpiredTokensAndSessions()
      await this.resetDailyUsage()
      await this.cleanupOldData()

      logger.info('✅ 完整清理执行完成')
      return true
    } catch (error) {
      logger.error('完整清理执行失败:', error)
      return false
    }
  }

  /**
   * 获取清理统计信息
   */
  async getCleanupStats() {
    try {
      const { TokenPool } = require('../models')
      
      const stats = {
        expiredTokens: await TokenPool.count({ where: { status: 'expired' } }),
        expiredSessions: await ProxySession.count({ where: { status: 'expired' } }),
        expiredActivationCodes: await ActivationCode.count({ where: { status: 'expired' } }),
        expiredUserActivations: await UserActivation.count({ where: { status: 'expired' } }),
        totalUsageRecords: await UsageRecord.count(),
        isRunning: this.isRunning
      }

      return stats
    } catch (error) {
      logger.error('获取清理统计信息失败:', error)
      return null
    }
  }

  /**
   * 检查系统健康状态
   */
  async checkSystemHealth() {
    try {
      const health = {
        cleanupService: this.isRunning,
        database: true,
        tokenPool: true,
        issues: []
      }

      // 检查是否有太多过期数据
      const stats = await this.getCleanupStats()
      if (stats) {
        if (stats.expiredTokens > 10) {
          health.issues.push(`过期Token过多: ${stats.expiredTokens}`)
        }
        if (stats.expiredSessions > 100) {
          health.issues.push(`过期会话过多: ${stats.expiredSessions}`)
        }
        if (stats.totalUsageRecords > 100000) {
          health.issues.push(`使用记录过多: ${stats.totalUsageRecords}`)
        }
      }

      health.overall = health.issues.length === 0 ? 'healthy' : 'warning'
      return health
    } catch (error) {
      logger.error('检查系统健康状态失败:', error)
      return {
        overall: 'error',
        cleanupService: this.isRunning,
        database: false,
        tokenPool: false,
        issues: ['系统检查失败']
      }
    }
  }
}

module.exports = new CleanupService()
