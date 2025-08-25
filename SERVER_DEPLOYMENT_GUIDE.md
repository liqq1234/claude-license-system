# 🚀 服务器部署指南

## 📋 部署前准备

### 1. 服务器环境要求
- Docker 和 Docker Compose
- Git
- 已配置MySQL数据库（宝塔面板）
- 已配置Redis（可选，容器会自动启动）

### 2. 域名和反向代理配置
- 确保域名 `admin.lqqmail.xyz` 已解析到服务器
- 宝塔面板中配置反向代理：
  - `/activation/` → `http://127.0.0.1:8888/`
  - `/pool/` → `http://127.0.0.1:8787/`

## 🔧 部署步骤

### 1. 拉取代码
```bash
# 方式1：直接克隆 deployment-config 分支
git clone -b deployment-config https://github.com/liqq1234/claude-license-system.git claude-project

# 方式2：如果已有代码，切换分支
cd claude-project
git fetch origin
git checkout deployment-config
git pull origin deployment-config
```

### 2. 配置环境变量
```bash
cd claude-project

# 将Docker配置文件重命名为标准环境文件
cp .env.docker .env

# 检查配置是否正确
cat .env
```

### 3. 启动服务
```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

## 📊 服务端口说明

| 服务 | 容器端口 | 宿主机端口 | 说明 |
|------|----------|------------|------|
| activation-backend | 8888 | 8888 | 激活码后端API |
| pool-backend | 8787 | 8787 | 池管理后端API |
| claude-frontend | 80 | 8081 | 前端用户界面 |
| claude-manager | 80 | 8082 | 管理员界面 |
| redis | 6379 | 6379 | Redis缓存 |

## 🌐 访问地址

### 通过反向代理访问（推荐）
- **前端用户界面**: `https://admin.lqqmail.xyz:8081`
- **管理员界面**: `https://admin.lqqmail.xyz:8082`
- **API接口**: 通过反向代理自动路由

### 直接访问（调试用）
- **前端**: `http://服务器IP:8081`
- **管理员**: `http://服务器IP:8082`
- **激活API**: `http://服务器IP:8888`
- **池管理API**: `http://服务器IP:8787`

## 🔍 部署验证

### 1. 检查容器状态
```bash
docker-compose ps
# 应显示所有服务为 Up 状态
```

### 2. 检查端口占用
```bash
netstat -tlnp | grep -E '(8081|8082|8787|8888|6379)'
```

### 3. 测试API连接
```bash
# 测试激活后端
curl http://localhost:8888/status

# 测试池管理后端
curl http://localhost:8787/api/status
```

### 4. 访问前端界面
- 打开浏览器访问: `https://admin.lqqmail.xyz:8081`
- 管理员界面: `https://admin.lqqmail.xyz:8082`

## 🛠️ 常用管理命令

```bash
# 停止所有服务
docker-compose down

# 重启服务
docker-compose restart

# 查看实时日志
docker-compose logs -f [service_name]

# 更新代码并重新部署
git pull origin deployment-config
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 清理未使用的镜像
docker system prune -a
```

## 🚨 故障排除

### 1. 容器启动失败
```bash
# 查看详细日志
docker-compose logs [service_name]

# 检查配置文件
cat .env
```

### 2. 数据库连接失败
- 检查 `.env` 中的数据库配置
- 确认数据库用户权限
- 验证数据库服务是否运行

### 3. Redis连接失败
```bash
# 检查Redis容器
docker-compose logs redis

# 测试Redis连接
docker exec -it claude-redis redis-cli ping
```

### 4. 反向代理问题
- 检查宝塔面板中的反向代理配置
- 确认域名解析正确
- 验证SSL证书配置

## 📝 配置说明

当前配置适用于：
- ✅ 宝塔面板 + MySQL
- ✅ Docker Compose 部署
- ✅ 反向代理设置
- ✅ 安全密钥已配置
- ✅ 生产环境优化

如需修改配置，请编辑 `.env` 文件后重启服务：
```bash
docker-compose restart
```
