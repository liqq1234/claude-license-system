'use strict'
//运维操作工具，负责管理员日常操作！
const { ActivationManager } = require('./services/activation')
const { LicenseKey } = require('./models/license')
const config = require('../config')

// 修复 DAL 初始化
let dal = null
let activationManager = null

// 初始化 DAL 和 ActivationManager
async function initializeDAL() {
  if (!config.stateless && !dal) {
    try {
      console.log('🔄 正在连接 Redis...')
      console.log(`📡 连接地址: ${config.redis || 'redis://localhost:6379'}`)
      
      dal = require('redis-async-wrapper')
      
      // 添加连接选项
      const redisOptions = {
        url: config.redis || 'redis://localhost:6379',
        keyPrefix: config.name,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        connectTimeout: 10000,
        lazyConnect: true
      }
      
      await dal.init(redisOptions)
      
      // 测试连接
      await dal.ping()
      console.log('✅ Redis 连接已建立')
      
    } catch (error) {
      console.error('❌ Redis 连接失败:', error.message)
      console.error('详细错误:', error.stack)
      
      // 提供详细的错误诊断
      if (error.code === 'ECONNREFUSED') {
        console.log('💡 可能的解决方案:')
        console.log('   1. 检查 Redis 服务是否启动: redis-server')
        console.log('   2. 检查端口 6379 是否被占用')
        console.log('   3. 检查防火墙设置')
      } else if (error.code === 'ENOTFOUND') {
        console.log('💡 可能的解决方案:')
        console.log('   1. 检查 Redis 主机地址是否正确')
        console.log('   2. 检查网络连接')
      }
      
      dal = null
    }
  }
  
  // 重新创建 ActivationManager
  activationManager = new ActivationManager(dal)
  return dal !== null
}

const readline = require('readline')

// 创建交互式输入接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// 询问用户确认的函数
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase().trim())
    })
  })
}

// 检查 Redis 连接状态
async function checkRedisConnection() {
  if (config.stateless) {
    return { connected: false, reason: '无状态模式' }
  }
  
  try {
    console.log('🔍 检查 Redis 连接...')
    
    if (!dal) {
      console.log('📡 初始化 Redis 连接...')
      dal = require('redis-async-wrapper')
      
      const redisOptions = {
        url: config.redis || 'redis://localhost:6379',
        keyPrefix: config.name,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        connectTimeout: 5000,
        lazyConnect: true
      }
      
      await dal.init(redisOptions)
    }
    
    // 测试连接 - 修复 ping 方法调用
    let result
    if (dal.redis && typeof dal.redis.ping === 'function') {
      result = await dal.redis.ping()
    } else if (typeof dal.ping === 'function') {
      result = await dal.ping()
    } else {
      // 使用 set/get 测试连接
      const testKey = `${config.name}:connection_test`
      if (dal.redis && typeof dal.redis.set === 'function') {
        await dal.redis.set(testKey, 'test', 'EX', 1)
        result = await dal.redis.get(testKey)
      } else if (typeof dal.set === 'function') {
        await dal.set(testKey, 'test')
        result = await dal.get(testKey)
      } else {
        throw new Error('Redis 客户端方法不可用')
      }
    }
    
    console.log('✅ Redis 响应:', result || 'OK')
    
    return { connected: true }
  } catch (error) {
    console.error('❌ Redis 连接测试失败:', error.message)
    
    // 详细错误分析
    let reason = error.message
    if (error.code === 'ECONNREFUSED') {
      reason = 'Redis 服务未启动或端口被拒绝'
    } else if (error.code === 'ENOTFOUND') {
      reason = 'Redis 主机地址无法解析'
    } else if (error.code === 'ETIMEDOUT') {
      reason = 'Redis 连接超时'
    }
    
    return { connected: false, reason, code: error.code }
  }
}

// 显示存储选项菜单
async function showStorageOptions() {
  console.log('\n📋 存储选项:')
  console.log('1. 存储到 Redis (推荐)')
  console.log('2. 仅生成不存储')
  console.log('3. 检查 Redis 连接状态')
  console.log('4. 取消操作')
  
  const choice = await askQuestion('请选择 (1-4): ')
  return choice
}

