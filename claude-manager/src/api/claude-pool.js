import axios from 'axios'

// 创建专门用于Claude Pool Manager的axios实例
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_CLAUDE_POOL_API_URL || 'http://localhost:3457', // Claude Pool Manager后端地址
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 响应拦截器
apiClient.interceptors.response.use(
  response => response.data,
  error => {
    console.error('Claude Pool API Error:', error)
    return Promise.reject(error)
  }
)

// Claude Pool Manager相关API
export const claudePoolApi = {
  // 管理员认证（无需密码）
  adminLogin: async () => {
    const response = await apiClient.post('/api/admin/list', {
      admin_password: 'admin123' // 固定密码
    })
    return response
  },

  // 获取账户列表
  getAccountList: async (adminPassword) => {
    const response = await apiClient.post('/api/admin/list', {
      admin_password: adminPassword
    })
    return response
  },

  // 添加账户
  addAccount: async (adminPassword, email, sk) => {
    const response = await apiClient.post('/api/admin/add', {
      admin_password: adminPassword,
      email: email,
      sk: sk
    })
    return response
  },

  // 更新账户
  updateAccount: async (adminPassword, email, newEmail, newSk) => {
    const payload = {
      admin_password: adminPassword,
      email: email
    }
    if (newEmail) payload.new_email = newEmail
    if (newSk) payload.new_sk = newSk

    const response = await apiClient.post('/api/admin/update', payload)
    return response
  },

  // 删除账户
  deleteAccount: async (adminPassword, email) => {
    const response = await apiClient.post('/api/admin/delete', {
      admin_password: adminPassword,
      email: email
    })
    return response
  },

  // 批量操作
  batchOperation: async (adminPassword, actions) => {
    const response = await apiClient.post('/api/admin/batch', {
      admin_password: adminPassword,
      actions: actions
    })
    return response
  },

  // 获取可用邮箱列表
  getAvailableEmails: async () => {
    const response = await apiClient.get('/api/emails')
    return response
  },

  // 随机登录
  randomLogin: async (expiresIn = null) => {
    const payload = { mode: 'random' }
    if (expiresIn) {
      payload.expires_in = expiresIn
    }
    const response = await apiClient.post('/api/login', payload)
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
    const response = await apiClient.post('/api/login', payload)
    return response
  },

  // 管理员登录（无限制）
  adminSpecificLogin: async (adminPassword, email, uniqueName, expiresIn = null) => {
    const payload = {
      admin_password: adminPassword,
      mode: 'specific',
      email: email,
      unique_name: uniqueName
    }
    if (expiresIn) {
      payload.expires_in = expiresIn
    }
    const response = await apiClient.post('/api/admin/login', payload)
    return response
  },

  // 生成随机ID
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
