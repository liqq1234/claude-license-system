/**
 * 为现有用户生成头像的脚本
 */

const { User } = require('../src/models')
const { generateUserAvatar } = require('../src/utils/avatarGenerator')
const logger = require('../src/utils/logger')

async function generateAvatarsForExistingUsers() {
  try {
    console.log('开始为现有用户生成头像...')
    
    // 查找所有没有头像的用户
    const users = await User.findAll({
      where: {
        avatar: null
      }
    })
    
    console.log(`找到 ${users.length} 个需要生成头像的用户`)
    
    for (const user of users) {
      try {
        // 生成头像
        const avatar = generateUserAvatar({
          username: user.username,
          email: user.email
        })
        
        // 更新用户头像
        await user.update({ avatar })
        
        console.log(`✅ 用户 ${user.username} 头像生成成功: ${avatar}`)
        
      } catch (error) {
        console.error(`❌ 用户 ${user.username} 头像生成失败:`, error.message)
      }
    }
    
    console.log('头像生成完成！')
    
  } catch (error) {
    console.error('生成头像过程中发生错误:', error)
  } finally {
    process.exit(0)
  }
}

// 运行脚本
generateAvatarsForExistingUsers()
