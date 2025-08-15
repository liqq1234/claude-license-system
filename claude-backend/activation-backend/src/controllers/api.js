'use strict'

const express = require('express')
const router = express.Router()
const logger = require('../utils/logger')
const errors = require('../constants/errors')
const { ActivationManager } = require('../services/activation')
const { ActivationCodeStatus } = require('../models')
const { testConnection, syncDatabase } = require('../config/database')
const config = require('../../config')

/**
 * @swagger
 * components:
 *   schemas:
 *     ActivationRequest:
 *       type: object
 *       required:
 *         - code
 *         - deviceId
 *       properties:
 *         code:
 *           type: string
 *           description: 激活码
 *           example: "ABC123-DEF456-GHI789"
 *         deviceId:
 *           type: string
 *           description: 设备ID
 *           example: "device-12345"
 *         userAgent:
 *           type: string
 *           description: 用户代理
 *           example: "MyApp/1.0"
 *         ipAddress:
 *           type: string
 *           description: IP地址
 *           example: "192.168.1.100"
 *
 *     ActivationResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: integer
 *           description: 状态码 (0=成功, 其他=失败)
 *           example: 0
 *         message:
 *           type: string
 *           description: 响应消息
 *           example: "激活成功"
 *         license:
 *           type: string
 *           description: 授权文件
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         expiresAt:
 *           type: integer
 *           description: 过期时间戳
 *           example: 1640995200000
 *         codeInfo:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               example: "daily"
 *             remainingDevices:
 *               type: integer
 *               example: 0
 *
 *     ValidationRequest:
 *       type: object
 *       required:
 *         - license
 *         - deviceId
 *       properties:
 *         license:
 *           type: string
 *           description: 授权文件
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         deviceId:
 *           type: string
 *           description: 设备ID
 *           example: "device-12345"
 *
 *     ValidationResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: integer
 *           description: 状态码 (0=成功, 其他=失败)
 *           example: 0
 *         valid:
 *           type: boolean
 *           description: 是否有效
 *           example: true
 *         message:
 *           type: string
 *           description: 验证消息
 *           example: "授权有效"
 *         expiresAt:
 *           type: integer
 *           description: 过期时间戳
 *           example: 1640995200000
 *
 *     GenerateCodesRequest:
 *       type: object
 *       required:
 *         - type
 *         - batchSize
 *       properties:
 *         type:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly, permanent]
 *           description: 激活码类型
 *           example: "daily"
 *         duration:
 *           type: number
 *           description: 持续时间（小时）
 *           example: 24
 *         maxDevices:
 *           type: number
 *           description: 最大设备数
 *           default: 1
 *           example: 1
 *         batchSize:
 *           type: number
 *           description: 生成数量
 *           example: 10
 *           minimum: 1
 *           maximum: 1000
 *         description:
 *           type: string
 *           description: 描述
 *           example: "测试激活码"
 *         permissions:
 *           type: array
 *           items:
 *             type: string
 *           description: 权限列表（增强模式）
 *           example: ["basic", "premium"]
 *         enhanced:
 *           type: boolean
 *           description: 是否使用增强模式
 *           example: false
 *         priority:
 *           type: integer
 *           description: 优先级（增强模式）
 *           example: 5
 *           minimum: 1
 *           maximum: 10
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: 标签
 *           example: ["test", "demo"]
 *
 *     GenerateCodesResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: integer
 *           description: 状态码 (0=成功, 其他=失败)
 *           example: 0
 *         codes:
 *           type: array
 *           items:
 *             type: string
 *           description: 生成的激活码列表
 *           example: ["ABC123-DEF456-GHI789", "XYZ789-UVW456-RST123"]
 *         batchId:
 *           type: string
 *           description: 批次ID
 *           example: "BATCH_20231201_A1B2C3D4"
 *         summary:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *               example: 10
 *             type:
 *               type: string
 *               example: "daily"
 *             permissions:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["basic"]
 *             expiresAt:
 *               type: integer
 *               example: 1640995200000
 */

class ApiController {
  constructor() {
    this.dal = null
    this.activationManager = null
    this.initializeDAL()
  }

