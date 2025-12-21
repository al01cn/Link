# 灵狼Link 版本更新日志

## [0.1.1] - 2025-12-21

### ✨ 新增功能
- **批量操作系统**
  - ✅ 添加批量选择模式，支持通过复选框选择多个短链
  - ✅ 实现批量删除功能，可一次性删除多个短链
  - ✅ 实现批量设置功能，支持批量修改过期时间、密码、中间页设置等
  - ✅ 添加全选/反选功能，快速选择当前页面所有短链
  - ✅ 批量操作工具栏，实时显示选中数量和操作按钮
  - ✅ 批量设置弹窗，支持灵活配置（留空则不修改）
  - ✅ 并发处理批量操作，提高操作效率
  - ✅ 完整的操作反馈（成功/部分成功/失败提示）

### 🎨 界面优化
- 批量模式进入/退出按钮，界面清晰直观
- 选中状态高亮显示，提升用户体验
- 响应式设计，完美支持暗色模式
- 批量操作工具栏采用醒目的蓝色主题

### 🌐 国际化
- 添加批量操作相关的中文翻译（25+条）
- 添加批量操作相关的英文翻译（25+条）

### 🔧 技术改进
- 使用 `Set<string>` 高效管理选中ID列表
- 使用 `Promise.all` 实现并发批量操作
- 智能表单处理，仅更新用户填写的字段
- 完整的错误处理和用户反馈机制

---

## [0.1.0] - 2025-12-20

### 🎉 初始版本发布

#### ✨ 核心功能
- 🔗 **智能短链生成**
  - Base62/NanoID 算法自动生成短链
  - 支持自定义路径（字母、数字、下划线、连字符）
  - 自动获取目标网站标题
  - 自定义标题和简介描述
  - 链接过期时间设置
  - 本地时间自动转换为 UTC 时间存储

- 🛡️ **安全防护系统**
  - 访问密码保护（bcrypt 加密）
  - 域名白名单/黑名单管理
  - 支持通配符域名规则（*.example.com）
  - 二次确认机制
  - 人机验证集成（Cloudflare Turnstile）
  - XSS、CSRF、点击劫持防护

- ⚡ **多种跳转模式**
  - 直接跳转模式（无中间页）
  - 过渡页面自动跳转（可设置等待时间）
  - 手动二次确认跳转
  - 密码保护跳转
  - 链接预加载优化

- 📊 **数据统计分析**
  - 实时访问统计
  - 企业级日志系统
  - 访问日志记录（IP、User-Agent、Referer）
  - 日志导出功能（JSON格式）
  - 日志自动清理
  - 统计趋势分析

- 👤 **管理员系统**
  - JWT token 身份认证
  - 安全的登录系统
  - 强制修改默认密码
  - 密码查看需要管理员验证
  - 完整的权限控制
  - 系统设置管理

- 🎨 **用户界面**
  - 现代化卡片设计
  - 响应式布局（适配移动端和桌面端）
  - 暗色模式支持
  - 中英文双语切换
  - 流畅的动画效果
  - 直观的操作反馈

- 🔍 **搜索与筛选**
  - 全局搜索（支持短链、原始链接、标题、路径）
  - 多种筛选条件（全部、密码保护、二次确认、自动跳转、直接跳转、已过期、有效）
  - 多种排序方式（最新、最旧、访问量、标题）
  - 实时搜索结果统计

- 📝 **链接管理**
  - 在线编辑短链信息
  - 快速复制短链
  - 删除确认机制
  - 链接过期状态显示
  - 密码查看功能
  - 访问次数统计

#### 🏗️ 技术架构
- **前端框架**: Next.js 16 (App Router) + React 19.2
- **开发语言**: TypeScript 5.0+
- **样式方案**: Tailwind CSS 4.0
- **数据库**: Prisma 5.22 ORM
- **数据库支持**: SQLite、PostgreSQL、MySQL
- **图标库**: Lucide React
- **包管理器**: Bun/npm
- **测试框架**: Vitest + Testing Library
- **代码规范**: ESLint + TypeScript 严格模式

#### 🚀 部署支持
- **Vercel**: 一键部署，自动配置
- **Netlify**: 一键部署，环境变量提示
- **Docker**: 完整的 Docker 和 Docker Compose 支持
- **自托管**: Linux 服务器部署指南
- **数据库迁移**: SQLite 到 PostgreSQL/MySQL 迁移工具

#### 📖 完整文档
- **README.md**: 项目介绍和快速开始（中英文）
- **DEVELOPMENT.md**: 开发指南和架构说明（中英文）
- **DEPLOYMENT.md**: 部署指南和运维手册
- **API.md**: 完整的 API 文档（中英文）
- **DATABASE_MIGRATION.md**: 数据库迁移指南
- **FORCE_PASSWORD_CHANGE.md**: 密码安全功能说明
- **MULTILINGUAL_METADATA.md**: 多语言元数据说明
- **PRELOAD_FEATURE.md**: 链接预加载功能说明

#### 🔧 工具脚本
- `setup-schema.js`: 自动数据库 schema 切换
- `init-db.ts`: 数据库初始化
- `init-db-vercel.ts`: Vercel 环境初始化
- `init-db-netlify.ts`: Netlify 环境初始化
- `init-db-serverless.ts`: Serverless 环境初始化
- `build-production.ts`: 生产环境构建
- `create-deployment-package.ts`: 部署包创建
- `optimize-db.ts`: 数据库优化
- `performance-monitor.ts`: 性能监控
- `clear-cache.ts`: 缓存清理
- `health-check.ts`: 健康检查

