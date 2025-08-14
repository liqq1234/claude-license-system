# 限流监控功能说明

## 功能概述

这个功能实现了从 claude-api-monitor 接收429限流数据，并自动识别对应的邮箱账户，更新其限流状态。

## 数据库迁移

在使用此功能前，需要先执行数据库迁移来添加必要的字段：

```bash
# 执行迁移脚本
mysql -u root -p claudehub < database/migration_add_organization_and_rate_limit.sql
```

## 新增字段说明

### claude_accounts 表新增字段：
- `organization_id` - Claude组织ID，用于匹配限流请求
- `rate_limit_reset_at` - 限流重置时间
- `rate_limit_type` - 限流类型（如 five_hour, free_messages 等）
- `rate_limit_cooldown_seconds` - 限流冷却秒数

### 新增表：
- `claude_rate_limit_logs` - 限流检测日志表

## API 接口

### POST /api/rate-limit
接收来自 claude-api-monitor 的429限流数据

**请求体示例：**
```json
{
  "type": "rate_limit_detected",
  "timestamp": 1640995200000,
  "url": "https://claude.ai/api/organizations/7b8556b4-d293-4e5c-af82-ba03e4d26238/completion",
  "status": 429,
  "statusText": "Too Many Requests",
  "resetsAt": 1755147600,
  "limitType": "five_hour",
  "source": "api_response",
  "rawResponse": {
    "type": "exceeded_limit",
    "resetsAt": 1755147600,
    "remaining": null
  }
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "Rate limit data received and processed successfully",
  "data": {
    "source": "api_response",
    "limitType": "five_hour",
    "resetsAt": 1755147600,
    "resetTime": "2025-8-14 16:00:00",
    "cooldownSeconds": 18000,
    "organizationId": "7b8556b4-d293-4e5c-af82-ba03e4d26238",
    "email": "user@example.com",
    "accountFound": true
  },
  "timestamp": "2025-08-14T08:00:00.000Z"
}
```

## 工作流程

1. **接收限流数据** - 从 claude-api-monitor 接收429限流检测数据
2. **提取组织ID** - 从URL中提取Claude组织ID
3. **查找对应账户** - 根据组织ID在数据库中查找对应的邮箱账户
4. **更新限流状态** - 将账户状态设置为限流，记录重置时间和冷却秒数
5. **记录日志** - 将限流事件记录到日志表中

## 数据库方法

### 新增的数据库方法：
- `getAccountByOrganizationId(organizationId)` - 根据组织ID获取账户
- `updateAccountRateLimit(email, resetAt, limitType, cooldownSeconds)` - 更新账户限流状态
- `clearAccountRateLimit(email)` - 清除账户限流状态
- `logRateLimit(log)` - 记录限流日志
- `getAccountRateLimitStatus(email)` - 获取账户当前限流状态

## 使用示例

### 测试接口
```bash
# 测试限流数据处理
curl -X POST http://localhost:8787/api/rate-limit/test
```

### 手动发送限流数据
```bash
curl -X POST http://localhost:8787/api/rate-limit \
  -H "Content-Type: application/json" \
  -d '{
    "type": "rate_limit_detected",
    "timestamp": 1640995200000,
    "url": "https://claude.ai/api/organizations/your-org-id/completion",
    "resetsAt": 1755147600,
    "limitType": "five_hour"
  }'
```

## 注意事项

1. 确保数据库中的账户记录包含正确的 `organization_id`
2. 限流重置时间会自动检查，过期的限流状态会被自动清除
3. 所有限流事件都会被记录到日志表中，便于后续分析
4. 如果找不到对应的账户，会记录警告日志但不会报错