  async initializeDAL() {
    try {
      // 1. 初始化 MySQL 数据库连接
      logger.info('🔄 正在连接 MySQL 数据库...')
      const dbConnected = await testConnection()
      if (!dbConnected) {
        throw new Error('MySQL 数据库连接失败')
      }

      // 2. 同步数据库表结构
      logger.info('🔄 正在同步数据库表结构...')
      const dbSynced = await syncDatabase(false) // false = 不强制重建表
      if (!dbSynced) {
        throw new Error('数据库表结构同步失败')
      }

      // 3. 初始化 Redis 连接
      logger.info('🔄 正在连接 Redis...')
      const dal = require('redis-async-wrapper')

      const redisOptions = {
        host: config.redis.host || 'localhost',
        port: config.redis.port || 6379,
        keyPrefix: config.name,
        password: config.redis.password || '123456',
        no_ready_check: true
      }

      logger.info('🔧 Redis 连接参数:', redisOptions)

      // redis-async-wrapper 的 init 方法是同步的
      dal.init(redisOptions)
      logger.info('✅ Redis 客户端初始化完成')

        // redis-async-wrapper 将 Redis 客户端存储在内部的 wrapper.db 中
        // 我们需要等待 Redis 连接建立
        logger.info('🔄 等待 Redis 连接建立...')

        const testRedisConnection = new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Redis 连接超时'))
          }, 10000)

