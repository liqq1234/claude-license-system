# 宝塔面板部署指南

## 🚀 宝塔部署概述

本项目已经配置为适合宝塔面板部署，利用宝塔的MySQL和Nginx，只需要Docker运行应用服务。

## 📋 部署前准备

### 1. 宝塔面板要求
- 宝塔Linux面板 7.x+
- Docker管理器插件
- MySQL 5.7+ 或 8.0+
- Redis（可选，推荐安装）

### 2. 数据库准备
在宝塔MySQL中创建两个数据库：
```sql
CREATE DATABASE license_server CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE claudehub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. 导入数据库结构
```bash
# 进入项目目录
cd /www/wwwroot/your-domain.com

# 导入activation-backend数据库结构
mysql -u root -p license_server < claude-backend/activation-backend/database/init.sql

# 导入pool-backend数据库结构  
mysql -u root -p claudehub < claude-backend/pool-backend/database/init.sql
```

## 🔧 配置步骤

### 1. 克隆项目到宝塔
```bash
cd /www/wwwroot
git clone https://github.com/liqq1234/claude-license-system.git your-domain.com
cd your-domain.com
git checkout deployment-config
```

### 2. 配置环境变量
复制并编辑Docker环境配置：
```bash
cp .env.docker .env
nano .env
```

修改以下关键配置：
```env
# 数据库配置（使用宝塔MySQL）
DB_HOST=host.docker.internal  # 如果不行，使用服务器内网IP
DB_PASSWORD=你的宝塔MySQL密码

# 域名配置
FRONTEND_ACTIVATION_API_URL=https://your-domain.com/api/activation
FRONTEND_POOL_API_URL=https://your-domain.com/api/pool
MANAGER_ACTIVATION_API_URL=https://your-domain.com/api/activation
MANAGER_POOL_API_URL=https://your-domain.com/api/pool

# 安全配置（必须修改）
JWT_SECRET=你的超长安全密钥
ADMIN_PASSWORD=你的管理员密码
```

### 3. 启动Docker服务
```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

## 🌐 宝塔反向代理配置

### 1. 添加网站
在宝塔面板添加网站：`your-domain.com`

### 2. 配置反向代理
在网站设置中添加反向代理：

#### 前端界面
- 代理名称：`claude-frontend`
- 目标URL：`http://127.0.0.1:8080`
- 发送域名：`$host`
- 代理目录：`/`

#### 管理界面  
- 代理名称：`claude-manager`
- 目标URL：`http://127.0.0.1:8081`
- 发送域名：`$host`  
- 代理目录：`/admin`

#### 激活码API
- 代理名称：`activation-api`
- 目标URL：`http://127.0.0.1:8888`
- 发送域名：`$host`
- 代理目录：`/api/activation`

#### Pool管理API
- 代理名称：`pool-api`
- 目标URL：`http://127.0.0.1:8787`
- 发送域名：`$host`
- 代理目录：`/api/pool`

### 3. Nginx配置示例
如果需要手动配置Nginx，可以参考：
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 前端界面
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # 管理界面
    location /admin {
        proxy_pass http://127.0.0.1:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # 激活码API
    location /api/activation {
        proxy_pass http://127.0.0.1:8888;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # Pool管理API
    location /api/pool {
        proxy_pass http://127.0.0.1:8787;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 🔍 故障排除

### 1. 容器无法连接MySQL
```bash
# 检查是否可以从容器内连接到宿主机MySQL
docker exec -it claude-activation-backend ping host.docker.internal

# 如果ping不通，使用服务器内网IP
ip addr show | grep inet
```

### 2. 端口冲突
```bash
# 检查端口占用
netstat -tlnp | grep -E ':(8080|8081|8787|8888|6379)'

# 修改docker-compose.yml中的端口映射
```

### 3. 权限问题
```bash
# 给予执行权限
chmod +x docker-compose
chmod -R 755 ./claude-backend
```

### 4. 查看容器日志
```bash
# 查看特定容器日志
docker logs claude-activation-backend
docker logs claude-pool-backend
docker logs claude-frontend
docker logs claude-manager
```

## 📊 服务监控

### 1. 检查服务状态
```bash
# Docker容器状态
docker-compose ps

# 系统资源使用
docker stats

# 服务健康检查
curl http://localhost:8888/status
curl http://localhost:8787/api/status
```

### 2. 宝塔监控
- 在宝塔面板监控CPU、内存使用情况
- 设置MySQL慢查询监控
- 配置磁盘空间警告

## 🔄 更新部署

```bash
# 拉取最新代码
git pull origin deployment-config

# 重新构建并启动
docker-compose down
docker-compose up -d --build

# 清理旧镜像
docker image prune -f
```

## 🎯 生产环境优化建议

1. **安全设置**
   - 修改所有默认密码
   - 配置SSL证书
   - 设置防火墙规则

2. **性能优化**
   - 调整MySQL配置
   - 配置Redis持久化
   - 设置应用日志轮转

3. **备份策略**
   - 定期备份数据库
   - 备份配置文件
   - 设置自动备份脚本

4. **监控告警**
   - 配置宝塔监控
   - 设置邮件告警
   - 监控容器健康状态
