/**
 * 密码重置功能测试脚本
 * 用于排查密码重置功能的问题
 */

const axios = require('axios')

const API_BASE_URL = 'http://localhost:8888'
const TEST_EMAIL = '3477981312@qq.com'

// 测试用户是否存在
async function testUserExists() {
  console.log('\n🔍 测试1: 检查用户是否存在')
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: 'wrongpassword'  // 故意用错误密码，只是为了测试用户是否存在
    })
    
    console.log('✅ 用户存在 (即使密码错误)')
    console.log('响应:', response.data)
  } catch (error) {
    if (error.response) {
      console.log('✅ 用户存在 (登录失败但用户存在)')
      console.log('响应:', error.response.data)
    } else {
      console.log('❌ 网络错误:', error.message)
    }
  }
}

// 测试发送密码重置验证码
async function testForgotPassword() {
  console.log('\n📧 测试2: 发送密码重置验证码')
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
      email: TEST_EMAIL
    })
    
    console.log('✅ 发送成功')
    console.log('响应:', response.data)
    return response.data
  } catch (error) {
    if (error.response) {
      console.log('❌ 发送失败')
      console.log('错误响应:', error.response.data)
      console.log('状态码:', error.response.status)
    } else {
      console.log('❌ 网络错误:', error.message)
    }
    return null
  }
}

// 测试邮件服务连接
async function testEmailService() {
  console.log('\n📮 测试3: 邮件服务连接')
  try {
    // 这里我们需要直接测试邮件服务
    const emailService = require('./src/services/emailService')
    const result = await emailService.testConnection()
    
    if (result) {
      console.log('✅ 邮件服务连接正常')
    } else {
      console.log('❌ 邮件服务连接失败')
    }
    
    return result
  } catch (error) {
    console.log('❌ 邮件服务测试失败:', error.message)
    return false
  }
}

// 测试数据库连接
async function testDatabase() {
  console.log('\n🗄️ 测试4: 数据库连接')
  try {
    const { User } = require('./src/models')
    const user = await User.findOne({
      where: { email: TEST_EMAIL }
    })
    
    if (user) {
      console.log('✅ 数据库连接正常，用户存在')
      console.log('用户信息:', {
        id: user.id,
        username: user.username,
        email: user.email,
        status: user.status
      })
      return true
    } else {
      console.log('❌ 用户不存在于数据库中')
      return false
    }
  } catch (error) {
    console.log('❌ 数据库连接失败:', error.message)
    return false
  }
}

// 测试发送注册验证码（对比测试）
async function testRegistrationCode() {
  console.log('\n📝 测试5: 发送注册验证码（对比测试）')
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/send-verification-code`, {
      email: 'test@qq.com',  // 使用一个不存在的邮箱
      type: 'register'
    })
    
    console.log('✅ 注册验证码发送成功')
    console.log('响应:', response.data)
  } catch (error) {
    if (error.response) {
      console.log('❌ 注册验证码发送失败')
      console.log('错误响应:', error.response.data)
    } else {
      console.log('❌ 网络错误:', error.message)
    }
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始密码重置功能测试...')
  console.log('测试邮箱:', TEST_EMAIL)
  console.log('API地址:', API_BASE_URL)
  
  // 测试数据库连接
  const dbOk = await testDatabase()
  
  // 测试邮件服务
  const emailOk = await testEmailService()
  
  // 测试用户是否存在
  await testUserExists()
  
  // 测试注册验证码（对比）
  await testRegistrationCode()
  
  // 测试密码重置
  const resetResult = await testForgotPassword()
  
  console.log('\n📊 测试总结:')
  console.log('- 数据库连接:', dbOk ? '✅ 正常' : '❌ 异常')
  console.log('- 邮件服务:', emailOk ? '✅ 正常' : '❌ 异常')
  console.log('- 密码重置:', resetResult ? '✅ 成功' : '❌ 失败')
  
  if (!resetResult) {
    console.log('\n🔧 可能的问题:')
    if (!dbOk) console.log('- 数据库连接问题')
    if (!emailOk) console.log('- 邮件服务配置问题')
    console.log('- 检查后端日志获取更多信息')
  }
}

// 运行测试
if (require.main === module) {
  runTests().catch(console.error)
}

module.exports = {
  testUserExists,
  testForgotPassword,
  testEmailService,
  testDatabase,
  runTests
}