          // 等待一小段时间让 Redis 客户端初始化
          setTimeout(async () => {
            try {
              // 创建一个测试用的 Redis_String 实例
              const testRedis = new dal.Redis_String({ tpl: 'test:connection' })

              // 尝试设置一个测试值
              await testRedis.set([], 'test-value')
              logger.info('✅ Redis 写入测试成功')

              // 尝试读取测试值
              const result = await testRedis.get([])
              if (result === 'test-value') {
                logger.info('✅ Redis 读取测试成功')
              }

              // 清理测试数据 (使用正确的方法名)
              try {
                await testRedis.deleteKey([])
              } catch (cleanupError) {
                // 清理失败不影响连接测试结果
                logger.warn('⚠️ 清理测试数据失败:', cleanupError.message)
              }
              logger.info('✅ Redis 连接完全正常')

              clearTimeout(timeout)
              resolve('connected')

            } catch (err) {
              clearTimeout(timeout)
              logger.error('❌ Redis 连接测试失败:', err.message)
              reject(err)
            }
          }, 1000) // 等待1秒让 Redis 客户端完全初始化
        })

        await testRedisConnection

        this.dal = dal
        logger.info('✅ Redis 连接成功！使用 Redis 存储模式')

      this.dal = dal
      logger.info('✅ Redis 连接成功！')

      // 4. 创建 ActivationManager 实例
      this.activationManager = new ActivationManager(this.dal)
      logger.info('🚀 ActivationManager 初始化完成 (MySQL + Redis 混合存储)')

    } catch (error) {
      logger.error('❌ 系统初始化失败:', error)
      logger.error('💡 请确保:')
      logger.error('   1. MySQL 数据库正在运行且可连接')
      logger.error('   2. Redis 服务正在运行: redis-server')
      logger.error('   3. 数据库配置正确')
      logger.error('   4. Redis 密码正确')
      throw new Error('系统初始化失败，无法启动服务器')
    }
  }


  async activate(req, res) {
    try {
      const { code, deviceId, userAgent, ipAddress } = req.body

      if (!code || !deviceId) {
        return res.json({
          status: errors.INVALID_INPUT,
          message: '激活码和设备ID不能为空'
        })
      }

      // 使用混合存储服务进行激活
      const result = await this.activationManager.storage.activateDevice(code, {
        deviceId,
        userAgent: userAgent || req.get('User-Agent'),
        ipAddress: ipAddress || req.ip || req.connection.remoteAddress
      })

      return res.json(result)
    } catch (error) {
      logger.error('激活失败:', error)
      return res.json({
        status: errors.SERVER_ERROR,
        message: '激活过程中发生错误'
      })
    }
  }


  async validate(req, res) {
    try {
      const { deviceId } = req.body
      
      if (!deviceId) {
        return res.json({
          status: errors.INVALID_INPUT,
          message: '设备ID不能为空'
        })
      }

      const result = await this.activationManager.validateDevice(deviceId)
      return res.json(result)
    } catch (error) {
      logger.error('验证失败:', error)
      return res.json({
        status: errors.SERVER_ERROR,
        message: '验证过程中发生错误'
      })
    }
  }

  // ==================== 管理员接口 ====================


  async getStats(req, res) {
    try {
      logger.info('📊 获取统计数据请求')

      // 记录请求开始时间
      const startTime = Date.now()

      // 从混合存储服务获取统计数据
      const result = await this.activationManager.storage.getActivationStats()

      // 计算响应时间
      const responseTime = Date.now() - startTime

      if (result.status === 0) {
        logger.info(`✅ 统计数据获取成功，响应时间: ${responseTime}ms，数据源: ${result.cached ? 'Redis缓存' : 'MySQL数据库'}`)

        return res.json({
          status: errors.SUCCESS,
          message: '获取统计数据成功',
          data: result.data,
          meta: {
            cached: result.cached,
            responseTime: responseTime,
            timestamp: result.timestamp,
            dataSource: result.cached ? 'redis' : 'mysql'
          }
        })
      } else {
        logger.error('❌ 获取统计数据失败:', result.message)
        return res.status(500).json({
          status: errors.SERVER_ERROR,
          message: result.message || '获取统计数据失败',
          meta: {
            responseTime: responseTime,
            timestamp: result.timestamp
          }
        })
      }

    } catch (error) {
      const responseTime = Date.now() - (startTime || Date.now())
      logger.error('❌ 统计接口异常:', error)

      return res.status(500).json({
        status: errors.SERVER_ERROR,
        message: '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        meta: {
          responseTime: responseTime,
          timestamp: Date.now()
        }
      })
    }
  }

  /**
   * @swagger
   * /v1/admin/codes:
   *   get:
   *     summary: 获取激活码列表
   *     tags: [4. 激活码管理]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *         description: 页码
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *         description: 每页数量
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [unused, used, activated, expired, suspended, disabled]
   *         description: 状态筛选
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *         description: 类型筛选
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: 搜索关键词
   *     responses:
   *       200:
   *         description: 激活码列表
   */
  async getCodes(req, res) {
    try {
      const { page = 1, limit = 50, status, type, search } = req.query
      const result = await this.activationManager.getActivationCodesList({
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        type,
        search
      })
      return res.json({
        status: errors.SUCCESS,
        codes: result.codes,
        total: result.total,
        page: parseInt(page),
        limit: parseInt(limit)
      })
    } catch (error) {
      logger.error('获取激活码列表失败:', error)
      return res.json({
        status: errors.SERVER_ERROR,
        message: '获取激活码列表失败'
      })
    }
  }

  /**
   * @swagger
   * /v1/admin/codes/{code}:
   *   get:
   *     summary: 获取激活码详情
   *     tags: [4. 激活码管理]
   *     parameters:
   *       - in: path
   *         name: code
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: 激活码详情
   */
  async getCodeDetails(req, res) {
    try {
      const { code } = req.params
      const details = await this.activationManager.getActivationCodeDetails(code)
      
      if (!details) {
        return res.json({
          status: errors.NOT_FOUND,
          message: '激活码不存在'
        })
      }

      return res.json({
        status: errors.SUCCESS,
        data: details
      })
    } catch (error) {
      logger.error('获取激活码详情失败:', error)
      return res.json({
        status: errors.SERVER_ERROR,
        message: '获取激活码详情失败'
      })
    }
  }

  /**
   * @swagger
   * /v1/admin/generate-codes:
   *   post:
   *     summary: 批量生成激活码
   *     tags: [4. 激活码管理]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - type
   *               - batchSize
   *             properties:
   *               type:
   *                 type: string
   *                 enum: [daily, weekly, monthly, yearly, permanent]
   *                 description: "激活码类型"
   *                 example: "monthly"
   *               batchSize:
   *                 type: integer
   *                 minimum: 1
   *                 maximum: 10000
   *                 description: "生成数量"
   *                 example: 100
   *               duration:
   *                 type: integer
   *                 minimum: 1
   *                 description: "持续时间（小时），permanent类型可不填"
   *                 example: 720
   *               maxDevices:
   *                 type: integer
   *                 minimum: 1
   *                 maximum: 100
   *                 default: 1
   *                 description: "每个激活码最大设备数"
   *               description:
   *                 type: string
   *                 maxLength: 500
   *                 description: "批次描述"
   *               tags:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: "标签列表"
   *               permissions:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: "权限列表"
   *               enhanced:
   *                 type: boolean
   *                 default: false
   *                 description: "是否增强模式"
   *               priority:
   *                 type: integer
   *                 minimum: 1
   *                 maximum: 10
   *                 default: 5
   *                 description: "优先级"
   *               createdBy:
   *                 type: string
   *                 description: "创建者"
   *     responses:
   *       200:
   *         description: 生成成功
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
   *                   example: "激活码生成成功"
   *                 data:
   *                   type: object
   *                   properties:
   *                     batchId:
   *                       type: string
   *                       example: "BATCH_ABC123_DEF456"
   *                     codes:
   *                       type: array
   *                       items:
   *                         type: string
   *                       example: ["CODE-1234-ABCD", "CODE-5678-EFGH"]
   *       400:
   *         description: 参数错误
   *       500:
   *         description: 服务器错误
   */
  async generateCodes(req, res) {
    try {
      logger.info('📝 收到批量生成激活码请求')

      const {
        type,
        batchSize,
        duration,
        maxDevices = 1,
        description = '',
        tags = [],



        createdBy = 'admin'
      } = req.body

      // 参数验证
      if (!type) {
        return res.status(400).json({
          status: errors.INVALID_PARAMS,
          message: '激活码类型不能为空'
        })
      }

      if (!batchSize || batchSize < 1) {
        return res.status(400).json({
          status: errors.INVALID_PARAMS,
          message: '生成数量必须大于0'
        })
      }

      // 记录请求开始时间
      const startTime = Date.now()

      // 调用混合存储服务生成激活码
      const result = await this.activationManager.storage.generateActivationCodes({
        type,
        batchSize,
        duration,
        maxDevices,
        description,
        tags,



        createdBy
      })

      const responseTime = Date.now() - startTime

      if (result.status === 0) {
        logger.info(`✅ 批量生成激活码成功: ${result.data.codes.length}个，耗时: ${responseTime}ms`)

        return res.json({
          status: errors.SUCCESS,
          message: result.message,
          data: result.data,
          meta: {
            ...result.meta,
            totalResponseTime: responseTime
          }
        })
      } else {
        logger.error('❌ 批量生成激活码失败:', result.message)

        return res.status(500).json({
          status: errors.SERVER_ERROR,
          message: result.message,
          meta: {
            ...result.meta,
            totalResponseTime: responseTime
          }
        })
      }

    } catch (error) {
      const responseTime = Date.now() - (startTime || Date.now())
      logger.error('❌ 批量生成激活码接口异常:', error)

      return res.status(500).json({
        status: errors.SERVER_ERROR,
        message: '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        meta: {
          responseTime,
          timestamp: Date.now()
        }
      })
    }
  }

  /**
   * @swagger
   * /v1/admin/codes/{code}/suspend:
   *   post:
   *     summary: 暂停激活码
   *     tags: [4. 激活码管理]
   *     parameters:
   *       - in: path
   *         name: code
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               reason:
   *                 type: string
   *                 description: 暂停原因
   *               suspendedBy:
   *                 type: string
   *                 description: 操作者
   *     responses:
   *       200:
   *         description: 暂停成功
   */
  async suspendCode(req, res) {
    try {
      const { code } = req.params
      const { reason = '管理员暂停', suspendedBy = 'admin' } = req.body

      const result = await this.activationManager.suspendActivationCode(code, reason, suspendedBy)
      return res.json(result)
    } catch (error) {
      logger.error('暂停激活码失败:', error)
      return res.json({
        status: errors.SERVER_ERROR,
        message: '暂停激活码失败'
      })
    }
  }

  /**
   * @swagger
   * /v1/admin/codes/{code}/resume:
   *   post:
   *     summary: 恢复激活码
   *     tags: [4. 激活码管理]
   *     parameters:
   *       - in: path
   *         name: code
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: 恢复成功
   */
  async resumeCode(req, res) {
    try {
      const { code } = req.params
      const result = await this.activationManager.resumeActivationCode(code)
      return res.json(result)
    } catch (error) {
      logger.error('恢复激活码失败:', error)
      return res.json({
        status: errors.SERVER_ERROR,
        message: '恢复激活码失败'
      })
    }
  }

  /**
   * @swagger
   * /v1/admin/codes/{code}:
   *   delete:
   *     summary: 删除激活码
   *     tags: [4. 激活码管理]
   *     parameters:
   *       - in: path
   *         name: code
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: 删除成功
   */
  async deleteCode(req, res) {
    try {
      const { code } = req.params
      const result = await this.activationManager.deleteActivationCode(code)
      return res.json(result)
    } catch (error) {
      logger.error('删除激活码失败:', error)
      return res.json({
        status: errors.SERVER_ERROR,
        message: '删除激活码失败'
      })
    }
  }

  /**
   * @swagger
   * /v1/admin/chart-data:
   *   get:
   *     summary: 获取图表数据
   *     tags: [4. 激活码管理]
   *     responses:
   *       200:
   *         description: 图表数据
   */
  async getChartData(req, res) {
    try {
      const chartData = await this.activationManager.getChartData()
      return res.json({
        status: errors.SUCCESS,
        ...chartData
      })
    } catch (error) {
      logger.error('获取图表数据失败:', error)
      return res.json({
        status: errors.SERVER_ERROR,
        message: '获取图表数据失败'
      })
    }
  }
}

