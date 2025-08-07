'use strict'
const crypto = require('crypto')
const config = require('../../config')
const logger = require('../utils/logger')
const errors = require('../constants/errors')
const utils = require('../utils/utils')
const fs = require('fs')
const { ActivationCodeGenerator } = require('../utils/codeGenerator')
const { ActivationCodeStatus } = require('../models')
const HybridStorageService = require('./hybridStorage')

const PrivateKey = {
  key: fs.readFileSync(config.rsa_private_key).toString(),
  passphrase: config.rsa_passphrase
}
const PublicKey = fs.readFileSync(config.rsa_public_key).toString()

class ActivationManager {
  constructor(dal) {
    if (!dal) {
      throw new Error('Redis DAL is required. Please ensure Redis is running and properly configured.')
    }

    this.dal = dal

    // 初始化混合存储服务
    this.storage = new HybridStorageService(dal)
    
    // 统一的 Redis 初始化（支持基础和增强模式）
    if (dal && typeof dal.Redis_Hash === 'function') {
      // 基础存储
      this.ActivationCode = new dal.Redis_Hash({tpl: 'ActivationCode:%s'})
      this.DeviceBinding = new dal.Redis_Hash({tpl: 'DeviceBinding:%s'})
      
      // 增强存储（可选）
      this.DeviceUsage = new dal.Redis_Hash({tpl: 'DeviceUsage:%s'})
      this.ActivationBatch = new dal.Redis_Hash({tpl: 'ActivationBatch:%s'})
      this.ActivationLog = new dal.Redis_List({tpl: 'ActivationLog'})
      this.BlacklistDevice = new dal.Redis_Set({tpl: 'BlacklistDevice'})
      this.WhitelistIP = new dal.Redis_Set({tpl: 'WhitelistIP'})
    } else if (dal) {
      // 创建兼容包装器
      this.ActivationCode = this.createRedisWrapper(dal, 'ActivationCode')
      this.DeviceBinding = this.createRedisWrapper(dal, 'DeviceBinding')
      this.DeviceUsage = this.createRedisWrapper(dal, 'DeviceUsage')
      this.ActivationBatch = this.createRedisWrapper(dal, 'ActivationBatch')
      this.ActivationLog = this.createListWrapper(dal, 'ActivationLog')
      this.BlacklistDevice = this.createSetWrapper(dal, 'BlacklistDevice')
      this.WhitelistIP = this.createSetWrapper(dal, 'WhitelistIP')
    } else {
      throw new Error('Redis DAL is required. Please ensure Redis is running and properly configured.')
    }
    
    this.codeGenerator = new ActivationCodeGenerator()
  }

  // 创建 Redis Hash 包装器
  createRedisWrapper(dal, prefix) {
    return {
      hgetall: async (args) => {
        const key = `${prefix}:${args[0]}`
        try {
          if (dal.redis && typeof dal.redis.hgetall === 'function') {
            return await dal.redis.hgetall(key)
          } else if (typeof dal.hgetall === 'function') {
            return await dal.hgetall(key)
          }
          return {}
        } catch (error) {
          logger.error(`Redis hgetall failed for key ${key}:`, error)
          return {}
        }
      },
      
      hmset: async (args, data) => {
        const key = `${prefix}:${args[0]}`
        try {
          const stringData = {}
          for (const [field, value] of Object.entries(data)) {
            stringData[field] = value === null ? 'null' : String(value)
          }
          
          if (dal.redis && typeof dal.redis.hmset === 'function') {
            return await dal.redis.hmset(key, stringData)
          } else if (typeof dal.hmset === 'function') {
            return await dal.hmset(key, stringData)
          }
          return true
        } catch (error) {
          logger.error(`Redis hmset failed for key ${key}:`, error)
          return false
        }
      },
      
      hset: async (args, field, value) => {
        const key = `${prefix}:${args[0]}`
        try {
          const stringValue = value === null ? 'null' : String(value)
          
          if (dal.redis && typeof dal.redis.hset === 'function') {
            return await dal.redis.hset(key, field, stringValue)
          } else if (typeof dal.hset === 'function') {
            return await dal.hset(key, field, stringValue)
          }
          return true
        } catch (error) {
          logger.error(`Redis hset failed for key ${key}:`, error)
          return false
        }
      },
      
      hincrby: async (args, field, increment) => {
        const key = `${prefix}:${args[0]}`
        try {
          if (dal.redis && typeof dal.redis.hincrby === 'function') {
            return await dal.redis.hincrby(key, field, increment)
          } else if (typeof dal.hincrby === 'function') {
            return await dal.hincrby(key, field, increment)
          }
          return 0
        } catch (error) {
          logger.error(`Redis hincrby failed for key ${key}:`, error)
          return 0
        }
      },

      keys: async (pattern) => {
        try {
          if (dal.redis && typeof dal.redis.keys === 'function') {
            return await dal.redis.keys(pattern)
          } else if (typeof dal.keys === 'function') {
            return await dal.keys(pattern)
          }
          return []
        } catch (error) {
          logger.error(`Redis keys failed for pattern ${pattern}:`, error)
          return []
        }
      },

      del: async (keys) => {
        try {
          if (dal.redis && typeof dal.redis.del === 'function') {
            return await dal.redis.del(keys)
          } else if (typeof dal.del === 'function') {
            return await dal.del(keys)
          }
          return true
        } catch (error) {
          logger.error(`Redis del failed for keys ${keys}:`, error)
          return false
        }
      }
    }
  }

