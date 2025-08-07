'use strict'
const crypto = require('crypto')

const utils = {
  // RSA加密/解密
  crypt: (key, data, encrypt = true) => {
    if (encrypt) {
      return crypto.privateEncrypt(key, data)
    } else {
      return crypto.publicDecrypt(key, data)
    }
  },

  // 检查对象属性是否非空
  attrsNotNull: (obj, attrs) => {
    return attrs.every(attr => obj[attr] != null && obj[attr] !== '')
  }
}

module.exports = utils

