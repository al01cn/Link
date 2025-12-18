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

## 🚀 部署指南

### Vercel 部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fal01cn%2FLink)

### Netlify 部署

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/al01cn/Link)

### Docker 部署

```bash
# 使用 Docker Compose
docker-compose up -d

# 初始化数据库
docker-compose exec app bun run setup
```

### 环境变量配置

```bash
# 必需配置
DATABASE_URL="file:./dev.db"                    # 数据库连接
NEXT_PUBLIC_BASE_URL="http://localhost:3000"    # 应用URL
ENCRYPTION_KEY="your-secret-key"                # 加密密钥

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