  // 创建 Redis List 包装器
  createListWrapper(dal, prefix) {
    return {
      lpush: async (args, value) => {
        const key = `${prefix}`
        try {
          if (dal.redis && typeof dal.redis.lpush === 'function') {
            return await dal.redis.lpush(key, value)
          } else if (typeof dal.lpush === 'function') {
            return await dal.lpush(key, value)
          }
          return 0
        } catch (error) {
          logger.error(`Redis lpush failed for key ${key}:`, error)
          return 0
        }
      },
      
      llen: async (args) => {
        const key = `${prefix}`
        try {
          if (dal.redis && typeof dal.redis.llen === 'function') {
            return await dal.redis.llen(key)
          } else if (typeof dal.llen === 'function') {
            return await dal.llen(key)
          }
          return 0
        } catch (error) {
          logger.error(`Redis llen failed for key ${key}:`, error)
          return 0
        }
      },
      
      ltrim: async (args, start, stop) => {
        const key = `${prefix}`
        try {
          if (dal.redis && typeof dal.redis.ltrim === 'function') {
            return await dal.redis.ltrim(key, start, stop)
          } else if (typeof dal.ltrim === 'function') {
            return await dal.ltrim(key, start, stop)
          }
          return true
        } catch (error) {
          logger.error(`Redis ltrim failed for key ${key}:`, error)
          return false
        }
      }
    }
  }

  // 创建 Redis Set 包装器
  createSetWrapper(dal, prefix) {
    return {
      sadd: async (args, member) => {
        const key = `${prefix}`
        try {
          if (dal.redis && typeof dal.redis.sadd === 'function') {
            return await dal.redis.sadd(key, member)
          } else if (typeof dal.sadd === 'function') {
            return await dal.sadd(key, member)
          }
          return 0
        } catch (error) {
          logger.error(`Redis sadd failed for key ${key}:`, error)
          return 0
        }
      },
      
      sismember: async (args, member) => {
        const key = `${prefix}`
        try {
          if (dal.redis && typeof dal.redis.sismember === 'function') {
            return await dal.redis.sismember(key, member)
          } else if (typeof dal.sismember === 'function') {
            return await dal.sismember(key, member)
          }
          return 0
        } catch (error) {
          logger.error(`Redis sismember failed for key ${key}:`, error)
          return 0
        }
      },
      
      srem: async (args, member) => {
        const key = `${prefix}`
        try {
          if (dal.redis && typeof dal.redis.srem === 'function') {
            return await dal.redis.srem(key, member)
          } else if (typeof dal.srem === 'function') {
            return await dal.srem(key, member)
          }
          return 0
        } catch (error) {
          logger.error(`Redis srem failed for key ${key}:`, error)
          return 0
        }
      }
    }
  }