// 生成激活码（修复版本）
async function generateActivationCodes(options = {}) {
  const {
    type = 'daily',
    duration = 24,
    maxDevices = 1,
    batchSize = 10,
    description = '批量生成的激活码'
  } = options

  try {
    console.log(`\n🔄 准备生成 ${batchSize} 个激活码`)
    console.log(`📋 类型: ${type} (${duration}小时)`)
    console.log(`📱 最大设备数: ${maxDevices}`)
    
    // 询问是否存储到 Redis
    const shouldStore = await askQuestion('\n❓ 是否将激活码存储到 Redis？(y/n): ')
    
    if (shouldStore === 'y' || shouldStore === 'yes') {
      // 检查 Redis 连接
      const redisStatus = await checkRedisConnection()
      
      if (!redisStatus.connected) {
        console.log(`❌ Redis 连接失败: ${redisStatus.reason}`)
        
        // 尝试管理 Redis 服务
        const serviceStarted = await manageRedisService()
        
        if (!serviceStarted) {
          console.log('❌ Redis 服务启动失败，无法存储激活码')
          const continueWithoutRedis = await askQuestion('是否继续生成（不存储）？(y/n): ')
          
          if (continueWithoutRedis !== 'y' && continueWithoutRedis !== 'yes') {
            console.log('❌ 操作已取消')
            rl.close()
            return
          }
          
          // 继续生成但不存储
          await generateCodesOnly({ batchSize, type })
          rl.close()
          return
        }
      }
      
      // 初始化 DAL 连接
      const dalInitialized = await initializeDAL()
      
      if (!dalInitialized) {
        console.log('❌ Redis 连接失败，无法存储激活码')
        const continueWithoutRedis = await askQuestion('是否继续生成（不存储）？(y/n): ')
        
        if (continueWithoutRedis !== 'y' && continueWithoutRedis !== 'yes') {
          console.log('❌ 操作已取消')
          rl.close()
          return
        }
        
        // 继续生成但不存储
        await generateCodesOnly({ batchSize, type })
        rl.close()
        return
      }
      
      // 临时修改配置以启用存储
      const originalStateless = config.stateless
      config.stateless = false
      
      try {
        // 生成并存储到 Redis
        const result = await activationManager.generateActivationCode({
          type,
          duration,
          maxDevices,
          batchSize,
          description,
          createdBy: 'admin-tool'
        })
        
        console.log(`\n✅ 成功生成并存储 ${batchSize} 个激活码到 Redis`)
        console.log(`📦 批次ID: ${result.batchId}`)
        console.log(`💾 存储位置: Redis`)
        
        console.log('\n🔑 激活码列表:')
        result.codes.forEach((code, index) => {
          console.log(`${index + 1}. ${code}`)
        })
        
        // 询问是否查看详细信息
        const showDetails = await askQuestion('\n❓ 是否查看其中一个激活码的详细信息？(y/n): ')
        
        if (showDetails === 'y' || showDetails === 'yes') {
          const firstCode = result.codes[0]
          console.log(`\n🔍 查看激活码详情: ${firstCode}`)
          await queryActivationCode(firstCode)
        }
        
      } finally {
        // 恢复原始配置
        config.stateless = originalStateless
      }
      
    } else {
      // 仅生成不存储
      await generateCodesOnly({ batchSize, type })
    }
    
    rl.close()
    
  } catch (error) {
    console.error('❌ 生成激活码失败:', error.message)
    console.error('详细错误:', error.stack)
    rl.close()
    throw error
  }
}

// 生成传统许可证密钥（内部工具使用）
async function generateLicenseKey(options = {}) {
  try {
    const result = await LicenseKey.issue({
      persist: false,
      startDate: Date.now(),
      endDate: Date.now() + (options.days || 30) * 24 * 60 * 60 * 1000,
      ...options
    })
    
    console.log('\n🔐 生成的许可证密钥:')
    console.log(result.key)
    
    return result
  } catch (error) {
    console.error('❌ 生成许可证密钥失败:', error.message)
    throw error
  }
}

