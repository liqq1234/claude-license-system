# 批量生成激活码 API 文档

## 接口概述

`POST /v1/admin/generate-codes` - 批量生成激活码

### 特性
- ✅ **批量生成**: 支持一次生成 1-10000 个激活码
- ✅ **事务保证**: 使用数据库事务确保数据一致性
- ✅ **智能缓存**: 新生成的激活码自动缓存到 Redis
- ✅ **性能优化**: 批量插入，高效处理大量数据
- ✅ **详细日志**: 完整的操作日志和性能监控

## 请求参数

### 必需参数
| 参数 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `type` | string | 激活码类型 | `"monthly"` |
| `batchSize` | integer | 生成数量 (1-10000) | `100` |

### 可选参数
| 参数 | 类型 | 默认值 | 说明 | 示例 |
|------|------|--------|------|------|
| `duration` | integer | 自动计算 | 持续时间（小时） | `720` |
| `maxDevices` | integer | `1` | 每个激活码最大设备数 | `3` |
| `description` | string | `""` | 批次描述 | `"2025年促销活动"` |
| `tags` | array | `[]` | 标签列表 | `["promotion", "2025"]` |
| `permissions` | array | `[]` | 权限列表 | `["basic", "premium"]` |
| `enhanced` | boolean | `false` | 是否增强模式 | `true` |
| `priority` | integer | `5` | 优先级 (1-10) | `8` |
| `createdBy` | string | `"admin"` | 创建者 | `"admin"` |

### 激活码类型说明
| 类型 | 默认持续时间 | 说明 |
|------|-------------|------|
| `daily` | 24小时 | 日度激活码 |
| `weekly` | 168小时 (7天) | 周度激活码 |
| `monthly` | 720小时 (30天) | 月度激活码 |
| `yearly` | 8760小时 (365天) | 年度激活码 |
| `permanent` | 永不过期 | 永久激活码 |

## 请求示例

### 基础示例
```bash
curl -X POST "http://localhost:8888/v1/admin/generate-codes" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "monthly",
    "batchSize": 100,
    "description": "2025年1月促销活动",
    "maxDevices": 1,
    "tags": ["promotion", "2025", "monthly"],
    "permissions": ["basic", "premium"],
    "createdBy": "admin"
  }'
```

### JavaScript 示例
```javascript
const response = await axios.post('http://localhost:8888/v1/admin/generate-codes', {
  type: 'yearly',
  batchSize: 50,
  duration: 8760,
  maxDevices: 3,
  description: '年度VIP激活码',
  tags: ['vip', 'yearly', '2025'],
  permissions: ['basic', 'premium', 'enterprise'],
  enhanced: true,
  priority: 8,
  createdBy: 'admin'
})

console.log('生成结果:', response.data)
```

### Python 示例
```python
import requests

data = {
    "type": "permanent",
    "batchSize": 10,
    "maxDevices": 5,
    "description": "永久激活码测试",
    "tags": ["permanent", "test"],
    "permissions": ["basic", "premium", "enterprise", "unlimited"],
    "enhanced": True,
    "priority": 10,
    "createdBy": "admin"
}

response = requests.post(
    'http://localhost:8888/v1/admin/generate-codes',
    json=data
)

print('生成结果:', response.json())
```

## 响应示例

### 成功响应 (200 OK)
```json
{
  "status": 0,
  "message": "激活码生成成功",
  "data": {
    "batchId": "BATCH_LQQ123_ABC456",
    "codes": [
      "ABCD-1234-EFGH-5678",
      "IJKL-9012-MNOP-3456",
      "QRST-7890-UVWX-1234"
    ],
    "summary": {
      "total": 100,
      "type": "monthly",
      "maxDevices": 1,
      "duration": 720,
      "expiresAt": 1709356245123,
      "permissions": ["basic", "premium"],
      "enhanced": false,
      "tags": ["promotion", "2025", "monthly"],
      "createdBy": "admin",
      "createdAt": 1706356245123
    }
  },
  "meta": {
    "responseTime": 245,
    "totalResponseTime": 250,
    "batchProcessing": true,
    "transactionUsed": true
  }
}
```

