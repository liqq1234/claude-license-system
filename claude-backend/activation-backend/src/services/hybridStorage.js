const { ActivationCode, DeviceBinding, ActivationLog, ActivationBatch } = require('../models')
const { Op } = require('sequelize')
const logger = require('../utils/logger')
const config = require('../../config')

/**
 * 混合存储服务 - Redis + MySQL
 * 
 * 存储策略：
 * - MySQL: 持久化存储所有激活码信息，支持复杂查询
 * - Redis: 缓存热点数据，快速验证和会话管理
 */
class HybridStorageService {
  constructor(redisDAL) {
    this.redis = redisDAL
    this.mysql = {
      ActivationCode,
      DeviceBinding,
      ActivationLog,
      ActivationBatch
    }
    
    // Redis 缓存键前缀
    this.cachePrefix = {
      activationCode: `${config.name}:cache:activation_code:`,
      deviceBinding: `${config.name}:cache:device_binding:`,
      stats: `${config.name}:cache:stats`,
      session: `${config.name}:session:`
    }
    
    // 缓存过期时间（秒）
    this.cacheExpiry = {
      activationCode: 3600,    // 1小时
      deviceBinding: 1800,     // 30分钟
      stats: 300,              // 5分钟
      session: 86400           // 24小时
    }
  }

  /**
   * 批量生成激活码
   * @param {Object} options - 生成选项
   * @returns {Object} 生成结果
   */
  async generateActivationCodes(options) {
    const {
      type,
      duration,
      maxDevices = 1,
      batchSize = 1,
      description = '',
      tags = [],
      serviceType = 'claude', // 添加服务类型参数，默认为claude
      enhanced = false,
      permissions = [],
      priority = 5,
      createdBy = 'system'
    } = options

    // 参数验证
    if (!type || !['daily', 'weekly', 'monthly', 'yearly', 'permanent'].includes(type)) {
      return { status: 1, message: '无效的激活码类型' }
    }

    // 验证服务类型
    const validServiceTypes = ['claude', 'midjourney', 'universal']
    if (serviceType && !validServiceTypes.includes(serviceType)) {
      return { status: 1, message: `无效的服务类型，支持: ${validServiceTypes.join(', ')}` }
    }

    if (batchSize < 1 || batchSize > 10000) {
      return { status: 1, message: '批次大小必须在 1-10000 之间' }
    }

    if (maxDevices < 1 || maxDevices > 100) {
      return { status: 1, message: '最大设备数必须在 1-100 之间' }
    }

    const startTime = Date.now()

    try {
      logger.info(`🔄 开始批量生成 ${batchSize} 个激活码 (类型: ${type}, 服务类型: ${serviceType})`)

      // 1. 生成批次ID和基础信息
      const batchId = this.generateBatchId()
      const currentTime = new Date()

      // 2. 新逻辑：生成时不设置过期时间，只有激活时才开始倒计时
      // expires_at 在生成时为 null，只有首次激活时才计算
      const expiresAt = null

      // 3. 使用数据库事务确保数据一致性
      const result = await this.mysql.ActivationCode.sequelize.transaction(async (transaction) => {
        // 3.1 创建批次记录
        const batch = await this.mysql.ActivationBatch.create({
          batch_id: batchId,
          name: `${type.toUpperCase()}_${currentTime.toISOString().slice(0, 10)}_${batchSize}`,
          description: description || `${type} 类型激活码批次 (${batchSize}个)`,
          type,
          total_count: batchSize,
          created_by: createdBy
        }, { transaction })

        // 3.2 批量生成激活码数据
        const codes = []
        const activationCodes = []

        // 生成唯一激活码，避免重复
        const existingCodes = new Set()

        for (let i = 0; i < batchSize; i++) {
          let code
          let attempts = 0

          // 确保生成的激活码唯一
          do {
            code = this.generateActivationCode()
            attempts++

            if (attempts > 100) {
              throw new Error('生成唯一激活码失败，请重试')
            }
          } while (existingCodes.has(code))

          existingCodes.add(code)
          codes.push(code)

          activationCodes.push({
            code,
            type,
            service_type: serviceType, // 添加服务类型字段
            duration: type === 'permanent' ? null : (duration || this.getDefaultDuration(type)),
            max_devices: maxDevices,
            status: 'unused',  // 新生成的激活码状态为 unused
            description: description || `${type} 类型激活码`,
            batch_id: batchId,
            tags: tags.length > 0 ? JSON.stringify(tags) : null,
            expires_at: null,  // 生成时不设置过期时间
            activated_at: null,  // 生成时没有激活时间
            created_by: createdBy
          })
        }





        // 3.3 批量插入激活码到 MySQL
        // 确保数据对象中不包含 id 字段
        const cleanActivationCodes = activationCodes.map(code => {
          const { id, ...cleanCode } = code;
          return cleanCode;
        });
        
        const createdCodes = await this.mysql.ActivationCode.bulkCreate(cleanActivationCodes, {
          transaction,
          validate: true,
          ignoreDuplicates: false,
          fields: [
            'code', 'type', 'service_type', 'duration', 'max_devices', 'status', 
            'description', 'batch_id', 'tags', 'expires_at', 
            'activated_at', 'created_by'
          ] // 明确指定要插入的字段，包含 service_type
        })

        return { batch, codes, createdCodes }
      })


      // 4. 异步缓存热点数据到 Redis（不阻塞响应）
      this.cacheNewActivationCodes(result.createdCodes).catch(error => {
        logger.warn('缓存新激活码到 Redis 失败:', error.message)
      })

      // 5. 清除相关缓存
      this.clearRelatedCaches(['stats', 'codes_list']).catch(() => {})

      // 6. 记录操作日志
      this.logBatchOperation(batchId, 'generate', 'success', {
        batchSize,
        type,
        duration: Date.now() - startTime,
        createdBy
      }).catch(() => {})

      const responseTime = Date.now() - startTime
      logger.info(`✅ 成功生成 ${result.codes ? result.codes.length : 0} 个激活码，耗时: ${responseTime}ms`)

      return {
        status: 0,
        message: '激活码生成成功',
        data: {
          batchId,
          codes: result.codes || [],
          summary: {
            total: result.codes ? result.codes.length : 0,
            type,
            maxDevices,
            duration: type === 'permanent' ? null : (duration || this.getDefaultDuration(type)),
            status: 'unused',  // 新生成的激活码状态
            expiresAt: null,   // 生成时不设置过期时间，激活时才开始倒计时
            tags,
            createdBy,
            createdAt: Date.now(),
            note: '激活码将在首次激活时开始倒计时'
          }
        },
        meta: {
          responseTime,
          batchProcessing: true,
          transactionUsed: true
        }
      }

    } catch (error) {
      const responseTime = Date.now() - startTime
      logger.error('❌ 批量生成激活码失败:', error)

      return {
        status: 1,
        message: '生成激活码失败: ' + error.message,
        data: {
          batchId: null,
          codes: [],  // 确保返回空数组而不是 undefined
          summary: {
            total: 0,
            type: null,
            status: 'failed',
            expiresAt: null,
            note: '生成失败'
          }
        },
        meta: {
          responseTime,
          error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }
      }
    }
  }

