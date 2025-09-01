import { activationApi as api } from './apiClient'

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

export const activationApiService = {
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
