# 账户状态管理系统使用指南

## 🎯 功能概述

账户状态管理系统实现了类似test.php的状态监控功能，包括：

- **空闲状态（绿色）**: 5分钟内无人使用
- **可用状态（黄色）**: 5分钟内有人使用，但仍可使用，显示倒计时
- **实时倒计时**: 显示"还有X分Y秒恢复"

## 🔧 系统架构

### 后端API (pool-backend)

#### 新增接口

1. **获取账户状态**
   ```
   GET /api/account-status/:email
   ```

2. **获取所有账户状态**
   ```
   GET /api/accounts-status
   ```

3. **记录账户使用**
   ```
   POST /api/account-usage/:email
   ```

#### 状态计算逻辑

```javascript
function calculateAccountStatus(account) {
  const currentTime = new Date();
  const lastUsed = account.last_used_at ? new Date(account.last_used_at) : null;
  
  if (!lastUsed) {
    return { status: 'idle', status_text: '空闲', color: 'green' };
  }

  const timeSinceUsed = Math.floor((currentTime.getTime() - lastUsed.getTime()) / 1000);
  const cooldownPeriod = 300; // 5分钟

  if (timeSinceUsed >= cooldownPeriod) {
    return { status: 'idle', status_text: '空闲', color: 'green' };
  } else {
    const remainingSeconds = cooldownPeriod - timeSinceUsed;
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    const countdown = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    return {
      status: 'available',
      status_text: '可用',
      color: 'yellow',
      countdown: countdown,
      remaining_seconds: remainingSeconds
    };
  }
}
```

### 前端组件 (claude-manager)

#### 新增组件

1. **AccountStatusCard.vue** - 状态卡片组件
   - 显示账户邮箱和状态
   - 实时倒计时功能
   - 登录和刷新按钮

2. **AccountStatusTest.vue** - 测试页面
   - 测试状态管理功能
   - 模拟使用记录
   - 自动刷新状态

#### 修改的组件

1. **ClaudeAccountManagement.vue**
   - 添加视图模式切换（表格/卡片）
   - 集成状态卡片显示
   - 状态刷新功能

## 🚀 使用方法

### 1. 启动服务

```bash
# 启动后端服务
cd claude-backend/pool-backend
npm run dev

# 启动前端服务
cd claude-manager
npm run dev
```

### 2. 访问测试页面

访问 `http://localhost:8082/status-test` 查看状态测试页面

### 3. 在管理界面使用

1. 访问 `http://localhost:8082/claude-manager`
2. 切换到"状态卡片"视图模式
3. 查看实时状态和倒计时

## 📊 状态说明

### 状态类型

| 状态 | 颜色 | 说明 | 显示内容 |
|------|------|------|----------|
| `idle` | 绿色 | 空闲 | 5分钟内无人使用 |
| `available` | 黄色 | 可用 | 5分钟内有人使用，显示倒计时 |

### 倒计时格式

- **格式**: `M:SS` (分钟:秒)
- **示例**: `4:23` 表示还有4分23秒恢复到空闲状态
- **更新频率**: 每秒更新一次

## 🔄 自动刷新机制

### 前端自动刷新

1. **卡片组件**: 每秒更新倒计时，倒计时结束时自动刷新状态
2. **测试页面**: 每10秒自动刷新所有状态
3. **手动刷新**: 点击刷新按钮立即更新

### 后端状态计算

- **实时计算**: 每次请求时根据`last_used_at`字段实时计算
- **数据库更新**: 使用时自动更新`last_used_at`和`usage_count`

## 🛠️ 自定义配置

### 修改冷却时间

在 `server.ts` 中修改 `cooldownPeriod` 变量：

```javascript
const cooldownPeriod = 300; // 改为其他秒数，如600（10分钟）
```

### 修改自动刷新间隔

在组件中修改定时器间隔：

```javascript
// AccountStatusCard.vue
setInterval(() => {
  localCountdown.value--
}, 1000) // 修改为其他间隔

// AccountStatusTest.vue
setInterval(() => {
  loadAllStatus()
}, 10000) // 修改为其他间隔
```

## 🐛 故障排除

### 常见问题

1. **状态不更新**
   - 检查后端服务是否正常运行
   - 确认数据库连接正常
   - 查看浏览器控制台错误

2. **倒计时不准确**
   - 检查服务器时间是否正确
   - 确认前后端时区一致

3. **API调用失败**
   - 检查API地址配置
   - 确认CORS设置正确

### 调试方法

1. **查看API响应**
   ```javascript
   // 在浏览器控制台执行
   fetch('http://localhost:3457/api/accounts-status')
     .then(r => r.json())
     .then(console.log)
   ```

2. **查看数据库状态**
   ```sql
   SELECT email, last_used_at, usage_count 
   FROM claude_accounts 
   ORDER BY last_used_at DESC;
   ```

## 📈 扩展功能

### 可能的增强

1. **更多状态类型**
   - 繁忙状态（红色）
   - 维护状态（灰色）

2. **统计功能**
   - 使用频率统计
   - 高峰时段分析

3. **通知功能**
   - 账户可用通知
   - 使用异常告警

4. **负载均衡**
   - 智能分配空闲账户
   - 避免单个账户过载

这个状态管理系统为您的Claude账户池提供了完整的状态监控和管理功能！🎉
