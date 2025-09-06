# 激活码系统升级说明

## 🎯 新增功能概述

本次升级为激活码系统添加了对 **Claude** 和 **Midjourney** 服务的原生支持，并引入了 **全能激活码** 概念。

## 📋 支持的服务类型

### 核心服务类型
- **`claude`** - Claude AI助手专用激活码
- **`midjourney`** - Midjourney AI绘图专用激活码  
- **`universal`** - 全能激活码（支持 Claude 和 Midjourney）

### 兼容服务类型（保留）
- **`gamma`** - Gamma设计工具
- **`figma`** - Figma设计工具
- **`canva`** - Canva设计平台
- **`premium`** - 高级会员

## 🔧 API 接口变更

### 1. 生成激活码 (管理员)
```bash
POST /api/activation/admin/generate
```

**新增支持的 serviceType 值:**
```json
{
  "count": 10,
  "serviceType": "claude",        // Claude专用
  "serviceType": "midjourney",    // Midjourney专用  
  "serviceType": "universal",     // 全能激活码
  "validDays": 30,
  "maxUsagePerCode": 100,
  "description": "Claude AI助手激活码"
}
```

### 2. 兑换激活码 (用户)
```bash
POST /api/activation/redeem
```

**激活码兼容性规则:**
- **Claude激活码** → 只能兑换 `claude` 服务
- **Midjourney激活码** → 只能兑换 `midjourney` 服务
- **全能激活码** → 可以兑换 `claude` 或 `midjourney` 服务

```json
{
  "code": "ABCD-EFGH-IJKL",
  "serviceType": "claude"         // 用户选择要激活的服务
}
```

### 3. 获取服务类型列表
```bash
GET /api/activation/service-types              // 公共接口
GET /api/activation/admin/service-types        // 管理员接口
```

**返回数据结构:**
```json
{
  "status": 0,
  "data": {
    "serviceTypes": [
      {
        "value": "claude",
        "name": "Claude AI助手",
        "category": "ai-assistant",
        "description": "Claude AI智能对话助手专用激活码",
        "defaultValidDays": 30,
        "defaultMaxUsage": 100,
        "isPrimary": true,
        "isLegacy": false
      }
    ],
    "categories": {
      "ai-assistant": {
        "name": "AI助手",
        "description": "AI智能对话助手服务",
        "services": [...]
      }
    },
    "compatibility": {
      "universal": ["claude", "midjourney"],
      "claude": ["claude"],
      "midjourney": ["midjourney"]
    }
  }
}
```

## 🗄️ 数据库变更

### 迁移脚本
运行数据库迁移脚本以支持新服务类型：

```sql
-- 执行迁移
mysql -u username -p database_name < database/migration_add_service_types.sql
```

### 字段说明
- `service_type` 字段支持新增值：`claude`, `midjourney`, `universal`
- 添加了新的索引以优化查询性能
- 保持向后兼容，现有数据不受影响

## 🧪 测试方法

### 使用测试页面
打开 `test-new-activation-system.html` 进行功能测试：

```bash
# 启动激活码后端服务
cd claude-backend/activation-backend
node index.js

# 在浏览器中打开测试页面
open test-new-activation-system.html
```

### 测试场景

1. **场景1: Claude专用激活码**
   - 生成 `claude` 类型激活码
   - 用户兑换时选择 `claude` 服务 ✅
   - 用户兑换时选择 `midjourney` 服务 ❌

2. **场景2: Midjourney专用激活码**
   - 生成 `midjourney` 类型激活码
   - 用户兑换时选择 `midjourney` 服务 ✅
   - 用户兑换时选择 `claude` 服务 ❌

3. **场景3: 全能激活码**
   - 生成 `universal` 类型激活码
   - 用户兑换时选择 `claude` 服务 ✅
   - 用户兑换时选择 `midjourney` 服务 ✅

## 🔄 兼容性说明

### 向后兼容
- 现有的 `gamma`, `figma`, `canva`, `premium` 激活码正常工作
- 现有API接口保持不变
- 现有数据库数据完全兼容

### 前端集成
前端需要更新以支持新的服务类型选择：

```javascript
// 获取支持的服务类型
const response = await fetch('/api/activation/service-types');
const { data } = await response.json();

// 渲染服务类型选择器
data.serviceTypes.forEach(service => {
  if (service.isPrimary) {
    // 显示为主要选项
    console.log(`${service.name} (推荐)`);
  }
});
```

## 🚀 部署步骤

1. **备份数据库**
   ```bash
   mysqldump -u username -p database_name > backup.sql
   ```

2. **更新代码**
   ```bash
   git pull origin main
   npm install  # 如有新依赖
   ```

3. **执行数据库迁移**
   ```bash
   mysql -u username -p database_name < database/migration_add_service_types.sql
   ```

4. **重启服务**
   ```bash
   pm2 restart activation-backend
   ```

5. **验证功能**
   - 测试新API接口
   - 验证激活码生成和兑换
   - 检查统计数据正确性

## 📊 监控和统计

新的统计接口会按服务类型分类显示：
- Claude激活码使用情况
- Midjourney激活码使用情况
- 全能激活码使用情况
- 各服务类型的兑换成功率

## ⚠️ 注意事项

1. **服务类型验证** - 系统会严格验证激活码与服务类型的兼容性
2. **用户体验** - 建议前端明确显示激活码适用的服务类型
3. **错误处理** - 兑换不兼容激活码时会返回明确的错误信息
4. **性能优化** - 新增的数据库索引可提升查询性能

## 🔗 相关文件

- **服务配置**: `src/services/activationService.js`
- **路由定义**: `src/routes/activation.js`
- **数据库迁移**: `database/migration_add_service_types.sql`
- **测试页面**: `test-new-activation-system.html`

---

如有问题，请检查日志文件或联系开发团队。
