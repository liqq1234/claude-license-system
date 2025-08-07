/**
 * Mailcow 邮箱管理控制器
 */

const express = require('express')
const router = express.Router()
const mailcowService = require('../services/mailcowService')
const logger = require('../utils/logger')
const errors = require('../constants/errors')

/**
 * @swagger
 * /mailcow/create-mailbox:
 *   post:
 *     summary: 创建单个邮箱账号
 *     tags: [Mailcow]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - localPart
 *               - password
 *               - name
 *             properties:
 *               localPart:
 *                 type: string
 *                 description: 邮箱本地部分（@前面的部分）
 *               password:
 *                 type: string
 *                 description: 邮箱密码
 *               name:
 *                 type: string
 *                 description: 显示名称
 *               quota:
 *                 type: number
 *                 description: 配额（MB）
 *                 default: 1024
 *     responses:
 *       200:
 *         description: 创建结果
 */
router.post('/create-mailbox', async (req, res) => {
  try {
    const { localPart, password, name, quota = 1024 } = req.body

    // 参数验证
    if (!localPart || !password || !name) {
      return res.json({
        status: errors.INVALID_INPUT,
        message: '邮箱本地部分、密码和显示名称不能为空'
      })
    }

    const result = await mailcowService.createMailbox(localPart, password, name, quota)

    if (result.success) {
      res.json({
        status: errors.SUCCESS,
        message: '邮箱创建成功',
        data: result
      })
    } else {
      res.json({
        status: errors.OPERATION_FAILED,
        message: `邮箱创建失败: ${result.error}`,
        data: result
      })
    }

  } catch (error) {
    logger.error('创建邮箱接口错误:', error)
    res.json({
      status: errors.INTERNAL_ERROR,
      message: '服务器内部错误'
    })
  }
})

/**
 * @swagger
 * /mailcow/create-batch:
 *   post:
 *     summary: 批量创建邮箱账号
 *     tags: [Mailcow]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prefix
 *               - start
 *               - count
 *               - password
 *             properties:
 *               prefix:
 *                 type: string
 *                 description: 邮箱前缀
 *                 example: "lqq"
 *               start:
 *                 type: number
 *                 description: 起始序号
 *                 example: 1
 *               count:
 *                 type: number
 *                 description: 创建数量
 *                 example: 10
 *               password:
 *                 type: string
 *                 description: 统一密码
 *               quota:
 *                 type: number
 *                 description: 配额（MB）
 *                 default: 1024
 *     responses:
 *       200:
 *         description: 批量创建结果
 */
router.post('/create-batch', async (req, res) => {
  try {
    const { prefix, start, count, password, quota = 1024 } = req.body

    // 参数验证
    if (!prefix || !start || !count || !password) {
      return res.json({
        status: errors.INVALID_INPUT,
        message: '前缀、起始序号、数量和密码不能为空'
      })
    }

    if (count > 100) {
      return res.json({
        status: errors.INVALID_INPUT,
        message: '单次批量创建数量不能超过100个'
      })
    }

    // 生成邮箱配置
    const mailboxes = mailcowService.generateSequentialMailboxes(prefix, start, count, password)
    
    // 批量创建
    const result = await mailcowService.createMailboxesBatch(mailboxes)

    res.json({
      status: errors.SUCCESS,
      message: `批量创建完成: 成功 ${result.success.length}，失败 ${result.failed.length}`,
      data: result
    })

  } catch (error) {
    logger.error('批量创建邮箱接口错误:', error)
    res.json({
      status: errors.INTERNAL_ERROR,
      message: '服务器内部错误'
    })
  }
})

/**
 * @swagger
 * /mailcow/delete-mailbox:
 *   delete:
 *     summary: 删除邮箱账号
 *     tags: [Mailcow]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 要删除的邮箱地址
 *     responses:
 *       200:
 *         description: 删除结果
 */
router.delete('/delete-mailbox', async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.json({
        status: errors.INVALID_INPUT,
        message: '邮箱地址不能为空'
      })
    }

    const result = await mailcowService.deleteMailbox(email)

    if (result.success) {
      res.json({
        status: errors.SUCCESS,
        message: '邮箱删除成功',
        data: result
      })
    } else {
      res.json({
        status: errors.OPERATION_FAILED,
        message: `邮箱删除失败: ${result.error}`,
        data: result
      })
    }

  } catch (error) {
    logger.error('删除邮箱接口错误:', error)
    res.json({
      status: errors.INTERNAL_ERROR,
      message: '服务器内部错误'
    })
  }
})

/**
 * @swagger
 * /mailcow/mailboxes:
 *   get:
 *     summary: 获取邮箱列表
 *     tags: [Mailcow]
 *     responses:
 *       200:
 *         description: 邮箱列表
 */
router.get('/mailboxes', async (req, res) => {
  try {
    const result = await mailcowService.getMailboxes()

    if (result.success) {
      res.json({
        status: errors.SUCCESS,
        message: '获取邮箱列表成功',
        data: result.data
      })
    } else {
      res.json({
        status: errors.OPERATION_FAILED,
        message: `获取邮箱列表失败: ${result.error}`
      })
    }

  } catch (error) {
    logger.error('获取邮箱列表接口错误:', error)
    res.json({
      status: errors.INTERNAL_ERROR,
      message: '服务器内部错误'
    })
  }
})

/**
 * @swagger
 * /mailcow/change-password:
 *   put:
 *     summary: 修改邮箱密码
 *     tags: [Mailcow]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 邮箱地址
 *               newPassword:
 *                 type: string
 *                 description: 新密码
 *     responses:
 *       200:
 *         description: 修改结果
 */
router.put('/change-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body

    if (!email || !newPassword) {
      return res.json({
        status: errors.INVALID_INPUT,
        message: '邮箱地址和新密码不能为空'
      })
    }

    const result = await mailcowService.changeMailboxPassword(email, newPassword)

    if (result.success) {
      res.json({
        status: errors.SUCCESS,
        message: '密码修改成功',
        data: result
      })
    } else {
      res.json({
        status: errors.OPERATION_FAILED,
        message: `密码修改失败: ${result.error}`,
        data: result
      })
    }

  } catch (error) {
    logger.error('修改邮箱密码接口错误:', error)
    res.json({
      status: errors.INTERNAL_ERROR,
      message: '服务器内部错误'
    })
  }
})

/**
 * @swagger
 * /mailcow/test-connection:
 *   get:
 *     summary: 测试 Mailcow API 连接
 *     tags: [Mailcow]
 *     responses:
 *       200:
 *         description: 连接测试结果
 */
router.get('/test-connection', async (req, res) => {
  try {
    const isConnected = await mailcowService.testConnection()

    if (isConnected) {
      res.json({
        status: errors.SUCCESS,
        message: 'Mailcow API 连接正常'
      })
    } else {
      res.json({
        status: errors.OPERATION_FAILED,
        message: 'Mailcow API 连接失败'
      })
    }

  } catch (error) {
    logger.error('测试连接接口错误:', error)
    res.json({
      status: errors.INTERNAL_ERROR,
      message: '服务器内部错误'
    })
  }
})

module.exports = router
