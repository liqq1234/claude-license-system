/**
 * API配置文件 - 管理多个后端服务的API地址
 */

// API端点配置
export const API_ENDPOINTS = {
  // 激活码后端（claude-backend）
  LICENSE_SERVER: {
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8888',
    timeout: 15000,
    description: '激活码验证和用户权限管理'
  },
  
  // Claude Pool后端（pool-backend）
  CLAUDE_POOL: {
    baseURL: import.meta.env.VITE_CLAUDE_POOL_API_URL || 'http://localhost:8787',
    timeout: 15000,
    description: 'Claude账号池管理和登录服务'
  }
}

// API路径配置
export const API_PATHS = {
  // 激活码后端路径
  LICENSE: {
    VALIDATE_ACCESS: '/api/claude/validate-access',
    USER_INFO: '/api/user/info',
    ACTIVATION_CODES: '/api/activation-codes',
    ADMIN: '/api/admin'
  },
  
  // Claude Pool后端路径
  CLAUDE_POOL: {
    EMAILS: '/api/emails',
    RANDOM_LOGIN: '/api/login/random',
    SPECIFIC_LOGIN: '/api/login/specific',
    ADMIN_ACCOUNTS: '/api/admin/accounts'
  }
}

// 环境检查
export const checkEnvironment = () => {
  const config = {
    licenseServer: API_ENDPOINTS.LICENSE_SERVER.baseURL,
    claudePool: API_ENDPOINTS.CLAUDE_POOL.baseURL,
    environment: import.meta.env.MODE || 'development'
  }
    
  return config
}

// 健康检查
export const healthCheck = async () => {
  const results = {
    licenseServer: false,
    claudePool: false,
    timestamp: new Date().toISOString()
  }
  
  try {
    // 检查激活码后端
    const licenseResponse = await fetch(`${API_ENDPOINTS.LICENSE_SERVER.baseURL}/status`, {
      method: 'GET',
      timeout: 5000
    })
    results.licenseServer = licenseResponse.ok
  } catch (error) {
    console.warn('激活码后端连接失败:', error.message)
  }
  
  try {
    // 检查Claude Pool后端
    const poolResponse = await fetch(`${API_ENDPOINTS.CLAUDE_POOL.baseURL}/api/status`, {
      method: 'GET',
      timeout: 5000
    })
    results.claudePool = poolResponse.ok
  } catch (error) {
    console.warn('Claude Pool后端连接失败:', error.message)
  }
  
  console.log('🏥 后端服务健康检查:', results)
  return results
}

export default {
  API_ENDPOINTS,
  API_PATHS,
  checkEnvironment,
  healthCheck
}
