/**
 * 代理相关模型
 */

const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

// Token池模型 - 管理第三方服务的登录凭据
const TokenPool = sequelize.define('TokenPool', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  service_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '服务类型: gamma, figma, canva等'
  },
  account_alias: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '账号别名，用于标识不同的代理账号'
  },
  access_token: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '访问令牌，加密存储'
  },
  refresh_token: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '刷新令牌，加密存储'
  },
  cookies: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '登录cookies，加密存储'
  },
  status: {
    type: DataTypes.ENUM('active', 'in_use', 'expired', 'disabled'),
    defaultValue: 'active',
    comment: '状态: 可用/使用中/过期/禁用'
  },
  max_concurrent_users: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
    comment: '最大并发用户数'
  },
  max_daily_usage: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    comment: '每日最大使用次数'
  },
  current_users: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '当前使用用户数'
  },
  daily_usage: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '今日使用次数'
  },
  last_used_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后使用时间'
  },
  last_refresh_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后刷新时间'
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Token过期时间'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'token_pool',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['service_type']
    },
    {
      fields: ['status']
    },
    {
      fields: ['service_type', 'status']
    }
  ]
})

// 用户激活记录模型 - 记录用户激活的服务
const UserActivation = sequelize.define('UserActivation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '用户ID'
  },
  activation_code_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '激活码ID'
  },
  service_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '服务类型'
  },
  activated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '激活时间'
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '过期时间'
  },
  remaining_usage: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '剩余使用次数'
  },
  max_usage: {
    type: DataTypes.INTEGER,
    defaultValue: 30,
    comment: '最大使用次数'
  },
  status: {
    type: DataTypes.ENUM('active', 'expired', 'suspended'),
    defaultValue: 'active',
    comment: '状态'
  }
}, {
  tableName: 'user_activations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['service_type']
    },
    {
      fields: ['status']
    },
    {
      unique: true,
      fields: ['user_id', 'activation_code_id']
    }
  ]
})

// 使用记录模型 - 记录用户的使用行为
const UsageRecord = sequelize.define('UsageRecord', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '用户ID'
  },
  service_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '服务类型'
  },
  action: {
    type: DataTypes.ENUM('jump', 'activation', 'login', 'logout'),
    allowNull: false,
    comment: '操作类型'
  },
  token_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '使用的Token ID'
  },
  session_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '会话ID'
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'IP地址'
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '用户代理'
  },
  details: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '详细信息'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'usage_records',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['service_type']
    },
    {
      fields: ['action']
    },
    {
      fields: ['created_at']
    }
  ]
})

// 代理会话模型 - 管理用户的代理会话
const ProxySession = sequelize.define('ProxySession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  session_id: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: '会话ID'
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '用户ID'
  },
  token_id: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'Token ID'
  },
  service_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '服务类型'
  },
  status: {
    type: DataTypes.ENUM('active', 'expired', 'terminated'),
    defaultValue: 'active',
    comment: '会话状态'
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '过期时间'
  },
  last_activity_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '最后活动时间'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'proxy_sessions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'last_activity_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['token_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['expires_at']
    }
  ]
})

module.exports = {
  TokenPool,
  UserActivation,
  UsageRecord,
  ProxySession
}
