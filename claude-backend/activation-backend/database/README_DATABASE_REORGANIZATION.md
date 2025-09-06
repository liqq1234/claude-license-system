# 数据库表结构逻辑分区方案

## 📊 重组前后对比

### 重组前（混乱状态）
```
license_server 数据库
├── activation_batches          （激活码功能）
├── activation_codes            （激活码功能）
├── activation_logs             （激活码功能）
├── api_logs                    （系统功能）
├── device_bindings             （激活码功能）
├── duration_options            （套餐功能）
├── email_verification_codes    （用户功能）
├── operation_logs              （系统功能）
├── orders                      （支付功能）
├── packages                    （套餐功能）
├── payment_methods             （支付功能）
├── proxy_sessions              （系统功能）
├── subscription_types          （套餐功能）
├── token_pool                  （系统功能）
├── usage_records               （激活码功能）
└── user_activation_bindings    （激活码功能）
```

### 重组后（逻辑分区）
```
license_server 数据库
│
├── 📋 激活码管理模块 (LICENSE_)
│   ├── license_activation_batches     激活码批次表
│   ├── license_activation_codes       激活码主表
│   ├── license_activation_logs        激活日志表
│   ├── license_device_bindings        设备绑定表
│   ├── license_user_bindings          用户激活绑定表
│   └── license_usage_records          使用记录表
│
├── 📦 套餐管理模块 (PACKAGE_)
│   ├── package_subscription_types     套餐类型表
│   ├── package_duration_options       套餐时长配置表
│   └── package_products               套餐产品表
│
├── 💰 支付管理模块 (PAYMENT_)
│   ├── payment_methods                支付方式表
│   └── payment_orders                 订单表
│
├── ⚙️ 系统管理模块 (SYSTEM_)
│   ├── system_api_logs                API调用日志表
│   ├── system_operation_logs          操作日志表
│   ├── system_proxy_sessions          代理会话表
│   └── system_token_pool              令牌池表
│
└── 👤 用户管理模块 (USER_)
    └── user_email_verification_codes  邮箱验证码表
```

## 🔄 执行重组的步骤

### 1. 备份现有数据
```sql
-- 创建数据库备份
mysqldump -u root -p license_server > license_server_backup_20250903.sql
```

### 2. 执行表重命名
```bash
mysql -u root -p license_server < database/reorganize_tables.sql
```

### 3. 更新代码中的表名引用
需要修改以下文件中的表名：
- `src/routes/*.js` (所有路由文件)
- `src/models/*.js` (如果有模型文件)
- `src/services/*.js` (服务文件)

### 4. 创建兼容性视图
为了不影响现有代码，已在脚本中创建了视图映射：
- `activation_codes` → `license_activation_codes`
- `packages` → `package_products`
- `orders` → `payment_orders`
- 等等...

## 🎯 逻辑分区的好处

### 1. **可读性提升**
- 表名一目了然，知道功能归属
- 便于新人快速理解系统架构

### 2. **维护性增强**
- 模块化管理，修改某个功能时范围明确
- 便于数据库权限分配和访问控制

### 3. **扩展性更好**
- 新增功能时，按模块创建表
- 便于后期拆分微服务

### 4. **团队协作**
- 不同开发者负责不同模块
- 减少表名冲突和混淆

## 📝 代码修改建议

### 更新API路由文件
```javascript
// 之前
SELECT * FROM packages WHERE id = ?

// 之后
SELECT * FROM package_products WHERE id = ?
```

### 渐进式迁移
1. 先执行重命名脚本（创建视图保证兼容性）
2. 逐步更新代码使用新表名
3. 最后删除兼容性视图

## 🚀 下一步优化建议

1. **索引优化**: 为每个模块的常用查询字段添加索引
2. **分表策略**: 对于日志类表考虑按时间分表
3. **读写分离**: 日志表可以考虑单独的只读副本
4. **数据归档**: 定期归档历史数据
