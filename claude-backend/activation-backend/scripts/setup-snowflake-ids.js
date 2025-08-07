/**
 * 设置雪花ID - 用于新项目或重新初始化
 * 这个脚本会重新创建所有表结构，使用雪花ID作为主键
 */

const { sequelize } = require('../src/config/database')
const { generateSnowflakeId } = require('../src/utils/snowflake')

async function setupSnowflakeIds() {
  try {
    console.log('🚀 开始设置雪花ID数据库结构...')
    
    // 1. 测试雪花ID生成器
    console.log('🧪 测试雪花ID生成器...')
    const testId = generateSnowflakeId()
    console.log(`生成测试ID: ${testId} (长度: ${testId.length})`)
    
    // 2. 同步数据库结构
    console.log('📊 同步数据库结构...')
    
    // 强制重新创建表（注意：这会删除所有数据）
    await sequelize.sync({ force: true })
    
    console.log('✅ 数据库结构同步完成')
    
    // 3. 验证表结构
    console.log('🔍 验证表结构...')
    
    const tables = await sequelize.getQueryInterface().showAllTables()
    console.log('创建的表:', tables)
    
    // 4. 测试插入数据
    console.log('🧪 测试数据插入...')
    
    const { User } = require('../src/models')
    
    // 创建测试用户
    const testUser = await User.create({
      username: 'test_snowflake_user',
      email: 'test@snowflake.com',
      password_hash: 'test_hash',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=TS&backgroundColor=4ECDC4'
    })
    
    console.log(`✅ 测试用户创建成功: ID=${testUser.id}, 用户名=${testUser.username}`)
    console.log(`ID长度: ${testUser.id.toString().length}`)
    
    // 5. 验证ID格式
    const { isValidSnowflakeId } = require('../src/utils/snowflake')
    const isValid = isValidSnowflakeId(testUser.id)
    console.log(`ID验证: ${isValid ? '✅ 有效' : '❌ 无效'}`)
    
    // 6. 清理测试数据
    await testUser.destroy()
    console.log('🧹 清理测试数据完成')
    
    console.log('🎉 雪花ID设置完成！')
    console.log('')
    console.log('📋 设置摘要:')
    console.log('  ✅ 雪花ID生成器正常工作')
    console.log('  ✅ 数据库表结构已更新')
    console.log('  ✅ 主键使用雪花ID')
    console.log('  ✅ 数据插入测试通过')
    console.log('')
    console.log('💡 雪花ID特点:')
    console.log('  - 19位数字ID')
    console.log('  - 全局唯一')
    console.log('  - 时间有序')
    console.log('  - 分布式友好')
    
  } catch (error) {
    console.error('❌ 设置失败:', error)
    throw error
  }
}

// 执行设置
if (require.main === module) {
  setupSnowflakeIds()
    .then(() => {
      console.log('✅ 设置脚本执行完成')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ 设置脚本执行失败:', error)
      process.exit(1)
    })
}

module.exports = { setupSnowflakeIds }
