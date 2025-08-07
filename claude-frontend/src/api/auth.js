import axios from 'axios'

// 创建axios实例 - 连接到后端 License Server
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8888',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
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

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    // 后端返回的数据结构: { status: 0, message: "成功", data: {...} }
    return response.data
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token过期，清除本地存储
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      // 使用路由跳转而不是直接修改location
      import('@/router').then(({ default: router }) => {
        router.push('/login')
      })

      // 显示提示消息
      import('element-plus').then(({ ElMessage }) => {
        ElMessage.warning('登录已过期，请重新登录')
      })
    }

    // 处理后端错误响应
    const errorData = error.response?.data
    const message = errorData?.message || error.message || '请求失败'
    return Promise.reject(new Error(message))
  }
)

// 认证相关API
export const authApi = {
  // 用户注册
  register: async (userData) => {
    const response = await api.post('/auth/register', userData)
    return response
  },

  // 用户登录 (使用邮箱登录)
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    return response
  },

  // 验证token
  verifyToken: async () => {
    const response = await api.get('/auth/verify')
    return response
  },

  // 用户登出
  logout: async () => {
    const response = await api.post('/auth/logout')
    return response
  },

  // 发送验证码
  sendVerificationCode: async (data) => {
    const response = await api.post('/auth/send-verification-code', data)
    return response
  },

  // 验证验证码
  verifyCode: async (data) => {
    const response = await api.post('/auth/verify-code', data)
    return response
  },

  // 忘记密码 - 发送重置验证码
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email })
    return response
  },

  // 重置密码
  resetPassword: async (data) => {
    const response = await api.post('/auth/reset-password', data)
    return response
  },

  // 修改密码（需要登录）
  changePassword: async (data) => {
    const response = await api.post('/auth/change-password', data)
    return response
  }
}

// 激活码相关API
export const activationApi = {
  // 激活码绑定
  bindActivationCode: async (activationCode) => {
    const response = await api.post('/activation/bind', { activationCode })
    return response
  },

  // 获取会员状态
  getMembershipStatus: async () => {
    const response = await api.get('/activation/status')
    return response
  },

  // 获取完整用户信息
  getCompleteUserInfo: async () => {
    const response = await api.get('/activation/user-info')
    return response
  },

  // 验证会员资格
  validateMembership: async () => {
    const response = await api.post('/activation/validate')
    return response
  }
}

export default api
