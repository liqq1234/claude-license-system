/**
 * 批量创建邮箱账号脚本
 * 使用方法: node scripts/createMailboxes.js
 */

require('dotenv').config()
const mailcowService = require('../src/services/mailcowService')
const logger = require('../src/utils/logger')

// 配置参数
const CONFIG = {
  prefix: 'lqq',           // 邮箱前缀
  start: 1,                // 起始序号
  count: 10,               // 创建数量
  password: 'SecurePass123!', // 统一密码
  quota: 1024              // 配额（MB）
}

async function createMailboxesBatch() {
  try {
    console.log('🚀 开始批量创建邮箱账号...')
    console.log(`📧 配置信息:`)
    console.log(`   前缀: ${CONFIG.prefix}`)
    console.log(`   起始序号: ${CONFIG.start}`)
    console.log(`   创建数量: ${CONFIG.count}`)
    console.log(`   密码: ${CONFIG.password}`)
    console.log(`   配额: ${CONFIG.quota}MB`)
    console.log('')

    // 1. 测试 API 连接
    console.log('🔗 测试 Mailcow API 连接...')
    const isConnected = await mailcowService.testConnection()
    
    if (!isConnected) {
      console.error('❌ Mailcow API 连接失败！请检查配置')
      process.exit(1)
    }
    
    console.log('✅ API 连接成功！')
    console.log('')

    // 2. 生成邮箱配置
    const mailboxes = mailcowService.generateSequentialMailboxes(
      CONFIG.prefix,
      CONFIG.start,
      CONFIG.count,
      CONFIG.password
    )

    console.log('📋 将要创建的邮箱:')
    mailboxes.forEach((mailbox, index) => {
      console.log(`   ${index + 1}. ${mailbox.localPart}@lqqmail.xyz (${mailbox.name})`)
    })
    console.log('')

    // 3. 确认创建
    console.log('⚠️  请确认以上信息无误，按 Ctrl+C 取消，或等待 5 秒后自动开始创建...')
    await delay(5000)

    // 4. 批量创建
    console.log('🔄 开始创建邮箱账号...')
    const result = await mailcowService.createMailboxesBatch(mailboxes)

    // 5. 显示结果
    console.log('')
    console.log('📊 创建结果统计:')
    console.log(`   总数: ${result.total}`)
    console.log(`   成功: ${result.success.length}`)
    console.log(`   失败: ${result.failed.length}`)
    console.log('')

    if (result.success.length > 0) {
      console.log('✅ 创建成功的邮箱:')
      result.success.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.email}`)
      })
      console.log('')
    }

    if (result.failed.length > 0) {
      console.log('❌ 创建失败的邮箱:')
      result.failed.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.email} - ${item.error}`)
      })
      console.log('')
    }

    // 6. 生成密码文件
    if (result.success.length > 0) {
      const passwordList = result.success.map(item => 
        `${item.email}:${CONFIG.password}`
      ).join('\n')

      const fs = require('fs')
      const filename = `mailbox-passwords-${Date.now()}.txt`
      fs.writeFileSync(filename, passwordList)
      
      console.log(`📄 密码列表已保存到: ${filename}`)
    }

    console.log('🎉 批量创建完成！')

  } catch (error) {
    console.error('❌ 批量创建过程中发生错误:', error.message)
    console.error('详细错误:', error)
  } finally {
    process.exit(0)
  }
}

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 处理 Ctrl+C 中断
process.on('SIGINT', () => {
  console.log('\n❌ 用户取消操作')
  process.exit(0)
})

// 运行脚本
createMailboxesBatch()
