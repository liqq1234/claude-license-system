# 账户卡片组件

这个目录包含了可复用的账户卡片相关组件。

## 组件列表

### 1. AccountCard.vue
单个账户卡片组件，显示账户信息和状态。

#### Props
- `account` (Object, required): 账户信息对象
  - `id`: 账户ID
  - `email`: 账户邮箱
  - `name`: 账户名称（可选）
- `status` (Object, optional): 账户状态对象
  - `status_text`: 状态文本
  - `color`: 状态颜色 ('green', 'yellow', 'red')
  - `countdown`: 倒计时
- `loading` (Boolean, optional): 是否显示加载状态

#### Events
- `click`: 当卡片被点击时触发，参数为 account 对象

#### 使用示例
```vue
<template>
  <AccountCard
    :account="account"
    :status="accountStatus"
    :loading="isLoading"
    @click="handleAccountClick"
  />
</template>

<script setup>
import AccountCard from '@/components/common/AccountCard.vue'

const account = {
  id: '1',
  email: 'test@example.com',
  name: 'Test Account'
}

const accountStatus = {
  status_text: '可用',
  color: 'yellow',
  countdown: '5:00'
}

const isLoading = false

const handleAccountClick = (account) => {
  console.log('账户被点击:', account)
}
</script>
```

### 2. AccountGrid.vue
账户网格组件，管理多个账户卡片的显示和状态。

#### Props
- `accounts` (Array, optional): 账户列表
- `loading` (Boolean, optional): 是否显示加载状态
- `error` (Boolean, optional): 是否显示错误状态

#### Events
- `account-click`: 当账户被点击时触发，参数为 account 对象
- `retry`: 当重试按钮被点击时触发

#### 暴露的方法
- `updateAccountStatus(email, newStatus)`: 更新指定账户的状态
- `setAccountLoading(email, loading)`: 设置指定账户的加载状态

#### 使用示例
```vue
<template>
  <AccountGrid
    ref="accountGridRef"
    :accounts="accounts"
    :loading="loading"
    :error="error"
    @account-click="handleAccountClick"
    @retry="fetchAccounts"
  />
</template>

<script setup>
import { ref } from 'vue'
import AccountGrid from '@/components/common/AccountGrid.vue'

const accountGridRef = ref(null)
const accounts = ref([
  {
    id: '1',
    email: 'test1@example.com',
    name: 'Test Account 1'
  },
  {
    id: '2',
    email: 'test2@example.com',
    name: 'Test Account 2'
  }
])
const loading = ref(false)
const error = ref(false)

const handleAccountClick = (account) => {
  console.log('账户被点击:', account)
  
  // 设置加载状态
  accountGridRef.value.setAccountLoading(account.email, true)
  
  // 模拟异步操作
  setTimeout(() => {
    // 更新状态
    accountGridRef.value.updateAccountStatus(account.email, {
      status_text: '可用',
      color: 'yellow',
      countdown: '5:00'
    })
    
    // 取消加载状态
    accountGridRef.value.setAccountLoading(account.email, false)
  }, 2000)
}

const fetchAccounts = () => {
  loading.value = true
  // 获取账户列表的逻辑
  setTimeout(() => {
    loading.value = false
  }, 1000)
}
</script>
```

## 特性

### 1. 响应式设计
- 自动适配不同屏幕尺寸
- 固定4列网格布局，在不同分辨率下调整间距

### 2. 状态管理
- 支持实时状态更新
- 支持加载状态显示
- 支持不同颜色的状态指示器

### 3. 调试功能
- 内置调试面板，可以查看和测试状态更新
- 支持手动测试状态更新功能
- 提供详细的控制台日志

### 4. 用户体验
- 平滑的悬停动画效果
- 加载状态的视觉反馈
- 邮箱地址自动脱敏显示

## 样式特点

### 1. Claude.ai 风格
- 温暖的色调搭配
- 渐变背景效果
- 圆角设计

### 2. 交互效果
- 悬停时的阴影和位移效果
- 加载时的旋转动画
- 状态圆点的颜色变化

### 3. 响应式布局
- 支持不同屏幕尺寸
- 自适应网格间距
- 移动端友好

## 开发注意事项

1. **组件引用**: 使用 `ref` 获取组件实例来调用暴露的方法
2. **状态更新**: 通过组件的 `updateAccountStatus` 方法更新状态，而不是直接修改数据
3. **加载状态**: 使用 `setAccountLoading` 方法控制单个账户的加载状态
4. **调试**: 可以通过调试面板实时查看和测试状态变化

## 扩展建议

1. **添加更多状态类型**: 可以扩展 status 对象支持更多状态信息
2. **自定义主题**: 可以通过 CSS 变量支持主题切换
3. **动画效果**: 可以添加更多的过渡动画效果
4. **无障碍支持**: 添加 ARIA 标签和键盘导航支持