  // 统一的激活码生成方法（支持基础和增强模式）
  async generateActivationCode(options = {}) {
    const {
      type = 'daily',
      duration = 24,
      maxDevices = 1,
      batchSize = 1,

      priority = 5,             // 增强功能
      ipWhitelist = [],         // 增强功能
      deviceLimit = {},         // 增强功能
      usageLimit = {},          // 增强功能
      description = '',
      tags = [],
      createdBy = 'system',
      metadata = {},            // 增强功能

    } = options

    const codes = []
    const batchId = this.generateBatchId()
    
    logger.info(`开始生成 ${batchSize} 个激活码，批次ID: ${batchId}`)

    for (let i = 0; i < batchSize; i++) {
      try {
        const code = await this.codeGenerator.generateUniqueCode(
          async (code) => await this.checkCodeUniqueness(code)
        )
        
        const currentTime = Date.now()
        
        // 基础数据结构
        const codeData = {
          code,
          batchId,
          type,
          duration: String(duration),
          maxDevices: String(maxDevices),
          usedCount: '0',
          status: 'unused',  // 新生成的激活码状态为 unused
          description,
          tags: JSON.stringify(tags),
          createdBy,
          createdAt: String(currentTime),
          expiresAt: 'null',  // 生成时不设置过期时间
          activatedAt: 'null',
          lastUsedAt: 'null'
        }

        // 增强功能数据
        if (enhanced) {
          Object.assign(codeData, {
            permissions: JSON.stringify(permissions),
            priority: String(priority),
            ipWhitelist: JSON.stringify(ipWhitelist),
            deviceLimit: JSON.stringify(deviceLimit),
            usageLimit: JSON.stringify(usageLimit),
            metadata: JSON.stringify(metadata),
            notes: '',
            revokedAt: 'null',
            revokeReason: ''
          })
        }
        
        if (!config.stateless) {
          const saveResult = await this.ActivationCode.hmset([code], codeData)
          if (!saveResult) {
            logger.error(`保存激活码失败: ${code}`)
            throw new Error('保存激活码到Redis失败')
          }
          logger.debug(`激活码已保存到Redis: ${code}`)
        }
        
        codes.push(code)
        
        // 记录生成日志（增强模式）
        if (enhanced) {
          await this.logActivationEvent('code_generated', {
            code,
            batchId,
            type,
            createdBy,
            permissions
          })
        }
        
      } catch (error) {
        logger.error(`生成激活码 ${i + 1}/${batchSize} 失败:`, error)
        throw error
      }
    }

    // 保存批次信息
    if (!config.stateless) {
      const batchData = {
        batchId,
        type,
        totalCodes: String(batchSize),
        createdBy,
        createdAt: String(Date.now()),
        description,
        tags: JSON.stringify(tags)
      }
      
      if (enhanced) {
        batchData.permissions = JSON.stringify(permissions)
      }
      
      try {
        await this.ActivationBatch.hmset([batchId], batchData)
        logger.debug(`批次信息已保存: ${batchId}`)
      } catch (error) {
        logger.error(`保存批次信息失败: ${batchId}`, error)
      }
    }

    logger.info(`成功生成 ${batchSize} 个${enhanced ? '增强' : '基础'}激活码，批次ID: ${batchId}`)
    return { 
      status: errors.SUCCESS, 
      codes,
      batchId,
      summary: {
        total: batchSize,
        type,
        status: 'unused',
        expiresAt: null,  // 生成时不设置过期时间
        note: '激活码将在首次激活时开始倒计时'
      }
    }
  }

  // 统一的激活验证方法
  async activateCode(activationCode, deviceInfo, enhanced = false) {
    if (enhanced) {
      return await this.enhancedActivateCode(activationCode, deviceInfo)
    } else {
      return await this.basicActivateCode(activationCode, deviceInfo)
    }
  }

