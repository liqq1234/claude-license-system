'use strict'
const crypto = require('crypto')
const logger = require('./logger')

class ActivationCodeGenerator {
  constructor() {
    this.generatedCodes = new Set() // 内存中跟踪已生成的码，防止短时间内重复
  }

  // 生成标准UUID v4格式激活码
  generateUUID() {
    // 优先使用Node.js内置方法
    if (crypto.randomUUID) {
      return crypto.randomUUID().toUpperCase()
    }
    
    // 备选方案：手动实现UUID v4
    return this.generateUUIDManual()
  }

  // 手动生成UUID v4
  generateUUIDManual() {
    const bytes = crypto.randomBytes(16)
    
    // 设置版本位 (第7字节的高4位设为0100，表示版本4)
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    
    // 设置变体位 (第9字节的高2位设为10)
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    
    // 转换为十六进制字符串并格式化
    const hex = bytes.toString('hex').toUpperCase()
    return [
      hex.substring(0, 8),
      hex.substring(8, 12),
      hex.substring(12, 16),
      hex.substring(16, 20),
      hex.substring(20, 32)
    ].join('-')
  }

  // 验证激活码格式（支持多种格式）
  isValidUUID(code) {
    if (!code || typeof code !== 'string') {
      return false
    }

    // 移除空格并转大写
    const cleanCode = code.trim().toUpperCase()

    // 格式1: UUID v4 格式 (XXXXXXXX-XXXX-4XXX-YXXX-XXXXXXXXXXXX)
    const uuidV4Regex = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
    if (uuidV4Regex.test(cleanCode)) {
      return true
    }

    // 格式2: 简化格式 (XXXX-XXXX-XXXX-XXXX)
    const simpleCodeRegex = /^[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/
    if (simpleCodeRegex.test(cleanCode)) {
      return true
    }

    // 格式3: 无连字符格式 (16位字符)
    const noHyphenRegex = /^[0-9A-Z]{16}$/
    if (noHyphenRegex.test(cleanCode)) {
      return true
    }

    return false
  }

  // 生成并验证唯一性
  async generateUniqueCode(uniquenessChecker) {
    let attempts = 0
    const maxAttempts = 50
    
    while (attempts < maxAttempts) {
      const code = this.generateUUID()
      
      // 检查内存中的临时记录
      if (this.generatedCodes.has(code)) {
        attempts++
        continue
      }
      
      // 检查数据库唯一性
      if (uniquenessChecker && !(await uniquenessChecker(code))) {
        attempts++
        continue
      }
      
      // 添加到临时记录
      this.generatedCodes.add(code)
      
      // 清理过期的临时记录（保持内存使用合理）
      if (this.generatedCodes.size > 10000) {
        this.cleanupGeneratedCodes()
      }
      
      logger.debug(`Generated unique activation code: ${code} (attempts: ${attempts + 1})`)
      return code
    }
    
    throw new Error(`Failed to generate unique activation code after ${maxAttempts} attempts`)
  }

  // 批量生成激活码
  async generateBatch(count, uniquenessChecker) {
    const codes = []
    const startTime = Date.now()
    
    logger.info(`Starting batch generation of ${count} activation codes`)
    
    for (let i = 0; i < count; i++) {
      try {
        const code = await this.generateUniqueCode(uniquenessChecker)
        codes.push(code)
        
        // 每生成100个码记录一次进度
        if ((i + 1) % 100 === 0) {
          logger.info(`Generated ${i + 1}/${count} activation codes`)
        }
      } catch (error) {
        logger.error(`Failed to generate activation code ${i + 1}/${count}: ${error.message}`)
        throw error
      }
    }
    
    const duration = Date.now() - startTime
    logger.info(`Batch generation completed: ${count} codes in ${duration}ms`)
    
    return codes
  }

  // 清理内存中的临时记录
  cleanupGeneratedCodes() {
    // 简单策略：清空一半
    const codesArray = Array.from(this.generatedCodes)
    this.generatedCodes.clear()
    
    // 保留最近生成的一半
    const keepCount = Math.floor(codesArray.length / 2)
    for (let i = codesArray.length - keepCount; i < codesArray.length; i++) {
      this.generatedCodes.add(codesArray[i])
    }
    
    logger.debug(`Cleaned up generated codes cache, kept ${keepCount} entries`)
  }

  // 格式化激活码（标准化输入）
  formatCode(code) {
    if (!code || typeof code !== 'string') {
      return null
    }

    // 移除空格、转大写
    let formatted = code.trim().toUpperCase()

    // 处理不同格式的激活码
    if (!formatted.includes('-')) {
      if (formatted.length === 32) {
        // 32位无连字符 -> UUID格式
        formatted = [
          formatted.substring(0, 8),
          formatted.substring(8, 12),
          formatted.substring(12, 16),
          formatted.substring(16, 20),
          formatted.substring(20, 32)
        ].join('-')
      } else if (formatted.length === 16) {
        // 16位无连字符 -> 简化格式
        formatted = [
          formatted.substring(0, 4),
          formatted.substring(4, 8),
          formatted.substring(8, 12),
          formatted.substring(12, 16)
        ].join('-')
      }
    }

    return this.isValidUUID(formatted) ? formatted : null
  }

  // 生成测试用的激活码（开发环境）
  generateTestCode(prefix = 'TEST') {
    const uuid = this.generateUUID()
    // 将前缀编码到UUID的前几位（仅用于测试识别）
    return uuid.replace(/^[0-9A-F]{4}/, prefix.padEnd(4, '0').substring(0, 4))
  }
}

module.exports = { ActivationCodeGenerator }