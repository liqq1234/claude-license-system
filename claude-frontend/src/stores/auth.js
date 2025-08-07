import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { authApi, activationApi } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || null)
  const loading = ref(false)
  const membership = ref(null)
  const activationHistory = ref([])
  const membershipStats = ref(null)

  // 计算属性
  const isAuthenticated = computed(() => !!token.value)
  const userInfo = computed(() => user.value)
  const membershipInfo = computed(() => membership.value)

  // 计算剩余时间（小时）
  const remainingHours = computed(() => {
    if (!membership.value?.membership_expires_at) return 0
    const now = new Date()
    const expiresAt = new Date(membership.value.membership_expires_at)
    const diffMs = expiresAt - now
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)))
  })

  // 计算剩余天数
  const remainingDays = computed(() => {
    return Math.floor(remainingHours.value / 24)
  })

  // 会员是否有效
  const isMembershipValid = computed(() => {
    if (!membership.value) return false
    const now = new Date()
    const expiresAt = new Date(membership.value.membership_expires_at)
    return expiresAt > now && membership.value.status === 'active'
  })

  // 会员状态文本
  const membershipStatusText = computed(() => {
    if (!membership.value) return '未激活'
    if (!isMembershipValid.value) return '已过期'
    if (remainingDays.value > 0) {
      return `${remainingDays.value}天${remainingHours.value % 24}小时`
    }
    return `${remainingHours.value}小时`
  })

  // 登录
  const login = async (credentials) => {
    try {
      loading.value = true
      const response = await authApi.login(credentials)

      // 检查后端响应格式: { status: 0, message: "登录成功", data: { user: {...}, token: "..." } }
      if (response.status === 0 && response.data) {
        token.value = response.data.token
        user.value = response.data.user

        // 保存到本地存储
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))

        ElMessage.success(response.message || '登录成功！')
        return { success: true }
      } else {
        throw new Error(response.message || '登录失败')
      }
    } catch (error) {
      ElMessage.error(error.message || '登录失败')
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  // 注册
  const register = async (userData) => {
    try {
      loading.value = true
      const response = await authApi.register({
        username: userData.username,
        email: userData.email,
        password: userData.password,
        verificationCode: userData.verificationCode
      })

      // 检查后端响应格式: { status: 0, message: "注册成功", data: {...} }
      if (response.status === 0) {
        ElMessage.success(response.message || '注册成功！请登录')
        return { success: true }
      } else {
        throw new Error(response.message || '注册失败')
      }
    } catch (error) {
      ElMessage.error(error.message || '注册失败')
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  // 登出
  const logout = async (showMessage = true) => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // 清除状态
      token.value = null
      user.value = null
      membership.value = null
      activationHistory.value = []
      membershipStats.value = null

      // 清除本地存储
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      if (showMessage) {
        ElMessage.success('已退出登录')
      }
    }
  }

  // 验证token
  const verifyToken = async () => {
    try {
      const response = await authApi.verifyToken()
      if (response.status === 0 && response.data) {
        user.value = response.data.user
        localStorage.setItem('user', JSON.stringify(response.data.user))
        return true
      }
      return false
    } catch (error) {
      console.error('Verify token error:', error)
      logout()
      return false
    }
  }

  // 激活码绑定
  const bindActivationCode = async (activationCode) => {
    try {
      loading.value = true
      const response = await activationApi.bindActivationCode(activationCode)

      if (response.status === 0) {
        // 更新本地状态
        if (response.data) {
          // 更新用户信息
          if (response.data.user) {
            user.value = { ...user.value, ...response.data.user }
          }

          // 更新会员信息
          if (response.data.membership) {
            membership.value = response.data.membership
          }

          // 添加到激活历史
          if (response.data.activation) {
            const newActivation = response.data.activation
            activationHistory.value = [newActivation, ...activationHistory.value]
          }
        }

        ElMessage.success(response.message || '激活码绑定成功！')

        // 绑定成功后获取最新完整信息
        await fetchCompleteUserInfo()

        return {
          success: true,
          data: response.data,
          activation: response.data?.activation,
          membership: response.data?.membership
        }
      } else {
        throw new Error(response.message || '激活码绑定失败')
      }
    } catch (error) {
      ElMessage.error(error.message || '激活码绑定失败')
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  // 获取会员状态
  const fetchMembershipStatus = async () => {
    try {
      const response = await activationApi.getMembershipStatus()
      if (response.status === 0 && response.data) {
        // 更新会员信息
        membership.value = response.data.membership || response.data

        // 如果响应包含激活历史，也更新它
        if (response.data.activations) {
          activationHistory.value = response.data.activations
        }

        return response.data
      }
      return null
    } catch (error) {
      console.error('Fetch membership status error:', error)
      return null
    }
  }

  // 获取完整用户信息
  const fetchCompleteUserInfo = async () => {
    try {
      const response = await activationApi.getCompleteUserInfo()
      if (response.status === 0 && response.data) {
        // 更新用户信息
        if (response.data.user) {
          user.value = { ...user.value, ...response.data.user }
        }
        // 更新会员信息
        if (response.data.membership) {
          membership.value = response.data.membership
        }
        // 更新激活历史
        if (response.data.activations) {
          activationHistory.value = response.data.activations
        }
        // 更新统计信息
        if (response.data.statistics) {
          membershipStats.value = response.data.statistics
        }
        return response.data
      }
      return null
    } catch (error) {
      console.error('Fetch complete user info error:', error)
      return null
    }
  }

  // 验证会员资格
  const validateMembership = async () => {
    try {
      const response = await activationApi.validateMembership()
      if (response.status === 0) {
        return { valid: true, data: response.data }
      } else {
        return { valid: false, message: response.message }
      }
    } catch (error) {
      console.error('Validate membership error:', error)
      return { valid: false, message: error.message }
    }
  }

  // 初始化用户信息
  const initAuth = async () => {
    const savedUser = localStorage.getItem('user')
    if (savedUser && token.value) {
      try {
        user.value = JSON.parse(savedUser)
        // 验证token是否仍然有效
        const isValid = await verifyToken()
        if (isValid) {
          // 初始化时获取最新会员状态
          fetchCompleteUserInfo()
        } else {
          // token无效，清除状态
          await logout(false)
        }
      } catch (error) {
        console.error('Parse saved user error:', error)
        await logout(false)
      }
    }
  }

  // 格式化时间辅助方法
  const formatDateTime = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  // 获取激活码类型文本
  const getActivationTypeText = (type) => {
    const types = {
      daily: '日卡',
      weekly: '周卡',
      monthly: '月卡',
      yearly: '年卡',
      permanent: '永久'
    }
    return types[type] || type
  }

  return {
    // 状态
    user,
    token,
    loading,
    membership,
    activationHistory,
    membershipStats,

    // 计算属性
    isAuthenticated,
    userInfo,
    membershipInfo,
    remainingHours,
    remainingDays,
    isMembershipValid,
    membershipStatusText,

    // 方法
    login,
    register,
    logout,
    verifyToken,
    bindActivationCode,
    fetchMembershipStatus,
    fetchCompleteUserInfo,
    validateMembership,
    initAuth,
    formatDateTime,
    formatDate,
    getActivationTypeText
  }
})