  // 基础激活方法（保持原有逻辑）
  async basicActivateCode(activationCode, deviceInfo) {
    const { deviceId, userAgent, ipAddress } = deviceInfo

    try {
      // 1. 格式验证
      if (!this.codeGenerator.isValidUUID(activationCode)) {
        return { status: errors.INVALID_INPUT, message: '激活码格式无效' }
      }

      // 2. 验证激活码存在性和状态
      const codeData = await this.ActivationCode.hgetall([activationCode])
      if (!codeData || Object.keys(codeData).length === 0) {
        return { status: errors.INVALID_INPUT, message: '激活码不存在' }
      }

      if (codeData.status !== 'active') {
        const statusMessages = {
          'used': '激活码已用完',
          'expired': '激活码已过期', 
          'revoked': '激活码已被撤销',
          'suspended': '激活码已被暂停'
        }
        return { 
          status: errors.INVALID_INPUT, 
          message: statusMessages[codeData.status] || '激活码状态异常' 
        }
      }

      // 3. 检查是否过期
      if (codeData.type !== 'permanent' && codeData.expiresAt && codeData.expiresAt !== 'null') {
        if (Date.now() > parseInt(codeData.expiresAt)) {
          await this.ActivationCode.hset([activationCode], 'status', 'expired')
          return { status: errors.INVALID_INPUT, message: '激活码已过期' }
        }
      }

      // 4. 检查设备绑定数量
      const usedCount = parseInt(codeData.usedCount) || 0
      const maxDevices = parseInt(codeData.maxDevices) || 1
      
      if (usedCount >= maxDevices) {
        await this.ActivationCode.hset([activationCode], 'status', 'used')
        return { status: errors.DUPLICATE_DATA, message: '激活码已达到最大设备绑定数' }
      }

      // 5. 检查设备是否已绑定
      const existingBinding = await this.DeviceBinding.hgetall([deviceId])
      if (existingBinding && existingBinding.status === 'active') {
        if (existingBinding.activationCode === activationCode) {
          return { 
            status: errors.SUCCESS, 
            message: '设备已激活', 
            license: existingBinding.license,
            expiresAt: existingBinding.expiresAt === 'null' ? null : parseInt(existingBinding.expiresAt)
          }
        } else {
          return { status: errors.DUPLICATE_DATA, message: '设备已绑定其他激活码' }
        }
      }

      // 6. 创建设备绑定
      const currentTime = Date.now()
      const bindingData = {
        activationCode,
        deviceId,
        userAgent: userAgent || '',
        ipAddress: ipAddress || '',
        activatedAt: String(currentTime),
        expiresAt: codeData.expiresAt,
        status: 'active'
      }

      // 7. 生成授权文件
      const license = this.generateLicense(bindingData)
      bindingData.license = license

      // 8. 保存绑定信息和更新统计
      await this.DeviceBinding.hmset([deviceId], bindingData)
      await this.ActivationCode.hincrby([activationCode], 'usedCount', 1)
      
      // 更新首次激活时间
      if (!codeData.activatedAt || codeData.activatedAt === 'null') {
        await this.ActivationCode.hset([activationCode], 'activatedAt', String(currentTime))
      }
      await this.ActivationCode.hset([activationCode], 'lastUsedAt', String(currentTime))
      
      // 如果达到最大使用次数，标记为已用
      if (usedCount + 1 >= maxDevices) {
        await this.ActivationCode.hset([activationCode], 'status', 'used')
      }

      logger.info(`Device ${deviceId} activated with UUID code ${activationCode}`)
      return { 
        status: errors.SUCCESS, 
        license,
        expiresAt: codeData.expiresAt === 'null' ? null : parseInt(codeData.expiresAt),
        message: '激活成功',
        codeInfo: {
          type: codeData.type,
          remainingDevices: maxDevices - usedCount - 1
        }
      }

    } catch (error) {
      logger.error('基础激活失败:', error)
      return { status: errors.SERVER_ERROR, message: '激活过程中发生错误' }
    }
  }

