'use strict'
const config = require('../../config');
const crypto = require('crypto');
const logger = require('../utils/logger');
const errors = require('../constants/errors')
const utils = require('../utils/utils');
const fs = require('fs')

const PrivateKey = {
  key: fs.readFileSync(config.rsa_private_key).toString(),
  passphrase: config.rsa_passphrase
}
const PublicKey = fs.readFileSync(config.rsa_public_key).toString()

// 简化的 LicenseKey - 只保留内部使用的方法
const LicenseKey = {
  // 保留：validate, issue, revoke（内部工具使用）
  
  validate: (key) => {
    const buf = Buffer.from(key, 'hex')
    try {
      const _data = utils.crypt(PublicKey, buf, false)
      const data = JSON.parse(_data.toString('utf8'))
      if (data.identity === config.identity) {
        if (data.persist == 1) return data
        else if (data.startDate < Date.now() && data.endDate > Date.now()) return data
      }
      logger.info(`遇到无效的许可证密钥: ${_data}`)
    } catch (e) {
      logger.error(e.toString())
    }
    return null
  },

  issue: async (options={}) => {
    const meta = {
      identity: config.identity || 'Software',
      persist: options.persist? 1: 0,
      startDate: options.startDate || Date.now(),
      endDate: options.endDate || Date.now() + config.expireAfter,
      issueDate: Date.now()
    }
    const buf = Buffer.from(JSON.stringify(meta), 'utf8')
    const key = utils.crypt(PrivateKey, buf, true).toString('hex')
    
    return {status: errors.SUCCESS, key }
  },

  revoke: async (key) => {
    return {status: errors.SUCCESS}
  }
}

module.exports = { LicenseKey }
