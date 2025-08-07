'use strict'
const express = require('express')
const router = express.Router()
const { ActivationManager } = require('../services/activation')  // 修正路径
const { AccountPoolManager } = require('../services/accountPool')  // 修正路径
const logger = require('../utils/logger')
const errors = require('../constants/errors')
const config = require('../../config')

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     AdminKey:
 *       type: apiKey
 *       in: header
 *       name: x-admin-key
 *   schemas:
 *     AdminGenerateCodesRequest:
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
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: 标签列表
 *           example: ["test", "batch1"]
 */

// 管理员认证中间件
const adminAuth = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'] || req.query.adminKey
  
  if (!adminKey || adminKey !== (process.env.ADMIN_KEY || 'admin123')) {
    return res.status(401).json({ 
      status: errors.UNAUTHORIZED, 
      message: '管理员权限验证失败' 
    })
  }
  next()
}

// 参数验证中间件
const validateGenerateParams = (req, res, next) => {
  const { type, duration, maxDevices, batchSize } = req.body
  
  // 验证激活码类型
  const validTypes = ['daily', 'weekly', 'monthly', 'yearly', 'permanent']
  if (type && !validTypes.includes(type)) {
    return res.json({
      status: errors.INVALID_INPUT,
      message: `无效的激活码类型，支持: ${validTypes.join(', ')}`
    })
  }
  
  // 验证批次大小
  if (batchSize && (batchSize < 1 || batchSize > 1000)) {
    return res.json({
      status: errors.INVALID_INPUT,
      message: '批次大小必须在1-1000之间'
    })
  }
  
  // 验证持续时间
  if (duration && (duration < 1 || duration > 8760)) { // 最大1年
    return res.json({
      status: errors.INVALID_INPUT,
      message: '持续时间必须在1-8760小时之间'
    })
  }
  
  // 验证最大设备数
  if (maxDevices && (maxDevices < 1 || maxDevices > 100)) {
    return res.json({
      status: errors.INVALID_INPUT,
      message: '最大设备数必须在1-100之间'
    })
  }
  
  next()
}

/**
 * @swagger
 * /admin/generate-codes:
 *   post:
 *     tags: [4. 激活码管理]
 *     summary: 批量生成激活码
 *     description: 管理员批量生成激活码
 *     security:
 *       - AdminKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminGenerateCodesRequest'
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
 *                   example: "成功生成10个激活码"
 *                 data:
 *                   type: object
 *                   properties:
 *                     batchId:
 *                       type: string
 *                       example: "batch_20250730_001"
 *                     codes:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["ABC123-DEF456", "GHI789-JKL012"]
 */
router.post('/generate-codes', adminAuth, validateGenerateParams, async (req, res) => {
  try {
    const {
      type = 'daily',
      duration = 24,
      maxDevices = 1,
      batchSize = 1,
      description = '',
      tags = [],
      createdBy = 'admin'
    } = req.body
    
    logger.info(`管理员请求生成激活码: 类型=${type}, 数量=${batchSize}, 持续时间=${duration}小时`)
    
    // 使用全局的 activationManager 实例
    const activationManager = global.activationManager

    if (!activationManager || !activationManager.storage) {
      return res.json({
        status: errors.INTERNAL_ERROR,
        message: '激活管理器未初始化'
      })
    }

    const result = await activationManager.storage.generateActivationCodes({
      type,
      duration,
      maxDevices,
      batchSize,
      description,
      tags,
      createdBy
    })

    if (result.status === 0) {
      logger.info(`成功生成${batchSize}个激活码，批次ID: ${result.data.batchId}`)

      // 返回详细信息
      res.json({
        status: 0,
        message: result.message,
        data: result.data,
        generatedAt: new Date().toISOString(),
        summary: {
          ...result.data.summary,
          codes: (result.data.codes || []).slice(0, 10), // 只返回前10个码用于预览
          totalGenerated: (result.data.codes || []).length,
          preview: (result.data.codes || []).length > 10 ? '仅显示前10个激活码' : '显示全部激活码'
        }
      })
    } else {
      res.json(result)
    }
    
  } catch (error) {
    logger.error(`生成激活码失败: ${error.message}`)
    res.json({
      status: 1,
      message: '生成激活码时发生内部错误: ' + error.message,
      data: {
        batchId: null,
        codes: [],
        summary: {
          total: 0,
          type: null,
          status: 'failed',
          expiresAt: null,
          note: '生成失败'
        }
      },
      error: error.message
    })
  }
})

