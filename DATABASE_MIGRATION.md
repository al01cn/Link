# 数据库迁移指南

本指南详细说明如何将灵狼Link从SQLite迁移到其他数据库，特别是在Serverless平台部署时的必要步骤。

## 🚨 为什么需要迁移数据库？

**Serverless平台限制**：
- Vercel、Netlify、Railway等无状态托管平台不支持持久化文件存储
- SQLite数据库文件在每次部署后会被重置
- 必须使用外部数据库服务来保证数据持久性

## 📋 支持的数据库

### PostgreSQL（推荐）
- ✅ 功能完整，性能优秀
- ✅ 免费服务：Supabase、Neon、Railway
- ✅ 与SQLite语法最接近，迁移简单

### MySQL
- ✅ 广泛支持，稳定可靠
- ✅ 免费服务：PlanetScale、Railway
- ⚠️ 部分语法差异需要注意

## 🔄 迁移步骤

### 步骤1：选择数据库服务

#### Supabase（PostgreSQL）- 推荐
1. 访问 [supabase.com](https://supabase.com)
2. 创建免费账户和新项目
3. 在项目设置中获取数据库连接字符串
4. 格式：`postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres`

#### PlanetScale（MySQL）
1. 访问 [planetscale.com](https://planetscale.com)
2. 创建免费账户和数据库
3. 创建分支和连接字符串
4. 格式：`mysql://[username]:[password]@[host]/[database]?sslaccept=strict`

#### Neon（PostgreSQL）
1. 访问 [neon.tech](https://neon.tech)
2. 创建免费账户和数据库
3. 获取连接字符串
4. 格式：`postgresql://[user]:[password]@[neon_hostname]/[dbname]?sslmode=require`

### 步骤2：更新环境变量

编辑 `.env` 或 `.env.local` 文件：

```bash
# 设置数据库提供商和连接字符串
DATABASE_PROVIDER="postgresql"  # 或 "mysql"
DATABASE_URL="postgresql://your-connection-string"
```

### 步骤3：处理数据库差异

#### PostgreSQL迁移
无需修改，Prisma会自动处理差异。

#### MySQL迁移
可能需要调整以下内容：

1. **UUID字段**：MySQL需要确保UUID格式正确
2. **文本长度**：某些字段可能需要指定长度限制

```prisma
// 示例：为MySQL添加长度限制
model ShortLink {
  id           String   @id @default(uuid()) @db.VarChar(36)
  path         String   @unique @db.VarChar(255)
  originalUrl  String   @db.Text
  title        String?  @db.VarChar(500)
  // ... 其他字段
}
```

### 步骤4：重新生成客户端

```bash
# 重新生成Prisma客户端
bun run prisma generate
```

### 步骤5：执行数据库迁移

```bash
# 推送数据库结构到新数据库
bun run prisma db push

# 或者使用迁移（推荐生产环境）
bun run prisma migrate dev --name init
```

### 步骤6：初始化数据

```bash
# 运行初始化脚本
bun run setup
```

## 🔧 常见问题解决

### 问题1：连接超时
**解决方案**：
- 检查数据库服务是否正常运行
- 确认网络连接和防火墙设置
- 验证连接字符串格式是否正确

### 问题2：权限错误
**解决方案**：
- 确认数据库用户具有创建表的权限
- 检查SSL/TLS配置是否正确

### 问题3：字符编码问题
**解决方案**：
- 确保数据库使用UTF-8编码
- 在连接字符串中指定字符集

```bash
# MySQL示例
DATABASE_URL="mysql://user:pass@host/db?charset=utf8mb4"

# PostgreSQL示例
DATABASE_URL="postgresql://user:pass@host/db?schema=public"
```

## 📊 性能优化建议

### 索引优化
```prisma
model ShortLink {
  path         String   @unique @db.VarChar(255)
  originalUrl  String   @db.Text
  createdAt    DateTime @default(now())
  
  @@index([createdAt])
  @@index([path, createdAt])
}
```

### 连接池配置
```bash
# PostgreSQL连接池
DATABASE_URL="postgresql://user:pass@host/db?connection_limit=10&pool_timeout=20"

# MySQL连接池
DATABASE_URL="mysql://user:pass@host/db?connection_limit=10&pool_timeout=20"
```

## 🚀 部署验证

### 本地测试
```bash
# 测试数据库连接
bun run prisma db pull

# 运行应用
bun run dev
```

### 生产部署
1. 在托管平台设置环境变量
2. 确认数据库连接正常
3. 运行初始化脚本
4. 测试核心功能

## 📝 备份与恢复

### 数据备份
```bash
# PostgreSQL备份
pg_dump $DATABASE_URL > backup.sql

# MySQL备份
mysqldump --single-transaction --routines --triggers $DATABASE_URL > backup.sql
```

### 数据恢复
```bash
# PostgreSQL恢复
psql $DATABASE_URL < backup.sql

# MySQL恢复
mysql $DATABASE_URL < backup.sql
```

## 🔗 相关资源

- [Prisma数据库连接器文档](https://www.prisma.io/docs/concepts/database-connectors)
- [Supabase快速开始](https://supabase.com/docs/guides/getting-started)
- [PlanetScale文档](https://planetscale.com/docs)
- [Neon文档](https://neon.tech/docs)

---

如有问题，请在 [GitHub Issues](https://github.com/al01cn/Link/issues) 中反馈。