// 创建 API 控制器实例
const apiController = new ApiController()

/**
 * @swagger
 * /v1/activate:
 *   post:
 *     tags: [2. 设备激活]
 *     summary: 激活设备
 *     description: 使用激活码激活设备并获取授权文件
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ActivationRequest'
 *     responses:
 *       200:
 *         description: 激活成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ActivationResponse'
 */
router.post('/activate', apiController.activate.bind(apiController))

/**
 * @swagger
 * /v1/validate:
 *   post:
 *     tags: [3. 授权验证]
 *     summary: 验证授权
 *     description: 验证设备的授权文件是否有效
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ValidationRequest'
 *     responses:
 *       200:
 *         description: 验证结果
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationResponse'
 */
router.post('/validate', apiController.validate.bind(apiController))

/**
 * @swagger
 * /v1/admin/stats:
 *   get:
 *     tags: [4. 激活码管理]
 *     summary: 获取统计数据
 *     description: 获取激活码和设备的统计信息
 *     responses:
 *       200:
 *         description: 统计数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 0
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalCodes:
 *                       type: integer
 *                       example: 100
 *                     activeCodes:
 *                       type: integer
 *                       example: 50
 *                     expiredCodes:
 *                       type: integer
 *                       example: 20
 *                     totalDevices:
 *                       type: integer
 *                       example: 75
 */
