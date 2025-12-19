# 灵狼Link - 简单好用的短链服务

[English](./README_EN.md) | 中文

🔗 **简单、安全、强大的短链生成工具**

基于 Next.js 16 + Prisma + SQLite 构建的现代化短链服务，支持密码保护、域名管理、访问统计等功能。

## ✨ 核心特性

- 🔗 **智能短链生成** - 自动生成或自定义路径，支持批量管理
- 🛡️ **安全防护** - 密码保护、域名白名单、二次确认机制
- ⚡ **多种跳转模式** - 直接跳转、过渡页面、手动确认、临时跳转
- 📊 **数据分析** - 访问统计、日志记录、趋势分析
- 🎨 **现代界面** - 响应式设计、中英双语、暗色主题

## � 快速安开始

### 环境要求
- Node.js 18.0+
- Bun 1.0+ (推荐) 或 npm/yarn

### 安装部署

**1. 克隆项目**
```bash
# GitHub (国际站)
git clone https://github.com/al01cn/Link.git

# Gitee (国内站) 
git clone https://gitee.com/al01/Link.git

# GitCode (国内站)
git clone https://gitcode.com/al01cn/Link.git

cd Link
```

**2. 安装依赖**
```bash
bun install
```

**3. 环境配置**
```bash
cp .env.example .env.local
# 编辑 .env.local 配置数据库和应用URL
```

**4. 初始化数据库**
```bash
bun run setup
```

**5. 启动服务**
```bash
# 开发模式
bun run dev

# 生产模式
bun run build && bun run start
```

访问 [http://localhost:3000](http://localhost:3000) 开始使用！

### 默认管理员账户
- **用户名**: `Loooong`
- **密码**: `Loooong123`

> ⚠️ 首次登录后系统会强制要求修改默认密码

## 🚀 一键部署

### Vercel 部署

点击下面按钮即可一键部署到 Vercel：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/al01cn/Link&env=DATABASE_PROVIDER,DATABASE_URL,ENCRYPTION_KEY&envDescription=数据库配置和应用密钥&envLink=https://gh.llkk.cc/https://github.com/al01cn/Link/blob/main/.env.example)

### Netlify 部署

点击下面按钮即可一键部署到 Netlify：

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/al01cn/Link)

**部署时需要配置的环境变量：**
- `DATABASE_PROVIDER` - 数据库类型（postgresql 或 mysql）
- `DATABASE_URL` - 数据库连接字符串
- `ENCRYPTION_KEY` - 密码加密密钥

> 💡 **提示**：推荐使用 [Supabase](https://supabase.com) 或 [Neon](https://neon.tech) 的免费 PostgreSQL 数据库。系统会根据 `DATABASE_PROVIDER` 自动选择正确的数据库 schema。

## 🚀 部署指南

### Serverless 平台部署

> ⚠️ **重要提醒**：在无状态 Serverless 托管平台（如 Vercel、Netlify、Railway 等）部署时，**必须将 SQLite 数据库更换为其他数据库**，因为 Serverless 环境不支持持久化文件存储。

#### 推荐的数据库选择

**1. PostgreSQL（推荐）**
```bash
# 环境变量配置
DATABASE_PROVIDER="postgresql"
DATABASE_URL="postgresql://username:password@host:5432/database"
```

**2. MySQL**
```bash
# 环境变量配置
DATABASE_PROVIDER="mysql"
DATABASE_URL="mysql://username:password@host:3306/database"
```

**3. 云数据库服务推荐**
- **Supabase** - 免费的 PostgreSQL 托管服务
- **PlanetScale** - 无服务器 MySQL 平台
- **Neon** - 现代化的 PostgreSQL 平台
- **Railway** - 支持多种数据库的云平台

#### 数据库迁移步骤

1. **更新环境变量**
   ```bash
   # 设置数据库提供商和连接字符串
   DATABASE_PROVIDER="postgresql"  # 或 "mysql"
   DATABASE_URL="postgresql://username:password@host:5432/database"
   ```

2. **重新生成 Prisma 客户端**
   ```bash
   bun run prisma generate
   ```

3. **执行数据库迁移**
   ```bash
   bun run prisma db push
   ```

> 🎯 **自动化优势**：系统会根据 `DATABASE_PROVIDER` 环境变量自动选择正确的 Prisma schema 文件，无需手动修改配置。

> 📖 **详细迁移指南**：查看 [DATABASE_MIGRATION.md](./DATABASE_MIGRATION.md) 获取完整的数据库迁移步骤和常见问题解决方案。

## 🚀 一键部署到 Netlify

点击下面按钮即可一键部署，系统会自动提示配置必需的环境变量：

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/al01cn/Link)

