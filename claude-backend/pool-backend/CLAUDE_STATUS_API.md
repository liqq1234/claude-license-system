# Claude 镜像网站状态检测 API

这个功能允许你在登录之前检测 Claude 镜像网站的状态，包括是否触发了 429 限流和获取冷却时间。

## 功能特性

- ✅ 检测网站可用性
- ✅ 识别 429 限流状态
- ✅ 获取冷却时间（从 Retry-After 头部或响应体）
- ✅ 测量响应时间
- ✅ 支持批量检测
- ✅ 筛选可用网站
- ✅ 详细的错误信息

## API 端点

### 1. 单个网站状态检测

**GET** `/api/claude-status`

检测单个 Claude 镜像网站的状态。

#### 查询参数

| 参数 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| `url` | string | 否 | 配置的 BASE_URL | 要检测的网站 URL |
| `timeout` | integer | 否 | 10000 | 请求超时时间（毫秒，1000-30000） |

#### 示例请求

```bash
curl "http://localhost:8787/api/claude-status?url=https://claude.lqqmail.xyz&timeout=10000"
```

#### 响应示例

**网站可用：**
```json
{
  "isAvailable": true,
  "statusCode": 200,
  "isRateLimited": false,
  "responseTime": 1250,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**网站被限流：**
```json
{
  "isAvailable": false,
  "statusCode": 429,
  "isRateLimited": true,
  "cooldownTime": 300,
  "retryAfter": 300,
  "errorMessage": "Rate limited (429)",
  "responseTime": 850,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 2. 批量网站状态检测

**POST** `/api/claude-status/batch`

同时检测多个 Claude 镜像网站的状态。

#### 请求体

```json
{
  "urls": ["https://claude.ai", "https://claude.lqqmail.xyz"],
  "timeout": 10000
}
```

#### 示例请求

```bash
curl -X POST "http://localhost:8787/api/claude-status/batch" \
  -H "Content-Type: application/json" \
  -d '{
    "urls": ["https://claude.ai", "https://claude.lqqmail.xyz"],
    "timeout": 10000
  }'
```

#### 响应示例

```json
{
  "results": {
    "https://claude.ai": {
      "isAvailable": false,
      "statusCode": 429,
      "isRateLimited": true,
      "cooldownTime": 300,
      "responseTime": 1200,
      "timestamp": "2024-01-01T12:00:00.000Z"
    },
    "https://claude.lqqmail.xyz": {
      "isAvailable": true,
      "statusCode": 200,
      "isRateLimited": false,
      "responseTime": 800,
      "timestamp": "2024-01-01T12:00:00.000Z"
    }
  },
  "summary": {
    "total": 2,
    "available": 1,
    "rateLimited": 1,
    "unavailable": 0
  }
}
```

### 3. 获取可用网站

**POST** `/api/claude-status/available`

从提供的 URL 列表中筛选出可用且未被限流的网站。

#### 请求体

```json
{
  "urls": ["https://claude.ai", "https://claude.lqqmail.xyz"],
  "timeout": 10000
}
```

#### 示例请求

```bash
curl -X POST "http://localhost:8787/api/claude-status/available" \
  -H "Content-Type: application/json" \
  -d '{
    "urls": ["https://claude.ai", "https://claude.lqqmail.xyz"],
    "timeout": 10000
  }'
```

#### 响应示例

```json
{
  "availableUrls": ["https://claude.lqqmail.xyz"],
  "count": 1,
  "checkedAt": "2024-01-01T12:00:00.000Z"
}
```

## 使用场景

### 1. 登录前检测

在用户登录前检测网站状态，避免登录到被限流的网站：

```javascript
// 检测默认网站状态
const response = await fetch('/api/claude-status');
const status = await response.json();

if (status.isRateLimited) {
  alert(`网站被限流，请等待 ${status.cooldownTime} 秒后重试`);
} else if (status.isAvailable) {
  // 继续登录流程
  proceedWithLogin();
} else {
  alert(`网站不可用: ${status.errorMessage}`);
}
```

### 2. 智能网站选择

从多个镜像网站中选择可用的网站：

```javascript
// 检测多个镜像网站
const response = await fetch('/api/claude-status/available', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    urls: [
      'https://claude.ai',
      'https://claude.lqqmail.xyz',
      'https://claude-mirror1.com',
      'https://claude-mirror2.com'
    ]
  })
});

const result = await response.json();

if (result.count > 0) {
  // 使用第一个可用的网站
  const selectedUrl = result.availableUrls[0];
  console.log(`选择网站: ${selectedUrl}`);
} else {
  console.log('没有可用的网站');
}
```

### 3. 监控和告警

定期检测网站状态，实现监控和告警：

```javascript
// 每分钟检测一次
setInterval(async () => {
  const response = await fetch('/api/claude-status/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      urls: ['https://claude.lqqmail.xyz']
    })
  });
  
  const result = await response.json();
  const status = result.results['https://claude.lqqmail.xyz'];
  
  if (status.isRateLimited) {
    console.warn(`⚠️ 网站被限流，冷却时间: ${status.cooldownTime}秒`);
  } else if (!status.isAvailable) {
    console.error(`❌ 网站不可用: ${status.errorMessage}`);
  }
}, 60000);
```

## 测试

运行测试脚本来验证功能：

```bash
# 启动服务器
npm run dev

# 在另一个终端运行测试
npm run test:claude-status
```

测试脚本会检测：
- 服务器健康状态
- 单个网站状态检测
- 批量网站状态检测
- 可用网站筛选

## 错误处理

API 会返回详细的错误信息：

- **400 Bad Request**: 请求参数错误
- **500 Internal Server Error**: 服务器内部错误

错误响应格式：
```json
{
  "error": "错误类型",
  "message": "详细错误信息"
}
```

## 限制

- 批量检测最多支持 10 个 URL
- 超时时间范围：1000-30000 毫秒
- 所有 URL 必须是有效的 HTTP/HTTPS 地址

## 注意事项

1. **频率限制**: 避免过于频繁的检测请求，建议间隔至少 30 秒
2. **超时设置**: 根据网络环境调整超时时间
3. **错误处理**: 始终检查响应状态和错误信息
4. **缓存策略**: 考虑缓存检测结果以减少重复请求