/**
 * @swagger
 * /admin/codes/{code}:
 *   get:
 *     tags: [4. 激活码管理]
 *     summary: 查询激活码信息
 *     description: 获取指定激活码的详细信息
 *     security:
 *       - AdminKey: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: 激活码
 *         example: "ABC123-DEF456-GHI789"
 *     responses:
 *       200:
 *         description: 激活码信息
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
 *                     code:
 *                       type: string
 *                       example: "ABC123-DEF456-GHI789"
 *                     type:
 *                       type: string
 *                       example: "daily"
 *                     status:
 *                       type: string
 *                       example: "unused"
 *                     maxDevices:
 *                       type: integer
 *                       example: 1
 *                     usedCount:
 *                       type: integer
 *                       example: 0
 */
router.get('/codes/:code', adminAuth, async (req, res) => {
  try {
    const { code } = req.params
    
    let dal
    if (!config.stateless) {
      dal = require('redis-async-wrapper')
    }
    
    const activationManager = new ActivationManager(dal)
    
    // 验证激活码格式
    if (!activationManager.codeGenerator.isValidUUID(code)) {
      return res.json({
        status: errors.INVALID_INPUT,
        message: '激活码格式无效'
      })
    }
    
    if (config.stateless) {
      return res.json({
        status: errors.SUCCESS,
        message: '无状态模式下无法查询激活码详情',
        code: code,
        valid: activationManager.codeGenerator.isValidUUID(code)
      })
    }
    
    const codeData = await activationManager.ActivationCode.hgetall([code])
    
    if (!codeData || Object.keys(codeData).length === 0) {
      return res.json({
        status: errors.NULL_DATA,
        message: '激活码不存在'
      })
    }
    
    res.json({
      status: errors.SUCCESS,
      data: {
        ...codeData,
        createdAt: codeData.createdAt && codeData.createdAt !== 'null' ? new Date(parseInt(codeData.createdAt)).toISOString() : null,
        expiresAt: codeData.expiresAt && codeData.expiresAt !== 'null' ? new Date(parseInt(codeData.expiresAt)).toISOString() : null,
        activatedAt: codeData.activatedAt && codeData.activatedAt !== 'null' ? new Date(parseInt(codeData.activatedAt)).toISOString() : null,
        lastUsedAt: codeData.lastUsedAt && codeData.lastUsedAt !== 'null' ? new Date(parseInt(codeData.lastUsedAt)).toISOString() : null
      }
    })
    
  } catch (error) {
    logger.error(`查询激活码失败: ${error.message}`)
    res.json({
      status: errors.INTERNAL_ERROR,
      message: '查询激活码时发生错误',
      error: error.message
    })
  }
})

// 撤销激活码
router.post('/codes/:code/revoke', adminAuth, async (req, res) => {
  try {
    const { code } = req.params
    const { reason = '管理员撤销' } = req.body
    
    let dal
    if (!config.stateless) {
      dal = require('redis-async-wrapper')
    }
    
    const activationManager = new ActivationManager(dal)
    const result = await activationManager.revokeActivationCode(code, reason)
    
    logger.info(`激活码已撤销: ${code}, 原因: ${reason}`)
    res.json(result)
    
  } catch (error) {
    logger.error(`撤销激活码失败: ${error.message}`)
    res.json({
      status: errors.INTERNAL_ERROR,
      message: '撤销激活码时发生错误',
      error: error.message
    })
  }
})

// 获取激活码统计信息
router.get('/stats', adminAuth, async (req, res) => {
  try {
    if (config.stateless) {
      return res.json({
        status: errors.SUCCESS,
        message: '无状态模式下无法提供统计信息',
        stats: {
          mode: 'stateless',
          note: '所有激活码验证基于格式检查'
        }
      })
    }
    
    // TODO: 实现完整的统计功能
    res.json({
      status: errors.SUCCESS,
      stats: {
        totalCodes: 0,
        activeCodes: 0,
        usedCodes: 0,
        expiredCodes: 0,
        revokedCodes: 0,
        note: '统计功能开发中'
      }
    })
    
  } catch (error) {
    logger.error(`获取统计信息失败: ${error.message}`)
    res.json({
      status: errors.INTERNAL_ERROR,
      message: '获取统计信息时发生错误',
      error: error.message
    })
  }
})

// 批量导出激活码
router.post('/export-codes', adminAuth, async (req, res) => {
  try {
    const { batchId, format = 'json' } = req.body
    
    if (!batchId) {
      return res.json({
        status: errors.INVALID_INPUT,
        message: '请提供批次ID'
      })
    }
    
    // TODO: 实现导出功能
    res.json({
      status: errors.SUCCESS,
      message: '导出功能开发中',
      batchId
    })
    
  } catch (error) {
    logger.error(`导出激活码失败: ${error.message}`)
    res.json({
      status: errors.INTERNAL_ERROR,
      message: '导出激活码时发生错误',
      error: error.message
    })
  }
})

module.exports = router