### 错误响应 (400 Bad Request)
```json
{
  "status": 1,
  "message": "激活码类型不能为空",
  "meta": {
    "responseTime": 5,
    "timestamp": 1706356245123
  }
}
```

### 服务器错误 (500 Internal Server Error)
```json
{
  "status": 1,
  "message": "生成激活码失败: 数据库连接超时",
  "meta": {
    "responseTime": 5000,
    "timestamp": 1706356245123
  }
}
```

## 响应字段说明

### data 对象
| 字段 | 类型 | 说明 |
|------|------|------|
| `batchId` | string | 批次ID，用于追踪和管理 |
| `codes` | array | 生成的激活码列表 |
| `summary` | object | 批次摘要信息 |

### summary 对象
| 字段 | 类型 | 说明 |
|------|------|------|
| `total` | integer | 生成的激活码总数 |
| `type` | string | 激活码类型 |
| `maxDevices` | integer | 每个激活码最大设备数 |
| `duration` | integer | 持续时间（小时），null表示永久 |
| `expiresAt` | integer | 过期时间戳，null表示永不过期 |
| `permissions` | array | 权限列表 |
| `enhanced` | boolean | 是否增强模式 |
| `tags` | array | 标签列表 |
| `createdBy` | string | 创建者 |
| `createdAt` | integer | 创建时间戳 |

### meta 对象
| 字段 | 类型 | 说明 |
|------|------|------|
| `responseTime` | integer | 后端处理时间（毫秒） |
| `totalResponseTime` | integer | 总响应时间（毫秒） |
| `batchProcessing` | boolean | 是否使用批量处理 |
| `transactionUsed` | boolean | 是否使用数据库事务 |

## 性能特性

### 批量处理优化
- **批量插入**: 使用 `bulkCreate` 批量插入数据库
- **事务保证**: 确保批次数据的一致性
- **异步缓存**: 新激活码异步缓存到 Redis

### 性能指标
| 批次大小 | 预期响应时间 | 内存使用 |
|----------|-------------|----------|
| 1-10 | < 50ms | 低 |
| 11-100 | 50-200ms | 中等 |
| 101-1000 | 200ms-2s | 中等 |
| 1001-10000 | 2s-10s | 高 |

### 并发限制
- 建议同时进行的大批量生成操作不超过 3 个
- 单次最大生成数量：10000 个
- 数据库连接池自动管理并发

## 最佳实践

### 1. 批次大小选择
```javascript
// 推荐的批次大小
const batchSizes = {
  testing: 10,        // 测试环境
  small: 100,         // 小规模部署
  medium: 1000,       // 中等规模
  large: 5000         // 大规模部署
}
```

### 2. 错误处理
```javascript
try {
  const response = await generateCodes(params)
  
  if (response.data.status === 0) {
    console.log('生成成功:', response.data.data.summary)
  } else {
    console.error('生成失败:', response.data.message)
  }
} catch (error) {
  if (error.response?.status === 400) {
    console.error('参数错误:', error.response.data.message)
  } else {
    console.error('服务器错误:', error.message)
  }
}
```

### 3. 性能监控
```javascript
// 监控生成性能
const startTime = Date.now()
const response = await generateCodes(params)
const totalTime = Date.now() - startTime

console.log('性能指标:', {
  totalTime,
  backendTime: response.data.meta.responseTime,
  codesPerSecond: params.batchSize / (totalTime / 1000),
  efficiency: response.data.meta.responseTime / totalTime
})
```

## 故障排除

### 常见错误
1. **参数验证失败**: 检查必需参数和参数范围
2. **数据库连接超时**: 检查 MySQL 服务状态
3. **内存不足**: 减少批次大小
4. **重复激活码**: 系统会自动重试生成

### 调试建议
- 查看服务器日志获取详细错误信息
- 使用小批次测试参数配置
- 监控数据库和 Redis 性能
- 检查网络连接稳定性