// 查询激活码信息（修复版本）
async function queryActivationCode(code) {
  if (config.stateless) {
    console.log('⚠️  无状态模式下无法查询激活码详情')
    return
  }

  try {
    // 确保有 activationManager
    if (!activationManager) {
      await initializeDAL()
    }
    
    const isValid = activationManager.codeGenerator.isValidUUID(code)
    console.log(`\n🔍 激活码: ${code}`)
    console.log(`✅ 格式有效: ${isValid}`)
    
    if (isValid && dal) {
      try {
        let codeData = null
        
        // 尝试多种方式查询
        if (activationManager.ActivationCode && typeof activationManager.ActivationCode.hgetall === 'function') {
          codeData = await activationManager.ActivationCode.hgetall([code])
        } else if (dal.redis && typeof dal.redis.hgetall === 'function') {
          const key = `${config.name}:ActivationCode:${code}`
          codeData = await dal.redis.hgetall(key)
        } else if (typeof dal.hgetall === 'function') {
          const key = `ActivationCode:${code}`
          codeData = await dal.hgetall(key)
        }
        
        if (codeData && Object.keys(codeData).length > 0) {
          console.log('📊 激活码信息:')
          console.log(`   状态: ${codeData.status}`)
          console.log(`   类型: ${codeData.type}`)
          console.log(`   已用/总数: ${codeData.usedCount}/${codeData.maxDevices}`)
          
          if (codeData.createdAt && codeData.createdAt !== 'null') {
            console.log(`   创建时间: ${new Date(parseInt(codeData.createdAt)).toLocaleString()}`)
          }
          
          if (codeData.expiresAt && codeData.expiresAt !== 'null') {
            const expiryDate = new Date(parseInt(codeData.expiresAt))
            const isExpired = Date.now() > parseInt(codeData.expiresAt)
            console.log(`   过期时间: ${expiryDate.toLocaleString()} ${isExpired ? '(已过期)' : '(有效)'}`)
          } else {
            console.log(`   过期时间: 永久有效`)
          }
          
          if (codeData.description) {
            console.log(`   描述: ${codeData.description}`)
          }
          
          if (codeData.batchId) {
            console.log(`   批次ID: ${codeData.batchId}`)
          }
          
          if (codeData.permissions && codeData.permissions !== '[]') {
            try {
              const permissions = JSON.parse(codeData.permissions)
              console.log(`   权限: ${permissions.join(', ')}`)
            } catch (e) {
              console.log(`   权限: ${codeData.permissions}`)
            }
          }
          
          if (codeData.priority) {
            console.log(`   优先级: ${codeData.priority}`)
          }
          
          if (codeData.createdBy) {
            console.log(`   创建者: ${codeData.createdBy}`)
          }
          
          if (codeData.lastUsedAt && codeData.lastUsedAt !== 'null') {
            console.log(`   最后使用: ${new Date(parseInt(codeData.lastUsedAt)).toLocaleString()}`)
          }
          
          // 查询绑定的设备
          console.log('\n🔍 查询绑定设备...')
          await queryBoundDevices(code)
          
        } else {
          console.log('❌ 激活码不存在或数据为空')
          
          // 尝试查看所有相关键
          console.log('\n🔍 查看相关键...')
          try {
            let keys = []
            if (dal.redis && typeof dal.redis.keys === 'function') {
              keys = await dal.redis.keys(`*ActivationCode*`)
            } else if (typeof dal.keys === 'function') {
              keys = await dal.keys(`*ActivationCode*`)
            }
            
            console.log(`📋 找到 ${keys.length} 个激活码相关键:`)
            keys.slice(0, 10).forEach((key, index) => {
              console.log(`   ${index + 1}. ${key}`)
            })
            
            if (keys.length > 10) {
              console.log(`   ... 还有 ${keys.length - 10} 个键`)
            }
          } catch (error) {
            console.log('❌ 查询相关键失败:', error.message)
          }
        }
        
      } catch (error) {
        console.log(`❌ 查询Redis失败: ${error.message}`)
        console.log('💡 尝试使用 redis-cli 手动查询:')
        console.log(`   redis-cli hgetall "${config.name}:ActivationCode:${code}"`)
        console.log(`   redis-cli hgetall "ActivationCode:${code}"`)
      }
    }
  } catch (error) {
    console.error('❌ 查询失败:', error.message)
  }
}