  /**
   * 激活设备
   * @param {string} code - 激活码
   * @param {Object} deviceInfo - 设备信息
   * @returns {Object} 激活结果
   */
  async activateDevice(code, deviceInfo) {
    const { deviceId, userAgent, ipAddress } = deviceInfo

    try {
      logger.info(`🔄 开始激活设备: ${deviceId}, 激活码: ${code}`)

      // 1. 从缓存或数据库获取激活码信息
      let activationCode = await this.getActivationCodeFromCache(code)
      if (!activationCode) {
        activationCode = await this.mysql.ActivationCode.findOne({
          where: { code }
        })
        
        if (!activationCode) {
          await this.logActivation(code, deviceId, 'activate', 'failed', '激活码不存在', ipAddress, userAgent)
          return { status: 1, message: '激活码不存在' }
        }

        // 缓存激活码信息
        await this.cacheActivationCode(activationCode)
      }

      // 2. 验证激活码状态
      const validation = this.validateActivationCode(activationCode)
      if (validation.status !== 0) {
        await this.logActivation(code, deviceId, 'activate', 'failed', validation.message, ipAddress, userAgent)
        return validation
      }

      // 3. 检查设备数量限制
      const existingBindings = await this.mysql.DeviceBinding.count({
        where: {
          activation_code: code,
          status: 'active'
        }
      })

      if (existingBindings >= activationCode.max_devices) {
        await this.logActivation(code, deviceId, 'activate', 'failed', '设备数量已达上限', ipAddress, userAgent)
        return { status: 1, message: '设备数量已达上限' }
      }

      // 4. 检查设备是否已绑定
      const existingBinding = await this.mysql.DeviceBinding.findOne({
        where: {
          activation_code: code,
          device_id: deviceId,
          status: 'active'
        }
      })

      if (existingBinding) {
        // 设备已绑定，返回现有授权
        const license = await this.generateLicense(activationCode, deviceInfo)
        await this.logActivation(code, deviceId, 'activate', 'success', '设备已激活', ipAddress, userAgent)
        
        return {
          status: 0,
          message: '设备已激活',
          license,
          expiresAt: existingBinding.expires_at ? existingBinding.expires_at.getTime() : null,
          codeInfo: {
            type: activationCode.type,
            remainingDevices: activationCode.max_devices - existingBindings
          }
        }
      }

      // 5. 处理首次激活逻辑
      const isFirstActivation = activationCode.status === 'unused'
      let expiresAt = activationCode.expires_at

      if (isFirstActivation) {
        // 首次激活：开始倒计时
        const activatedAt = new Date()
        let newExpiresAt = null

        // 根据激活码类型计算过期时间
        if (activationCode.type !== 'permanent' && activationCode.duration) {
          newExpiresAt = new Date(activatedAt.getTime() + (activationCode.duration * 60 * 60 * 1000))
        }

        // 更新激活码状态和时间
        await activationCode.update({
          status: 'active',
          activated_at: activatedAt,
          expires_at: newExpiresAt
        })

        expiresAt = newExpiresAt
        logger.info(`🚀 激活码首次激活，开始倒计时: ${code}，过期时间: ${newExpiresAt ? newExpiresAt.toISOString() : '永久'}`)
      }

      // 6. 创建新的设备绑定
      const deviceBinding = await this.mysql.DeviceBinding.create({
        activation_code_id: activationCode.id,
        activation_code: code,
        device_id: deviceId,
        user_agent: userAgent,
        ip_address: ipAddress,
        expires_at: expiresAt,
        status: 'active'
      })

      // 7. 更新激活码使用次数
      await activationCode.increment('used_count')

      // 8. 检查是否达到最大设备数，如果是则标记为已用完
      const newUsedCount = activationCode.used_count + 1
      if (newUsedCount >= activationCode.max_devices) {
        await activationCode.update({ status: 'used' })
        logger.info(`📱 激活码已达到最大设备数，标记为已用完: ${code}`)
      }

      // 9. 生成授权文件
      const license = await this.generateLicense(activationCode, deviceInfo)

      // 10. 缓存设备绑定信息
      await this.cacheDeviceBinding(deviceBinding, license)

      // 11. 记录激活日志
      const logMessage = isFirstActivation ? '首次激活成功' : '激活成功'
      await this.logActivation(code, deviceId, 'activate', 'success', logMessage, ipAddress, userAgent, {
        deviceBinding: deviceBinding.id,
        license: license.substring(0, 50) + '...',
        isFirstActivation
      })

      // 12. 清除相关缓存
      this.clearRelatedCache(code).catch(() => {})

      logger.info(`✅ 设备激活成功: ${deviceId}`)

      return {
        status: 0,
        message: '激活成功',
        license,
        expiresAt: expiresAt ? expiresAt.getTime() : null,
        codeInfo: {
          type: activationCode.type,
          remainingDevices: activationCode.max_devices - existingBindings - 1
        }
      }

    } catch (error) {
      logger.error('设备激活失败:', error)
      await this.logActivation(code, deviceId, 'activate', 'error', error.message, ipAddress, userAgent)
      return {
        status: 1,
        message: '激活失败: ' + error.message
      }
    }
  }

