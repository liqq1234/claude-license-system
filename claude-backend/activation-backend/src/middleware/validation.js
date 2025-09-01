/**
 * 请求验证中间件
 */

const { validationResult } = require('express-validator')
const logger = require('../utils/logger')

/**
 * 验证请求参数
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req)
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }))

    logger.warn('请求参数验证失败:', {
      url: req.url,
      method: req.method,
      errors: errorMessages,
      body: req.body,
      query: req.query
    })

    return res.status(400).json({
      status: 400,
      message: '请求参数验证失败',
      errors: errorMessages
    })
  }

  next()
}

/**
 * 验证UUID格式
 */
const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * 验证邮箱格式
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 验证激活码格式
 */
const isValidActivationCode = (code) => {
  // 激活码格式：XXXX-XXXX-XXXX (12位字符，每4位用-分隔)
  const codeRegex = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/
  return codeRegex.test(code)
}

/**
 * 验证密码强度
 */
const isStrongPassword = (password) => {
  // 至少8位，包含大小写字母、数字
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
  return passwordRegex.test(password)
}

/**
 * 验证用户名格式
 */
const isValidUsername = (username) => {
  // 3-20位，只能包含字母、数字、下划线
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  return usernameRegex.test(username)
}

/**
 * 清理和验证输入数据
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return input
  }
  
  // 移除前后空格
  input = input.trim()
  
  // 转义HTML特殊字符
  input = input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
  
  return input
}

/**
 * 验证分页参数
 */
const validatePagination = (req, res, next) => {
  const { page = 1, limit = 20 } = req.query
  
  const pageNum = parseInt(page)
  const limitNum = parseInt(limit)
  
  if (isNaN(pageNum) || pageNum < 1) {
    return res.status(400).json({
      status: 400,
      message: '页码必须是大于0的整数'
    })
  }
  
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return res.status(400).json({
      status: 400,
      message: '每页数量必须在1-100之间'
    })
  }
  
  req.pagination = {
    page: pageNum,
    limit: limitNum,
    offset: (pageNum - 1) * limitNum
  }
  
  next()
}

/**
 * 验证日期范围
 */
const validateDateRange = (req, res, next) => {
  const { startDate, endDate } = req.query
  
  if (startDate) {
    const start = new Date(startDate)
    if (isNaN(start.getTime())) {
      return res.status(400).json({
        status: 400,
        message: '开始日期格式无效'
      })
    }
    req.dateRange = { ...req.dateRange, startDate: start }
  }
  
  if (endDate) {
    const end = new Date(endDate)
    if (isNaN(end.getTime())) {
      return res.status(400).json({
        status: 400,
        message: '结束日期格式无效'
      })
    }
    req.dateRange = { ...req.dateRange, endDate: end }
  }
  
  if (req.dateRange && req.dateRange.startDate && req.dateRange.endDate) {
    if (req.dateRange.startDate > req.dateRange.endDate) {
      return res.status(400).json({
        status: 400,
        message: '开始日期不能晚于结束日期'
      })
    }
  }
  
  next()
}

/**
 * 验证服务类型
 */
const validateServiceType = (serviceType) => {
  const validTypes = ['gamma', 'figma', 'canva', 'premium']
  return validTypes.includes(serviceType)
}

/**
 * 验证状态值
 */
const validateStatus = (status, validStatuses) => {
  return validStatuses.includes(status)
}

/**
 * 通用验证器工厂
 */
const createValidator = (validationRules) => {
  return (req, res, next) => {
    const errors = []
    
    for (const rule of validationRules) {
      const { field, validator, message, required = false } = rule
      const value = req.body[field] || req.query[field] || req.params[field]
      
      if (required && (value === undefined || value === null || value === '')) {
        errors.push({ field, message: `${field} 是必填项` })
        continue
      }
      
      if (value !== undefined && value !== null && value !== '') {
        if (!validator(value)) {
          errors.push({ field, message, value })
        }
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        status: 400,
        message: '参数验证失败',
        errors
      })
    }
    
    next()
  }
}

module.exports = {
  validateRequest,
  isValidUUID,
  isValidEmail,
  isValidActivationCode,
  isStrongPassword,
  isValidUsername,
  sanitizeInput,
  validatePagination,
  validateDateRange,
  validateServiceType,
  validateStatus,
  createValidator
}
