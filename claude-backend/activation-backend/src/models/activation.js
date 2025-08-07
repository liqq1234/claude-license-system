const { sequelize } = require('../config/database')
const { DataTypes } = require('sequelize')
const { generateSnowflakeId } = require('../utils/snowflake')

// 状态枚举
const ActivationCodeStatus = {
  UNUSED: 'unused',           // 未使用
  ACTIVE: 'active',          // 已激活
  USED: 'used',              // 已用完
  EXPIRED: 'expired',        // 过期
  SUSPENDED: 'suspended',     // 暂停
  DISABLED: 'disabled'       // 禁用
}

// 激活码模型
const ActivationCode = sequelize.define('ActivationCode', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '主键ID'
  },
  code: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    comment: '激活码'
  },
  type: {
    type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'yearly', 'permanent'),
    allowNull: false,
    comment: '激活码类型'
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '持续时间（小时）'
  },
  max_devices: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '最大设备数'
  },
  used_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '已使用次数'
  },
  status: {
    type: DataTypes.ENUM('unused', 'active', 'used', 'expired', 'suspended', 'disabled'),
    allowNull: false,
    defaultValue: 'unused',
    comment: '状态：unused-未使用，active-已激活，used-已用完，expired-已过期，suspended-已暂停，disabled-已禁用'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '描述'
  },
  batch_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '批次ID'
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '标签列表（JSON格式）'
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '过期时间（首次激活后计算）'
  },
  activated_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '首次激活时间'
  },
  created_by: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'created_by',
    comment: '创建者'
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
  tableName: 'activation_codes',
  timestamps: true,
  underscored: true,
  comment: '激活码表',
  indexes: [
    {
      fields: ['code'],
      unique: true
    },
    {
      fields: ['status']
    },
    {
      fields: ['type']
    },
    {
      fields: ['batch_id']
    },
    {
      fields: ['expires_at']
    }
  ]
})

// 设备绑定模型
const DeviceBinding = sequelize.define('DeviceBinding', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '主键ID'
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
  device_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '设备ID'
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: '绑定的用户ID'
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '用户代理'
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'IP地址'
  },
  activated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: '激活时间'
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '过期时间'
  },
  last_validated_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后验证时间'
  },
  validation_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '验证次数'
  },
  status: {
    type: DataTypes.ENUM('active', 'expired', 'revoked', 'suspended'),
    allowNull: false,
    defaultValue: 'active',
    comment: '状态'
  },
  license_data: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '授权文件数据'
  }
}, {
  tableName: 'device_bindings',
  comment: '设备绑定表',
  indexes: [
    {
      fields: ['activation_code']
    },
    {
      fields: ['device_id']
    },
    {
      fields: ['activation_code_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['expires_at']
    }
  ]
})

// 激活日志模型
const ActivationLog = sequelize.define('ActivationLog', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    defaultValue: () => generateSnowflakeId(),
    comment: '雪花ID主键'
  },
  activation_code: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '激活码'
  },
  device_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '设备ID'
  },
  action: {
    type: DataTypes.ENUM('activate', 'validate', 'revoke', 'suspend', 'resume'),
    allowNull: false,
    comment: '操作类型'
  },
  result: {
    type: DataTypes.ENUM('success', 'failed', 'error'),
    allowNull: false,
    comment: '操作结果'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '详细消息'
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
  request_data: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '请求数据（JSON格式）'
  },
  response_data: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '响应数据（JSON格式）'
  }
}, {
  tableName: 'activation_logs',
  comment: '激活日志表',
  indexes: [
    {
      fields: ['activation_code']
    },
    {
      fields: ['device_id']
    },
    {
      fields: ['action']
    },
    {
      fields: ['result']
    },
    {
      fields: ['created_at']
    }
  ]
})

// 批次信息模型
const ActivationBatch = sequelize.define('ActivationBatch', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '主键ID'
  },
  batch_id: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: '批次ID'
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '批次名称'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '批次描述'
  },
  type: {
    type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'yearly', 'permanent'),
    allowNull: false,
    comment: '激活码类型'
  },
  total_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '总数量'
  },
  used_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '已使用数量'
  },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'active',
    comment: '批次状态'
  },
  created_by: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '创建者'
  }
}, {
  tableName: 'activation_batches',
  comment: '激活码批次表',
  indexes: [
    {
      fields: ['batch_id'],
      unique: true
    },
    {
      fields: ['status']
    },
    {
      fields: ['type']
    }
  ]
})

module.exports = {
  ActivationCode,
  DeviceBinding,
  ActivationLog,
  ActivationBatch,
  ActivationCodeStatus
}