// 查询绑定设备
async function queryBoundDevices(activationCode) {
  try {
    if (!dal) return
    
    let deviceKeys = []
    
    // 查找所有设备绑定键
    if (dal.redis && typeof dal.redis.keys === 'function') {
      deviceKeys = await dal.redis.keys(`*DeviceBinding*`)
    } else if (typeof dal.keys === 'function') {
      deviceKeys = await dal.keys(`*DeviceBinding*`)
    }
    
    const boundDevices = []
    
    for (const key of deviceKeys) {
      try {
        let deviceData = null
        
        if (dal.redis && typeof dal.redis.hgetall === 'function') {
          deviceData = await dal.redis.hgetall(key)
        } else if (typeof dal.hgetall === 'function') {
          deviceData = await dal.hgetall(key)
        }
        
        if (deviceData && deviceData.activationCode === activationCode) {
          boundDevices.push({
            deviceId: deviceData.deviceId,
            status: deviceData.status,
            activatedAt: deviceData.activatedAt,
            lastAccessAt: deviceData.lastAccessAt,
            ipAddress: deviceData.ipAddress
          })
        }
      } catch (error) {
        // 忽略单个设备查询错误
      }
    }
    
    if (boundDevices.length > 0) {
      console.log(`📱 绑定设备 (${boundDevices.length}个):`)
      boundDevices.forEach((device, index) => {
        console.log(`   ${index + 1}. 设备ID: ${device.deviceId}`)
        console.log(`      状态: ${device.status}`)
        if (device.activatedAt && device.activatedAt !== 'null') {
          console.log(`      激活时间: ${new Date(parseInt(device.activatedAt)).toLocaleString()}`)
        }
        if (device.lastAccessAt && device.lastAccessAt !== 'null') {
          console.log(`      最后访问: ${new Date(parseInt(device.lastAccessAt)).toLocaleString()}`)
        }
        if (device.ipAddress) {
          console.log(`      IP地址: ${device.ipAddress}`)
        }
        console.log('')
      })
    } else {
      console.log('📱 未找到绑定设备')
    }
    
  } catch (error) {
    console.log('❌ 查询绑定设备失败:', error.message)
  }
}

// 增强的命令行参数处理
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  // 确保 activationManager 初始化
  if (!activationManager) {
    activationManager = new ActivationManager(null)
  }

  switch (command) {
    case 'generate':
    case 'gen':
      const batchSize = parseInt(args[1]) || 10
      const type = args[2] || 'daily'
      
      console.log('🚀 激活码生成工具')
      console.log('='.repeat(50))
      
      // 检查 Redis 连接
      const redisStatus = await checkRedisConnection()
      console.log(`📡 Redis 状态: ${redisStatus.connected ? '✅ 已连接' : '❌ 未连接'}`)
      if (!redisStatus.connected) {
        console.log(`   原因: ${redisStatus.reason}`)
      }
      
      await generateActivationCodes({ batchSize, type })
      break
      
    case 'interactive':
    case 'i':
      await interactiveMode()
      break
      
    case 'redis-test':
      await testRedisConnection()
      break
      
    case 'redis-start':
      await manageRedisService()
      break
      
    case 'license':
      const days = parseInt(args[1]) || 30
      await generateLicenseKey({ days })
      break
      
    case 'query':
      const code = args[1]
      if (!code) {
        console.log('❌ 请提供激活码')
        return
      }
      await queryActivationCode(code)
      break
      
    case 'keys':
      const pattern = args[1] || `${config.name}:ActivationCode:*`
      await queryRedisKeys(pattern)
      break
      
    case 'view':
      const key = args[1]
      if (!key) {
        console.log('❌ 请提供 Redis 键名')
        return
      }
      await viewRedisKey(key)
      break
      
    case 'help':
    default:
      console.log(`
📋 管理员工具使用说明:

🔑 生成激活码 (交互式):
   node src/ops.js interactive
   node src/ops.js i

🔑 快速生成激活码:
   node src/ops.js generate [数量] [类型]
   node src/ops.js gen 5 weekly

🔍 查询激活码:
   node src/ops.js query [激活码]

🔧 测试 Redis 连接:
   node src/ops.js redis-test

🚀 启动 Redis 服务:
   node src/ops.js redis-start

🔐 生成许可证密钥:
   node src/ops.js license [天数]

🗝️  查询 Redis 键:
   node src/ops.js keys [模式]

👁️  查看 Redis 键内容:
   node src/ops.js view [键名]

❓ 显示帮助:
   node src/ops.js help
`)
      break
  }
}

