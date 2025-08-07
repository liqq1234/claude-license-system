/**
 * 头像生成工具
 * 为用户生成基于首字母的头像URL
 */

/**
 * 预定义的背景颜色列表
 * 使用温暖、专业的颜色
 */
const BACKGROUND_COLORS = [
  '#FF6B6B', // 珊瑚红
  '#4ECDC4', // 青绿色
  '#45B7D1', // 天蓝色
  '#96CEB4', // 薄荷绿
  '#FFEAA7', // 浅黄色
  '#DDA0DD', // 梅花色
  '#98D8C8', // 薄荷蓝
  '#F7DC6F', // 香蕉黄
  '#BB8FCE', // 淡紫色
  '#85C1E9', // 浅蓝色
  '#F8C471', // 桃色
  '#82E0AA'  // 浅绿色
]

/**
 * 获取用户名的首字母
 * @param {string} username - 用户名
 * @returns {string} 首字母（大写）
 */
function getInitials(username) {
  if (!username) return 'U'

  // 处理中文用户名
  if (/[\u4e00-\u9fff]/.test(username)) {
    return username.charAt(0).toUpperCase()
  }

  // 处理英文用户名
  const words = username.trim().split(/\s+/)
  if (words.length >= 2) {
    // 多个单词，取前两个单词的首字母
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase()
  } else {
    // 单个单词，取前两个字符或首字母
    const word = words[0]
    if (word.length >= 2) {
      return word.substring(0, 2).toUpperCase()
    } else {
      return word.charAt(0).toUpperCase()
    }
  }
}

/**
 * 根据用户名选择背景颜色
 * @param {string} username - 用户名
 * @returns {string} 背景颜色
 */
function getBackgroundColor(username) {
  if (!username) return BACKGROUND_COLORS[0]

  // 使用用户名生成稳定的哈希值
  let hash = 0
  for (let i = 0; i < username.length; i++) {
    const char = username.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 转换为32位整数
  }

  // 根据哈希值选择颜色
  const index = Math.abs(hash) % BACKGROUND_COLORS.length
  return BACKGROUND_COLORS[index]
}

/**
 * 生成基于首字母的头像URL
 * @param {string} identifier - 用户标识符（用户名）
 * @returns {string} 头像URL
 */
function generateRandomAvatar(identifier) {
  try {
    // 获取首字母
    const initials = getInitials(identifier)

    // 获取背景颜色
    const backgroundColor = getBackgroundColor(identifier)

    // 使用DiceBear的initials风格生成头像
    const baseUrl = 'https://api.dicebear.com/7.x/initials/svg'
    const params = new URLSearchParams({
      seed: initials,
      backgroundColor: backgroundColor.replace('#', ''),
      backgroundType: 'solid',
      fontSize: '36',
      fontWeight: '600',
      textColor: 'ffffff'  // 白色文字
    })

    const url = `${baseUrl}?${params.toString()}`

    return url
  } catch (error) {
    console.error('生成首字母头像失败，使用默认头像:', error)
    // 如果生成失败，返回默认头像
    return 'https://api.dicebear.com/7.x/initials/svg?seed=U&backgroundColor=4ECDC4&backgroundType=solid&fontSize=36&fontWeight=600&textColor=ffffff'
  }
}

/**
 * 获取默认头像
 * @returns {string} 默认头像URL
 */
function getFallbackAvatar() {
  return 'https://api.dicebear.com/7.x/initials/svg?seed=U&backgroundColor=4ECDC4&backgroundType=solid&fontSize=36&fontWeight=600&textColor=ffffff'
}

/**
 * 验证头像URL是否有效
 * @param {string} avatarUrl - 头像URL
 * @returns {Promise<boolean>} 是否有效
 */
async function validateAvatarUrl(avatarUrl) {
  try {
    // 简单验证URL格式
    const url = new URL(avatarUrl)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch (error) {
    return false
  }
}

/**
 * 为用户生成头像
 * @param {Object} user - 用户对象
 * @param {string} user.username - 用户名
 * @param {string} user.email - 邮箱
 * @returns {string} 头像URL
 */
function generateUserAvatar(user) {
  // 使用用户名作为主要标识符，邮箱作为备用
  const identifier = user.username || user.email || 'User'
  return generateRandomAvatar(identifier)
}

/**
 * 获取所有可用的头像风格
 * @returns {Array<string>} 头像风格列表
 */
function getAvailableStyles() {
  return ['initials'] // 只提供首字母风格
}

/**
 * 生成头像预览信息（用于测试）
 * @param {string} identifier - 用户标识符
 * @returns {Object} 包含头像URL和配置的对象
 */
function generateAvatarPreview(identifier) {
  const initials = getInitials(identifier)
  const backgroundColor = getBackgroundColor(identifier)

  return {
    url: generateRandomAvatar(identifier),
    config: {
      initials,
      backgroundColor,
      identifier
    }
  }
}

module.exports = {
  generateRandomAvatar,
  generateUserAvatar,
  getFallbackAvatar,
  validateAvatarUrl,
  getAvailableStyles,
  generateAvatarPreview,
  getInitials,
  getBackgroundColor,
  BACKGROUND_COLORS
}
