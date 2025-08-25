import { poolApi } from './apiClient'
import logger from '@/utils/logger'

// Claude Pool Manager相关API
export const claudePoolService = {
  // 获取可用的邮箱账户列表
  getAvailableEmails: async () => {
    const response = await poolApi.get('/api/emails')
    return response
  },

  // 随机登录
  randomLogin: async (expiresIn = null) => {
    const payload = { mode: 'random' }
    if (expiresIn) {
      payload.expires_in = expiresIn
    }
    const response = await poolApi.post('/api/login', payload)
    return response
  },

  // 特定账户登录
  specificLogin: async (email, uniqueName, expiresIn = null) => {
    const payload = {
      mode: 'specific',
      email: email,
      unique_name: uniqueName
    }
    if (expiresIn) {
      payload.expires_in = expiresIn
    }
    const response = await poolApi.post('/api/login', payload)
    return response
  },

  // 生成随机会话标识
  generateRandomId: () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let result = 'rand_'
    for (let i = 0; i < 15; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  },

  // 获取所有账户状态（新版本）
  getAllAccountsStatus: async () => {
    const response = await poolApi.get('/api/accounts/status')
    return response
  },

  // 获取单个账户状态（使用雪花ID）
  getAccountStatus: async (snowflakeId) => {
    logger.log('🔗 claudePoolService.getAccountStatus 开始执行');
    logger.log('🆔 雪花ID:', snowflakeId);

    const response = await poolApi.get(`/api/account-status/${snowflakeId}`)
    logger.log('✅ getAccountStatus 成功响应:', response);
    return response
  },

  // 激活账户
  activateAccount: async (accountId) => {
    logger.log('🚀 激活账户:', accountId);
    const response = await poolApi.post(`/api/accounts/${accountId}/activate`)
    logger.log('✅ 账户激活响应:', response);
    return response
  },

  // 设置账户限流状态（测试用）
  setAccountRateLimit: async (accountId, minutes = 5) => {
    logger.log('⏰ 设置账户限流:', accountId, minutes);
    const response = await poolApi.post(`/api/accounts/${accountId}/set-rate-limit`, { minutes })
    logger.log('✅ 限流设置响应:', response);
    return response
  },

  // 记录账户使用（使用雪花ID）
  recordAccountUsage: async (snowflakeId, userInfo = {}) => {
    logger.log('🔗 claudePoolService.recordAccountUsage 开始执行');
    logger.log('🆔 雪花ID:', snowflakeId);
    logger.log('👤 用户信息:', userInfo);

    const payload = {
      user_ip: userInfo.ip || 'unknown',
      user_agent: userInfo.userAgent || navigator.userAgent
    }

    logger.log('📦 请求载荷:', payload);
    logger.log('🌐 请求URL:', `/api/account-usage/${snowflakeId}`);

    try {
      const response = await poolApi.post(`/api/account-usage/${snowflakeId}`, payload)
      logger.log('✅ recordAccountUsage 成功响应:', response);
      return response
    } catch (error) {
      logger.error('❌ recordAccountUsage 请求失败:', error);
      logger.error('❌ 错误详情:', error.response?.data || error.message);
      throw error;
    }
  }
}

export default poolApi
