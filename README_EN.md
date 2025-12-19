# AL01Link - Enterprise URL Shortener

English | [中文](./README.md)

🔗 **Simple, Secure, Powerful URL Shortening Tool**

A modern URL shortening service built with Next.js 16 + Prisma + SQLite, featuring password protection, domain management, access analytics, and other enterprise-grade capabilities.

## ✨ Core Features

- 🔗 **Smart Link Generation** - Auto-generate or custom paths, batch management support
- 🛡️ **Enterprise Security** - Password protection, domain whitelist, confirmation mechanism
- ⚡ **Multiple Redirect Modes** - Direct redirect, transition page, manual confirmation, quick jump
- 📊 **Data Analytics** - Access statistics, logs, trend analysis
- 🎨 **Modern Interface** - Responsive design, bilingual support, dark theme

## 🚀 Quick Start

### Requirements
- Node.js 18.0+
- Bun 1.0+ (recommended) or npm/yarn

### Installation & Deployment

**1. Clone Project**
```bash
# GitHub (International)
git clone https://github.com/al01cn/Link.git

# Gitee (China Mirror)
git clone https://gitee.com/al01/Link.git

# GitCode (China Mirror)
git clone https://gitcode.com/al01cn/Link.git

cd Link
```

**2. Install Dependencies**
```bash
bun install
```

**3. Environment Configuration**
```bash
cp .env.example .env.local
# Edit .env.local to configure database and app URL
```

**4. Initialize Database**
```bash
bun run setup
```

**5. Start Service**
```bash
# Development mode
bun run dev

# Production mode
bun run build && bun run start
```

Visit [http://localhost:3000](http://localhost:3000) to get started!

### Default Admin Account
- **Username**: `Loooong`
- **Password**: `Loooong123`

> ⚠️ System will force password change on first login

## 🚀 Deployment Guide

### Vercel Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/al01cn/Link&env=DATABASE_PROVIDER,DATABASE_URL,ENCRYPTION_KEY&envDescription=Database%20configuration%20and%20application%20key&envLink=https://github.com/al01cn/Link/blob/main/.env.example)
### Netlify Deployment

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/al01cn/Link)

### Docker Deployment

```bash
# Using Docker Compose
docker-compose up -d

# Initialize database
docker-compose exec app bun run setup
```

### Environment Variables

```bash
# Required
DATABASE_URL="file:./dev.db"                    # Database connection
NEXT_PUBLIC_BASE_URL="http://localhost:3000"    # App URL
ENCRYPTION_KEY="your-secret-key"                # Encryption key

# Optional
NEXT_PUBLIC_TURNSTILE_SITE_KEY="your-site-key"  # Cloudflare verification
TURNSTILE_SECRET_KEY="your-secret-key"
```

## 🛠️ Tech Stack

- **Frontend Framework**: [Next.js 16](https://nextjs.org/) - React full-stack framework
- **Database**: [Prisma](https://prisma.io/) + SQLite/PostgreSQL - Modern database toolkit
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- **Icons**: [Lucide React](https://lucide.dev/) - Beautiful icon library
- **Runtime**: [Bun](https://bun.sh/) - Fast JavaScript runtime
- **Language**: TypeScript - Type-safe JavaScript

## 📖 API Documentation

For detailed API documentation, please see:
- [中文 API 文档](./API.md)
- [English API Documentation](./API_EN.md)

## 🤝 Contributing

Welcome to submit Issues and Pull Requests!

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/al01cn/Link/issues)
- 💬 **Feature Discussions**: [GitHub Discussions](https://github.com/al01cn/Link/discussions)
- 🇨🇳 **China Users**: [Gitee](https://gitee.com/al01/Link) | [GitCode](https://gitcode.com/al01cn/Link)

## 🙏 Acknowledgments

Thanks to the following open source projects:

- [Next.js](https://nextjs.org/) - React full-stack framework
- [Prisma](https://prisma.io/) - Modern database toolkit
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Lucide React](https://lucide.dev/) - Beautiful icon library
- [Bun](https://bun.sh/) - Fast JavaScript runtime

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

### 📦 Open Source Repositories

| Platform | Link | Description |
|----------|------|-------------|
| **GitHub** | [al01cn/Link](https://github.com/al01cn/Link) | International, Latest Features |
| **Gitee** | [al01/Link](https://gitee.com/al01/Link) | China Mirror, Faster Access |
| **GitCode** | [al01cn/Link](https://gitcode.com/al01cn/Link) | China Mirror, Alternative Choice |

**AL01Link** - Make long URLs short, make sharing simple ✨

[🐛 Issues](https://github.com/al01cn/Link/issues) • [💬 Discussions](https://github.com/al01cn/Link/discussions) • [📖 API Docs](./API_EN.md) • [🇨🇳 中文](./README.md)

</div>

<div align="center">

### 📦 Sponsor

[AL01](https://www.al01.cn/#energy)

**Thank you for your support** - Your support is my motivation to develop and maintain AL01 Link!

</div>