  // 增强激活方法（包含所有增强功能）
  async enhancedActivateCode(activationCode, deviceInfo) {
    const { deviceId, userAgent, ipAddress, deviceDetails = {} } = deviceInfo

    try {
      logger.info(`开始增强激活验证: 激活码=${activationCode}, 设备=${deviceId}`)

      // 1. 检查设备黑名单
      const isBlacklisted = await this.BlacklistDevice.sismember(['devices'], deviceId)
      if (isBlacklisted) {
        logger.warn(`设备在黑名单中: ${deviceId}`)
        return { status: errors.FORBIDDEN, message: '设备已被列入黑名单' }
      }

      // 2. 检查激活码是否存在
      const codeData = await this.ActivationCode.hgetall([activationCode])
      if (!codeData || Object.keys(codeData).length === 0) {
        logger.warn(`激活码不存在: ${activationCode}`)
        return { status: errors.NULL_DATA, message: '激活码不存在' }
      }

      // 3. 检查激活码状态
      if (codeData.status !== 'active') {
        logger.warn(`激活码状态无效: ${activationCode}, 状态: ${codeData.status}`)
        return { status: errors.FORBIDDEN, message: `激活码状态无效: ${codeData.status}` }
      }

      // 4. 检查过期时间
      if (codeData.expiresAt !== 'null' && parseInt(codeData.expiresAt) < Date.now()) {
        logger.warn(`激活码已过期: ${activationCode}`)
        await this.ActivationCode.hset([activationCode], 'status', 'expired')
        return { status: errors.FORBIDDEN, message: '激活码已过期' }
      }

      // 5. 检查IP白名单
      if (codeData.ipWhitelist && codeData.ipWhitelist !== '[]') {
        const ipWhitelist = JSON.parse(codeData.ipWhitelist)
        if (ipWhitelist.length > 0 && !ipWhitelist.includes(ipAddress)) {
          logger.warn(`IP地址不在白名单中: ${ipAddress}`)
          return { status: errors.FORBIDDEN, message: 'IP地址不在允许范围内' }
        }
      }

      // 6. 检查设备限制
      if (codeData.deviceLimit && codeData.deviceLimit !== '{}') {
        const deviceLimit = JSON.parse(codeData.deviceLimit)
        // 这里可以添加设备类型、版本等限制检查
      }

      // 7. 检查设备绑定数量
      const usedCount = parseInt(codeData.usedCount) || 0
      const maxDevices = parseInt(codeData.maxDevices) || 1
      
      if (usedCount >= maxDevices) {
        logger.warn(`激活码设备数量已达上限: ${activationCode}`)
        await this.ActivationCode.hset([activationCode], 'status', 'used')
        return { status: errors.FORBIDDEN, message: '激活码已达到最大设备绑定数' }
      }

      // 8. 检查设备是否已绑定
      const existingBinding = await this.DeviceBinding.hgetall([deviceId])
      if (existingBinding && Object.keys(existingBinding).length > 0) {
        if (existingBinding.activationCode === activationCode) {
          logger.info(`设备已绑定到此激活码: ${deviceId} -> ${activationCode}`)
          return {
            status: errors.SUCCESS,
            message: '设备已激活',
            license: existingBinding.license,
            expiresAt: existingBinding.expiresAt,
            permissions: JSON.parse(existingBinding.permissions || '[]'),
            deviceId,
            activationTime: existingBinding.activatedAt
          }
        } else {
          logger.warn(`设备已绑定到其他激活码: ${deviceId} -> ${existingBinding.activationCode}`)
          return { status: errors.FORBIDDEN, message: '设备已绑定到其他激活码' }
        }
      }

      // 9. 创建增强设备绑定
      const currentTime = Date.now()
      const bindingData = {
        activationCode,
        deviceId,
        userAgent: userAgent || '',
        ipAddress: ipAddress || '',
        deviceDetails: JSON.stringify(deviceDetails),
        activatedAt: String(currentTime),
        expiresAt: codeData.expiresAt,
        status: 'active',
        permissions: codeData.permissions,
        priority: codeData.priority
      }

      // 10. 生成增强授权文件
      const enhancedLicense = this.generateEnhancedLicense(bindingData, codeData)
      bindingData.license = enhancedLicense

      // 11. 保存绑定信息和更新统计
      await this.DeviceBinding.hmset([deviceId], bindingData)
      await this.ActivationCode.hincrby([activationCode], 'usedCount', 1)
      
      // 更新激活时间
      if (!codeData.activatedAt || codeData.activatedAt === 'null') {
        await this.ActivationCode.hset([activationCode], 'activatedAt', String(currentTime))
      }
      await this.ActivationCode.hset([activationCode], 'lastUsedAt', String(currentTime))
      
      // 如果达到最大设备数，标记为已用
      if (usedCount + 1 >= maxDevices) {
        await this.ActivationCode.hset([activationCode], 'status', 'used')
      }

      // 记录激活事件
      await this.logActivationEvent('device_activated', {
        activationCode,
        deviceId,
        ipAddress,
        permissions: JSON.parse(codeData.permissions || '["basic"]')
      })

      logger.info(`设备激活成功: ${deviceId} -> ${activationCode}`)
      return {
        status: errors.SUCCESS,
        message: '设备激活成功',
        license: enhancedLicense,
        expiresAt: codeData.expiresAt === 'null' ? null : parseInt(codeData.expiresAt),
        permissions: JSON.parse(codeData.permissions || '["basic"]'),
        deviceId,
        activationTime: currentTime
      }

    } catch (error) {
      logger.error('增强激活失败:', error)
      return { status: errors.SERVER_ERROR, message: '激活过程中发生错误' }
    }
  }