  /**
   * 验证授权
   * @param {string} license - 授权文件
   * @param {string} deviceId - 设备ID
   * @returns {Object} 验证结果
   */
  async validateLicense(license, deviceId) {
    try {
      logger.debug(`🔄 验证授权: 设备 ${deviceId}`)

      // 1. 从缓存获取设备绑定信息
      let deviceBinding = await this.getDeviceBindingFromCache(deviceId, license)
      
      if (!deviceBinding) {
        // 2. 从数据库查询
        deviceBinding = await this.mysql.DeviceBinding.findOne({
          where: {
            device_id: deviceId,
            license_data: license,
            status: 'active'
          },
          include: [{
            model: this.mysql.ActivationCode,
            as: 'activationCode'
          }]
        })

        if (!deviceBinding) {
          return { status: 1, valid: false, message: '授权无效' }
        }

        // 缓存设备绑定信息
        await this.cacheDeviceBinding(deviceBinding, license)
      }

      // 3. 检查过期时间
      if (deviceBinding.expires_at && new Date() > deviceBinding.expires_at) {
        // 更新状态为过期
        await deviceBinding.update({ status: 'expired' })
        await this.clearDeviceBindingCache(deviceId, license)
        
        return { status: 1, valid: false, message: '授权已过期' }
      }

      // 4. 更新最后验证时间和次数
      await deviceBinding.update({
        last_validated_at: new Date(),
        validation_count: deviceBinding.validation_count + 1
      })

      // 5. 记录验证日志（异步）
      this.logActivation(
        deviceBinding.activation_code,
        deviceId,
        'validate',
        'success',
        '验证成功'
      ).catch(() => {})

      return {
        status: 0,
        valid: true,
        message: '授权有效',
        expiresAt: deviceBinding.expires_at ? deviceBinding.expires_at.getTime() : null
      }

    } catch (error) {
      logger.error('验证授权失败:', error)
      return {
        status: 1,
        valid: false,
        message: '验证失败: ' + error.message
      }
    }
  }

