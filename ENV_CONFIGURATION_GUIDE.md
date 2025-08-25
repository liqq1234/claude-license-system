# 环境变量配置指南

## 概述

本项目包含四个主要服务，每个服务都有自己的环境变量配置：

1. **activation-backend** - 激活码后端服务
2. **pool-backend** - Claude池管理后端服务  
3. **claude-frontend** - 用户前端界面
4. **claude-manager** - 管理员界面

## 关键环境变量说明

### 🔐 安全相关（生产环境必须修改）

| 变量名 | 服务 | 说明 | 示例 |
|--------|------|------|------|
| `JWT_SECRET` | activation-backend, pool-backend | JWT签名密钥 | `your-very-long-secure-secret-key` |
| `LICENSE_SECRET` | activation-backend | 许可证签名密钥 | `your-license-secret-key` |
| `TOKEN_ENCRYPTION_KEY` | activation-backend | Token加密密钥 | `your-32-char-encryption-key` |
| `ADMIN_KEY` | activation-backend | 管理员密钥 | `your-admin-secret-key` |
| `ADMIN_PASSWORD` | pool-backend | 管理员密码 | `your-strong-admin-password` |

### 🗄️ 数据库配置

| 变量名 | 服务 | 说明 | 开发环境 | 生产环境 |
|--------|------|------|----------|----------|
| `DB_HOST` | activation-backend, pool-backend | 数据库主机 | `localhost` | 生产服务器IP |
| `DB_PORT` | activation-backend, pool-backend | 数据库端口 | `3306` | `3306` |
| `DB_USER` | activation-backend, pool-backend | 数据库用户 | `root` | 专用用户 |
| `DB_PASSWORD` | activation-backend, pool-backend | 数据库密码 | 开发密码 | 强密码 |
| `DB_NAME` | activation-backend, pool-backend | 数据库名 | `license_server/claudehub` | 同左 |

### 🔴 Redis配置

| 变量名 | 服务 | 说明 | 开发环境 | 生产环境 |
|--------|------|------|----------|----------|
| `REDIS_HOST` | activation-backend | Redis主机 | `localhost` | Redis服务器IP |
| `REDIS_PORT` | activation-backend | Redis端口 | `6379` | `6379` |
| `REDIS_PASSWORD` | activation-backend | Redis密码 | `123456` | 强密码 |
| `REDIS_DB` | activation-backend | Redis数据库 | `0` | `0` |

### 📧 邮件服务配置

| 变量名 | 服务 | 说明 | 
|--------|------|------|
| `SMTP_HOST` | activation-backend | SMTP服务器 |
| `SMTP_PORT` | activation-backend | SMTP端口 |
| `SMTP_USER` | activation-backend | 邮箱地址 |
| `SMTP_PASS` | activation-backend | 邮箱授权码 |

### 🌐 服务间通信

| 变量名 | 服务 | 说明 | 开发环境 | 生产环境 |
|--------|------|------|----------|----------|
| `BASE_URL` | pool-backend | Claude服务地址 | `https://claude.lqqmail.xyz` | 实际域名 |
| `POOL_BACKEND_URL` | activation-backend | Pool后端地址 | `http://localhost:8787` | 内网地址 |
| `LICENSE_SERVER_URL` | pool-backend | License服务地址 | `http://localhost:8888` | 内网地址 |

### 🖥️ 前端API配置

| 变量名 | 服务 | 说明 | 开发环境 | 生产环境 |
|--------|------|------|----------|----------|
| `VITE_ACTIVATION_API_URL` | claude-frontend, claude-manager | 激活码API地址 | `http://localhost:8888` | `https://domain:8888` |
| `VITE_CLAUDE_POOL_API_URL` | claude-frontend, claude-manager | Claude Pool API地址 | `http://localhost:8787` | `https://domain:8787` |

## 环境配置文件

### 开发环境
- `claude-backend/activation-backend/.env.development`
- `claude-backend/pool-backend/.env.development`
- `claude-frontend/.env.development`
- `claude-manager/.env.development`

### 生产环境
- `claude-backend/activation-backend/.env.production`
- `claude-backend/pool-backend/.env.production`
- `claude-frontend/.env.production`
- `claude-manager/.env.production`

## 部署检查清单

### ✅ 生产环境部署前必须检查：

1. **安全配置**
   - [ ] 所有密钥都已更换为强密码
   - [ ] JWT_SECRET在activation-backend和pool-backend中保持一致
   - [ ] 数据库密码足够强

2. **服务配置**
   - [ ] BASE_URL指向正确的Claude服务
   - [ ] 所有API地址配置正确
   - [ ] 端口配置符合生产环境

3. **数据库配置**
   - [ ] 数据库连接信息正确
   - [ ] Redis连接信息正确
   - [ ] 连接池配置合理

4. **前端配置**
   - [ ] API地址指向生产环境
   - [ ] 调试选项已关闭
   - [ ] 应用信息正确

## 常见问题

### Q: 服务启动失败，提示数据库连接错误
A: 检查DB_HOST, DB_PORT, DB_USER, DB_PASSWORD是否正确

### Q: JWT token验证失败
A: 确保activation-backend和pool-backend使用相同的JWT_SECRET

### Q: Redis连接失败
A: 检查REDIS_HOST, REDIS_PORT, REDIS_PASSWORD配置

### Q: 前端无法访问API
A: 检查VITE_ACTIVATION_API_URL和VITE_CLAUDE_POOL_API_URL是否正确
