# 企业级日志系统迁移指南

## 概述

本文档说明如何将现有的日志系统升级到企业级安全日志系统。新系统支持：

- ✅ 时间范围筛选
- ✅ 多维度高级搜索
- ✅ 日志级别管理
- ✅ 风险级别评估
- ✅ 性能监控
- ✅ 安全审计
- ✅ 数据导出（CSV/JSON）
- ✅ 敏感信息脱敏
- ✅ 趋势分析

## 迁移步骤

### 1. 备份现有数据库

在开始迁移之前，请务必备份现有数据库：

```bash
# SQLite 数据库备份
cp prisma/dev.db prisma/dev.db.backup

# PostgreSQL 数据库备份
pg_dump your_database > backup.sql
```

### 2. 更新数据库模式

运行 Prisma 迁移以更新数据库结构：

```bash
# 生成迁移文件
bunx prisma migrate dev --name upgrade_to_enterprise_logs

# 或者直接推送模式变更（开发环境）
bunx prisma db push
```

### 3. 迁移现有日志数据

运行迁移脚本将现有日志数据更新到新格式：

```bash
bun run scripts/migrate-logs.ts
```

迁移脚本会：
- 为现有日志添加 `level`、`category`、`riskLevel` 等新字段
- 根据日志类型自动推断合适的值
- 批量处理以提高性能
- 验证迁移结果

### 4. 更新 Prisma Client

重新生成 Prisma Client 以使用新的数据库模式：

```bash
bunx prisma generate
```

### 5. 验证迁移结果

启动应用并检查日志功能：

```bash
bun run dev
```

访问管理后台的日志页面，验证：
- 现有日志是否正常显示
- 新的筛选功能是否工作
- 统计数据是否正确

## 新功能使用指南

### 使用新的日志记录器

```typescript
import Logger, { LogType, LogLevel, LogCategory, RiskLevel } from '@/lib/logger'

// 记录访问日志
await Logger.logVisit('abc123', 'https://example.com', context)

// 记录错误日志
await Logger.logError(error, context, { additionalInfo: 'value' })

// 记录安全事件
await Logger.logSecurity('failed_login', 'admin', RiskLevel.HIGH, context)

// 记录管理员操作
await Logger.logAdmin('delete_link', 'shortlink:abc123', context)

// 自定义日志
await Logger.log({
  type: LogType.SYSTEM,
  level: LogLevel.INFO,
  category: LogCategory.OPERATION,
  message: '自定义消息',
  action: 'custom_action',
  resource: 'resource_id',
  riskLevel: RiskLevel.LOW,
  tags: ['custom', 'tag']
}, context)
```

### 使用增强的日志视图组件

```typescript
import EnhancedLogsView from '@/components/EnhancedLogsView'

// 在你的组件中使用
<EnhancedLogsView isOpen={isOpen} onClose={handleClose} />
```

### API 查询示例

```bash
# 基础查询
GET /api/logs?page=1&limit=50

# 按类型筛选
GET /api/logs?type=security&level=error

# 时间范围筛选
GET /api/logs?startDate=2024-01-01&endDate=2024-01-31

# 全文搜索
GET /api/logs?search=登录失败

# 高级筛选
GET /api/logs?type=security&riskLevel=high&startDate=2024-01-01&ip=192.168.1.1

# 导出日志
GET /api/logs/export?format=csv&startDate=2024-01-01&endDate=2024-01-31

# 获取统计数据
GET /api/logs/stats
```

## 数据库索引优化

新的日志表包含以下索引以提高查询性能：

```prisma
@@index([type, createdAt])
@@index([level, createdAt])
@@index([category, createdAt])
@@index([riskLevel, createdAt])
@@index([ip, createdAt])
@@index([userId, createdAt])
```

这些索引会自动在迁移时创建。

## 性能优化建议

### 1. 定期清理旧日志

```bash
# 清理30天前的日志
DELETE /api/logs/cleanup?days=30
```

建议设置定时任务自动清理：

```bash
# 添加到 crontab
0 2 * * * curl -X DELETE http://localhost:3000/api/logs/cleanup?days=30
```

### 2. 监控数据库大小

```bash
# SQLite
du -h prisma/dev.db

# PostgreSQL
SELECT pg_size_pretty(pg_database_size('your_database'));
```

### 3. 使用分页查询

前端组件已经实现了分页，建议每页显示 50-100 条记录。

## 安全特性

### 敏感信息脱敏

日志系统会自动脱敏以下敏感字段：
- password
- token
- secret
- key
- auth
- credential
- ssn
- credit_card
- phone
- email
- address

### 风险级别评估

系统会根据日志类型和内容自动评估风险级别：
- **低风险 (low)**: 正常访问、常规操作
- **中风险 (medium)**: 错误日志、管理员操作
- **高风险 (high)**: 安全事件、异常访问
- **严重风险 (critical)**: 系统崩溃、安全攻击

## 故障排查

### 问题：迁移脚本执行失败

**解决方案**：
1. 检查数据库连接是否正常
2. 确认 Prisma schema 已更新
3. 查看错误日志获取详细信息
4. 从备份恢复后重试

### 问题：日志查询性能慢

**解决方案**：
1. 检查数据库索引是否创建成功
2. 清理过期的日志数据
3. 使用更具体的筛选条件
4. 考虑使用数据库分区

### 问题：前端组件显示异常

**解决方案**：
1. 清除浏览器缓存
2. 检查 API 响应格式是否正确
3. 查看浏览器控制台错误信息
4. 确认所有依赖已正确安装

## 回滚方案

如果需要回滚到旧版本：

```bash
# 1. 恢复数据库备份
cp prisma/dev.db.backup prisma/dev.db

# 2. 回滚 Prisma 迁移
bunx prisma migrate resolve --rolled-back <migration_name>

# 3. 重新生成 Prisma Client
bunx prisma generate

# 4. 重启应用
bun run dev
```

## 技术支持

如有问题，请查看：
- 项目 README.md
- API 文档 (API.md)
- 开发文档 (DEVELOPMENT.md)

## 更新日志

### v2.0.0 - 企业级日志系统
- ✅ 新增时间范围筛选功能
- ✅ 新增多维度高级搜索
- ✅ 新增日志级别和风险评估
- ✅ 新增性能监控指标
- ✅ 新增数据导出功能
- ✅ 新增敏感信息脱敏
- ✅ 新增趋势分析图表
- ✅ 优化数据库索引
- ✅ 改进查询性能

---

**重要提示**：迁移前请务必备份数据库！