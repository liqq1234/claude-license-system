'use strict'

const express = require('express')
const router = express.Router()
const logger = require('../utils/logger')
const errors = require('../constants/errors')
const EmailActivationService = require('../services/emailActivationService')
const { authenticateToken } = require('../middleware/auth')

const emailActivationService = new EmailActivationService()

/**
 * @swagger
 * components:
 *   schemas:
 *     EmailActivationRequest:
 *       type: object
 *       required:
 *         - activationCode
 *       properties:
 *         activationCode:
 *           type: string
 *           description: 激活码
 *           example: "ABC123-DEF456-GHI789"
 *     
 *     MembershipResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: integer
 *           example: 0
 *         message:
 *           type: string
 *           example: "激活成功"
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 email:
 *                   type: string
 *                   example: "user@example.com"
 *                 username:
 *                   type: string
 *                   example: "testuser"
 *             membership:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "active"
 *                 total_duration_hours:
 *                   type: integer
 *                   example: 48
 *                 remaining_duration_hours:
 *                   type: integer
 *                   example: 36
 *                 expires_at:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-08-01T14:30:00Z"
 */

/**
 * @swagger
 * /activation/bind:
 *   post:
 *     tags: [2. 设备激活]
 *     summary: 邮箱绑定激活码
 *     description: 用户使用邮箱绑定激活码，激活码可叠加时间
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmailActivationRequest'
 *     responses:
 *       200:
 *         description: 激活结果
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MembershipResponse'
 */
router.post('/bind', authenticateToken, async (req, res) => {
  try {
    const { activationCode } = req.body
    const userEmail = req.user.email

    // 参数验证
    if (!activationCode) {
      return res.json({
        status: errors.INVALID_INPUT,
        message: '激活码不能为空'
      })
    }

    // 获取客户端信息
    const clientInfo = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    }

    const result = await emailActivationService.activateByEmail({
      email: userEmail,
      activationCode,
      ...clientInfo
    })

    res.json({
      status: result.code,
      message: result.message,
      data: result.data
    })

  } catch (error) {
    logger.error('邮箱激活码绑定接口错误:', error)
    res.json({
      status: errors.INTERNAL_ERROR,
      message: '服务器内部错误'
    })
  }
})

/**
 * @swagger
 * /activation/status:
 *   get:
 *     tags: [2. 设备激活]
 *     summary: 获取用户会员状态
 *     description: 获取当前用户的会员状态和激活记录
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 会员状态
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MembershipResponse'
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email

    const result = await emailActivationService.getUserMembershipStatus(userEmail)

    res.json({
      status: result.code,
      message: result.message,
      data: result.data
    })

  } catch (error) {
    logger.error('获取会员状态接口错误:', error)
    res.json({
      status: errors.INTERNAL_ERROR,
      message: '服务器内部错误'
    })
  }
})

/**
 * @swagger
 * /activation/user-info:
 *   get:
 *     tags: [2. 设备激活]
 *     summary: 获取完整用户信息
 *     description: 获取用户的完整信息，包括会员状态、激活记录、统计信息等
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 用户完整信息
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
 *                   example: "获取用户信息成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         email:
 *                           type: string
 *                           example: "user@example.com"
 *                         username:
 *                           type: string
 *                           example: "testuser"
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-07-31T10:00:00Z"
 *                     membership:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: "active"
 *                         total_duration_hours:
 *                           type: integer
 *                           example: 48
 *                         remaining_duration_hours:
 *                           type: integer
 *                           example: 36
 *                         membership_start_at:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-07-31T10:00:00Z"
 *                         membership_expires_at:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-08-02T10:00:00Z"
 *                         activation_count:
 *                           type: integer
 *                           example: 3
 *                     activations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           code:
 *                             type: string
 *                             example: "ABC123-DEF456"
 *                           type:
 *                             type: string
 *                             example: "daily"
 *                           duration_hours:
 *                             type: integer
 *                             example: 24
 *                           activated_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-07-31T10:00:00Z"
 *                           expires_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-08-01T10:00:00Z"
 *                           status:
 *                             type: string
 *                             example: "active"
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         total_activations:
 *                           type: integer
 *                           example: 3
 *                         total_hours_gained:
 *                           type: integer
 *                           example: 72
 *                         days_since_first_activation:
 *                           type: integer
 *                           example: 15
 *                         is_premium_user:
 *                           type: boolean
 *                           example: true
 */
router.get('/user-info', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email

    const result = await emailActivationService.getCompleteUserInfo(userEmail)

    res.json({
      status: result.code,
      message: result.message,
      data: result.data
    })

  } catch (error) {
    logger.error('获取完整用户信息接口错误:', error)
    res.json({
      status: errors.INTERNAL_ERROR,
      message: '服务器内部错误'
    })
  }
})

/**
 * @swagger
 * /activation/validate:
 *   post:
 *     tags: [3. 授权验证]
 *     summary: 验证用户会员状态
 *     description: 验证当前用户是否有有效的会员资格
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 验证结果
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
 *                   example: "会员有效"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         email:
 *                           type: string
 *                           example: "user@example.com"
 *                     membership:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: "active"
 *                         expires_at:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-08-01T14:30:00Z"
 *                         remaining_hours:
 *                           type: integer
 *                           example: 36
 */
router.post('/validate', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email

    const result = await emailActivationService.validateMembership(userEmail)

    res.json({
      status: result.code,
      message: result.message,
      data: result.data
    })

  } catch (error) {
    logger.error('验证会员状态接口错误:', error)
    res.json({
      status: errors.INTERNAL_ERROR,
      message: '服务器内部错误'
    })
  }
})

module.exports = router
