import { activationApi, poolApi } from './apiClient'
import logger from '@/utils/logger'

// Claude用户相关API
export const claudeUsersService = {
  // 获取Claude用户列表 - 从pool-backend获取
  getUserList: async () => {
    try {
      logger.log('🔍 开始获取Claude用户列表...')
      // 首先从pool-backend获取可用邮箱列表
      const response = await poolApi.get('/api/emails')

      if (response && response.accounts) {
        logger.log('✅ 获取到账号列表:', response.accounts)
        // 将账号列表转换为用户列表格式
        const userList = response.accounts.map((account, index) => ({
          id: account.id || `claude_user_${index + 1}`,
          snowflake_id: account.id, // 保存snowflake_id，用于后续API调用
          email: account.email, // 已经是脱敏后的邮箱
          name: account.name || account.email.split('@')[0], // 使用账号昵称或邮箱前缀
          status: 'active',
          avatar: null
        }))
        return {
          status: 0,
          message: '获取Claude用户列表成功',
          data: userList
        }
      } else {
        logger.error('❌ 响应数据格式错误:', response)
        throw new Error('未获取到用户列表数据')
      }
    } catch (error) {
      logger.error('💥 获取Claude用户列表失败:', error)
      throw error
    }
  },

  // 请求跳转到Claude聊天界面
    requestClaudeAccess: async (accountEmail) => {
    try {
      // 首先验证用户权限（通过激活码后端）
      const authResponse = await activationApi.get('/api/claude/validate-access')

      if (authResponse.status !== 0 || !authResponse.data.hasAccess) {
        throw new Error('您的激活码已过期，请联系管理员续费或重新激活')
      }

      // 然后从pool-backend获取登录链接
      const loginResponse = await poolApi.post('/api/login/random', {})

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
      logger.error('请求Claude访问失败:', error)
      throw error
    }
  },

  // 验证用户权限（检查激活码是否过期）
  validateUserAccess: async () => {
    try {
      const response = await activationApi.get('/api/claude/validate-access')
      return response
    } catch (error) {
      logger.error('❌ 验证用户权限失败:', error)
      throw error
    }
  }
}

export default claudeUsersService
