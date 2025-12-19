# 企业级日志系统部署指南

## 🎉 重构完成

企业级日志系统重构已完成！新系统支持时间筛选、高级搜索、安全审计等企业级功能。

## 📋 部署步骤

### 方法一：自动部署（推荐）

```bash
# 运行自动部署脚本
bun run scripts/deploy-enterprise-logs.ts
```

### 方法二：手动部署

```bash
# 1. 备份数据库（重要！）
cp prisma/dev.db prisma/dev.db.backup-$(date +%Y%m%d_%H%M%S)

# 2. 更新数据库模式
bunx prisma db push

# 3. 重新生成 Prisma Client
bunx prisma generate

# 4. 迁移现有日志数据
bun run scripts/migrate-logs.ts

# 5. 验证构建
bun run build

# 6. 启动应用
bun run dev
```

## ✅ 验证部署

### 1. 检查 API 端点

```bash
# 获取日志列表
curl "http://localhost:3000/api/logs?page=1&limit=10"

# 获取统计数据
curl "http://localhost:3000/api/logs/stats"

# 测试时间筛选
curl "http://localhost:3000/api/logs?startDate=2024-01-01&endDate=2024-12-31"

# 测试导出功能
curl "http://localhost:3000/api/logs/export?format=csv" -o logs.csv
```

### 2. 检查前端界面

1. 访问管理后台
2. 打开日志管理页面
3. 测试以下功能：
   - ✅ 时间范围选择
   - ✅ 高级筛选
   - ✅ 搜索功能
   - ✅ 数据导出
   - ✅ 统计图表

## 🔧 新功能使用

### 时间筛选

```typescript
// 查询最近7天的日志
const logs = await fetch('/api/logs?startDate=2024-01-01&endDate=2024-01-07')

// 快速时间范围
- 今天
- 昨天  
- 最近7天
- 最近30天
- 本月
```

### 高级搜索

```typescript
// 多维度筛选
const logs = await fetch('/api/logs?' + new URLSearchParams({
  type: 'security',        // 日志类型
  level: 'error',          // 日志级别
  riskLevel: 'high',       // 风险级别
  search: '登录失败',       // 全文搜索
  ip: '192.168.1.1',       // IP筛选
  startDate: '2024-01-01', // 开始时间
  endDate: '2024-01-31'    // 结束时间
}))
```

### 数据导出

```typescript
// 导出 CSV
const csvData = await fetch('/api/logs/export?format=csv&startDate=2024-01-01')

// 导出 JSON
const jsonData = await fetch('/api/logs/export?format=json&type=security')
```

### 使用新的日志记录器

```typescript
import Logger, { LogType, LogLevel, RiskLevel } from '@/lib/logger'

// 记录访问日志
await Logger.logVisit('abc123', 'https://example.com', context)

// 记录安全事件
await Logger.logSecurity('failed_login', 'admin', RiskLevel.HIGH, context)

// 自定义日志
await Logger.log({
  type: LogType.ADMIN,
  level: LogLevel.WARN,
  message: '管理员操作',
  action: 'delete_link',
  resource: 'shortlink:abc123',
  riskLevel: RiskLevel.MEDIUM,
  tags: ['admin', 'delete']
}, context)
```

## 🛡️ 安全特性

### 敏感信息脱敏

系统会自动脱敏以下敏感字段：
- password, token, secret, key
- auth, credential  
- ssn, credit_card
- phone, email, address

### 风险级别评估

- **低风险 (low)**: 正常访问、常规操作
- **中风险 (medium)**: 错误日志、管理员操作  
- **高风险 (high)**: 安全事件、异常访问
- **严重风险 (critical)**: 系统崩溃、安全攻击

## 📊 性能优化

### 数据库索引

新系统包含以下性能优化索引：

```prisma
@@index([type, createdAt])
@@index([level, createdAt])  
@@index([category, createdAt])
@@index([riskLevel, createdAt])
@@index([ip, createdAt])
@@index([userId, createdAt])
```

### 查询优化

- 分页查询（默认50条/页，最大200条/页）
- 时间范围索引优化
- 缓存统计数据
- 批量操作支持

## 🔄 维护任务

### 定期清理

```bash
# 清理30天前的日志
curl -X DELETE "http://localhost:3000/api/logs/cleanup?days=30"

# 设置定时任务（Linux/Mac）
echo "0 2 * * * curl -X DELETE http://localhost:3000/api/logs/cleanup?days=30" | crontab -
```

### 监控建议

```bash
# 监控日志表大小
du -h prisma/dev.db

# 监控查询性能
tail -f logs/application.log | grep "slow query"

# 检查错误日志
curl "http://localhost:3000/api/logs?level=error&limit=10"
```

## 🚨 故障排查

### 常见问题

**问题1**: 迁移脚本执行失败
```bash
# 解决方案
1. 检查数据库连接
2. 确认 Prisma schema 已更新
3. 从备份恢复后重试
```

**问题2**: 日志查询性能慢
```bash
# 解决方案  
1. 检查数据库索引
2. 清理过期日志
3. 使用更具体的筛选条件
```

**问题3**: 前端组件显示异常
```bash
# 解决方案
1. 清除浏览器缓存
2. 检查 API 响应格式
3. 查看浏览器控制台错误
```

### 回滚方案

如需回滚到旧版本：

```bash
# 1. 恢复数据库备份
cp prisma/dev.db.backup prisma/dev.db

# 2. 回滚代码（如果使用 Git）
git checkout HEAD~1

# 3. 重新生成 Prisma Client
bunx prisma generate

# 4. 重启应用
bun run dev
```

## 📚 相关文档

- [企业级日志系统总结](./ENTERPRISE_LOG_SYSTEM_SUMMARY.md)
- [迁移指南](./ENTERPRISE_LOG_MIGRATION.md)
- [API 文档](./API.md)
- [开发文档](./DEVELOPMENT.md)

## 🎯 下一步

部署完成后，建议：

1. **配置监控**: 设置日志告警和性能监控
2. **用户培训**: 培训管理员使用新的日志功能
3. **定期维护**: 设置自动清理和备份任务
4. **安全审计**: 定期检查安全日志和风险事件

---

**🎉 恭喜！企业级日志系统部署完成！**

现在您拥有了一个功能完整、安全可靠的企业级日志管理系统。