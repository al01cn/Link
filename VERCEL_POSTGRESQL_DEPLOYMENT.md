# Vercel PostgreSQL 部署指南

## 问题描述
在 Vercel 上部署时遇到错误：`The table 'public.Admin' does not exist in the current database`

这是因为项目本地使用 SQLite，但 Vercel 部署需要使用 PostgreSQL，且数据库表尚未创建。

## 解决步骤

### 1. 准备 PostgreSQL 数据库
首先需要一个 PostgreSQL 数据库，推荐使用：
- **Supabase**（免费额度充足）
- **Neon**（专为 Serverless 优化）
- **PlanetScale**（MySQL，但也支持）
- **Railway**
- **Render**

### 2. 设置环境变量
在 Vercel 项目设置中添加以下环境变量：

```bash
DATABASE_PROVIDER=postgresql
DATABASE_URL=你的PostgreSQL连接字符串
NEXT_PUBLIC_BASE_URL=https://你的域名.vercel.app
ENCRYPTION_KEY=你的加密密钥（32位随机字符串）
```

**PostgreSQL 连接字符串示例：**
```bash
# Supabase
DATABASE_URL="postgresql://postgres:[密码]@db.[项目ID].supabase.co:5432/postgres"

# Neon
DATABASE_URL="postgresql://[用户名]:[密码]@[主机名]/[数据库名]?sslmode=require"
```

### 3. 更新构建配置
项目已配置专门的 Vercel 构建命令：

**在 Vercel 项目设置中设置：**
- Build Command: `bun run build:vercel`
- Install Command: `bun install`

### 4. 重新部署
设置完环境变量后，重新部署项目。构建过程会：
1. 设置 PostgreSQL schema
2. 生成 Prisma 客户端
3. 推送数据库结构（创建表）
4. 初始化默认数据
5. 构建 Next.js 应用

### 5. 验证部署
部署成功后，访问 `/admin` 页面，使用默认账号登录：
- 用户名：`Loooong`
- 密码：`Loooong123`

**⚠️ 重要：首次登录后请立即修改密码！**

## 常见问题

### Q: 构建时间过长怎么办？
A: Vercel 免费版有构建时间限制，如果超时可以：
1. 使用更轻量的数据库初始化
2. 考虑升级到 Pro 版本
3. 使用其他部署平台

### Q: 数据库连接失败？
A: 检查：
1. DATABASE_URL 格式是否正确
2. 数据库服务是否正常运行
3. 网络连接是否允许（某些数据库需要白名单）

### Q: 如何重置数据库？
A: 在本地运行：
```bash
# 设置 PostgreSQL 环境
export DATABASE_PROVIDER=postgresql
export DATABASE_URL="你的数据库连接字符串"

# 重置数据库
bun run db:reset
bun run db:init
```

## 备注
- 本地开发仍使用 SQLite
- 生产环境自动切换到 PostgreSQL
- 迁移文件已针对不同数据库类型优化