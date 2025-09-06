const { sequelize } = require('../config/database')
const { DataTypes } = require('sequelize')
const { generateSnowflakeId } = require('../utils/snowflake')

// 用户模型
const User = sequelize.define('User', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    defaultValue: () => generateSnowflakeId(),
    comment: '雪花ID主键'
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '用户名'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: '邮箱'
  },
  avatar: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '用户头像URL'
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '密码哈希'
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '用户状态: 0-禁用, 1-正常'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at',
    comment: '创建时间'
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'updated_at',
    comment: '更新时间'
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
  comment: '用户表',
  indexes: [
    {
      fields: ['email'],
      unique: true
    },
    {
      fields: ['username'],
      unique: true
    }
  ]
})

// 邮箱验证码模型
const EmailVerificationCode = sequelize.define('EmailVerificationCode', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    defaultValue: () => generateSnowflakeId(),
    comment: '雪花ID主键'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '邮箱'
  },
  code: {
    type: DataTypes.STRING(6),
    allowNull: false,
    comment: '验证码'
  },
  type: {
    type: DataTypes.ENUM('register', 'reset_password', 'change_email'),
    allowNull: false,
    comment: '验证码类型'
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '过期时间'
  },
  used: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '是否已使用: 0-未使用, 1-已使用'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at',
    comment: '创建时间'
  }
}, {
  tableName: 'email_verification_codes',
  timestamps: false,
  underscored: true,
  comment: '邮箱验证码表',
  indexes: [
    {
      fields: ['email', 'code']
    },
    {
      fields: ['expires_at']
    }
  ]
})

// 用户会话模型
const UserSession = sequelize.define('UserSession', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    defaultValue: () => generateSnowflakeId(),
    comment: '雪花ID主键'
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '用户ID'
  },
  token: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    comment: 'JWT token或session token'
  },
  device_info: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '设备信息'
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'IP地址'
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '过期时间'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at',
    comment: '创建时间'
  }
}, {
  tableName: 'user_sessions',
  timestamps: false,
  underscored: true,
  comment: '用户会话表',
  indexes: [
    {
      fields: ['token'],
      unique: true
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['expires_at']
    }
  ]
})

// 操作日志模型
const OperationLog = sequelize.define('OperationLog', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    defaultValue: () => generateSnowflakeId(),
    comment: '雪花ID主键'
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: '用户ID'
  },
  operation_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '操作类型'
  },
  operation_desc: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '操作描述'
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
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at',
    comment: '创建时间'
  }
}, {
  tableName: 'operation_logs',
  timestamps: false,
  underscored: true,
  comment: '操作日志表',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['operation_type']
    },
    {
      fields: ['created_at']
    }
  ]
})

// 用户激活码绑定模型 (新的绑定策略)
const UserActivationBinding = sequelize.define('UserActivationBinding', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    defaultValue: () => generateSnowflakeId(),
    comment: '雪花ID主键'
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
  activation_code: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '激活码'
  },
  activated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: '激活时间'
  },
  duration_hours: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '激活码时长(小时)'
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '过期时间'
  },
  status: {
    type: DataTypes.ENUM('active', 'expired', 'revoked'),
    allowNull: false,
    defaultValue: 'active',
    comment: '状态'
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: '激活时的IP地址'
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '用户代理'
  },
  service_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'universal',
    comment: '服务类型：claude, midjourney, universal'
  }
}, {
  tableName: 'user_activation_bindings',
  timestamps: false,
  underscored: true,
  comment: '用户激活码绑定表',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['activation_code_id'],
      unique: true  // 确保一个激活码只能绑定一次
    },
    {
      fields: ['activation_code']
    },
    {
      fields: ['status']
    },
    {
      fields: ['expires_at']
    },
    {
      fields: ['service_type']
    }
  ]
})

// 用户会员状态模型 (汇总用户的所有激活码)
const UserMembership = sequelize.define('UserMembership', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    defaultValue: () => generateSnowflakeId(),
    comment: '雪花ID主键'
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '用户ID'
  },
  service_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'universal',
    comment: '服务类型: claude, midjourney, universal'
  },
  total_duration_hours: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '总时长(小时)'
  },
  used_duration_hours: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '已使用时长(小时)'
  },
  remaining_duration_hours: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '剩余时长(小时)'
  },
  membership_start_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '会员开始时间'
  },
  membership_expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '会员过期时间'
  },
  status: {
    type: DataTypes.ENUM('inactive', 'active', 'expired'),
    allowNull: false,
    defaultValue: 'inactive',
    comment: '会员状态'
  },
  last_activation_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后激活时间'
  },
  activation_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '激活次数'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at',
    comment: '创建时间'
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'updated_at',
    comment: '更新时间'
  }
}, {
  tableName: 'user_memberships',
  timestamps: true,
  underscored: true,
  comment: '用户会员状态表',
  indexes: [
    {
      fields: ['user_id', 'service_type'],
      unique: true,
      name: 'uk_user_service'
    },
    {
      fields: ['status']
    },
    {
      fields: ['membership_expires_at']
    }
  ]
})

module.exports = {
  User,
  EmailVerificationCode,
  UserSession,
  OperationLog,
  UserActivationBinding,
  UserMembership
}
