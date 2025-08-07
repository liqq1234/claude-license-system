# 统计接口 API 文档

## 接口概述

`GET /v1/admin/stats` - 获取激活码系统的详细统计数据

### 特性
- ✅ **智能缓存**: Redis 缓存提升性能，5分钟缓存时间
- ✅ **详细统计**: 包含概览、分布、趋势等多维度数据
- ✅ **性能监控**: 返回响应时间和数据源信息
- ✅ **错误处理**: 完善的错误处理和日志记录

## 请求示例

### cURL
```bash
curl -X GET "http://localhost:8888/v1/admin/stats" \
  -H "Accept: application/json"
```

### JavaScript (axios)
```javascript
const response = await axios.get('http://localhost:8888/v1/admin/stats')
console.log(response.data)
```

### Python (requests)
```python
import requests

response = requests.get('http://localhost:8888/v1/admin/stats')
data = response.json()
print(data)
```

## 响应示例

### 成功响应 (200 OK)
```json
{
  "status": 0,
  "message": "获取统计数据成功",
  "data": {
    "overview": {
      "totalCodes": 150,
      "unusedCodes": 45,
      "usedCodes": 80,
      "expiredCodes": 20,
      "suspendedCodes": 5,
      "totalDeviceBindings": 120,
      "activeDeviceBindings": 95,
      "totalBatches": 12,
      "activeBatches": 8
    },
    "typeDistribution": [
      { "type": "daily", "count": 30 },
      { "type": "weekly", "count": 25 },
      { "type": "monthly", "count": 60 },
      { "type": "yearly", "count": 25 },
      { "type": "permanent", "count": 10 }
    ],
    "statusDistribution": [
      { "status": "unused", "count": 45, "label": "未使用" },
      { "status": "used", "count": 80, "label": "已使用" },
      { "status": "expired", "count": 20, "label": "已过期" },
      { "status": "suspended", "count": 5, "label": "已暂停" }
    ],
    "activationTrend": [
      { "date": "2025-01-21", "count": 12 },
      { "date": "2025-01-22", "count": 15 },
      { "date": "2025-01-23", "count": 8 },
      { "date": "2025-01-24", "count": 20 },
      { "date": "2025-01-25", "count": 18 },
      { "date": "2025-01-26", "count": 22 },
      { "date": "2025-01-27", "count": 16 }
    ],
    "usageStats": {
      "codeUsageRate": "53.33",
      "deviceBindingRate": "63.33", 
      "batchCompletionRate": "33.33"
    },
    "metadata": {
      "lastUpdated": "2025-01-27T12:30:45.123Z",
      "dataSource": "mysql",
      "cacheExpiry": 300
    }
  },
  "meta": {
    "cached": false,
    "responseTime": 45,
    "timestamp": 1706356245123,
    "dataSource": "mysql"
  }
}
```

### 缓存命中响应
```json
{
  "status": 0,
  "message": "获取统计数据成功",
  "data": { /* 同上 */ },
  "meta": {
    "cached": true,
    "responseTime": 8,
    "timestamp": 1706356250456,
    "dataSource": "redis"
  }
}
```

### 错误响应 (500 Internal Server Error)
```json
{
  "status": 1,
  "message": "获取统计数据失败: 数据库连接超时",
  "meta": {
    "responseTime": 5000,
    "timestamp": 1706356245123
  }
}
```

## 响应字段说明

### 基础字段
| 字段 | 类型 | 说明 |
|------|------|------|
| `status` | integer | 状态码，0=成功，1=失败 |
| `message` | string | 响应消息 |
| `data` | object | 统计数据对象 |
| `meta` | object | 元数据信息 |

### data.overview (概览统计)
| 字段 | 类型 | 说明 |
|------|------|------|
| `totalCodes` | integer | 激活码总数 |
| `unusedCodes` | integer | 未使用激活码数 |
| `usedCodes` | integer | 已使用激活码数 |
| `expiredCodes` | integer | 过期激活码数 |
| `suspendedCodes` | integer | 暂停激活码数 |
| `totalDeviceBindings` | integer | 设备绑定总数 |
| `activeDeviceBindings` | integer | 活跃设备绑定数 |
| `totalBatches` | integer | 批次总数 |
| `activeBatches` | integer | 活跃批次数 |

### data.typeDistribution (类型分布)
激活码类型分布数组，每个元素包含：
- `type`: 激活码类型 (daily/weekly/monthly/yearly/permanent)
- `count`: 该类型的数量

### data.statusDistribution (状态分布)
激活码状态分布数组，每个元素包含：
- `status`: 状态代码 (unused/used/expired/suspended)
- `count`: 该状态的数量
- `label`: 状态中文描述

### data.activationTrend (激活趋势)
最近7天的激活趋势数组，每个元素包含：
- `date`: 日期 (YYYY-MM-DD)
- `count`: 当天激活次数

### data.usageStats (使用率统计)
| 字段 | 类型 | 说明 |
|------|------|------|
| `codeUsageRate` | string | 激活码使用率 (百分比) |
| `deviceBindingRate` | string | 设备绑定率 (百分比) |
| `batchCompletionRate` | string | 批次完成率 (百分比) |

### meta (元数据)
| 字段 | 类型 | 说明 |
|------|------|------|
| `cached` | boolean | 是否来自缓存 |
| `responseTime` | integer | 响应时间 (毫秒) |
| `timestamp` | integer | 响应时间戳 |
| `dataSource` | string | 数据源 (redis/mysql) |

## 性能特性

### 缓存策略
- **缓存时间**: 5分钟 (300秒)
- **缓存键**: `node-license-server:cache:stats`
- **缓存失效**: 数据变更时自动清除

### 性能指标
- **首次请求**: 通常 20-100ms (从 MySQL 查询)
- **缓存命中**: 通常 5-20ms (从 Redis 获取)
- **性能提升**: 缓存可提升 60-90% 的响应速度

### 并发支持
- 支持高并发访问
- Redis 缓存减少数据库压力
- 异步缓存更新不阻塞响应

## 使用建议

1. **前端轮询**: 建议每 30-60 秒轮询一次获取最新数据
2. **缓存利用**: 短时间内多次请求会自动使用缓存
3. **错误处理**: 请妥善处理网络错误和服务器错误
4. **性能监控**: 可通过 `meta.responseTime` 监控接口性能

## 故障排除

### 常见错误
1. **连接超时**: 检查网络连接和服务器状态
2. **数据库错误**: 检查 MySQL 和 Redis 服务状态
3. **权限错误**: 确认接口访问权限

### 调试信息
- 查看服务器日志获取详细错误信息
- 使用 `meta` 字段中的性能数据分析问题
- 检查 `dataSource` 确认数据来源
