import { activationApi } from './apiClient'
import logger from '@/utils/logger'

/**
 * 套餐管理 API
 */
export class PackagesAPI {
  
  /**
   * 获取所有套餐类型
   */
  static async getTypes() {
    try {
      const response = await activationApi.get('/api/packages/types')
      return response.data
    } catch (error) {
      logger.error('获取套餐类型失败:', error)
      throw error
    }
  }

  /**
   * 获取所有时长选项
   */
  static async getDurations() {
    try {
      const response = await activationApi.get('/api/packages/durations')
      return response.data
    } catch (error) {
      logger.error('获取时长选项失败:', error)
      throw error
    }
  }

  /**
   * 获取套餐产品列表
   * @param {number} typeId - 套餐类型ID (可选)
   */
  static async getProducts(typeId = null) {
    try {
      const params = typeId ? { type_id: typeId } : {}
      const response = await activationApi.get('/api/packages/products', { params })
      return response.data
    } catch (error) {
      logger.error('获取套餐产品失败:', error)
      throw error
    }
  }

  /**
   * 获取支付方式列表
   */
  static async getPaymentMethods() {
    try {
      const response = await activationApi.get('/api/packages/payment-methods')
      return response.data
    } catch (error) {
      logger.error('获取支付方式失败:', error)
      throw error
    }
  }

  /**
   * 获取完整的购买界面数据
   */
  static async getPurchaseData() {
    try {
      const response = await activationApi.get('/api/packages/purchase-data')
      return response.data
    } catch (error) {
      logger.error('获取购买界面数据失败:', error)
      throw error
    }
  }

  /**
   * 创建订单
   * @param {number} packageId - 套餐ID
   * @param {number} paymentMethodId - 支付方式ID
   * @param {number} userId - 用户ID (可选)
   */
  static async createOrder(packageId, paymentMethodId, userId = null) {
    try {
      const response = await activationApi.post('/api/packages/create-order', {
        package_id: packageId,
        payment_method_id: paymentMethodId,
        user_id: userId
      })
      return response.data
    } catch (error) {
      logger.error('创建订单失败:', error)
      throw error
    }
  }
}

export default PackagesAPI
