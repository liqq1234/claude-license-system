/**
 * API配置文件 - 管理多个后端服务的API地址
 */

// 环境检查
export const checkEnvironment = () => {
  const config = {
    licenseServer: import.meta.env.VITE_ACTIVATION_API_URL || 'http://localhost:8888',
    claudePool: import.meta.env.VITE_CLAUDE_POOL_API_URL || 'http://localhost:8787',
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
    const licenseResponse = await fetch(`${import.meta.env.VITE_ACTIVATION_API_URL || 'http://localhost:8888'}/status`, {
      method: 'GET',
      timeout: 5000
    })
    results.licenseServer = licenseResponse.ok
  } catch (error) {
    console.warn('激活码后端连接失败:', error.message)
  }

  try {
    // 检查Claude Pool后端
    const poolResponse = await fetch(`${import.meta.env.VITE_CLAUDE_POOL_API_URL || 'http://localhost:8787'}/api/status`, {
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
  checkEnvironment,
  healthCheck
}