  /**
   * 获取激活码统计
   * @returns {Object} 统计数据
   */
  async getActivationStats() {
    try {
      logger.debug('🔄 开始获取激活码统计数据')

      // 1. 尝试从 Redis 缓存获取
      const cachedStats = await this.getStatsFromCache()
      if (cachedStats) {
        logger.debug('✅ 从缓存获取统计数据')
        return {
          status: 0,
          data: cachedStats,
          cached: true,
          timestamp: Date.now()
        }
      }

      logger.debug('🔄 缓存未命中，从数据库计算统计数据')

      // 2. 从 MySQL 数据库计算统计
      const currentTime = new Date()

      // 并行查询各种状态的激活码数量
      const [
        totalCodes,
        unusedCodes,
        usedCodes,
        expiredCodes,
        suspendedCodes,
        totalDeviceBindings,
        activeDeviceBindings,
        totalBatches,
        activeBatches
      ] = await Promise.all([
        // 激活码总数
        this.mysql.ActivationCode.count(),

        // 未使用的激活码
        this.mysql.ActivationCode.count({
          where: { status: 'unused' }
        }),

        // 已使用的激活码
        this.mysql.ActivationCode.count({
          where: { status: 'used' }
        }),

        // 过期的激活码 (包括状态为expired和超过过期时间的)
        this.mysql.ActivationCode.count({
          where: {
            [Op.or]: [
              { status: 'expired' },
              {
                status: { [Op.in]: ['unused', 'used'] },
                expires_at: { [Op.lt]: currentTime }
              }
            ]
          }
        }),

        // 暂停的激活码
        this.mysql.ActivationCode.count({
          where: { status: 'suspended' }
        }),

        // 设备绑定总数
        this.mysql.DeviceBinding.count(),

        // 活跃的设备绑定数
        this.mysql.DeviceBinding.count({
          where: { status: 'active' }
        }),

        // 批次总数
        this.mysql.ActivationBatch.count(),

        // 活跃批次数
        this.mysql.ActivationBatch.count({
          where: { status: 'active' }
        })
      ])

      // 3. 获取类型分布统计
      const typeStats = await this.mysql.ActivationCode.findAll({
        attributes: [
          'type',
          [this.mysql.ActivationCode.sequelize.fn('COUNT', '*'), 'count']
        ],
        group: ['type']
      })

      // 4. 获取最近7天的激活趋势
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const activationTrend = await this.mysql.DeviceBinding.findAll({
        attributes: [
          [this.mysql.DeviceBinding.sequelize.fn('DATE', this.mysql.DeviceBinding.sequelize.col('activated_at')), 'date'],
          [this.mysql.DeviceBinding.sequelize.fn('COUNT', '*'), 'count']
        ],
        where: {
          activated_at: { [Op.gte]: sevenDaysAgo }
        },
        group: [this.mysql.DeviceBinding.sequelize.fn('DATE', this.mysql.DeviceBinding.sequelize.col('activated_at'))],
        order: [[this.mysql.DeviceBinding.sequelize.fn('DATE', this.mysql.DeviceBinding.sequelize.col('activated_at')), 'ASC']]
      })

      // 5. 组装统计数据
      const stats = {
        // 基础统计
        overview: {
          totalCodes,
          unusedCodes,
          usedCodes,
          expiredCodes,
          suspendedCodes,
          totalDeviceBindings,
          activeDeviceBindings,
          totalBatches,
          activeBatches
        },

        // 类型分布
        typeDistribution: typeStats.map(item => ({
          type: item.type,
          count: parseInt(item.dataValues.count)
        })),

        // 状态分布
        statusDistribution: [
          { status: 'unused', count: unusedCodes, label: '未使用' },
          { status: 'used', count: usedCodes, label: '已使用' },
          { status: 'expired', count: expiredCodes, label: '已过期' },
          { status: 'suspended', count: suspendedCodes, label: '已暂停' }
        ],

        // 激活趋势 (最近7天)
        activationTrend: activationTrend.map(item => ({
          date: item.dataValues.date,
          count: parseInt(item.dataValues.count)
        })),

        // 使用率统计
        usageStats: {
          codeUsageRate: totalCodes > 0 ? ((usedCodes / totalCodes) * 100).toFixed(2) : '0.00',
          deviceBindingRate: totalCodes > 0 ? ((activeDeviceBindings / totalCodes) * 100).toFixed(2) : '0.00',
          batchCompletionRate: totalBatches > 0 ? (((totalBatches - activeBatches) / totalBatches) * 100).toFixed(2) : '0.00'
        },

        // 元数据
        metadata: {
          lastUpdated: currentTime.toISOString(),
          dataSource: 'mysql',
          cacheExpiry: this.cacheExpiry.stats
        }
      }

      // 6. 缓存统计结果到 Redis
      await this.cacheStats(stats)

      logger.info('✅ 统计数据计算完成并已缓存')

      return {
        status: 0,
        data: stats,
        cached: false,
        timestamp: Date.now()
      }

    } catch (error) {
      logger.error('❌ 获取统计数据失败:', error)
      return {
        status: 1,
        message: '获取统计数据失败: ' + error.message,
        timestamp: Date.now()
      }
    }
  }

