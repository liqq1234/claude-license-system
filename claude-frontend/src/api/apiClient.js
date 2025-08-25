import axios from 'axios'
import logger from '@/utils/logger'

// 创建用于 activation-backend 的 axios 实例
export const activationApi = axios.create({
  baseURL: import.meta.env.VITE_ACTIVATION_API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 创建用于 pool-backend 的 axios 实例
export const poolApi = axios.create({
  baseURL: import.meta.env.VITE_CLAUDE_POOL_API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// poolApi 使用通用拦截器
poolApi.interceptors.response.use(
  response => response.data,
  error => {
    logger.error('Claude Pool API Error:', error)
    return Promise.reject(error)
  }
)

// activationApi 使用特定的拦截器来处理认证
activationApi.interceptors.request.use(
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

activationApi.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // 使用动态导入来避免循环依赖
      import('@/router').then(({ default: router }) => {
        router.push('/login')
      })
      import('element-plus').then(({ ElMessage }) => {
        ElMessage.warning('登录已过期，请重新登录')
      })
    }
    const errorData = error.response?.data
    const message = errorData?.message || error.message || '请求失败'
    logger.error('Activation API Error:', message)
    return Promise.reject(new Error(message))
  }
)

export default {
  activationApi,
  poolApi
}

