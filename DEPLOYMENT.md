# ShortLink 部署指南

## 📋 目录

- [部署前准备](#部署前准备)
- [Vercel 部署](#vercel-部署)
- [Docker 部署](#docker-部署)
- [自托管部署](#自托管部署)
- [数据库配置](#数据库配置)
- [域名和SSL配置](#域名和ssl配置)
- [监控和维护](#监控和维护)
- [故障排除](#故障排除)

## 🚀 部署前准备

### 环境检查清单

- [ ] **代码准备**：确保代码已提交到 Git 仓库
- [ ] **构建测试**：本地构建成功 (`bun run build`)
- [ ] **测试通过**：所有测试用例通过 (`bun run test`)
- [ ] **环境变量**：准备好生产环境的环境变量
- [ ] **数据库**：选择并配置生产数据库
- [ ] **域名**：准备好自定义域名（可选）
- [ ] **SSL证书**：HTTPS 配置（推荐）

### 生产环境要求

- **Node.js**: 18.0 或更高版本
- **内存**: 最低 512MB，推荐 1GB+
- **存储**: 最低 1GB，推荐 5GB+
- **数据库**: SQLite（小型项目）或 PostgreSQL（生产环境）
- **网络**: 稳定的网络连接

## 🌐 Vercel 部署（推荐）

Vercel 是最简单的部署方式，特别适合 Next.js 应用。

### 1. 准备 GitHub 仓库

```bash
# 初始化 Git 仓库（如果还没有）
git init
git add .
git commit -m "Initial commit"

# 推送到 GitHub
git remote add origin https://github.com/your-username/shortlink.git
git branch -M main
git push -u origin main
```

### 2. 导入到 Vercel

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 选择 GitHub 仓库
4. 配置项目设置：
   - **Framework Preset**: Next.js
   - **Build Command**: `bun run build`
   - **Install Command**: `bun install`
   - **Output Directory**: `.next`

### 3. 配置环境变量

在 Vercel 项目设置中添加以下环境变量：

```bash
# 必需的环境变量
DATABASE_URL="your-database-connection-string"
NEXT_PUBLIC_BASE_URL="https://your-domain.vercel.app"
ENCRYPTION_KEY="your-strong-encryption-key-32-chars"

# 可选的环境变量
NEXT_PUBLIC_TURNSTILE_SITE_KEY="your-turnstile-site-key"
TURNSTILE_SECRET_KEY="your-turnstile-secret-key"
```

### 4. 配置数据库

#### 选项 A: Vercel Postgres（推荐）

1. 在 Vercel 项目中添加 Postgres 数据库
2. 复制连接字符串到 `DATABASE_URL`
3. 更新 `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

#### 选项 B: 外部数据库

使用 PlanetScale、Supabase 或其他数据库服务：

```bash
# PlanetScale 示例
DATABASE_URL="mysql://username:password@host:port/database?sslaccept=strict"

# Supabase 示例  
DATABASE_URL="postgresql://username:password@host:port/database"
```

### 5. 部署和初始化

```bash
# 部署完成后，运行数据库迁移
# 在 Vercel 项目设置中添加构建后脚本
"scripts": {
  "build": "next build && prisma db push && tsx scripts/init-db.ts"
}
```

### 6. 自定义域名（可选）

1. 在 Vercel 项目设置中添加自定义域名
2. 配置 DNS 记录：
   ```
   CNAME: your-domain.com -> your-project.vercel.app
   ```
3. 更新 `NEXT_PUBLIC_BASE_URL` 环境变量

## 🐳 Docker 部署

适合需要完全控制部署环境的场景。

### 1. 创建 Dockerfile

```dockerfile
# Dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

# 安装依赖阶段
FROM base AS deps
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production=false

# 构建阶段
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 生成 Prisma 客户端
RUN bun run db:generate

# 构建应用
RUN bun run build

# 生产运行阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 创建用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts

# 复制必要的依赖
COPY --from=deps /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["bun", "server.js"]
```

### 2. 创建 docker-compose.yml

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://shortlink:password@db:5432/shortlink
      - NEXT_PUBLIC_BASE_URL=http://localhost:3000
      - ENCRYPTION_KEY=your-32-character-encryption-key
    depends_on:
      - db
    volumes:
      - ./data:/app/data

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=shortlink
      - POSTGRES_USER=shortlink
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app

volumes:
  postgres_data:
```

### 3. 构建和运行

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 初始化数据库
docker-compose exec app bun run db:push
docker-compose exec app bun run db:init

# 查看日志
docker-compose logs -f app
```

### 4. Nginx 配置

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    server {
        listen 80;
        server_name your-domain.com;
        
        # 重定向到 HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location / {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

## 🖥️ 自托管部署

适合需要完全控制服务器的场景。

### 1. 服务器准备

#### 系统要求
- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **CPU**: 1 核心（最低），2+ 核心（推荐）
- **内存**: 1GB（最低），2GB+（推荐）
- **存储**: 20GB（最低），50GB+（推荐）

#### 安装基础软件

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要软件
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx

# 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# 安装 PM2（进程管理器）
npm install -g pm2

# 安装 PostgreSQL（可选）
sudo apt install -y postgresql postgresql-contrib
```

### 2. 部署应用

```bash
# 创建应用目录
sudo mkdir -p /var/www/shortlink
sudo chown $USER:$USER /var/www/shortlink

# 克隆代码
cd /var/www/shortlink
git clone https://github.com/your-username/shortlink.git .

# 安装依赖
bun install

# 配置环境变量
cp .env.example .env.local
nano .env.local
```

### 3. 配置环境变量

```bash
# .env.local
DATABASE_URL="postgresql://shortlink:password@localhost:5432/shortlink"
NEXT_PUBLIC_BASE_URL="https://your-domain.com"
ENCRYPTION_KEY="your-32-character-encryption-key-here"
NEXT_PUBLIC_TURNSTILE_SITE_KEY="your-turnstile-site-key"
TURNSTILE_SECRET_KEY="your-turnstile-secret-key"
```

### 4. 构建和启动

```bash
# 构建应用
bun run build

# 初始化数据库
bun run setup

# 使用 PM2 启动应用
pm2 start bun --name "shortlink" -- run start

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER
```

### 5. 配置 Nginx

```bash
# 创建 Nginx 配置
sudo nano /etc/nginx/sites-available/shortlink
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 安全头
        proxy_set_header X-Frame-Options DENY;
        proxy_set_header X-Content-Type-Options nosniff;
        proxy_set_header X-XSS-Protection "1; mode=block";
    }

    # 静态文件缓存
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/shortlink /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 6. 配置 SSL

```bash
# 使用 Let's Encrypt 获取免费 SSL 证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 测试自动续期
sudo certbot renew --dry-run
```

## 🗄️ 数据库配置

### SQLite（开发/小型项目）

```bash
# 环境变量
DATABASE_URL="file:./data/production.db"

# 确保数据目录存在
mkdir -p data

# 设置权限
chmod 755 data
```

### PostgreSQL（生产环境推荐）

#### 1. 安装和配置 PostgreSQL

```bash
# 安装 PostgreSQL
sudo apt install postgresql postgresql-contrib

# 启动服务
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 创建数据库和用户
sudo -u postgres psql
```

```sql
-- 在 PostgreSQL 命令行中执行
CREATE DATABASE shortlink;
CREATE USER shortlink WITH PASSWORD 'your-strong-password';
GRANT ALL PRIVILEGES ON DATABASE shortlink TO shortlink;
\q
```

#### 2. 配置连接

```bash
# 更新环境变量
DATABASE_URL="postgresql://shortlink:your-strong-password@localhost:5432/shortlink"

# 更新 Prisma 配置
# prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

#### 3. 迁移数据

```bash
# 生成客户端
bun run db:generate

# 推送模式
bun run db:push

# 初始化数据
bun run db:init
```

### 数据库备份

#### SQLite 备份

```bash
# 创建备份脚本
cat > backup-sqlite.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/shortlink"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
cp data/production.db $BACKUP_DIR/shortlink_$DATE.db

# 保留最近 30 天的备份
find $BACKUP_DIR -name "shortlink_*.db" -mtime +30 -delete
EOF

chmod +x backup-sqlite.sh

# 添加到 crontab（每天凌晨 2 点备份）
echo "0 2 * * * /var/www/shortlink/backup-sqlite.sh" | crontab -
```

#### PostgreSQL 备份

```bash
# 创建备份脚本
cat > backup-postgres.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/shortlink"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="shortlink"
DB_USER="shortlink"

mkdir -p $BACKUP_DIR
pg_dump -U $DB_USER -h localhost $DB_NAME > $BACKUP_DIR/shortlink_$DATE.sql

# 压缩备份文件
gzip $BACKUP_DIR/shortlink_$DATE.sql

# 保留最近 30 天的备份
find $BACKUP_DIR -name "shortlink_*.sql.gz" -mtime +30 -delete
EOF

chmod +x backup-postgres.sh

# 添加到 crontab
echo "0 2 * * * /var/www/shortlink/backup-postgres.sh" | crontab -
```

## 🌐 域名和SSL配置

### 域名配置

#### DNS 记录设置

```bash
# A 记录（指向服务器 IP）
your-domain.com.     A     your-server-ip
www.your-domain.com. A     your-server-ip

# 或 CNAME 记录（指向其他域名）
your-domain.com.     CNAME your-app.vercel.app
www.your-domain.com. CNAME your-app.vercel.app
```

#### 子域名配置

```bash
# 为短链服务配置子域名
short.your-domain.com. A your-server-ip
s.your-domain.com.     A your-server-ip
```

### SSL 证书配置

#### Let's Encrypt（免费）

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 自动续期
sudo crontab -e
# 添加以下行
0 12 * * * /usr/bin/certbot renew --quiet
```

#### 自签名证书（测试用）

```bash
# 生成自签名证书
sudo mkdir -p /etc/nginx/ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/shortlink.key \
  -out /etc/nginx/ssl/shortlink.crt
```

### 安全配置

#### Nginx 安全头

```nginx
# 在 Nginx 配置中添加安全头
server {
    # ... 其他配置

    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';";

    # 隐藏 Nginx 版本
    server_tokens off;
}
```

#### 防火墙配置

```bash
# 使用 ufw 配置防火墙
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 允许必要端口
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 查看状态
sudo ufw status
```

## 📊 监控和维护

### 应用监控

#### PM2 监控

```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs shortlink

# 查看实时监控
pm2 monit

# 重启应用
pm2 restart shortlink

# 查看详细信息
pm2 show shortlink
```

#### 系统监控

```bash
# 安装 htop
sudo apt install htop

# 监控系统资源
htop

# 监控磁盘使用
df -h

# 监控内存使用
free -h

# 监控网络连接
netstat -tulpn
```

### 日志管理

#### 应用日志

```bash
# PM2 日志位置
~/.pm2/logs/

# 配置日志轮转
pm2 install pm2-logrotate

# 设置日志保留策略
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

#### Nginx 日志

```bash
# 日志位置
/var/log/nginx/access.log
/var/log/nginx/error.log

# 配置日志轮转
sudo nano /etc/logrotate.d/nginx
```

```
/var/log/nginx/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 nginx adm
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 `cat /var/run/nginx.pid`
        fi
    endscript
}
```

### 性能优化

#### 数据库优化

```sql
-- PostgreSQL 性能优化
-- 创建索引
CREATE INDEX idx_shortlink_path ON "ShortLink"(path);
CREATE INDEX idx_visitlog_shortid ON "VisitLog"("shortId");
CREATE INDEX idx_visitlog_created ON "VisitLog"("createdAt");

-- 分析查询性能
EXPLAIN ANALYZE SELECT * FROM "ShortLink" WHERE path = 'abc123';
```

#### 缓存配置

```nginx
# Nginx 缓存配置
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location /_next/static/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 定期维护

#### 创建维护脚本

```bash
# 创建维护脚本
cat > maintenance.sh << 'EOF'
#!/bin/bash

echo "开始系统维护..."

# 更新系统
sudo apt update && sudo apt upgrade -y

# 清理日志
sudo journalctl --vacuum-time=30d

# 清理包缓存
sudo apt autoremove -y
sudo apt autoclean

# 重启服务
pm2 restart shortlink

# 检查服务状态
pm2 status

echo "维护完成！"
EOF

chmod +x maintenance.sh

# 每月第一个周日凌晨 3 点执行维护
echo "0 3 1-7 * 0 /var/www/shortlink/maintenance.sh" | crontab -
```

## 🔧 故障排除

### 常见问题

#### 1. 应用无法启动

```bash
# 检查端口占用
sudo netstat -tulpn | grep :3000

# 检查 PM2 状态
pm2 status

# 查看错误日志
pm2 logs shortlink --err

# 重启应用
pm2 restart shortlink
```

#### 2. 数据库连接失败

```bash
# 检查数据库服务状态
sudo systemctl status postgresql

# 测试数据库连接
psql -U shortlink -h localhost -d shortlink

# 检查连接字符串
echo $DATABASE_URL
```

#### 3. Nginx 配置错误

```bash
# 测试 Nginx 配置
sudo nginx -t

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# 重新加载配置
sudo nginx -s reload
```

#### 4. SSL 证书问题

```bash
# 检查证书状态
sudo certbot certificates

# 手动续期证书
sudo certbot renew

# 测试证书配置
openssl s_client -connect your-domain.com:443
```

### 性能问题诊断

#### 1. 高 CPU 使用率

```bash
# 查看进程 CPU 使用情况
top -p $(pgrep -f "shortlink")

# 分析 Node.js 性能
pm2 start shortlink --node-args="--inspect"

# 使用 clinic.js 分析性能
npm install -g clinic
clinic doctor -- bun run start
```

#### 2. 高内存使用率

```bash
# 查看内存使用情况
pm2 show shortlink

# 分析内存泄漏
clinic heapprofiler -- bun run start

# 设置内存限制
pm2 start shortlink --max-memory-restart 500M
```

#### 3. 数据库性能问题

```sql
-- PostgreSQL 慢查询分析
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- 查看活跃连接
SELECT * FROM pg_stat_activity;
```

### 紧急恢复

#### 1. 应用崩溃恢复

```bash
# 快速重启
pm2 restart shortlink

# 如果重启失败，重新部署
cd /var/www/shortlink
git pull origin main
bun install
bun run build
pm2 restart shortlink
```

#### 2. 数据库恢复

```bash
# SQLite 恢复
cp /var/backups/shortlink/shortlink_latest.db data/production.db

# PostgreSQL 恢复
dropdb shortlink
createdb shortlink
psql shortlink < /var/backups/shortlink/shortlink_latest.sql
```

#### 3. 完整系统恢复

```bash
# 从备份恢复整个应用
cd /var/www
sudo rm -rf shortlink
git clone https://github.com/your-username/shortlink.git
cd shortlink
bun install
cp /var/backups/shortlink/.env.local .
bun run build
pm2 delete shortlink
pm2 start bun --name "shortlink" -- run start
```

---

## 📞 技术支持

如果在部署过程中遇到问题，可以通过以下方式获取帮助：

- 📧 **邮箱支持**: support@yourcompany.com
- 🐛 **问题反馈**: [GitHub Issues](https://github.com/your-username/shortlink/issues)
- 💬 **社区讨论**: [GitHub Discussions](https://github.com/your-username/shortlink/discussions)
- 📖 **文档中心**: [项目文档](https://docs.shortlink.com)

---

**部署成功后，记得修改默认管理员密码！** 🔐

**Happy Deploying! 🚀**