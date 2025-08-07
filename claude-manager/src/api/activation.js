import axios from 'axios'

const API_BASE_URL = 'http://localhost:8888/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 响应拦截器
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const activationApi = {
  // 获取统计数据
  getStats: () => api.get('/admin/stats'),

  // 获取激活码列表 - 支持分页和筛选
  getCodes: (params = {}) => api.get('/admin/codes', { params }),

  // 生成激活码
  generateCodes: (data) => api.post('/admin/generate-codes', data),

  // 暂停激活码
  suspendCode: (code, data) => api.post(`/admin/codes/${code}/suspend`, data),

  // 恢复激活码
  resumeCode: (code) => api.post(`/admin/codes/${code}/resume`),

  // 删除激活码
  deleteCode: (code) => api.delete(`/admin/codes/${code}`),

  // 获取激活码详情
  getCodeDetails: (code) => api.get(`/admin/codes/${code}`),

  // 获取图表数据
  getChartData: () => api.get('/admin/chart-data'),

  // 设备激活
  activateDevice: (data) => api.post('/activate', data),

  // 授权验证 - 只需要deviceId
  validateLicense: (data) => api.post('/validate', data)
}