router.get('/admin/stats', apiController.getStats.bind(apiController))

/**
 * @swagger
 * /v1/admin/codes:
 *   get:
 *     tags: [4. 激活码管理]
 *     summary: 获取激活码列表
 *     description: 分页获取激活码列表，支持筛选
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 每页数量
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [unused, active, used, expired, suspended, disabled]
 *         description: 状态筛选
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly, permanent]
 *         description: 类型筛选
 *     responses:
 *       200:
 *         description: 激活码列表
 */
router.get('/admin/codes', apiController.getCodes.bind(apiController))

/**
 * @swagger
 * /v1/admin/codes/{code}:
 *   get:
 *     tags: [4. 激活码管理]
 *     summary: 获取激活码详情
 *     description: 获取指定激活码的详细信息
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: 激活码
 *     responses:
 *       200:
 *         description: 激活码详情
 */
router.get('/admin/codes/:code', apiController.getCodeDetails.bind(apiController))

/**
 * @swagger
 * /v1/admin/generate-codes:
 *   post:
 *     tags: [4. 激活码管理]
 *     summary: 生成激活码
 *     description: 批量生成激活码
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerateCodesRequest'
 *     responses:
 *       200:
 *         description: 生成成功
 */
router.post('/admin/generate-codes', apiController.generateCodes.bind(apiController))

// 删除激活码
router.delete('/admin/codes/:code', apiController.deleteCode.bind(apiController))

// 系统接口
router.get('/status', (req, res) => {
  res.json({ status: 0, message: '服务正常' })
})

module.exports = { router }

