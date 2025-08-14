# Claude 账户状态管理系统

这个系统实现了账户状态的实时监控和管理，支持状态转换、重置时间显示和前端卡片展示。

## 🎯 核心功能

### 📊 状态管理
- **空闲 (IDLE)** - 🟢 绿色 - 账户可以正常使用
- **繁忙 (BUSY)** - 🔴 红色 - 账户被429限流，显示重置时间
- **错误 (ERROR)** - ⚫ 灰色 - 账户连接或其他错误

### 🔄 状态转换流程
```
空闲 (IDLE) → (检测到429) → 繁忙 (BUSY) → (时间到期) → 空闲 (IDLE)
```

### ⏰ 重置时间管理
- 自动计算重置倒计时
- 显示格式：`4h 29m 15s`
- 时间到期后自动恢复为空闲状态

## 🏗️ 系统架构

### 1. 状态管理器 (`accountStatusManager.ts`)
```typescript
// 核心状态管理
export enum AccountStatus {
  IDLE = 'idle',     // 空闲 - 绿色
  BUSY = 'busy',     // 繁忙 - 红色 (限流状态)
  ERROR = 'error'    // 错误 - 灰色
}

// 设置账户为限流状态
accountStatusManager.setAccountBusy(
  accountId, 
  email, 
  cooldownSeconds, // 冷却时间(秒)
  errorMessage
);

// 获取重置倒计时
const countdown = accountStatusManager.getResetCountdown(accountId);
```

### 2. API 端点 (`accountStatusApi.ts`)
```typescript
// 获取所有账户状态
GET /api/account-status

// 获取单个账户状态
GET /api/account-status/:accountId

// 手动重置账户状态
POST /api/account-status/:accountId/reset

// 获取状态统计
GET /api/account-status/stats
```

### 3. 前端集成
```javascript
// 获取账户状态
const response = await fetch('/api/account-status');
const data = await response.json();

// 显示重置倒计时
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}h ${minutes}m ${secs}s`;
}
```

## 🚀 使用方法

### 1. 启动服务器
```bash
cd claude-backend/pool-backend
npm run dev
```

### 2. 集成到登录流程
```typescript
// 在检测到429限流时调用
import { accountStatusManager } from './managers/accountStatusManager';

// 检测到429限流
if (apiResponse.status === 429) {
  const retryAfter = parseInt(apiResponse.headers.get('retry-after') || '300');
  
  accountStatusManager.setAccountBusy(
    account.id,
    account.email,
    retryAfter,
    'Claude API Rate Limited (429)'
  );
}
```

### 3. 前端状态显示
```html
<!-- 账户卡片 -->
<div class="account-card busy">
  <div class="account-header">
    <span class="status-icon">🔴</span>
    test@example.com
  </div>
  <div class="countdown">
    ⏰ 重置倒计时: 4h 29m 15s
  </div>
</div>
```

## 🧪 测试功能

### 运行测试
```bash
# 测试账户状态管理
npm run test:account-status

# 查看前端示例
# 在浏览器中打开 frontend-status-example.html
```

### 测试输出示例
```
🚀 开始测试账户状态管理功能
📡 服务器地址: http://localhost:3457

✅ 服务器健康状态正常

📊 状态统计:
  🟢 空闲: 5
  🔴 繁忙: 2
  🚫 限流: 2
  ⚫ 错误: 0
  📊 总计: 7

📋 账户详情:
1. 🟢 test1@example.com
   状态: idle

2. 🔴 test2@example.com
   状态: busy
   重置时间: 4h 29m 15s
   重置于: 2024-01-01 16:30:00
```

## 📱 前端集成示例

### Vue.js 组件
```vue
<template>
  <div class="account-card" :class="account.status">
    <div class="account-header">
      <span class="status-icon">{{ getStatusIcon(account.status) }}</span>
      {{ account.email }}
    </div>
    
    <div v-if="isRateLimited" class="countdown">
      ⏰ 重置倒计时: {{ formatTime(account.remainingSeconds) }}
    </div>
  </div>
</template>

<script>
export default {
  props: ['account'],
  computed: {
    isRateLimited() {
      return this.account.status === 'busy' && this.account.remainingSeconds > 0;
    }
  },
  methods: {
    getStatusIcon(status) {
      const icons = { idle: '🟢', busy: '🔴', error: '⚫' };
      return icons[status] || '❓';
    },
    formatTime(seconds) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      return `${hours}h ${minutes}m ${secs}s`;
    }
  }
}
</script>
```

### React 组件
```jsx
function AccountCard({ account }) {
  const isRateLimited = account.status === 'busy' && account.remainingSeconds > 0;
  
  const getStatusIcon = (status) => {
    const icons = { idle: '🟢', busy: '🔴', error: '⚫' };
    return icons[status] || '❓';
  };
  
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };
  
  return (
    <div className={`account-card ${account.status}`}>
      <div className="account-header">
        <span className="status-icon">{getStatusIcon(account.status)}</span>
        {account.email}
      </div>
      
      {isRateLimited && (
        <div className="countdown">
          ⏰ 重置倒计时: {formatTime(account.remainingSeconds)}
        </div>
      )}
    </div>
  );
}
```

## 🔧 配置选项

### 环境变量
```env
# 状态清理间隔 (毫秒)
STATUS_CLEANUP_INTERVAL=60000

# 默认冷却时间 (秒)
DEFAULT_COOLDOWN_SECONDS=300
```

### 自定义配置
```typescript
// 修改清理间隔
const manager = new AccountStatusManager({
  cleanupInterval: 30000, // 30秒清理一次
  defaultCooldown: 600    // 默认10分钟冷却
});
```

## 📈 监控和统计

### 实时统计
- 空闲账户数量
- 繁忙/限流账户数量
- 错误账户数量
- 平均重置时间

### 历史记录
- 状态变更日志
- 限流频率统计
- 账户可用性报告

## 🚨 告警功能

### 限流告警
```typescript
// 注册状态更新回调
accountStatusManager.onStatusUpdate((event) => {
  if (event.newStatus === AccountStatus.BUSY) {
    console.log(`⚠️ 账户 ${event.accountId} 被限流`);
    // 发送告警通知
    sendAlert({
      type: 'rate_limit',
      accountId: event.accountId,
      timestamp: event.timestamp
    });
  }
});
```

## 💡 最佳实践

### 1. 性能优化
- 使用内存缓存存储状态
- 批量更新减少数据库操作
- 定期清理过期状态

### 2. 错误处理
- 网络异常时的重试机制
- 状态不一致时的自动修复
- 异常情况的日志记录

### 3. 扩展性
- 支持自定义状态类型
- 可配置的重置时间策略
- 插件化的告警系统

## 🔮 未来扩展

### 1. 智能调度
- 基于状态的账户选择算法
- 负载均衡和故障转移
- 预测性维护

### 2. 高级监控
- 实时性能指标
- 状态变化趋势分析
- 自动化运维建议

### 3. 集群支持
- 多实例状态同步
- 分布式状态管理
- 高可用性保障

这个账户状态管理系统为你的 Claude Pool Manager 提供了完整的状态监控和管理能力，让你能够实时了解每个账户的状态，并在前端卡片上直观地显示重置时间！
