# 24小时有效期更新总结

## 🎯 更新目标
将 Claude 会话的默认有效期从"永不过期"改为"24小时"，提高系统安全性和资源管理效率。

## 📝 具体更改

### 1. 后端配置更改

#### `.env` 文件
```bash
# 修改前
TOKEN_EXPIRES_IN=0

# 修改后  
TOKEN_EXPIRES_IN=86400  # 24小时 = 86400秒
```

#### `server.ts` 警告逻辑优化
```javascript
// 修改前
warning: expiresIn > config.TOKEN_EXPIRES_IN ? 'Token有效期已调整为最大允许值' : undefined

// 修改后
warning: expiresIn > config.TOKEN_EXPIRES_IN && config.TOKEN_EXPIRES_IN > 0 ? 
  `会话有效期已设置为 ${Math.floor(expiresIn / 3600)} 小时，超过系统默认的 ${Math.floor(config.TOKEN_EXPIRES_IN / 3600)} 小时` : 
  undefined
```

### 2. 前端代码更改

#### `Dashboard.vue` 登录请求
```javascript
// 修改前 - 随机登录
{
  mode: "random",
  unique_name: `random_user_${Date.now()}`,
  expires_in: 3600  // 硬编码1小时
}

// 修改后 - 随机登录
{
  mode: "random", 
  unique_name: `random_user_${Date.now()}`
  // 不指定 expires_in，使用后端默认值（24小时）
}

// 修改前 - 特定账户登录
{
  mode: "specific",
  account_id: account.id,
  unique_name: `user_${Date.now()}`,
  expires_in: 3600  // 硬编码1小时
}

// 修改后 - 特定账户登录
{
  mode: "specific",
  account_id: account.id, 
  unique_name: `user_${Date.now()}`
  // 不指定 expires_in，使用后端默认值（24小时）
}
```

## 🔄 生效步骤

### 1. 重启后端服务
```bash
# 使用 PowerShell 脚本
.\restart-service.ps1

# 或手动重启
pm2 restart claude-pool-backend
```

### 2. 重新构建前端（可选）
```bash
cd claude-frontend
npm run build
```

## 📊 用户体验变化

### 修改前
- **默认行为**：会话永不过期
- **用户指定1小时**：会话1小时后过期，显示警告
- **潜在问题**：僵尸会话、安全风险

### 修改后  
- **默认行为**：会话24小时后过期
- **用户指定1小时**：会话1小时后过期，无警告
- **用户指定48小时**：会话48小时后过期，显示警告
- **优势**：更安全、更合理的资源管理

## ⚠️ 警告机制

### 新的警告条件
只有当用户明确指定的有效期**超过**系统默认的24小时时，才会显示警告。

### 警告内容示例
```
"会话有效期已设置为 48 小时，超过系统默认的 24 小时"
```

## 🎯 预期效果

### 对用户的影响
1. **正常使用**：大多数用户24小时内的使用不受影响
2. **长期使用**：需要每24小时重新登录一次
3. **安全提升**：减少长期会话的安全风险

### 对系统的影响
1. **资源优化**：减少僵尸会话占用
2. **安全提升**：定期清理过期会话
3. **稳定性**：减少长期会话可能的问题

## 🔧 故障排除

### 如果用户反馈会话过期太快
```bash
# 可以调整为更长时间，如48小时
TOKEN_EXPIRES_IN=172800
```

### 如果需要更高安全性
```bash
# 可以调整为更短时间，如12小时
TOKEN_EXPIRES_IN=43200
```

### 如果需要回到永不过期
```bash
# 设置为0（不推荐）
TOKEN_EXPIRES_IN=0
```

## 📋 验证清单

- [x] 后端 `.env` 文件已更新
- [x] 后端警告逻辑已优化
- [x] 前端硬编码时间已移除
- [x] 重启脚本已创建
- [x] 配置文档已完善
- [ ] 后端服务已重启
- [ ] 功能测试已完成

## 🎉 完成后的效果

用户点击登录后：
1. 获得24小时有效期的 Claude 会话
2. 不会看到不必要的警告消息
3. 24小时后需要重新登录
4. 系统更加安全和稳定