// 交互式模式
async function interactiveMode() {
  console.log('\n🎯 交互式激活码生成器')
  console.log('='.repeat(40))
  
  try {
    // 获取生成参数
    const batchSizeInput = await askQuestion('📊 生成数量 (默认 10): ')
    const batchSize = parseInt(batchSizeInput) || 10
    
    const typeInput = await askQuestion('📅 激活码类型 (daily/weekly/monthly/yearly/permanent, 默认 daily): ')
    const type = typeInput || 'daily'
    
    const descInput = await askQuestion('📝 描述信息 (可选): ')
    const description = descInput || '交互式生成的激活码'
    
    // 显示存储选项
    const storageChoice = await showStorageOptions()
    
    switch (storageChoice) {
      case '1':
        // 存储到 Redis
        await generateActivationCodes({ batchSize, type, description })
        break
        
      case '2':
        // 仅生成
        console.log('\n🔄 仅生成激活码（不存储）...')
        await generateCodesOnly({ batchSize, type })
        break
        
      case '3':
        // 检查连接
        await testRedisConnection()
        await interactiveMode() // 重新显示菜单
        break
        
      case '4':
        console.log('❌ 操作已取消')
        break
        
      default:
        console.log('❌ 无效选择')
        await interactiveMode()
    }
    
  } catch (error) {
    console.error('❌ 交互式模式出错:', error.message)
  } finally {
    rl.close()
  }
}

// 仅生成激活码（不存储）
async function generateCodesOnly(options) {
  const { batchSize, type } = options
  
  console.log('\n🔄 生成激活码（不存储到 Redis）...')
  
  // 确保有 activationManager
  if (!activationManager) {
    activationManager = new ActivationManager(null)
  }
  
  const codes = []
  for (let i = 0; i < batchSize; i++) {
    const code = activationManager.codeGenerator.generateUUID()
    codes.push(code)
  }
  
  console.log(`\n✅ 成功生成 ${batchSize} 个 ${type} 激活码（仅内存）`)
  console.log(`💾 存储位置: 无（临时生成）`)
  
  console.log('\n🔑 激活码列表:')
  codes.forEach((code, index) => {
    console.log(`${index + 1}. ${code}`)
  })
  
  const saveToFile = await askQuestion('\n💾 是否保存到文件？(y/n): ')
  if (saveToFile === 'y' || saveToFile === 'yes') {
    await saveCodestoFile(codes, type)
  }
  
  return { codes }
}

// 保存到文件
async function saveCodestoFile(codes, type) {
  const fs = require('fs')
  const filename = `activation-codes-${type}-${Date.now()}.txt`
  
  const content = [
    `# 激活码列表 - ${type}`,
    `# 生成时间: ${new Date().toLocaleString()}`,
    `# 总数量: ${codes.length}`,
    '',
    ...codes
  ].join('\n')
  
  fs.writeFileSync(filename, content)
  console.log(`✅ 已保存到文件: ${filename}`)
}

// 测试 Redis 连接
async function testRedisConnection() {
  console.log('\n🔍 测试 Redis 连接...')
  
  const status = await checkRedisConnection()
  
  if (status.connected) {
    console.log('✅ Redis 连接正常')
    
    try {
      const keyCount = await dal.dbsize()
      console.log(`📊 数据库大小: ${keyCount} 个键`)
      
      const activationKeys = await dal.keys('ActivationCode:*')
      console.log(`🔑 激活码数量: ${activationKeys.length}`)
      
    } catch (error) {
      console.log(`⚠️  获取统计信息失败: ${error.message}`)
    }
  } else {
    console.log(`❌ Redis 连接失败: ${status.reason}`)
    console.log('💡 请检查:')
    console.log('   1. Redis 服务是否启动')
    console.log('   2. 连接地址是否正确')
    console.log('   3. 网络是否可达')
  }
}