  // 记录激活事件日志
  async logActivationEvent(eventType, eventData) {
    try {
      const logEntry = {
        timestamp: Date.now(),
        type: eventType,
        data: eventData,
        id: crypto.randomUUID()
      }

      if (!config.stateless) {
        await this.ActivationLog.lpush(['events'], JSON.stringify(logEntry))
        
        // 保持日志数量在合理范围内
        const logCount = await this.ActivationLog.llen(['events'])
        if (logCount > 10000) {
          await this.ActivationLog.ltrim(['events'], 0, 5000)
        }
      }

      logger.debug(`激活事件已记录: ${eventType}`, eventData)
    } catch (error) {
      logger.error('记录激活事件失败:', error)
    }
  }

  // 获取IP地理位置信息
  async getLocationFromIP(ipAddress) {
    try {
      // 这里可以集成第三方IP地理位置服务
      return {
        ip: ipAddress,
        country: 'Unknown',
        city: 'Unknown',
        timestamp: Date.now()
      }
    } catch (error) {
      logger.error('获取IP位置信息失败:', error)
      return { ip: ipAddress, error: error.message }
    }
  }

  // 生成增强的授权文件
  generateEnhancedLicense(bindingData, codeData) {
    const licenseData = {
      deviceId: bindingData.deviceId,
      activationCode: bindingData.activationCode,
      permissions: JSON.parse(codeData.permissions || '["basic"]'),
      issuedAt: Date.now(),
      expiresAt: codeData.expiresAt === 'null' ? null : parseInt(codeData.expiresAt),
      issuer: 'EnhancedLicenseServer',
      version: '2.0',
      metadata: {
        type: codeData.type,
        priority: parseInt(codeData.priority || '5'),
        batchId: codeData.batchId
      }
    }

    const licenseString = JSON.stringify(licenseData)
    const signature = crypto
      .createHmac('sha256', process.env.LICENSE_SECRET || 'default-secret-key')
      .update(licenseString)
      .digest('hex')

    return Buffer.from(JSON.stringify({
      data: licenseData,
      signature
    })).toString('base64')
  }

  // 黑名单管理
  async addToBlacklist(deviceId, reason = '') {
    try {
      await this.BlacklistDevice.sadd(['devices'], deviceId)
      
      // 如果设备当前已激活，立即解绑
      const binding = await this.DeviceBinding.hgetall([deviceId])
      if (binding && binding.status === 'active') {
        await this.unbindDevice(deviceId, `blacklisted: ${reason}`)
      }

      await this.logActivationEvent('device_blacklisted', {
        deviceId,
        reason,
        blacklistedAt: Date.now()
      })

      logger.info(`设备已加入黑名单: ${deviceId}, 原因: ${reason}`)
      return { status: errors.SUCCESS, message: '设备已加入黑名单' }
    } catch (error) {
      logger.error('加入黑名单失败:', error)
      return { status: errors.SERVER_ERROR, message: '加入黑名单失败' }
    }
  }

  async removeFromBlacklist(deviceId) {
    try {
      await this.BlacklistDevice.srem(['devices'], deviceId)
      
      await this.logActivationEvent('device_unblacklisted', {
        deviceId,
        unblacklistedAt: Date.now()
      })

      logger.info(`设备已从黑名单移除: ${deviceId}`)
      return { status: errors.SUCCESS, message: '设备已从黑名单移除' }
    } catch (error) {
      logger.error('移除黑名单失败:', error)
      return { status: errors.SERVER_ERROR, message: '移除黑名单失败' }
    }
  }

