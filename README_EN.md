# AL01 Link - A Simple and Powerful URL Shortener

[中文](./README.md) | English

🔗 **Simple, Secure, and Powerful URL Shortening Service**

AL01 Link is a modern URL shortener built with Next.js 16, Prisma, and SQLite. It supports password protection, domain management, access analytics, and more.

## ✨ Key Features

- 🔗 **Smart Short Link Generation** - Auto-generate or customize paths with batch management support
- 🛡️ **Security Protection** - Password protection, domain whitelist, and secondary confirmation
- ⚡ **Multiple Redirect Modes** - Direct redirect, intermediate page, manual confirmation, temporary redirect
- 📊 **Analytics & Insights** - Access statistics, logs, and trend analysis
- 🎨 **Modern UI** - Responsive design, bilingual (EN/ZH), and dark mode

## 🚀 Quick Start

### Requirements
- Node.js 18.0+
- Bun 1.0+ (recommended) or npm/yarn

### Installation & Setup

**1. Clone the repository**
```bash
# GitHub (Global)
git clone https://github.com/al01cn/Link.git

# Gitee (China)
git clone https://gitee.com/al01/Link.git

# GitCode (China)
git clone https://gitcode.com/al01cn/Link.git

cd Link
```

**2. Install dependencies**
```bash
bun install
```

**3. Environment configuration**
```bash
cp .env.example .env.local
# Edit .env.local to configure the database and application URL
```

**4. Initialize the database**
```bash
bun run setup
```

**5. Start the service**
```bash
# Development mode
bun run dev

# Production mode
bun run build && bun run start
```

Visit [http://localhost:3000](http://localhost:3000) to get started.

### Default Admin Account
- **Username**: `Loooong`
- **Password**: `Loooong123`

> ⚠️ You will be required to change the default password after your first login.

## 🚀 One-Click Deployment

### Deploy to Vercel

Click the button below to deploy AL01 Link to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/al01cn/Link&env=DATABASE_PROVIDER,DATABASE_URL,ENCRYPTION_KEY&envDescription=Database configuration and application secrets&envLink=https://gh.llkk.cc/https://github.com/al01cn/Link/blob/main/.env.example)

**Required environment variables:**
- `DATABASE_PROVIDER` - Database type (`postgresql` or `mysql`)
- `DATABASE_URL` - Database connection string
- `ENCRYPTION_KEY` - Encryption key for passwords

> 💡 **Tip**: We recommend using free PostgreSQL databases from **Supabase** or **Neon**. The system automatically selects the correct Prisma schema based on `DATABASE_PROVIDER`.

### Deploy to Netlify

Click the button below to deploy with Netlify. You will be prompted to configure the required environment variables automatically:

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/al01cn/Link)

**Required environment variables:**
- `DATABASE_PROVIDER` - Database type (`postgresql` or `mysql`)
- `DATABASE_URL` - Database connection string
- `NEXT_PUBLIC_BASE_URL` - Application base URL (optional; auto-detected if empty)
- `ENCRYPTION_KEY` - Encryption key

> 💡 **Tip**: Netlify will automatically prompt for required environment variables based on `netlify.toml`.

## 🚀 Deployment Guide

### Serverless Platforms

> ⚠️ **Important**: When deploying to stateless Serverless platforms (such as Vercel, Netlify, or Railway), **SQLite must be replaced with another database**, as Serverless environments do not support persistent file storage.

```bash
# Build for Serverless
bun run build:sls

# Start
bun run start
```

### Server Deployment

```bash
# Build production package
bun run build:prod

# Upload the build artifact to your server

# Install dependencies
pnpm install --production

# or
bun install --production

# Start the service
bun run start
```

#### Recommended Databases

**1. PostgreSQL (Recommended)**
```bash
DATABASE_PROVIDER="postgresql"
DATABASE_URL="postgresql://username:password@host:5432/database"
```

**2. MySQL**
```bash
DATABASE_PROVIDER="mysql"
DATABASE_URL="mysql://username:password@host:3306/database"
```

**3. Cloud Database Services**
- **Supabase** - Free PostgreSQL hosting
- **PlanetScale** - Serverless MySQL
- **Neon** - Modern PostgreSQL platform
- **Railway** - Cloud platform with multiple database options

#### Database Migration Steps

1. **Update environment variables**
   ```bash
   DATABASE_PROVIDER="postgresql"  # or "mysql"
   DATABASE_URL="postgresql://username:password@host:5432/database"
   ```

2. **Regenerate Prisma Client**
   ```bash
   bun run prisma generate
   ```

3. **Apply database migrations**
   ```bash
   bun run prisma db push
   ```

> 🎯 **Automation Advantage**: The system automatically selects the correct Prisma schema based on `DATABASE_PROVIDER`, with no manual configuration required.

> 📖 **Detailed Guide**: See [DATABASE_MIGRATION.md](./DATABASE_MIGRATION.md) for full migration instructions and FAQs.

### Docker Deployment

```bash
# Using Docker Compose
docker-compose up -d

# Initialize the database
docker-compose exec app bun run setup
```

> 📝 **Note**: Docker deployment supports SQLite because containers provide persistent storage.

### Environment Variables

```bash
# Required
DATABASE_PROVIDER="sqlite"                     # sqlite | postgresql | mysql
DATABASE_URL="file:./dev.db"                   # SQLite (local development)
NEXT_PUBLIC_BASE_URL="http://localhost:3000"   # Application URL
ENCRYPTION_KEY="your-secret-key"               # Encryption key

# Optional
NEXT_PUBLIC_TURNSTILE_SITE_KEY="your-site-key" # Cloudflare Turnstile
TURNSTILE_SECRET_KEY="your-secret-key"
```

## 🛠️ Tech Stack

- **Framework**: Next.js 16
- **Database**: Prisma + SQLite / PostgreSQL / MySQL
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Runtime**: Bun
- **Language**: TypeScript

## 📖 API Documentation

- [Chinese API Docs](./API.md)
- [English API Docs](./API_EN.md)

## 🤝 Contributing

Issues and Pull Requests are welcome!

- 🐛 **Bug Reports**: GitHub Issues
- 💬 **Discussions**: GitHub Discussions
- 🇨🇳 **China Mirrors**: Gitee | GitCode

## 🙏 Acknowledgements

- Next.js
- Prisma
- Tailwind CSS
- Lucide React
- Bun

## 📄 License

Licensed under the MIT License.

---

<div align="center">

### 📦 Repositories

| Platform | Link | Description |
|--------|------|-------------|
| **GitHub** | al01cn/Link | Global, latest features |
| **Gitee** | al01/Link | China mirror |
| **GitCode** | al01cn/Link | China mirror (backup) |

**AL01 Link** — Shorten long URLs, make sharing easier ✨

</div>

---

<div align="center">

### 📦 Sponsorship

[AL01](https://www.al01.cn/#energy)

**Thank you for your support** — Your support motivates the development and maintenance of AL01 Link.

</div>

