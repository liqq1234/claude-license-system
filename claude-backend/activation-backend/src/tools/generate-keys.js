const crypto = require('crypto');
const fs = require('fs');

// 生成RSA密钥对
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 1024,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
    cipher: 'aes-256-cbc',
    passphrase: '1234'
  }
});

// 保存密钥文件
fs.writeFileSync('sample.private.pem', privateKey);
fs.writeFileSync('sample.public.pem', publicKey);

console.log('RSA密钥对生成成功！');
console.log('私钥文件: sample.private.pem');
console.log('公钥文件: sample.public.pem');
console.log('密码短语: 1234');