// Redis 服务管理
async function manageRedisService() {
  console.log('\n🔧 Redis 服务管理')
  console.log('='.repeat(30))
  
  const os = require('os')
  const { exec } = require('child_process')
  const util = require('util')
  const execAsync = util.promisify(exec)
  
  try {
    if (os.platform() === 'win32') {
      // Windows 平台
      console.log('🖥️  检测到 Windows 系统')
      
      try {
        const { stdout } = await execAsync('tasklist | findstr redis')
        if (stdout.includes('redis')) {
          console.log('✅ Redis 服务正在运行')
          return true
        }
      } catch (error) {
        console.log('❌ Redis 服务未运行')
      }
      
      // 尝试启动 Redis
      const startRedis = await askQuestion('❓ 是否尝试启动 Redis 服务？(y/n): ')
      if (startRedis === 'y' || startRedis === 'yes') {
        console.log('🚀 正在启动 Redis...')
        try {
          exec('redis-server', { detached: true })
          console.log('✅ Redis 启动命令已执行')
          
          // 等待几秒让 Redis 启动
          await new Promise(resolve => setTimeout(resolve, 3000))
          
          // 再次检查
          const status = await checkRedisConnection()
          return status.connected
        } catch (error) {
          console.log('❌ 启动 Redis 失败:', error.message)
          console.log('💡 请手动启动 Redis: redis-server')
        }
      }
      
    } else {
      // Linux/Mac 平台
      console.log('🐧 检测到 Unix 系统')
      
      try {
        const { stdout } = await execAsync('ps aux | grep redis-server | grep -v grep')
        if (stdout.trim()) {
          console.log('✅ Redis 服务正在运行')
          return true
        }
      } catch (error) {
        console.log('❌ Redis 服务未运行')
      }
      
      // 尝试启动 Redis
      const startRedis = await askQuestion('❓ 是否尝试启动 Redis 服务？(y/n): ')
      if (startRedis === 'y' || startRedis === 'yes') {
        console.log('🚀 正在启动 Redis...')
        try {
          await execAsync('sudo systemctl start redis')
          console.log('✅ Redis 服务已启动')
          
          // 等待几秒让 Redis 启动
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          // 再次检查
          const status = await checkRedisConnection()
          return status.connected
        } catch (error) {
          console.log('❌ 启动 Redis 失败:', error.message)
          console.log('💡 请手动启动 Redis: sudo systemctl start redis 或 redis-server')
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Redis 服务管理出错:', error.message)
  }
  
  return false
}

// 增强的Redis键查询工具
async function queryRedisKeys(pattern = '*') {
  if (config.stateless) {
    console.log('⚠️  无状态模式下无法查询 Redis')
    return
  }

  try {
    if (!dal) {
      await initializeDAL()
    }

    if (!dal) {
      console.log('❌ Redis 连接不可用')
      return
    }

    console.log(`\n🔍 查询 Redis 键: ${pattern}`)
    
    let keys = []
    
    if (dal.redis && typeof dal.redis.keys === 'function') {
      keys = await dal.redis.keys(pattern)
    } else if (typeof dal.keys === 'function') {
      keys = await dal.keys(pattern)
    } else {
      console.log('❌ 无法访问 Redis keys 方法')
      return
    }

    console.log(`📊 找到 ${keys.length} 个键:`)
    
    if (keys.length > 0) {
      // 按类型分组显示
      const keyGroups = {
        ActivationCode: [],
        DeviceBinding: [],
        DeviceUsage: [],
        ActivationBatch: [],
        ActivationLog: [],
        BlacklistDevice: [],
        Other: []
      }
      
      keys.forEach(key => {
        if (key.includes('ActivationCode')) {
          keyGroups.ActivationCode.push(key)
        } else if (key.includes('DeviceBinding')) {
          keyGroups.DeviceBinding.push(key)
        } else if (key.includes('DeviceUsage')) {
          keyGroups.DeviceUsage.push(key)
        } else if (key.includes('ActivationBatch')) {
          keyGroups.ActivationBatch.push(key)
        } else if (key.includes('ActivationLog')) {
          keyGroups.ActivationLog.push(key)
        } else if (key.includes('BlacklistDevice')) {
          keyGroups.BlacklistDevice.push(key)
        } else {
          keyGroups.Other.push(key)
        }
      })
      
      Object.entries(keyGroups).forEach(([type, typeKeys]) => {
        if (typeKeys.length > 0) {
          console.log(`\n📂 ${type} (${typeKeys.length}个):`)
          typeKeys.slice(0, 10).forEach((key, index) => {
            console.log(`   ${index + 1}. ${key}`)
          })
          if (typeKeys.length > 10) {
            console.log(`   ... 还有 ${typeKeys.length - 10} 个键`)
          }
        }
      })
      
      // 询问是否查看具体键的内容
      const viewKey = await askQuestion('\n❓ 是否查看某个键的内容？输入键名或按回车跳过: ')
      
      if (viewKey && viewKey.trim()) {
        await viewRedisKey(viewKey.trim())
      }
    } else {
      console.log('❌ 没有找到匹配的键')
      
      // 提供一些常用的查询建议
      console.log('\n💡 尝试以下查询模式:')
      console.log('   *ActivationCode*     - 查看所有激活码')
      console.log('   *DeviceBinding*      - 查看所有设备绑定')
      console.log('   *DeviceUsage*        - 查看所有使用统计')
      console.log('   *ActivationBatch*    - 查看所有批次信息')
    }

  } catch (error) {
    console.error('❌ 查询 Redis 键失败:', error.message)
  }
}

// 增强的查看Redis键内容
async function viewRedisKey(key) {
  try {
    if (!dal) {
      console.log('❌ Redis 连接不可用')
      return
    }

    console.log(`\n🔍 查看键内容: ${key}`)
    
    let data = null
    let keyType = 'unknown'
    
    // 检测键类型
    if (dal.redis && typeof dal.redis.type === 'function') {
      keyType = await dal.redis.type(key)
    }
    
    console.log(`📋 键类型: ${keyType}`)
    
    if (keyType === 'hash') {
      // Hash 类型
      if (dal.redis && typeof dal.redis.hgetall === 'function') {
        data = await dal.redis.hgetall(key)
      } else if (typeof dal.hgetall === 'function') {
        data = await dal.hgetall(key)
      }
      
      if (data && Object.keys(data).length > 0) {
        console.log('📊 Hash 内容:')
        Object.entries(data).forEach(([field, value]) => {
          // 格式化显示
          if (field.includes('At') && !isNaN(value) && value !== 'null' && value.length > 10) {
            const date = new Date(parseInt(value))
            console.log(`   ${field}: ${value} (${date.toLocaleString()})`)
          } else if (field.includes('permissions') || field.includes('tags') || field.includes('metadata')) {
            try {
              const parsed = JSON.parse(value)
              console.log(`   ${field}: ${JSON.stringify(parsed, null, 2)}`)
            } catch (e) {
              console.log(`   ${field}: ${value}`)
            }
          } else {
            console.log(`   ${field}: ${value}`)
          }
        })
      } else {
        console.log('❌ Hash 为空')
      }
    } else if (keyType === 'list') {
      // List 类型
      let listData = []
      if (dal.redis && typeof dal.redis.lrange === 'function') {
        listData = await dal.redis.lrange(key, 0, 9) // 只显示前10个
      } else if (typeof dal.lrange === 'function') {
        listData = await dal.lrange(key, 0, 9)
      }
      
      if (listData.length > 0) {
        console.log('📋 List 内容 (前10个):')
        listData.forEach((item, index) => {
          try {
            const parsed = JSON.parse(item)
            console.log(`   ${index + 1}. ${JSON.stringify(parsed, null, 2)}`)
          } catch (e) {
            console.log(`   ${index + 1}. ${item}`)
          }
        })
      } else {
        console.log('❌ List 为空')
      }
    } else if (keyType === 'set') {
      // Set 类型
      let setData = []
      if (dal.redis && typeof dal.redis.smembers === 'function') {
        setData = await dal.redis.smembers(key)
      } else if (typeof dal.smembers === 'function') {
        setData = await dal.smembers(key)
      }
      
      if (setData.length > 0) {
        console.log('📋 Set 内容:')
        setData.forEach((item, index) => {
          console.log(`   ${index + 1}. ${item}`)
        })
      } else {
        console.log('❌ Set 为空')
      }
    } else {
      console.log('❌ 不支持的键类型或键不存在')
    }

  } catch (error) {
    console.error('❌ 查看键内容失败:', error.message)
  }
}

// 如果没有命令行参数，执行默认操作
if (process.argv.length <= 2) {
  // 确保初始化
  if (!activationManager) {
    activationManager = new ActivationManager(null)
  }
  generateActivationCodes()
} else {
  main().catch(error => {
    console.error('❌ 程序执行出错:', error.message)
    process.exit(1)
  })
}











