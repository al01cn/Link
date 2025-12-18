# 生产环境部署指南

## 打包完成

项目已成功打包到 `dist` 目录，包含以下内容：

```
dist/
├── .next/              # Next.js 构建输出（包含独立运行时）
├── node_modules/       # 生产环境依赖
├── public/             # 静态资源
├── .env.example        # 环境变量示例
├── next.config.ts      # Next.js 配置
├── package.json        # 项目配置
├── server.js           # 服务器入口文件
├── start.js            # 启动脚本
└── README.md           # 部署说明
```

## 部署步骤

### 1. 上传到服务器

将整个 `dist` 目录上传到服务器：

```bash
# 使用 scp
scp -r dist/ user@server:/path/to/app/

# 或使用 rsync
rsync -avz dist/ user@server:/path/to/app/
```

### 2. 配置环境变量

在服务器上创建 `.env` 文件：

```bash
cd /path/to/app/dist
cp .env.example .env
# 编辑 .env 文件，填入实际的配置
```

### 3. 启动应用

#### 方式一：直接启动
```bash
cd /path/to/app/dist
node server.js
```

#### 方式二：使用启动脚本
```bash
cd /path/to/app/dist
node start.js
```

#### 方式三：使用 PM2（推荐）
```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start server.js --name "link-app"

# 设置开机自启
pm2 startup
pm2 save
```

### 4. 使用 Nginx 反向代理（可选）

创建 Nginx 配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Docker 部署（可选）

如果需要使用 Docker 部署，可以使用项目根目录的 `Dockerfile` 和 `docker-compose.yml`。

## 注意事项

1. **Node.js 版本**：确保服务器安装了 Node.js 18 或更高版本
2. **端口配置**：默认端口为 3000，可通过环境变量 `PORT` 修改
3. **数据库**：项目使用 SQLite，数据库文件位于 `prisma/dev.db`
4. **环境变量**：务必配置所有必需的环境变量
5. **进程管理**：生产环境建议使用 PM2 或 systemd 管理进程

## 性能优化建议

1. 使用 Nginx 作为反向代理
2. 启用 gzip 压缩
3. 配置 CDN 加速静态资源
4. 定期备份数据库文件
5. 监控应用性能和日志

## 故障排查

如果启动失败，请检查：

1. Node.js 版本是否符合要求
2. 环境变量是否正确配置
3. 端口是否被占用
4. 文件权限是否正确
5. 查看错误日志定位问题