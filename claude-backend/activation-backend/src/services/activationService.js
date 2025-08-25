/**
 * 激活码管理服务
 */

const { v4: uuidv4 } = require('uuid')
const { ActivationCode, ActivationBatch, UserActivation, UsageRecord } = require('../models')
const { Op } = require('sequelize')
const logger = require('../utils/logger')

class ActivationService {
  constructor() {
    this.serviceTypes = {
      gamma: {
        name: 'Gamma设计工具',
        defaultValidDays: 30,
        defaultMaxUsage: 30
      },
      figma: {
        name: 'Figma设计工具',
        defaultValidDays: 30,
        defaultMaxUsage: 50
      },
      canva: {
        name: 'Canva设计平台',
        defaultValidDays: 30,
        defaultMaxUsage: 40
      },
      premium: {
        name: '高级会员',
        defaultValidDays: 365,
        defaultMaxUsage: 1000
      }
    }
  }

  /**
   * 生成激活码
   */
  generateActivationCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 12; i++) {
      if (i > 0 && i % 4 === 0) {
        result += '-'
      }
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  /**
   * 批量生成激活码
   */
  async generateActivationCodes({
    count,
    serviceType,
    validDays = null,
    maxUsagePerCode = null,
    description = '',
    adminUserId
  }) {
    try {
      // 验证服务类型
      if (!this.serviceTypes[serviceType]) {
        throw new Error(`不支持的服务类型: ${serviceType}`)
      }

      const serviceConfig = this.serviceTypes[serviceType]
      const finalValidDays = validDays || serviceConfig.defaultValidDays
      const finalMaxUsage = maxUsagePerCode || serviceConfig.defaultMaxUsage

      // 创建批次记录
      const batchId = uuidv4()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + finalValidDays)

      const batch = await ActivationBatch.create({
        batch_id: batchId,
        service_type: serviceType,
        total_codes: count,
        valid_days: finalValidDays,
        max_usage_per_code: finalMaxUsage,
        description: description || `${serviceConfig.name} - ${count}个激活码`,
        created_by: adminUserId,
        expires_at: expiresAt
      })

      // 生成激活码
      const codes = []
      const activationCodes = []

      for (let i = 0; i < count; i++) {
        let code
        let isUnique = false
        
        // 确保生成的激活码唯一
        while (!isUnique) {
          code = this.generateActivationCode()
          const existing = await ActivationCode.findOne({ where: { code } })
          if (!existing) {
            isUnique = true
          }
        }

        codes.push(code)
        activationCodes.push({
          code,
          batch_id: batchId,
          service_type: serviceType,
          max_usage: finalMaxUsage,
          expires_at: expiresAt,
          status: 'unused'
        })
      }

      // 批量插入激活码
      await ActivationCode.bulkCreate(activationCodes)

      logger.info(`激活码生成成功: ${count}个 ${serviceType} 激活码`)

      return {
        batchId,
        codes,
        count,
        serviceType,
        expiresAt,
        maxUsage: finalMaxUsage
      }
    } catch (error) {
      logger.error('生成激活码失败:', error)
      throw error
    }
  }

  /**
   * 兑换激活码
   */
  async redeemActivationCode(userId, code, serviceType) {
    try {
      // 查找激活码
      const activationCode = await ActivationCode.findOne({
        where: {
          code: code.toUpperCase(),
          service_type: serviceType,
          status: 'unused',
          [Op.or]: [
            { expires_at: null },
            { expires_at: { [Op.gt]: new Date() } }
          ]
        }
      })

      if (!activationCode) {
        throw new Error('激活码无效、已使用或已过期')
      }

      // 检查用户是否已经激活过相同服务
      const existingActivation = await UserActivation.findOne({
        where: {
          user_id: userId,
          service_type: serviceType,
          status: 'active'
        }
      })

      if (existingActivation) {
        throw new Error('您已经激活过此服务')
      }

      // 计算过期时间
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30) // 默认30天

      // 创建用户激活记录
      const userActivation = await UserActivation.create({
        user_id: userId,
        activation_code_id: activationCode.id,
        service_type: serviceType,
        activated_at: new Date(),
        expires_at: expiresAt,
        remaining_usage: activationCode.max_usage,
        max_usage: activationCode.max_usage,
        status: 'active'
      })

      // 更新激活码状态
      await activationCode.update({
        status: 'used',
        usage_count: activationCode.usage_count + 1
      })

      // 记录使用记录
      await UsageRecord.create({
        user_id: userId,
        service_type: serviceType,
        action: 'activation',
        details: {
          activationCodeId: activationCode.id,
          code: code
        }
      })

      logger.info(`激活码兑换成功: ${code} by user ${userId}`)

      return {
        serviceType,
        activatedAt: userActivation.activated_at,
        expiresAt: userActivation.expires_at,
        remainingUsage: userActivation.remaining_usage,
        maxUsage: userActivation.max_usage
      }
    } catch (error) {
      logger.error('兑换激活码失败:', error)
      throw error
    }
  }

  /**
   * 查询激活码状态
   */
  async getActivationCodeStatus(code) {
    try {
      const activationCode = await ActivationCode.findOne({
        where: { code: code.toUpperCase() },
        include: [
          {
            model: ActivationBatch,
            as: 'batch',
            attributes: ['description', 'created_by']
          }
        ]
      })

      if (!activationCode) {
        return {
          isValid: false,
          reason: 'not_found'
        }
      }

      const isExpired = activationCode.expires_at && activationCode.expires_at < new Date()
      const isUsed = activationCode.status === 'used'

      return {
        code: activationCode.code,
        isValid: !isExpired && !isUsed,
        serviceType: activationCode.service_type,
        status: activationCode.status,
        expiresAt: activationCode.expires_at,
        usageCount: activationCode.usage_count,
        maxUsage: activationCode.max_usage,
        batchDescription: activationCode.batch?.description,
        reason: isExpired ? 'expired' : (isUsed ? 'used' : 'valid')
      }
    } catch (error) {
      logger.error('查询激活码状态失败:', error)
      throw new Error('查询激活码状态失败')
    }
  }

  /**
   * 获取用户激活记录
   */
  async getUserActivations(userId) {
    try {
      const activations = await UserActivation.findAll({
        where: { user_id: userId },
        include: [
          {
            model: ActivationCode,
            as: 'activationCode',
            attributes: ['code']
          }
        ],
        order: [['activated_at', 'DESC']]
      })

      return {
        activations: activations.map(activation => ({
          id: activation.id,
          serviceType: activation.service_type,
          serviceName: this.serviceTypes[activation.service_type]?.name || activation.service_type,
          activatedAt: activation.activated_at,
          expiresAt: activation.expires_at,
          status: activation.status,
          remainingUsage: activation.remaining_usage,
          maxUsage: activation.max_usage,
          activationCode: activation.activationCode?.code
        }))
      }
    } catch (error) {
      logger.error('获取用户激活记录失败:', error)
      throw new Error('获取用户激活记录失败')
    }
  }

  /**
   * 获取激活码列表 (管理员)
   */
  async getActivationCodes({
    page = 1,
    limit = 20,
    serviceType = null,
    status = null,
    batchId = null,
    search = null
  }) {
    try {
      const whereClause = {}
      
      if (serviceType) whereClause.service_type = serviceType
      if (status) whereClause.status = status
      if (batchId) whereClause.batch_id = batchId
      if (search) {
        whereClause[Op.or] = [
          { code: { [Op.like]: `%${search}%` } }
        ]
      }

      console.log("🔍 [SERVICE DEBUG] getActivationCodes调用参数:", {
        page, limit, serviceType, status, batchId, search
      });
      console.log("🔍 [SERVICE DEBUG] 构建的查询条件:", whereClause);

      const { count, rows } = await ActivationCode.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: ActivationBatch,
            as: 'batch',
            attributes: ['description', 'created_by']
          }
        ],
        limit,
        offset: (page - 1) * limit,
        order: [['created_at', 'DESC']]
      })

      console.log("🔍 [SERVICE DEBUG] 数据库查询结果:", {
        总数: count,
        当前页数据条数: rows.length,
        分页信息: { page, limit, offset: (page - 1) * limit }
      });

      const result = {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
        codes: rows.map(code => ({
          id: code.id,
          code: code.code,
          serviceType: code.service_type,
          status: code.status,
          usageCount: code.usage_count,
          maxUsage: code.max_usage,
          expiresAt: code.expires_at,
          createdAt: code.created_at,
          batchDescription: code.batch ? code.batch.description : null
        }))
      }
      
      console.log("🔍 [SERVICE DEBUG] 最终返回结果:", {
        total: result.total,
        codesLength: result.codes.length,
        sampleCode: result.codes[0] ? {
          id: result.codes[0].id,
          code: result.codes[0].code,
          status: result.codes[0].status
        } : null
      });
      
      return result;
    } catch (error) {
      logger.error('获取激活码列表失败:', error)
      throw new Error('获取激活码列表失败')
    }
  }

  /**
   * 更新激活码状态 (管理员)
   */
  async updateActivationCodeStatus(codeId, status, adminUserId) {
    try {
      const activationCode = await ActivationCode.findByPk(codeId)
      if (!activationCode) {
        throw new Error('激活码不存在')
      }

      await activationCode.update({ status })
      
      logger.info(`激活码状态更新: ${codeId} -> ${status} by admin ${adminUserId}`)
      return true
    } catch (error) {
      logger.error('更新激活码状态失败:', error)
      throw error
    }
  }

  /**
   * 获取激活统计
   */
  async getActivationStatistics(days = 30) {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // 总体统计
      const totalCodes = await ActivationCode.count()
      const usedCodes = await ActivationCode.count({ where: { status: 'used' } })
      const expiredCodes = await ActivationCode.count({ where: { status: 'expired' } })

      // 按服务类型统计
      const serviceStats = await ActivationCode.findAll({
        attributes: [
          'service_type',
          [ActivationCode.sequelize.fn('COUNT', '*'), 'total'],
          [ActivationCode.sequelize.fn('SUM', 
            ActivationCode.sequelize.literal("CASE WHEN status = 'used' THEN 1 ELSE 0 END")
          ), 'used']
        ],
        group: ['service_type']
      })

      // 每日激活趋势
      const dailyActivations = await UserActivation.findAll({
        attributes: [
          [ActivationCode.sequelize.fn('DATE', ActivationCode.sequelize.col('activated_at')), 'date'],
          [ActivationCode.sequelize.fn('COUNT', '*'), 'count']
        ],
        where: {
          activated_at: { [Op.gte]: startDate }
        },
        group: [ActivationCode.sequelize.fn('DATE', ActivationCode.sequelize.col('activated_at'))],
        order: [[ActivationCode.sequelize.fn('DATE', ActivationCode.sequelize.col('activated_at')), 'ASC']]
      })

      return {
        overview: {
          totalCodes,
          usedCodes,
          expiredCodes,
          availableCodes: totalCodes - usedCodes - expiredCodes,
          usageRate: totalCodes > 0 ? (usedCodes / totalCodes * 100).toFixed(2) : 0
        },
        serviceStats: serviceStats.map(stat => ({
          serviceType: stat.service_type,
          serviceName: this.serviceTypes[stat.service_type]?.name || stat.service_type,
          total: parseInt(stat.dataValues.total),
          used: parseInt(stat.dataValues.used),
          usageRate: stat.dataValues.total > 0 ? 
            (stat.dataValues.used / stat.dataValues.total * 100).toFixed(2) : 0
        })),
        dailyTrend: dailyActivations.map(item => ({
          date: item.dataValues.date,
          count: parseInt(item.dataValues.count)
        }))
      }
    } catch (error) {
      logger.error('获取激活统计失败:', error)
      throw new Error('获取激活统计失败')
    }
  }
}

module.exports = new ActivationService()
