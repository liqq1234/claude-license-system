import axios from 'axios'

// 创建专门用于Claude Pool Manager的axios实例
const claudePoolApi = axios.create({
  baseURL: import.meta.env.VITE_CLAUDE_POOL_API_URL || 'http://localhost:3456', // Claude Pool Manager后端地址
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 响应拦截器
claudePoolApi.interceptors.response.use(
  response => response.data,
  error => {
    console.error('Claude Pool API Error:', error)
    return Promise.reject(error)
  }
)

// Claude Pool Manager相关API
export const claudePoolService = {
  // 获取可用的邮箱账户列表
  getAvailableEmails: async () => {
    const response = await claudePoolApi.get('/api/emails')
    return response
  },

  // 随机登录
  randomLogin: async (expiresIn = null) => {
    const payload = { mode: 'random' }
    if (expiresIn) {
      payload.expires_in = expiresIn
    }
    const response = await claudePoolApi.post('/api/login', payload)
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
    const response = await claudePoolApi.post('/api/login', payload)
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

  // 获取所有账户状态
  getAllAccountsStatus: async () => {
    const response = await claudePoolApi.get('/api/accounts-status')
    return response
  },

  // 获取单个账户状态
  getAccountStatus: async (email) => {
    const response = await claudePoolApi.get(`/api/account-status/${email}`)
    return response
  },

  // 记录账户使用
  recordAccountUsage: async (email, userInfo = {}) => {
    console.log('🔗 claudePoolService.recordAccountUsage 开始执行');
    console.log('📧 邮箱:', email);
    console.log('👤 用户信息:', userInfo);

    const payload = {
      user_ip: userInfo.ip || 'unknown',
      user_agent: userInfo.userAgent || navigator.userAgent
    }

    console.log('📦 请求载荷:', payload);
    console.log('🌐 请求URL:', `/api/account-usage/${email}`);

    try {
      const response = await claudePoolApi.post(`/api/account-usage/${email}`, payload)
      console.log('✅ recordAccountUsage 成功响应:', response);
      return response
    } catch (error) {
      console.error('❌ recordAccountUsage 请求失败:', error);
      console.error('❌ 错误详情:', error.response?.data || error.message);
      throw error;
    }
  }
}

export default claudePoolApi
