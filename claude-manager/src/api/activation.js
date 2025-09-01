import { activationApi as apiClient } from './apiClient';

const v1Api = (api) => ({
  // 获取统计数据
    getStats: () => api.get('/v1/admin/stats'),

  // 获取激活码列表 - 支持分页和筛选
  getCodes: (params = {}) => api.get('/v1/admin/codes', { params }),

  // 生成激活码
  generateCodes: (data) => api.post('/v1/admin/generate-codes', data),

  // 暂停激活码
  suspendCode: (code, data) => api.post(`/v1/admin/codes/${code}/suspend`, data),

  // 恢复激活码
  resumeCode: (code) => api.post(`/v1/admin/codes/${code}/resume`),

  // 删除激活码
  deleteCode: (code) => api.delete(`/v1/admin/codes/${code}`),

  // 获取激活码详情
  getCodeDetails: (code) => api.get(`/v1/admin/codes/${code}`),

  // 获取图表数据
  getChartData: () => api.get('/v1/admin/chart-data'),

  // 设备激活
  activateDevice: (data) => api.post('/v1/activate', data),

  // 授权验证 - 只需要deviceId
  validateLicense: (data) => api.post('/v1/validate', data),
});

export const activationApi = v1Api(apiClient);