  /**
   * 获取激活码列表
   * @param {Object} options - 查询选项
   * @returns {Object} 激活码列表
   */
  async getActivationCodesList(options = {}) {
    const {
      page = 1,
      limit = 50,
      status,
      type,
      search,
      batchId,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = options

    try {
      const offset = (page - 1) * limit
      const where = {}

      // 构建查询条件
      if (status) {
        where.status = status
      }
      if (type) {
        where.type = type
      }
      if (batchId) {
        where.batch_id = batchId
      }
      if (search) {
        where[Op.or] = [
          { code: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ]
      }

      // 查询数据
      const { count, rows } = await this.mysql.ActivationCode.findAndCountAll({
        where,
        include: [{
          model: this.mysql.ActivationBatch,
          as: 'batch',
          attributes: ['batch_id', 'name', 'description']
        }],
        order: [[sortBy, sortOrder]],
        limit,
        offset
      })

      // 格式化数据
      const codes = rows.map(code => ({
        id: code.id,
        code: code.code,
        type: code.type,
        duration: code.duration,
        maxDevices: code.max_devices,
        usedCount: code.used_count,
        status: code.status,
        description: code.description,
        batchId: code.batch_id,
        tags: code.tags,
        expiresAt: code.expires_at ? code.expires_at.getTime() : null,
        createdAt: code.created_at ? code.created_at.getTime() : null,
        updatedAt: code.updated_at ? code.updated_at.getTime() : null,
        batch: code.batch ? {
          id: code.batch.batch_id,
          name: code.batch.name,
          description: code.batch.description
        } : null
      }))

      return {
        codes,
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }

    } catch (error) {
      logger.error('获取激活码列表失败:', error)
      throw error
    }
  }

  /**
   * 获取激活码详情
   * @param {string} code - 激活码
   * @returns {Object} 激活码详情
   */
  async getActivationCodeDetails(code) {
    try {
      // 1. 尝试从缓存获取
      let activationCode = await this.getActivationCodeFromCache(code)

      if (!activationCode) {
        // 2. 从数据库查询
        activationCode = await this.mysql.ActivationCode.findOne({
          where: { code },
          include: [
            {
              model: this.mysql.ActivationBatch,
              as: 'batch'
            },
            {
              model: this.mysql.DeviceBinding,
              as: 'deviceBindings',
              where: { status: 'active' },
              required: false
            }
          ]
        })

        if (!activationCode) {
          return { status: 1, message: '激活码不存在' }
        }

        // 缓存激活码信息
        await this.cacheActivationCode(activationCode)
      }

      // 3. 获取使用统计
      const deviceBindings = await this.mysql.DeviceBinding.findAll({
        where: { activation_code: code },
        order: [['created_at', 'DESC']]
      })

      // 4. 获取操作日志
      const logs = await this.mysql.ActivationLog.findAll({
        where: { activation_code: code },
        order: [['created_at', 'DESC']],
        limit: 20
      })

      // 安全的日期转换函数
      const safeGetTime = (dateValue) => {
        if (!dateValue) return null
        try {
          return dateValue.getTime ? dateValue.getTime() : null
        } catch (error) {
          logger.warn('日期转换失败:', error)
          return null
        }
      }

      return {
        status: 0,
        data: {
          id: activationCode.id,
          code: activationCode.code,
          type: activationCode.type,
          duration: activationCode.duration,
          maxDevices: activationCode.max_devices,
          usedCount: activationCode.used_count,
          status: activationCode.status,
          description: activationCode.description,
          batchId: activationCode.batch_id,
          tags: activationCode.tags,
          expiresAt: safeGetTime(activationCode.expires_at),
          createdAt: safeGetTime(activationCode.created_at),
          updatedAt: safeGetTime(activationCode.updated_at),
          batch: activationCode.batch ? {
            id: activationCode.batch.batch_id,
            name: activationCode.batch.name,
            description: activationCode.batch.description
          } : null,
          deviceBindings: deviceBindings.map(binding => ({
            id: binding.id,
            deviceId: binding.device_id,
            ipAddress: binding.ip_address,
            userAgent: binding.user_agent,
            activatedAt: safeGetTime(binding.activated_at),
            expiresAt: safeGetTime(binding.expires_at),
            lastValidatedAt: safeGetTime(binding.last_validated_at),
            validationCount: binding.validation_count,
            status: binding.status
          })),
          logs: logs.map(log => ({
            id: log.id,
            action: log.action,
            result: log.result,
            message: log.message,
            deviceId: log.device_id,
            ipAddress: log.ip_address,
            createdAt: safeGetTime(log.created_at)
          }))
        }
      }

    } catch (error) {
      logger.error('获取激活码详情失败:', error)
      return { status: 1, message: error.message }
    }
  }

  // ==================== 缓存相关方法 ====================

  /**
   * 缓存激活码信息到 Redis
   */
  async cacheActivationCode(activationCode) {
    try {
      const key = `${this.cachePrefix.activationCode}${activationCode.code}`
      const data = JSON.stringify({
        id: activationCode.id,
        code: activationCode.code,
        type: activationCode.type,
        duration: activationCode.duration,
        max_devices: activationCode.max_devices,
        used_count: activationCode.used_count,
        status: activationCode.status,
        expires_at: activationCode.expires_at ? activationCode.expires_at.getTime() : null,
        cached_at: Date.now()
      })

      if (this.redis && this.redis.Redis_String) {
        try {
          const redisString = new this.redis.Redis_String({ tpl: key })
          await redisString.setex([], this.cacheExpiry.activationCode, data)
        } catch (error) {
          logger.warn('缓存激活码失败:', error.message)
        }
      }
    } catch (error) {
      logger.warn('缓存激活码失败:', error.message)
    }
  }

  /**
   * 从 Redis 获取激活码信息
   */
  async getActivationCodeFromCache(code) {
    try {
      const key = `${this.cachePrefix.activationCode}${code}`

      if (this.redis && this.redis.Redis_String) {
        try {
          const redisString = new this.redis.Redis_String({ tpl: key })
          const data = await redisString.get([])
          if (data) {
            const parsed = JSON.parse(data)
            // 检查缓存是否过期（额外的安全检查）
            if (Date.now() - parsed.cached_at < this.cacheExpiry.activationCode * 1000) {
              return parsed
            }
          }
        } catch (redisError) {
          logger.warn('Redis 获取失败:', redisError.message)
        }
      }
      return null
    } catch (error) {
      logger.warn('从缓存获取激活码失败:', error.message)
      return null
    }
  }

  /**
   * 缓存设备绑定信息
   */
  async cacheDeviceBinding(deviceBinding, license) {
    try {
      const key = `${this.cachePrefix.deviceBinding}${deviceBinding.device_id}:${license.substring(0, 32)}`
      const data = JSON.stringify({
        id: deviceBinding.id,
        activation_code: deviceBinding.activation_code,
        device_id: deviceBinding.device_id,
        expires_at: deviceBinding.expires_at ? deviceBinding.expires_at.getTime() : null,
        status: deviceBinding.status,
        validation_count: deviceBinding.validation_count,
        cached_at: Date.now()
      })

      if (this.redis && this.redis.redis && typeof this.redis.redis.setex === 'function') {
        await this.redis.redis.setex(key, this.cacheExpiry.deviceBinding, data)
      }
    } catch (error) {
      logger.warn('缓存设备绑定失败:', error.message)
    }
  }

  /**
   * 从缓存获取设备绑定信息
   */
  async getDeviceBindingFromCache(deviceId, license) {
    try {
      const key = `${this.cachePrefix.deviceBinding}${deviceId}:${license.substring(0, 32)}`

      if (this.redis && this.redis.redis && typeof this.redis.redis.get === 'function') {
        const data = await this.redis.redis.get(key)
        if (data) {
          const parsed = JSON.parse(data)
          if (Date.now() - parsed.cached_at < this.cacheExpiry.deviceBinding * 1000) {
            return parsed
          }
        }
      }
      return null
    } catch (error) {
      logger.warn('从缓存获取设备绑定失败:', error.message)
      return null
    }
  }

  /**
   * 缓存统计数据到 Redis
   */
  async cacheStats(stats) {
    try {
      const cacheData = {
        ...stats,
        cached_at: Date.now(),
        cache_version: '1.0'
      }

      const data = JSON.stringify(cacheData)

      // 尝试使用 redis-async-wrapper 的正确方式
      if (this.redis && this.redis.Redis_String) {
        try {
          const redisString = new this.redis.Redis_String({ tpl: this.cachePrefix.stats })
          await redisString.setex([], this.cacheExpiry.stats, data)
          logger.debug(`✅ 统计数据已缓存到 Redis，过期时间: ${this.cacheExpiry.stats}秒`)
        } catch (error) {
          logger.warn('❌ 缓存统计数据失败:', error.message)
        }
      } else {
        logger.warn('⚠️ Redis 不可用，无法缓存统计数据')

        // Redis 连接状态检查已记录到日志
      }
    } catch (error) {
      logger.warn('❌ 缓存统计数据失败:', error.message)
    }
  }

  /**
   * 从 Redis 缓存获取统计数据
   */
  async getStatsFromCache() {
    try {
      if (this.redis && this.redis.Redis_String) {
        const redisString = new this.redis.Redis_String({ tpl: this.cachePrefix.stats })
        const data = await redisString.get([])
        if (data) {
          const parsed = JSON.parse(data)

          // 检查缓存是否过期（双重检查）
          const cacheAge = Date.now() - parsed.cached_at
          const maxAge = this.cacheExpiry.stats * 1000

          if (cacheAge < maxAge) {
            logger.debug(`✅ 从缓存获取统计数据，缓存年龄: ${Math.round(cacheAge/1000)}秒`)

            // 清理缓存元数据
            delete parsed.cached_at
            delete parsed.cache_version

            return parsed
          } else {
            logger.debug('⚠️ 缓存已过期，将重新计算')
            // 异步清除过期缓存
            this.clearStatsCache().catch(() => {})
          }
        }
      }
      return null
    } catch (error) {
      logger.warn('❌ 从缓存获取统计数据失败:', error.message)
      return null
    }
  }

  /**
   * 清除相关缓存
   */
  async clearRelatedCache(code) {
    try {
      const keys = [
        `${this.cachePrefix.activationCode}${code}`,
        this.cachePrefix.stats
      ]

      if (this.redis && this.redis.redis && typeof this.redis.redis.del === 'function') {
        await this.redis.redis.del(...keys)
      }
    } catch (error) {
      logger.warn('清除缓存失败:', error.message)
    }
  }

  /**
   * 清除统计缓存
   */
  async clearStatsCache() {
    try {
      if (this.redis && this.redis.redis && typeof this.redis.redis.del === 'function') {
        await this.redis.redis.del(this.cachePrefix.stats)
      }
    } catch (error) {
      logger.warn('清除统计缓存失败:', error.message)
    }
  }

  /**
   * 清除设备绑定缓存
   */
  async clearDeviceBindingCache(deviceId, license) {
    try {
      const key = `${this.cachePrefix.deviceBinding}${deviceId}:${license.substring(0, 32)}`

      if (this.redis && this.redis.redis && typeof this.redis.redis.del === 'function') {
        await this.redis.redis.del(key)
      }
    } catch (error) {
      logger.warn('清除设备绑定缓存失败:', error.message)
    }
  }

  // ==================== 工具方法 ====================

  /**
   * 验证激活码
   */
  validateActivationCode(activationCode) {
    const currentTime = Date.now()

    // 检查状态 - 只允许 unused 和 active 状态激活
    const validStatuses = ['unused', 'active']
    if (!validStatuses.includes(activationCode.status)) {
      const statusMessages = {
        'used': '激活码已用完',
        'expired': '激活码已过期',
        'suspended': '激活码已被暂停',
        'revoked': '激活码已被撤销',
        'disabled': '激活码已被禁用'
      }
      return {
        status: 1,
        message: statusMessages[activationCode.status] || `激活码状态异常: ${activationCode.status}`
      }
    }

    // 检查过期时间（只有已激活的码才检查过期时间）
    if (activationCode.status === 'active' && activationCode.expires_at && currentTime > activationCode.expires_at.getTime()) {
      return { status: 1, message: '激活码已过期' }
    }

    // 检查使用次数限制
    const usedCount = activationCode.used_count || 0
    const maxDevices = activationCode.max_devices || 1
    if (usedCount >= maxDevices) {
      return { status: 1, message: '激活码已达到最大设备绑定数' }
    }

    return { status: 0, message: '激活码有效' }
  }

  /**
   * 生成激活码
   */
  generateActivationCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const segments = []

    for (let i = 0; i < 4; i++) {
      let segment = ''
      for (let j = 0; j < 4; j++) {
        segment += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      segments.push(segment)
    }

    return segments.join('-')
  }

  /**
   * 检查并更新过期的激活码
   */
  async checkExpiredActivationCodes() {
    try {
      const currentTime = new Date()

      // 查找所有已激活但过期的激活码
      const expiredCodes = await this.mysql.ActivationCode.findAll({
        where: {
          status: 'active',
          expires_at: {
            [this.mysql.Sequelize.Op.lt]: currentTime
          }
        }
      })

      if (expiredCodes.length > 0) {
        // 批量更新为过期状态
        await this.mysql.ActivationCode.update(
          { status: 'expired' },
          {
            where: {
              id: {
                [this.mysql.Sequelize.Op.in]: expiredCodes.map(code => code.id)
              }
            }
          }
        )

        // 更新相关的设备绑定为过期状态
        await this.mysql.DeviceBinding.update(
          { status: 'expired' },
          {
            where: {
              activation_code: {
                [this.mysql.Sequelize.Op.in]: expiredCodes.map(code => code.code)
              },
              status: 'active'
            }
          }
        )

        logger.info(`🕒 检查到 ${expiredCodes.length} 个过期激活码，已更新状态`)

        // 清除相关缓存
        for (const code of expiredCodes) {
          this.clearRelatedCache(code.code).catch(() => {})
        }
      }

      return expiredCodes.length
    } catch (error) {
      logger.error('检查过期激活码失败:', error)
      return 0
    }
  }

  /**
   * 生成批次ID
   */
  generateBatchId() {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 8)
    return `BATCH_${timestamp}_${random}`.toUpperCase()
  }

  /**
   * 获取默认持续时间（小时）
   */
  getDefaultDuration(type) {
    const durations = {
      daily: 24,
      weekly: 168,
      monthly: 720,
      yearly: 8760,
      permanent: null
    }
    return durations[type] || 720
  }

  /**
   * 缓存新生成的激活码到 Redis
   */
  async cacheNewActivationCodes(codes) {
    try {
      if (!this.redis || !this.redis.redis) {
        return
      }

      const pipeline = this.redis.redis.pipeline()

      for (const code of codes) {
        const cacheKey = `${this.cachePrefix.activationCode}${code.code}`
        const cacheData = {
          id: code.id,
          code: code.code,
          type: code.type,
          duration: code.duration,
          max_devices: code.max_devices,
          status: code.status || 'unused',  // 确保状态正确
          expires_at: code.expires_at ? code.expires_at.getTime() : null,
          activated_at: code.activated_at ? code.activated_at.getTime() : null,
          cached_at: Date.now()
        }

        pipeline.setex(cacheKey, this.cacheExpiry.activationCode, JSON.stringify(cacheData))
      }

      await pipeline.exec()
      logger.debug(`✅ 已缓存 ${codes.length} 个新激活码到 Redis`)

    } catch (error) {
      logger.warn('❌ 缓存新激活码失败:', error.message)
    }
  }

  /**
   * 清除相关缓存
   */
  async clearRelatedCaches(cacheTypes = []) {
    try {
      if (!this.redis || !this.redis.redis) {
        return
      }

      const keysToDelete = []

      for (const type of cacheTypes) {
        switch (type) {
          case 'stats':
            keysToDelete.push(this.cachePrefix.stats)
            break
          case 'codes_list':
            // 清除所有列表查询缓存
            const listKeys = await this.redis.redis.keys(`${config.name}:cache:codes_list:*`)
            keysToDelete.push(...listKeys)
            break
        }
      }

      if (keysToDelete.length > 0) {
        await this.redis.redis.del(...keysToDelete)
        logger.debug(`✅ 已清除 ${keysToDelete.length} 个相关缓存`)
      }

    } catch (error) {
      logger.warn('❌ 清除相关缓存失败:', error.message)
    }
  }

  /**
   * 记录批次操作日志
   */
  async logBatchOperation(batchId, action, result, metadata = {}) {
    try {
      await this.mysql.ActivationLog.create({
        activation_code: batchId,
        device_id: 'system',
        action,
        result,
        message: `批次操作: ${action}`,
        request_data: JSON.stringify(metadata)
      })
    } catch (error) {
      logger.warn('❌ 记录批次操作日志失败:', error.message)
    }
  }

  /**
   * 生成授权文件
   */
  async generateLicense(activationCode, deviceInfo) {
    const licenseData = {
      code: activationCode.code,
      deviceId: deviceInfo.deviceId,
      type: activationCode.type,

      issuedAt: Date.now(),
      expiresAt: activationCode.expires_at ? activationCode.expires_at.getTime() : null
    }

    // 这里可以添加加密逻辑
    const license = Buffer.from(JSON.stringify(licenseData)).toString('base64')
    return license
  }

  /**
   * 记录激活日志
   */
  async logActivation(code, deviceId, action, result, message, ipAddress = null, userAgent = null, extraData = null) {
    try {
      await this.mysql.ActivationLog.create({
        activation_code: code,
        device_id: deviceId,
        action,
        result,
        message,
        ip_address: ipAddress,
        user_agent: userAgent,
        request_data: extraData ? JSON.stringify(extraData) : null
      })
    } catch (error) {
      logger.warn('记录激活日志失败:', error.message)
    }
  }

  /**
   * 撤销激活码
   */
  async revokeActivationCode(code, reason = '管理员撤销') {
    try {
      const activationCode = await this.mysql.ActivationCode.findOne({
        where: { code }
      })

      if (!activationCode) {
        return { status: 1, message: '激活码不存在' }
      }

      // 更新激活码状态
      await activationCode.update({ status: 'disabled' })

      // 撤销所有相关的设备绑定
      await this.mysql.DeviceBinding.update(
        { status: 'revoked' },
        { where: { activation_code: code, status: 'active' } }
      )

      // 清除缓存
      await this.clearRelatedCache(code)

      // 记录日志
      await this.logActivation(code, 'system', 'revoke', 'success', reason)

      logger.info(`✅ 激活码已撤销: ${code}`)
      return { status: 0, message: '激活码已撤销' }

    } catch (error) {
      logger.error('撤销激活码失败:', error)
      return { status: 1, message: error.message }
    }
  }

  /**
   * 删除激活码
   */
  async deleteActivationCode(code) {
    try {
      const activationCode = await this.mysql.ActivationCode.findOne({
        where: { code }
      })

      if (!activationCode) {
        return { status: 1, message: '激活码不存在' }
      }

      // 删除相关的设备绑定
      await this.mysql.DeviceBinding.destroy({
        where: { activation_code: code }
      })

      // 删除激活码
      await activationCode.destroy()

      // 清除缓存
      await this.clearRelatedCache(code)

      // 记录日志
      await this.logActivation(code, 'system', 'delete', 'success', '激活码已删除')

      logger.info(`✅ 激活码已删除: ${code}`)
      return { status: 0, message: '激活码已删除' }

    } catch (error) {
      logger.error('删除激活码失败:', error)
      return { status: 1, message: error.message }
    }
  }

  /**
   * 获取图表数据
   */
  async getChartData() {
    try {
      // 状态分布
      const statusStats = await this.mysql.ActivationCode.findAll({
        attributes: [
          'status',
          [this.mysql.ActivationCode.sequelize.fn('COUNT', '*'), 'count']
        ],
        group: ['status']
      })

      const statusData = statusStats.map(stat => ({
        status: stat.status,
        count: parseInt(stat.dataValues.count)
      }))

      // 最近7天的激活趋势
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const trendStats = await this.mysql.ActivationLog.findAll({
        attributes: [
          [this.mysql.ActivationLog.sequelize.fn('DATE', this.mysql.ActivationLog.sequelize.col('created_at')), 'date'],
          [this.mysql.ActivationLog.sequelize.fn('COUNT', '*'), 'count']
        ],
        where: {
          created_at: { [Op.gte]: sevenDaysAgo },
          action: 'activate',
          result: 'success'
        },
        group: [this.mysql.ActivationLog.sequelize.fn('DATE', this.mysql.ActivationLog.sequelize.col('created_at'))],
        order: [[this.mysql.ActivationLog.sequelize.fn('DATE', this.mysql.ActivationLog.sequelize.col('created_at')), 'ASC']]
      })

      const trendData = trendStats.map(stat => ({
        date: stat.dataValues.date,
        activated: parseInt(stat.dataValues.count)
      }))

      return {
        status: statusData,
        trend: trendData
      }

    } catch (error) {
      logger.error('获取图表数据失败:', error)
      throw error
    }
  }
}

module.exports = HybridStorageService
