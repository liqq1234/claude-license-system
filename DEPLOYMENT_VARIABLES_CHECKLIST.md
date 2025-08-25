# 🚨 部署前必须修改的环境变量清单

## 📋 概述

在部署到生产环境前，以下环境变量**必须**修改为你自己的配置，否则会导致安全问题或服务无法正常运行。

---

## 🔐 安全相关（必须修改）

### 1. JWT密钥配置
```env
# 🚨 必须修改：JWT签名密钥（两个后端服务必须使用相同值）
JWT_SECRET=your_production_jwt_secret_very_long_and_secure
```
**用途**：用于JWT token的签名和验证  
**默认值**：`dev-jwt-secret-key`  
**修改建议**：使用64位以上的随机字符串  
**生成方法**：`openssl rand -base64 64`

### 2. 激活码密钥
```env
# 🚨 必须修改：激活码签名密钥
LICENSE_SECRET=your_production_license_secret_here
```
**用途**：激活码生成和验证的签名密钥  
**默认值**：`dev-license-secret`  
**修改建议**：使用32位以上的随机字符串

### 3. Token加密密钥
```env
# 🚨 必须修改：Token加密密钥
TOKEN_ENCRYPTION_KEY=your_production_token_encryption_key_here
```
**用途**：Token池服务中token的加密存储  
**默认值**：`dev-token-encryption-key`  
**修改建议**：使用32位字符串

---

## 🗄️ 数据库配置（必须修改）

### 1. MySQL配置
```env
# 🚨 必须修改：数据库连接信息
DB_HOST=localhost                    # 宝塔MySQL主机（通常是localhost或内网IP）
DB_PORT=3306                        # MySQL端口（通常是3306）
DB_USER=root                        # 数据库用户名
DB_PASSWORD=your_baota_mysql_password  # 🚨 必须修改：你的宝塔MySQL密码
```
**用途**：连接宝塔面板的MySQL数据库  
**修改建议**：使用宝塔面板中设置的MySQL root密码

### 2. Redis配置
```env
# 🚨 必须修改：Redis密码
REDIS_PASSWORD=your_redis_password
```
**用途**：Redis缓存服务的密码保护  
**默认值**：`123456`  
**修改建议**：使用强密码

---

## 📧 邮件服务配置（必须修改）

```env
# 🚨 必须修改：邮件服务配置
SMTP_HOST=smtp.163.com                          # 邮件服务器（可保持163）
SMTP_PORT=465                                   # 端口（可保持465）
SMTP_USER=your_production_email@163.com        # 🚨 你的邮箱地址
SMTP_PASS=your_production_smtp_code             # 🚨 你的邮箱授权码
```
**用途**：发送邮件验证码和通知邮件  
**修改建议**：
- 使用你的真实邮箱地址
- SMTP_PASS是邮箱的SMTP授权码，不是登录密码
- 163邮箱授权码获取：邮箱设置 → POP3/SMTP/IMAP → 开启SMTP服务

---

## 🌐 域名和URL配置（必须修改）

### 1. Claude服务地址
```env
# 🚨 必须修改：Claude服务基础URL
BASE_URL=https://claude.lqqmail.xyz
CLAUDE_BASE_URL=https://claude.lqqmail.xyz
CLAUDE_PROXY_DOMAIN=claude.lqqmail.xyz
```
**用途**：Claude AI服务的访问地址  
**修改建议**：如果你有自己的Claude镜像服务，修改为你的域名

### 2. 前端API地址
```env
# 🚨 必须修改：前端访问的API地址
FRONTEND_ACTIVATION_API_URL=https://your-domain.com/api/activation
FRONTEND_POOL_API_URL=https://your-domain.com/api/pool

# 🚨 必须修改：管理器访问的API地址  
MANAGER_ACTIVATION_API_URL=https://your-domain.com/api/activation
MANAGER_POOL_API_URL=https://your-domain.com/api/pool
```
**用途**：前端和管理器界面访问后端API的地址  
**修改建议**：替换 `your-domain.com` 为你的实际域名

---

## 📝 配置文件修改清单

### 1. 修改 `.env` 文件
```bash
# 复制模板文件
cp .env.docker .env

# 编辑配置文件
nano .env
```

### 2. 必须修改的配置项
```env
# 数据库（使用你的宝塔MySQL密码）
DB_PASSWORD=你的宝塔MySQL密码

# 安全密钥（全部修改为随机强密钥）
JWT_SECRET=生成的64位随机字符串
LICENSE_SECRET=生成的32位随机字符串  
TOKEN_ENCRYPTION_KEY=生成的32位随机字符串
REDIS_PASSWORD=你的Redis强密码

# 邮件服务（使用你的邮箱）
SMTP_USER=你的邮箱@163.com
SMTP_PASS=你的邮箱SMTP授权码

# 域名（替换为你的域名）
FRONTEND_ACTIVATION_API_URL=https://你的域名.com/api/activation
FRONTEND_POOL_API_URL=https://你的域名.com/api/pool
MANAGER_ACTIVATION_API_URL=https://你的域名.com/api/activation
MANAGER_POOL_API_URL=https://你的域名.com/api/pool
```

---

## 🛠️ 密钥生成工具

### 1. 生成随机密钥
```bash
# 生成64位JWT密钥
openssl rand -base64 64

# 生成32位密钥
openssl rand -base64 32

# 如果没有openssl，使用在线工具：
# https://www.random.org/strings/
```

### 2. 在线密钥生成器
- JWT密钥：https://jwtsecret.com/generate
- 随机字符串：https://www.random.org/strings/

---

## ⚠️ 安全提醒

1. **不要在公开仓库中提交包含真实密码的.env文件**
2. **所有默认密码都必须修改**
3. **JWT_SECRET在activation-backend和pool-backend中必须相同**
4. **生产环境密码要足够复杂**
5. **定期更换密钥和密码**

---

## ✅ 配置验证

修改完成后，可以通过以下方式验证配置：

```bash
# 检查配置文件语法
cat .env | grep -v '^#' | grep -v '^$'

# 启动服务并检查日志
docker-compose up -d
docker-compose logs -f

# 检查服务是否正常启动
docker-compose ps
```

**配置正确的标志**：
- 所有服务状态为 `Up`
- 日志中没有密码错误
- 可以正常访问前端界面
- API接口返回正常
