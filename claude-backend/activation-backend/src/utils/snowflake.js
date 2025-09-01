/**
 * 雪花ID生成器
 * 用于生成全局唯一的分布式ID
 */

const SnowflakeId = require('snowflake-id').default

/**
 * 雪花ID生成器实例
 * 机器ID设置为1，数据中心ID设置为1
 */
const snowflake = new SnowflakeId({
  mid: 1,        // 机器ID (0-31)
  offset: 0,     // 时间偏移量
  method: SnowflakeId.nextId  // 生成方法
})

/**
 * 生成雪花ID
 * @returns {string} 雪花ID字符串
 */
function generateSnowflakeId() {
  return snowflake.generate().toString()
}

/**
 * 批量生成雪花ID
 * @param {number} count - 生成数量
 * @returns {Array<string>} 雪花ID数组
 */
function generateSnowflakeIds(count) {
  const ids = []
  for (let i = 0; i < count; i++) {
    ids.push(generateSnowflakeId())
  }
  return ids
}

/**
 * 解析雪花ID
 * @param {string|number} id - 雪花ID
 * @returns {Object} 解析结果
 */
function parseSnowflakeId(id) {
  try {
    const snowflakeId = new SnowflakeId({ mid: 1 })
    const parsed = snowflakeId.parse(id.toString())
    
    return {
      timestamp: parsed.timestamp,
      mid: parsed.mid,
      pid: parsed.pid,
      increment: parsed.increment,
      date: new Date(parsed.timestamp)
    }
  } catch (error) {
    return null
  }
}

/**
 * 验证雪花ID格式
 * @param {string|number} id - 要验证的ID
 * @returns {boolean} 是否为有效的雪花ID
 */
function isValidSnowflakeId(id) {
  if (!id) return false

  // 雪花ID应该是19位数字
  const idStr = id.toString()
  if (!/^\d{19}$/.test(idStr)) return false

  // 简单验证：雪花ID应该大于某个最小值
  const idNum = BigInt(idStr)
  const minSnowflakeId = BigInt('1000000000000000000') // 19位最小值
  const maxSnowflakeId = BigInt('9999999999999999999') // 19位最大值

  return idNum >= minSnowflakeId && idNum <= maxSnowflakeId
}

/**
 * 获取雪花ID的时间戳
 * @param {string|number} id - 雪花ID
 * @returns {number|null} 时间戳
 */
function getSnowflakeTimestamp(id) {
  const parsed = parseSnowflakeId(id)
  return parsed ? parsed.timestamp : null
}

module.exports = {
  generateSnowflakeId,
  generateSnowflakeIds,
  parseSnowflakeId,
  isValidSnowflakeId,
  getSnowflakeTimestamp,
  snowflake
}
