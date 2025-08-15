import axios from 'axios'

// 创建用于Claude用户管理的axios实例 - 连接到后端License Server
const claudeUsersApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8888',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 创建用于Claude Pool的axios实例 - 连接到pool-backend
const claudePoolApi = axios.create({
  baseURL: import.meta.env.VITE_CLAUDE_POOL_API_URL || 'http://localhost:8787',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 为claudePoolApi添加请求拦截器 - 添加认证token
claudePoolApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 请求拦截器 - 添加认证token
claudeUsersApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - claudeUsersApi
claudeUsersApi.interceptors.response.use(
  (response) => {
    // 后端返回的数据结构: { status: 0, message: "成功", data: {...} }
    return response.data
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token过期，清除本地存储并跳转到登录页
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }

    // 处理后端错误响应
    const errorData = error.response?.data
    const message = errorData?.message || error.message || '请求失败'
    return Promise.reject(new Error(message))
  }
)

// 响应拦截器 - claudePoolApi
claudePoolApi.interceptors.response.use(
  (response) => {
    // pool-backend返回的数据结构可能不同，直接返回data
    return response.data
  },
  (error) => {
    console.error('Claude Pool API Error:', error)
    const message = error.response?.data?.error || error.message || 'Claude Pool请求失败'
    return Promise.reject(new Error(message))
  }
)

// Claude用户相关API
export const claudeUsersService = {
  // 获取Claude用户列表 - 从pool-backend获取
  getUserList: async () => {
    try {
      console.log('🔍 开始获取Claude用户列表...')
      console.log('🔧 环境变量检查:', {
        VITE_CLAUDE_POOL_API_URL: import.meta.env.VITE_CLAUDE_POOL_API_URL,
        claudePoolApi_baseURL: claudePoolApi.defaults.baseURL
      })
      console.log('📡 请求地址:', `${claudePoolApi.defaults.baseURL}/api/emails`)

      // 首先从pool-backend获取可用邮箱列表
      const response = await claudePoolApi.get('/api/emails')

      console.log('📥 Pool-backend响应:', response)

      if (response && response.accounts) {
        console.log('✅ 获取到账号列表:', response.accounts)

        // 将账号列表转换为用户列表格式
        const userList = response.accounts.map((account, index) => ({
          id: account.id || `claude_user_${index + 1}`,
          snowflake_id: account.id, // 保存snowflake_id，用于后续API调用
          email: account.email, // 已经是脱敏后的邮箱
          name: account.name || account.email.split('@')[0], // 使用账号昵称或邮箱前缀
          status: 'active',
          avatar: null
        }))

        console.log('🔄 转换后的用户列表:', userList)

        return {
          status: 0,
          message: '获取Claude用户列表成功',
          data: userList
        }
      } else {
        console.error('❌ 响应数据格式错误:', response)
        throw new Error('未获取到用户列表数据')
      }
    } catch (error) {
      console.error('💥 获取Claude用户列表失败:', error)
      console.error('📊 错误详情:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      })
      throw error
    }
  },

  // 请求跳转到Claude聊天界面
  requestClaudeAccess: async (accountId, accountEmail) => {
    try {
      // 首先验证用户权限（通过激活码后端）
      const authResponse = await claudeUsersApi.get('/api/claude/validate-access')

      if (authResponse.status !== 0 || !authResponse.data.hasAccess) {
        throw new Error('您的激活码已过期，请联系管理员续费或重新激活')
      }

      // 然后从pool-backend获取登录链接
      const loginResponse = await claudePoolApi.post('/api/login/random', {
        // 可以添加特定邮箱参数，如果pool-backend支持的话
        // email: accountEmail
      })

      if (loginResponse && loginResponse.login_url) {
        return {
          status: 0,
          message: '获取访问权限成功',
          data: {
            redirectUrl: loginResponse.login_url,
            accountEmail: accountEmail,
            expiresAt: authResponse.data.expiresAt
          }
        }
      } else {
        throw new Error('未获取到登录链接')
      }
    } catch (error) {
      console.error('请求Claude访问失败:', error)
      throw error
    }
  },

  // 验证用户权限（检查激活码是否过期）
  validateUserAccess: async () => {
    try {
      console.log('🔗 发送API请求到: /api/claude/validate-access')
      const response = await claudeUsersApi.get('/api/claude/validate-access')

      console.log('🔄 API原始响应:')
      console.log('- 响应对象:', response)
      console.log('- 响应JSON:', JSON.stringify(response, null, 2))
      console.log('- 响应类型:', typeof response)

      return response
    } catch (error) {
      console.error('❌ 验证用户权限失败:', error)
      console.error('- 错误类型:', typeof error)
      console.error('- 错误消息:', error.message)
      console.error('- 错误详情:', error)
      throw error
    }
  }
}

export default claudeUsersApi
