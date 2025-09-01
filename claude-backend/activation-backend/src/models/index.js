const { sequelize } = require('../config/database')

// 导入各个模型
const userModels = require('./user')
const activationModels = require('./activation')
const proxyModels = require('./proxy')

// 解构导入用户相关模型
const { User, EmailVerificationCode, UserSession, OperationLog, UserActivationBinding, UserMembership } = userModels

// 解构导入激活码相关模型
const { ActivationCode, DeviceBinding, ActivationLog, ActivationBatch, ActivationCodeStatus } = activationModels

// 解构导入代理相关模型
const { TokenPool, UserActivation, UsageRecord, ProxySession } = proxyModels

// 定义关联关系
// 激活码相关关联
ActivationCode.hasMany(DeviceBinding, {
  foreignKey: 'activation_code_id',
  as: 'deviceBindings'
})

DeviceBinding.belongsTo(ActivationCode, {
  foreignKey: 'activation_code_id',
  as: 'activationCode'
})

ActivationCode.belongsTo(ActivationBatch, {
  foreignKey: 'batch_id',
  targetKey: 'batch_id',
  as: 'batch'
})

ActivationBatch.hasMany(ActivationCode, {
  foreignKey: 'batch_id',
  sourceKey: 'batch_id',
  as: 'activationCodes'
})

// 用户相关关联
User.hasMany(UserSession, {
  foreignKey: 'user_id',
  as: 'sessions'
})

UserSession.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
})

User.hasMany(OperationLog, {
  foreignKey: 'user_id',
  as: 'operationLogs'
})

OperationLog.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
})

// 用户与设备绑定的关联 (暂时注释掉，改为邮箱+激活码绑定)
// User.hasMany(DeviceBinding, {
//   foreignKey: 'user_id',
//   as: 'deviceBindings'
// })

// DeviceBinding.belongsTo(User, {
//   foreignKey: 'user_id',
//   as: 'user'
// })

// 新的用户激活码绑定关联
User.hasMany(UserActivationBinding, {
  foreignKey: 'user_id',
  as: 'activationBindings'
})

UserActivationBinding.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
})

ActivationCode.hasOne(UserActivationBinding, {
  foreignKey: 'activation_code_id',
  as: 'userBinding'
})

UserActivationBinding.belongsTo(ActivationCode, {
  foreignKey: 'activation_code_id',
  as: 'activationCode'
})

// 用户会员状态关联
User.hasOne(UserMembership, {
  foreignKey: 'user_id',
  as: 'membership'
})

UserMembership.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
})

// 代理相关关联
// 用户激活记录关联
User.hasMany(UserActivation, {
  foreignKey: 'user_id',
  as: 'activations'
})

UserActivation.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
})

ActivationCode.hasMany(UserActivation, {
  foreignKey: 'activation_code_id',
  as: 'userActivations'
})

UserActivation.belongsTo(ActivationCode, {
  foreignKey: 'activation_code_id',
  as: 'activationCode'
})

// 使用记录关联
User.hasMany(UsageRecord, {
  foreignKey: 'user_id',
  as: 'usageRecords'
})

UsageRecord.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
})

TokenPool.hasMany(UsageRecord, {
  foreignKey: 'token_id',
  as: 'usageRecords'
})

UsageRecord.belongsTo(TokenPool, {
  foreignKey: 'token_id',
  as: 'token'
})

// 代理会话关联
User.hasMany(ProxySession, {
  foreignKey: 'user_id',
  as: 'proxySessions'
})

ProxySession.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
})

TokenPool.hasMany(ProxySession, {
  foreignKey: 'token_id',
  as: 'proxySessions'
})

ProxySession.belongsTo(TokenPool, {
  foreignKey: 'token_id',
  as: 'token'
})

// 导出所有模型
module.exports = {
  sequelize,
  // 用户相关模型
  User,
  EmailVerificationCode,
  UserSession,
  OperationLog,
  UserActivationBinding,
  UserMembership,
  // 激活码相关模型
  ActivationCode,
  DeviceBinding, // 保持与数据库一致性，但不使用
  ActivationLog,
  ActivationBatch,
  // 代理相关模型
  TokenPool,
  UserActivation,
  UsageRecord,
  ProxySession,
  // 常量和枚举
  ActivationCodeStatus
}
