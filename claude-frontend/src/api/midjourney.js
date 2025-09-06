/**
 * Midjourney API 服务
 */

import apiClient from './apiClient'

export const midjourneyApi = {
  /**
   * 检查用户Midjourney权限
   */
  async checkPermission() {
    try {
      const response = await apiClient.get('/api/midjourney/check-permission')
      return response.data
    } catch (error) {
      console.error('检查Midjourney权限失败:', error)
      throw error
    }
  },

  /**
   * 生成Midjourney访问链接
   */
  async generateAccessUrl() {
    try {
      const response = await apiClient.post('/api/midjourney/generate-access-url')
      return response.data
    } catch (error) {
      console.error('生成Midjourney访问链接失败:', error)
      throw error
    }
  },

  /**
   * 记录Midjourney使用
   */
  async recordUsage(action = 'generate', details = {}) {
    try {
      const response = await apiClient.post('/api/midjourney/record-usage', {
        action,
        details
      })
      return response.data
    } catch (error) {
      console.error('记录Midjourney使用失败:', error)
      throw error
    }
  }
}

export default midjourneyApi