#### 🌟 特色亮点
1. **企业级安全**: 多层防护机制，符合安全标准
2. **高性能架构**: 服务端渲染，静态优化，数据库索引
3. **完整文档**: 从开发到部署的全流程文档
4. **现代技术栈**: 使用最新的前端技术和最佳实践
5. **生产就绪**: 可直接用于生产环境的完整解决方案
6. **多数据库支持**: 自动检测并适配不同数据库
7. **国际化**: 完整的中英文双语支持
8. **可扩展性**: 清晰的代码结构，易于二次开发

#### 📦 核心组件
- `HomeView.tsx`: 主页视图，短链生成和列表管理
- `SafeRedirectClient.tsx`: 客户端安全跳转组件
- `SafeRedirectView.tsx`: 服务端安全跳转视图
- `AdminLoginPage.tsx`: 管理员登录页面
- `AdminSettings.tsx`: 系统设置管理
- `EnhancedLogsView.tsx`: 增强的日志查看
- `EditPanel.tsx`: 短链编辑面板
- `EditLinkDialog.tsx`: 短链编辑对话框
- `ConfirmDialog.tsx`: 确认对话框组件
- `NotificationDialog.tsx`: 通知对话框组件
- `ForcePasswordChangeDialog.tsx`: 强制修改密码对话框
- `TurnstileWidget.tsx`: 人机验证组件
- `ThemeToggle.tsx`: 主题切换组件
- `Navbar.tsx`: 导航栏组件
- `DynamicMetadata.tsx`: 动态元数据组件

#### 🔌 API 路由
- `/api/links`: 短链 CRUD 操作
- `/api/links/[id]`: 单个短链操作
- `/api/domains`: 域名管理
- `/api/domains/[id]`: 单个域名操作
- `/api/settings`: 系统设置
- `/api/public-settings`: 公开设置
- `/api/logs`: 日志查询
- `/api/logs/stats`: 日志统计
- `/api/logs/export`: 日志导出
- `/api/logs/cleanup`: 日志清理
- `/api/admin/login`: 管理员登录
- `/api/admin/check-default`: 检查默认密码
- `/api/admin/change-password`: 修改密码
- `/api/check-domain`: 检查域名访问权限
- `/api/verify-turnstile`: 验证人机验证
- `/api/track-visit/[path]`: 记录访问统计
- `/api/track-to-visit`: 记录 TO 模式访问
- `/api/visit/[path]`: 访问短链
- `/api/to`: TO 模式跳转
- `/api/config/export`: 导出配置
- `/api/config/import`: 导入配置
- `/api/health`: 健康检查
- `/api/openapi`: OpenAPI 文档

#### 🗄️ 数据库模型
- **ShortLink**: 短链接表
  - 基本信息：id, path, originalUrl, shortUrl
  - 元数据：title, description
  - 安全：password, requireConfirm, enableIntermediate
  - 统计：views, createdAt, expiresAt

- **DomainRule**: 域名规则表
  - 规则信息：id, domain, isBlacklist
  - 时间戳：createdAt

- **Admin**: 管理员表
  - 认证信息：id, username, password
  - 安全标记：isDefaultPassword
  - 时间戳：createdAt, updatedAt

- **AccessLog**: 访问日志表
  - 关联信息：id, linkId
  - 访问详情：ip, userAgent, referer
  - 时间戳：visitedAt

- **Settings**: 系统设置表
  - 配置信息：id, securityMode, waitTime
  - 功能开关：captchaEnabled, preloadEnabled, autoFillPasswordEnabled
  - 时间戳：updatedAt

#### 🎯 使用场景
- **个人用户**: 博客、社交媒体链接分享
- **小团队**: 内部链接管理和统计
- **企业用户**: 营销链接追踪和品牌保护
- **开发者**: API 集成和自定义扩展

#### 🔒 安全特性
- 密码使用 bcrypt 加密存储
- JWT token 认证
- HTTP 安全头配置
- XSS 防护
- CSRF 防护
- 点击劫持防护
- SQL 注入防护（Prisma ORM）
- 域名访问控制
- 人机验证集成

#### ⚡ 性能优化
- 服务端渲染（SSR）
- 静态优化
- 数据库索引优化
- 请求缓存机制
- 链接预加载
- 代码分割
- 图片优化
- Gzip 压缩

---

## 🚀 快速开始

### 环境要求
- Node.js 18.0+
- Bun 1.0+ (推荐) 或 npm/yarn

### 安装部署

```bash
# 克隆项目
git clone https://github.com/al01cn/Link.git
cd Link

# 安装依赖
bun install

# 环境配置
cp .env.example .env.local
# 编辑 .env.local 配置数据库和应用URL

# 初始化数据库
bun run setup

# 启动服务
bun run dev
```

访问 http://localhost:3000 开始使用！

### 默认管理员账户
- **用户名**: `Loooong`
- **密码**: `Loooong123`

> ⚠️ 首次登录后系统会强制要求修改默认密码

---

## 📝 更新说明

### 如何更新到最新版本

```bash
# 拉取最新代码
git pull origin main

# 更新依赖
bun install

# 运行数据库迁移（如有变更）
bun run db:push

# 重启服务
bun run build && bun run start
```

### 版本兼容性
- v0.1.1 与 v0.1.0 完全兼容
- 数据库结构无变更，可直接升级
- 新功能为增量添加，不影响现有功能

---

## 🔗 相关链接

- **GitHub**: https://github.com/al01cn/Link
- **Gitee**: https://gitee.com/al01/Link
- **GitCode**: https://gitcode.com/al01cn/Link
- **在线演示**: （待部署）
- **问题反馈**: https://github.com/al01cn/Link/issues

---

**灵狼Link - 让长链接变短，让分享更简单！** ✨