  // 生成批次ID
  generateBatchId() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const random = crypto.randomBytes(4).toString('hex').toUpperCase()
    return `BATCH_${date}_${random}`
  }

  // 保存批次信息
  async saveBatchInfo(batchId, batchData) {
    if (this.dal && this.dal.Redis_Hash) {
      const BatchInfo = new this.dal.Redis_Hash({tpl: 'ActivationBatch:%s'})
      await BatchInfo.hmset([batchId], batchData)
    }
  }

  // 生成授权文件
  generateLicense(bindingData) {
    const licenseData = {
      deviceId: bindingData.deviceId,
      activationCode: bindingData.activationCode,
      activatedAt: parseInt(bindingData.activatedAt),
      expiresAt: bindingData.expiresAt === 'null' ? null : parseInt(bindingData.expiresAt),
      identity: config.identity
    }
    
    const buf = Buffer.from(JSON.stringify(licenseData), 'utf8')
    const encrypted = utils.crypt(PrivateKey, buf, true)
    return encrypted.toString('hex')
  }

  // 验证授权文件
  validateLicense(license, deviceId) {
    try {
      const buf = Buffer.from(license, 'hex')
      const decrypted = utils.crypt(PublicKey, buf, false)
      const licenseData = JSON.parse(decrypted.toString('utf8'))
      
      if (licenseData.deviceId !== deviceId) {
        return { valid: false, reason: '设备ID不匹配' }
      }
      
      if (licenseData.identity !== config.identity) {
        return { valid: false, reason: '软件身份不匹配' }
      }
      
      if (licenseData.expiresAt && Date.now() > licenseData.expiresAt) {
        return { valid: false, reason: '授权已过期' }
      }
      
      return { valid: true, data: licenseData }
    } catch (error) {
      return { valid: false, reason: '授权文件格式错误' }
    }
  }

  // 解绑设备
  async unbindDevice(deviceId, reason = '') {
    try {
      const bindingData = await this.DeviceBinding.hgetall([deviceId])
      if (!bindingData || Object.keys(bindingData).length === 0) {
        return { status: errors.NULL_DATA, message: '设备未绑定' }
      }

      // 标记绑定为已撤销
      await this.DeviceBinding.hset([deviceId], 'status', 'revoked')
      if (reason) {
        await this.DeviceBinding.hset([deviceId], 'revokedAt', String(Date.now()))
        await this.DeviceBinding.hset([deviceId], 'revokeReason', reason)
      }
      
      // 减少激活码使用次数
      const activationCode = bindingData.activationCode
      await this.ActivationCode.hincrby([activationCode], 'usedCount', -1)
      
      // 重新激活激活码
      const codeData = await this.ActivationCode.hgetall([activationCode])
      const usedCount = parseInt(codeData.usedCount) || 0
      const maxDevices = parseInt(codeData.maxDevices) || 1
      
      if (codeData.status === 'used' && usedCount < maxDevices) {
        await this.ActivationCode.hset([activationCode], 'status', 'active')
      }
      
      logger.info(`Device ${deviceId} unbound from code ${activationCode}`)
      return { status: errors.SUCCESS, message: '设备解绑成功' }
    } catch (error) {
      logger.error('设备解绑失败:', error)
      return { status: errors.SERVER_ERROR, message: '设备解绑失败' }
    }
  }

  // 撤销激活码
  async revokeActivationCode(activationCode) {
    try {
      const codeData = await this.ActivationCode.hgetall(`${config.name}:ActivationCode:${activationCode}`)
      if (!codeData || !codeData.code) {
        return { status: errors.NOT_FOUND, message: '激活码不存在' }
      }
      
      if (codeData.status === 'revoked') {
        return { status: errors.BAD_REQUEST, message: '激活码已被撤销' }
      }
      
      // 更新状态为撤销
      await this.ActivationCode.hset(`${config.name}:ActivationCode:${activationCode}`, 'status', 'revoked')
      await this.ActivationCode.hset(`${config.name}:ActivationCode:${activationCode}`, 'revokedAt', String(Date.now()))
      
      // 解绑所有设备
      const deviceKeys = await this.DeviceBinding.keys(`${config.name}:DeviceBinding:*`)
      for (const key of deviceKeys) {
        const deviceData = await this.DeviceBinding.hgetall(key)
        if (deviceData.activationCode === activationCode) {
          await this.DeviceBinding.del(key)
        }
      }
      
      logger.info(`激活码已撤销: ${activationCode}`)
      return { status: errors.SUCCESS, message: '激活码已撤销' }
    } catch (error) {
      logger.error('撤销激活码失败:', error)
      return { status: errors.SERVER_ERROR, message: '撤销激活码失败' }
    }
  }

  // 删除激活码
  async deleteActivationCode(activationCode) {
    try {
      // 使用混合存储服务删除激活码
      return await this.storage.deleteActivationCode(activationCode)
    } catch (error) {
      logger.error('删除激活码失败:', error)
      return { status: errors.SERVER_ERROR, message: '删除激活码失败' }
    }
  }

  // 获取激活码统计数据
  async getActivationStats() {
    try {
      // 使用混合存储服务获取统计数据
      return await this.storage.getActivationStats()
    } catch (error) {
      logger.error('获取统计数据失败:', error)
      throw error
    }
  }



  // 获取激活码列表
  async getActivationCodesList(options = {}) {
    try {
      // 使用混合存储服务获取激活码列表
      return await this.storage.getActivationCodesList(options)
    } catch (error) {
      logger.error('获取激活码列表失败:', error)
      throw error
    }
  }

  // 获取激活码详情
  async getActivationCodeDetails(activationCode) {
    try {
      // 使用混合存储服务获取激活码详情
      return await this.storage.getActivationCodeDetails(activationCode)
    } catch (error) {
      logger.error('获取激活码详情失败:', error)
      throw error
    }
  }

  // 获取图表数据
  async getChartData() {
    try {
      // 使用混合存储服务获取图表数据
      return await this.storage.getChartData()
    } catch (error) {
      logger.error('获取图表数据失败:', error)
      throw error
    }
  }

  // 暂停激活码
  async suspendActivationCode(activationCode, reason = '管理员暂停', suspendedBy = 'admin') {
    try {
      const codeData = await this.ActivationCode.hgetall([activationCode])
      if (!codeData || Object.keys(codeData).length === 0) {
        return { status: errors.NOT_FOUND, message: '激活码不存在' }
      }

      if (codeData.status === ActivationCodeStatus.SUSPENDED) {
        return { status: errors.INVALID_INPUT, message: '激活码已处于暂停状态' }
      }

      const currentTime = Date.now()
      await this.ActivationCode.hmset([activationCode], {
        status: ActivationCodeStatus.SUSPENDED,
        suspendedAt: String(currentTime),
        suspendedBy,
        suspendReason: reason
      })

      logger.info(`激活码已暂停: ${activationCode}, 原因: ${reason}`)
      return { status: errors.SUCCESS, message: '激活码已暂停' }
    } catch (error) {
      logger.error('暂停激活码失败:', error)
      return { status: errors.SERVER_ERROR, message: '暂停激活码失败' }
    }
  }

  // 恢复激活码
  async resumeActivationCode(activationCode) {
    try {
      const codeData = await this.ActivationCode.hgetall([activationCode])
      if (!codeData || Object.keys(codeData).length === 0) {
        return { status: errors.NOT_FOUND, message: '激活码不存在' }
      }

      if (codeData.status !== ActivationCodeStatus.SUSPENDED) {
        return { status: errors.INVALID_INPUT, message: '激活码未处于暂停状态' }
      }

      // 检查是否过期
      const currentTime = Date.now()
      const expiresAt = codeData.expiresAt === 'null' ? null : parseInt(codeData.expiresAt)
      
      let newStatus = ActivationCodeStatus.UNUSED
      if (expiresAt && currentTime > expiresAt) {
        newStatus = ActivationCodeStatus.EXPIRED
      } else if (parseInt(codeData.usedCount || '0') >= parseInt(codeData.maxDevices || '1')) {
        newStatus = ActivationCodeStatus.USED
      }

      await this.ActivationCode.hmset([activationCode], {
        status: newStatus,
        suspendedAt: 'null',
        suspendedBy: '',
        suspendReason: ''
      })

      logger.info(`激活码已恢复: ${activationCode}, 新状态: ${newStatus}`)
      return { status: errors.SUCCESS, message: '激活码已恢复', newStatus }
    } catch (error) {
      logger.error('恢复激活码失败:', error)
      return { status: errors.SERVER_ERROR, message: '恢复激活码失败' }
    }
  }
}

module.exports = { ActivationManager }