**部署时需要配置的环境变量：**
- `DATABASE_PROVIDER` - 数据库类型（postgresql 或 mysql）
- `DATABASE_URL` - 数据库连接字符串
- `NEXT_PUBLIC_BASE_URL` - 应用访问地址
- `ENCRYPTION_KEY` - 密码加密密钥

> 💡 **提示**：Netlify 会根据 `netlify.toml` 配置自动提示需要配置的环境变量。

### Docker 部署

```bash
# 使用 Docker Compose
docker-compose up -d

# 初始化数据库
docker-compose exec app bun run setup
```

> 📝 **Docker 部署说明**：Docker 部署支持 SQLite，因为容器提供了持久化存储。

### 环境变量配置

```bash
# 必需配置
DATABASE_PROVIDER="sqlite"                      # 数据库提供商：sqlite | postgresql | mysql
DATABASE_URL="file:./dev.db"                    # SQLite数据库连接（本地开发）
NEXT_PUBLIC_BASE_URL="http://localhost:3000"    # 应用URL
ENCRYPTION_KEY="your-secret-key"                # 加密密钥

# Serverless 部署数据库配置示例
# PostgreSQL
# DATABASE_PROVIDER="postgresql"
# DATABASE_URL="postgresql://username:password@host:5432/database"

# MySQL
# DATABASE_PROVIDER="mysql"
# DATABASE_URL="mysql://username:password@host:3306/database"

# Supabase (PostgreSQL)
# DATABASE_PROVIDER="postgresql"
# DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"

# PlanetScale (MySQL)
# DATABASE_PROVIDER="mysql"
# DATABASE_URL="mysql://[username]:[password]@[host]/[database]?sslaccept=strict"

# 可选配置
NEXT_PUBLIC_TURNSTILE_SITE_KEY="your-site-key"  # Cloudflare验证
TURNSTILE_SECRET_KEY="your-secret-key"
```

## �️A 技术栈

- **前端框架**: [Next.js 16](https://nextjs.org/) - React 全栈框架
- **数据库**: [Prisma](https://prisma.io/) + SQLite/PostgreSQL - 现代数据库工具包
- **样式**: [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- **图标**: [Lucide React](https://lucide.dev/) - 美观的图标库
- **运行时**: [Bun](https://bun.sh/) - 快速的 JavaScript 运行时
- **语言**: TypeScript - 类型安全的 JavaScript

## 📖 API 文档

详细的 API 文档请查看：
- [中文 API 文档](./API.md)
- [English API Documentation](./API_EN.md)

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

- 🐛 **问题反馈**: [GitHub Issues](https://github.com/al01cn/Link/issues)
- 💬 **功能讨论**: [GitHub Discussions](https://github.com/al01cn/Link/discussions)
- 🇨🇳 **国内用户**: [Gitee](https://gitee.com/al01/Link) | [GitCode](https://gitcode.com/al01cn/Link)

## � 致谢证

感谢以下开源项目：

- [Next.js](https://nextjs.org/) - React 全栈框架
- [Prisma](https://prisma.io/) - 现代数据库工具包
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [Lucide React](https://lucide.dev/) - 美观的图标库
- [Bun](https://bun.sh/) - 快速的 JavaScript 运行时

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。

---

<div align="center">

### 📦 开源仓库

| 平台 | 链接 | 说明 |
|------|------|------|
| **GitHub** | [al01cn/Link](https://github.com/al01cn/Link) | 国际站，功能最新 |
| **Gitee** | [al01/Link](https://gitee.com/al01/Link) | 国内镜像，访问更快 |
| **GitCode** | [al01cn/Link](https://gitcode.com/al01cn/Link) | 国内镜像，备用选择 |

**灵狼Link** - 让长链接变短，让分享更简单 ✨

[🐛 问题反馈](https://github.com/al01cn/Link/issues) • [💬 功能讨论](https://github.com/al01cn/Link/discussions) • [📖 API文档](./API.md) • [🌍 English](./README_EN.md)

</div>