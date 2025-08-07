/**
 * 邮件服务
 * 使用 Mailcow SMTP 发送验证码邮件
 */

const nodemailer = require('nodemailer')
const logger = require('../utils/logger')
const config = require('../../config')

// 加载环境变量
require('dotenv').config()

class EmailService {
  constructor() {
    // 创建邮件传输器
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.163.com',
      port: parseInt(process.env.SMTP_PORT) || 465,
      secure: true, // SSL
      auth: {
        user: process.env.SMTP_USER || '你的163邮箱地址',
        pass: process.env.SMTP_PASS || '你的163邮箱授权码'
      },
      // 连接超时设置
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
      // QQ邮箱可能需要的额外设置
      tls: {
        rejectUnauthorized: false
      }
    })
  }

  /**
   * 生成6位数字验证码
   * @returns {string} 验证码
   */
  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  /**
   * 发送注册验证码邮件
   * @param {string} email - 收件人邮箱
   * @param {string} code - 验证码
   * @returns {Promise<boolean>} 发送结果
   */
  async sendRegistrationCode(email, code) {
    try {
      const mailOptions = {
        from: '"Claude 激活系统" <liqingquan20030522@163.com>',
        to: email,
        subject: '【Claude】注册验证码',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Claude 激活系统</h1>
              <p style="color: #f0f0f0; margin: 10px 0 0 0;">欢迎注册我们的服务</p>
            </div>
            
            <div style="background: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-bottom: 20px;">您的注册验证码</h2>
              
              <div style="background: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${code}
                </div>
              </div>
              
              <div style="margin: 30px 0;">
                <p style="color: #666; line-height: 1.6; margin-bottom: 10px;">
                  <strong>验证码有效期：</strong>10分钟
                </p>
                <p style="color: #666; line-height: 1.6; margin-bottom: 10px;">
                  请在注册页面输入此验证码完成注册。
                </p>
                <p style="color: #666; line-height: 1.6;">
                  如果您没有申请注册，请忽略此邮件。
                </p>
              </div>
              
              <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                  此邮件由系统自动发送，请勿回复。<br>
                  © 2025 Claude 激活系统. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        `,
        text: `
【Claude 激活系统】注册验证码

您的验证码是：${code}

验证码有效期：10分钟
请在注册页面输入此验证码完成注册。

如果您没有申请注册，请忽略此邮件。

此邮件由系统自动发送，请勿回复。
        `
      }

      const result = await this.transporter.sendMail(mailOptions)
      
      logger.info(`注册验证码邮件发送成功: ${email}, MessageId: ${result.messageId}`)
      return true

    } catch (error) {
      logger.error(`注册验证码邮件发送失败: ${email}`, error)
      return false
    }
  }

  /**
   * 发送密码重置验证码邮件
   * @param {string} email - 收件人邮箱
   * @param {string} code - 验证码
   * @returns {Promise<boolean>} 发送结果
   */
  async sendPasswordResetCode(email, code) {
    try {
      const mailOptions = {
        from: '"Claude 激活系统" <liqingquan20030522@163.com>',
        to: email,
        subject: '【Claude】密码重置验证码',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Claude 激活系统</h1>
              <p style="color: #f0f0f0; margin: 10px 0 0 0;">密码重置请求</p>
            </div>
            
            <div style="background: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-bottom: 20px;">密码重置验证码</h2>
              
              <div style="background: #f8f9fa; border: 2px dashed #f5576c; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                <div style="font-size: 32px; font-weight: bold; color: #f5576c; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${code}
                </div>
              </div>
              
              <div style="margin: 30px 0;">
                <p style="color: #666; line-height: 1.6; margin-bottom: 10px;">
                  <strong>验证码有效期：</strong>10分钟
                </p>
                <p style="color: #666; line-height: 1.6; margin-bottom: 10px;">
                  请在密码重置页面输入此验证码。
                </p>
                <p style="color: #e74c3c; line-height: 1.6; font-weight: bold;">
                  如果您没有申请密码重置，请立即联系我们！
                </p>
              </div>
              
              <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                  此邮件由系统自动发送，请勿回复。<br>
                  © 2025 Claude 激活系统. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        `,
        text: `
【Claude 激活系统】密码重置验证码

您的验证码是：${code}

验证码有效期：10分钟
请在密码重置页面输入此验证码。

如果您没有申请密码重置，请立即联系我们！

此邮件由系统自动发送，请勿回复。
        `
      }

      const result = await this.transporter.sendMail(mailOptions)
      
      logger.info(`密码重置验证码邮件发送成功: ${email}, MessageId: ${result.messageId}`)
      return true

    } catch (error) {
      logger.error(`密码重置验证码邮件发送失败: ${email}`, error)
      return false
    }
  }

  /**
   * 测试邮件连接
   * @returns {Promise<boolean>} 连接结果
   */
  async testConnection() {
    try {
      await this.transporter.verify()
      logger.info('邮件服务连接测试成功')
      return true
    } catch (error) {
      logger.error('邮件服务连接测试失败:', error)
      return false
    }
  }
}

module.exports = new EmailService()
