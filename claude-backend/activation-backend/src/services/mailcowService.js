/**
 * Mailcow API 服务
 * 用于管理邮箱账号的创建、删除、修改等操作
 */

const axios = require('axios')
const logger = require('../utils/logger')

// 加载环境变量
require('dotenv').config()

class MailcowService {
  constructor() {
    this.apiKey = process.env.MAILCOW_API_KEY || '你的API密钥'
    this.baseUrl = process.env.MAILCOW_BASE_URL || 'https://mail.lqqmail.xyz/api/v1'
    this.domain = process.env.MAILCOW_DOMAIN || 'lqqmail.xyz'
    
    // 创建 axios 实例
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    })
  }

  /**
   * 创建单个邮箱账号
   * @param {string} localPart - 邮箱本地部分（@前面的部分）
   * @param {string} password - 邮箱密码
   * @param {string} name - 显示名称
   * @param {number} quota - 配额（MB），默认1024MB
   * @returns {Promise<Object>} 创建结果
   */
  async createMailbox(localPart, password, name, quota = 1024) {
    try {
      const response = await this.client.post('/add/mailbox', {
        domain: this.domain,
        local_part: localPart,
        name,
        password,
        quota,
        active: '1',
        force_pw_update: false
      })

      logger.info(`邮箱创建成功: ${localPart}@${this.domain}`)
      
      return {
        success: true,
        email: `${localPart}@${this.domain}`,
        data: response.data
      }

    } catch (error) {
      const errorMsg = error.response?.data?.msg || error.message
      logger.error(`邮箱创建失败: ${localPart}@${this.domain} - ${errorMsg}`)
      
      return {
        success: false,
        email: `${localPart}@${this.domain}`,
        error: errorMsg
      }
    }
  }

  /**
   * 批量创建邮箱账号
   * @param {Array} mailboxes - 邮箱配置数组
   * @param {string} mailboxes[].localPart - 邮箱本地部分
   * @param {string} mailboxes[].password - 邮箱密码
   * @param {string} mailboxes[].name - 显示名称
   * @param {number} mailboxes[].quota - 配额（可选）
   * @returns {Promise<Object>} 批量创建结果
   */
  async createMailboxesBatch(mailboxes) {
    const results = {
      success: [],
      failed: [],
      total: mailboxes.length
    }

    logger.info(`开始批量创建 ${mailboxes.length} 个邮箱账号`)

    for (const mailbox of mailboxes) {
      const result = await this.createMailbox(
        mailbox.localPart,
        mailbox.password,
        mailbox.name,
        mailbox.quota
      )

      if (result.success) {
        results.success.push(result)
      } else {
        results.failed.push(result)
      }

      // 添加延迟避免API限制
      await this.delay(100)
    }

    logger.info(`批量创建完成: 成功 ${results.success.length}，失败 ${results.failed.length}`)
    
    return results
  }

  /**
   * 生成序号邮箱配置
   * @param {string} prefix - 邮箱前缀，如 'lqq'
   * @param {number} start - 起始序号
   * @param {number} count - 创建数量
   * @param {string} password - 统一密码
   * @returns {Array} 邮箱配置数组
   */
  generateSequentialMailboxes(prefix, start, count, password) {
    const mailboxes = []
    
    for (let i = 0; i < count; i++) {
      const num = start + i
      const localPart = `${prefix}${String(num).padStart(3, '0')}`
      
      mailboxes.push({
        localPart,
        password,
        name: `${prefix}用户${num}`,
        quota: 1024
      })
    }
    
    return mailboxes
  }

  /**
   * 删除邮箱账号
   * @param {string} email - 完整邮箱地址
   * @returns {Promise<Object>} 删除结果
   */
  async deleteMailbox(email) {
    try {
      const response = await this.client.post('/delete/mailbox', [email])

      logger.info(`邮箱删除成功: ${email}`)
      
      return {
        success: true,
        email,
        data: response.data
      }

    } catch (error) {
      const errorMsg = error.response?.data?.msg || error.message
      logger.error(`邮箱删除失败: ${email} - ${errorMsg}`)
      
      return {
        success: false,
        email,
        error: errorMsg
      }
    }
  }

  /**
   * 获取邮箱列表
   * @returns {Promise<Object>} 邮箱列表
   */
  async getMailboxes() {
    try {
      const response = await this.client.get('/get/mailbox/all')
      
      return {
        success: true,
        data: response.data
      }

    } catch (error) {
      const errorMsg = error.response?.data?.msg || error.message
      logger.error(`获取邮箱列表失败: ${errorMsg}`)
      
      return {
        success: false,
        error: errorMsg
      }
    }
  }

  /**
   * 修改邮箱密码
   * @param {string} email - 邮箱地址
   * @param {string} newPassword - 新密码
   * @returns {Promise<Object>} 修改结果
   */
  async changeMailboxPassword(email, newPassword) {
    try {
      const response = await this.client.post('/edit/mailbox', {
        items: [email],
        attr: {
          password: newPassword
        }
      })

      logger.info(`邮箱密码修改成功: ${email}`)
      
      return {
        success: true,
        email,
        data: response.data
      }

    } catch (error) {
      const errorMsg = error.response?.data?.msg || error.message
      logger.error(`邮箱密码修改失败: ${email} - ${errorMsg}`)
      
      return {
        success: false,
        email,
        error: errorMsg
      }
    }
  }

  /**
   * 测试 API 连接
   * @returns {Promise<boolean>} 连接结果
   */
  async testConnection() {
    try {
      await this.client.get('/get/status/containers')
      logger.info('Mailcow API 连接测试成功')
      return true
    } catch (error) {
      logger.error('Mailcow API 连接测试失败:', error.message)
      return false
    }
  }

  /**
   * 延迟函数
   * @param {number} ms - 延迟毫秒数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

module.exports = new MailcowService()
