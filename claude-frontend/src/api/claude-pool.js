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
  }
}

export default claudePoolApi
