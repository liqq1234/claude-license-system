'use strict'
const crypto = require('crypto')
const logger = require('../utils/logger')
const errors = require('../constants/errors')

class AccountPoolManager {
  constructor(dal) {
    this.dal = dal
    this.AccountPool = dal ? new dal.Redis_Hash({tpl: 'Account:%s'}) : {}
    this.AccountQueue = dal ? new dal.Redis_List({tpl: 'AccountQueue'}) : {}
  }

  // 添加账号到池中
  async addAccount(accountData) {
    const { email, password, accessToken, refreshToken } = accountData
    const accountId = crypto.createHash('md5').update(email).digest('hex')
    
    const account = {
      id: accountId,
      email,
      password,
      accessToken,
      refreshToken,
      status: 'active',
      usageCount: 0,
      lastUsed: 0,
      createdAt: Date.now()
    }

    await this.AccountPool.hmset([accountId], account)
    await this.AccountQueue.lpush(['available'], accountId)
    
    logger.info(`Account ${email} added to pool`)
    return { status: errors.SUCCESS, accountId }
  }

  // 获取可用账号
  async getAvailableAccount() {
    try {
      // 从队列中获取账号ID
      const accountId = await this.AccountQueue.rpop(['available'])
      if (!accountId) {
        return { status: errors.NULL_DATA, message: '暂无可用账号' }
      }

      // 获取账号详情
      const account = await this.AccountPool.hgetall([accountId])
      if (!account || account.status !== 'active') {
        // 递归获取下一个账号
        return this.getAvailableAccount()
      }

      // 更新使用信息
      await this.AccountPool.hmset([accountId], {
        usageCount: parseInt(account.usageCount) + 1,
        lastUsed: Date.now()
      })

      // 检查是否需要限制
      const usageCount = parseInt(account.usageCount) + 1
      if (usageCount >= 10) { // 使用10次后标记为受限
        await this.AccountPool.hset([accountId], 'status', 'limited')
        logger.warn(`Account ${account.email} marked as limited`)
      } else {
        // 重新放回队列
        await this.AccountQueue.lpush(['available'], accountId)
      }

      return {
        status: errors.SUCCESS,
        account: {
          email: account.email,
          accessToken: account.accessToken,
          refreshToken: account.refreshToken
        }
      }
    } catch (error) {
      logger.error('Error getting available account:', error)
      return { status: errors.SERVER_ERROR, message: '获取账号失败' }
    }
  }

  // 重置账号状态
  async resetAccount(accountId) {
    const account = await this.AccountPool.hgetall([accountId])
    if (!account) {
      return { status: errors.NULL_DATA, message: '账号不存在' }
    }

    await this.AccountPool.hmset([accountId], {
      status: 'active',
      usageCount: 0,
      lastUsed: 0
    })

    // 重新加入可用队列
    await this.AccountQueue.lpush(['available'], accountId)
    
    logger.info(`Account ${account.email} reset`)
    return { status: errors.SUCCESS, message: '账号已重置' }
  }

  // 批量导入账号
  async importAccounts(accountList) {
    const results = []
    for (const accountData of accountList) {
      try {
        const result = await this.addAccount(accountData)
        results.push({ email: accountData.email, ...result })
      } catch (error) {
        results.push({ 
          email: accountData.email, 
          status: errors.SERVER_ERROR, 
          error: error.message 
        })
      }
    }
    return { status: errors.SUCCESS, results }
  }

  // 获取池状态
  async getPoolStatus() {
    const availableCount = await this.AccountQueue.llen(['available'])
    // TODO: 统计各状态账号数量
    return {
      status: errors.SUCCESS,
      availableCount,
      totalCount: 0, // 需要实现
      limitedCount: 0, // 需要实现
      bannedCount: 0 // 需要实现
    }
  }
}

module.exports = { AccountPoolManager }