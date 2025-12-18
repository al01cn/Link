# ShortLink 开发文档

## 📋 目录

- [开发环境搭建](#开发环境搭建)
- [项目架构](#项目架构)
- [数据库设计](#数据库设计)
- [API 设计](#api-设计)
- [前端组件](#前端组件)
- [测试指南](#测试指南)
- [部署流程](#部署流程)
- [常见问题](#常见问题)

## 🛠️ 开发环境搭建

### 系统要求

- **操作系统**：Windows 10+, macOS 10.15+, Ubuntu 18.04+
- **Node.js**：18.0 或更高版本
- **Bun**：1.0 或更高版本 (推荐)
- **Git**：2.20 或更高版本
- **编辑器**：VS Code (推荐) 或其他支持 TypeScript 的编辑器

### 开发工具安装

#### 1. 安装 Node.js
```bash
# 使用 nvm (推荐)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# 或直接下载安装
# https://nodejs.org/
```

#### 2. 安装 Bun
```bash
# macOS/Linux
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"
```

#### 3. 安装 Git
```bash
# Ubuntu/Debian
sudo apt install git

# macOS
brew install git

# Windows
# 下载 Git for Windows: https://git-scm.com/download/win
```

### VS Code 扩展推荐

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "prisma.prisma",
    "ms-vscode.vscode-json",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-eslint"
  ]
}
```

### 项目初始化

```bash
# 1. 克隆项目
git clone https://github.com/your-username/shortlink.git
cd shortlink

# 2. 安装依赖
bun install

# 3. 复制环境变量
cp .env.example .env.local

# 4. 编辑环境变量
code .env.local

# 5. 初始化数据库
bun run setup

# 6. 启动开发服务器
bun run dev
```

## 🏗️ 项目架构

### 技术栈

- **前端框架**：Next.js 16 (App Router)
- **开发语言**：TypeScript 5.0+
- **样式框架**：Tailwind CSS 4.0
- **数据库 ORM**：Prisma 5.0
- **数据库**：SQLite (开发) / PostgreSQL (生产)
- **图标库**：Lucide React
- **测试框架**：Vitest + Testing Library
- **包管理器**：Bun

### 目录结构详解

```
shortlink/
├── 📁 app/                     # Next.js App Router
│   ├── 📁 api/                # 后端 API 路由
│   │   ├── 📁 admin/          # 管理员相关 API
│   │   │   ├── login/         # 管理员登录
│   │   │   └── change-password/ # 修改密码
│   │   ├── 📁 domains/        # 域名管理 API
│   │   ├── 📁 links/          # 短链管理 API
│   │   ├── 📁 logs/           # 日志管理 API
│   │   ├── 📁 settings/       # 系统设置 API
│   │   ├── 📁 visit/          # 访问统计 API
│   │   └── 📁 to/             # 快速跳转 API
│   ├── 📁 [path]/             # 动态路由 - 短链访问
│   │   ├── page.tsx           # 短链页面
│   │   └── SafeRedirectClient.tsx # 客户端跳转组件
│   ├── 📁 to/                 # 快速跳转页面
│   │   └── page.tsx           # 快速跳转页面
│   ├── 📄 layout.tsx          # 根布局
│   ├── 📄 page.tsx            # 主页
│   ├── 📄 not-found.tsx       # 404 页面
│   └── 📄 globals.css         # 全局样式
├── 📁 components/              # React 组件
│   ├── 📄 AdminDropdown.tsx   # 管理员下拉菜单
│   ├── 📄 AdminLoginPage.tsx  # 管理员登录页面
│   ├── 📄 AdminSettings.tsx   # 管理员设置
│   ├── 📄 ApiDocumentation.tsx # API 文档组件
│   ├── 📄 ConfirmDialog.tsx   # 确认对话框
│   ├── 📄 EditLinkDialog.tsx  # 编辑短链对话框
│   ├── 📄 EditPanel.tsx       # 编辑面板
│   ├── 📄 HomeView.tsx        # 主页视图
│   ├── 📄 LogsView.tsx        # 日志视图
│   ├── 📄 Navbar.tsx          # 导航栏
│   ├── 📄 NotificationDialog.tsx # 通知对话框
│   ├── 📄 SafeRedirectView.tsx # 安全跳转视图
│   ├── 📄 SettingsView.tsx    # 设置视图
│   └── 📄 TurnstileWidget.tsx # 人机验证组件
├── 📁 lib/                     # 工具库和上下文
│   ├── 📄 AdminContext.tsx    # 管理员状态管理
│   ├── 📄 LanguageContext.tsx # 多语言状态管理
│   ├── 📄 db.ts               # 数据库连接配置
│   ├── 📄 translations.ts     # 多语言翻译配置
│   └── 📄 utils.ts            # 通用工具函数
├── 📁 prisma/                  # 数据库相关
│   └── 📄 schema.prisma       # 数据库模型定义
├── 📁 scripts/                 # 脚本文件
│   └── 📄 init-db.ts          # 数据库初始化脚本
├── 📁 test/                    # 测试文件
│   ├── 📁 api/                # API 测试
│   ├── 📁 components/         # 组件测试
│   ├── 📁 integration/        # 集成测试
│   ├── 📁 lib/                # 工具函数测试
│   └── 📄 setup.ts            # 测试环境配置
├── 📄 .env.example            # 环境变量模板
├── 📄 .gitignore              # Git 忽略文件
├── 📄 bun.lockb               # Bun 锁定文件
├── 📄 next.config.ts          # Next.js 配置
├── 📄 package.json            # 项目配置
├── 📄 tailwind.config.ts      # Tailwind CSS 配置
├── 📄 tsconfig.json           # TypeScript 配置
└── 📄 vitest.config.ts        # 测试配置
```

### 架构设计原则

1. **分层架构**：清晰的前后端分离，API 层、业务逻辑层、数据访问层
2. **组件化**：可复用的 React 组件，单一职责原则
3. **类型安全**：全面的 TypeScript 类型定义
4. **响应式设计**：移动优先的响应式布局
5. **国际化**：完整的中英双语支持

## 🗄️ 数据库设计

### 数据模型关系图

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  ShortLink  │────│  VisitLog   │    │    Admin    │
│             │    │             │    │             │
│ id (PK)     │    │ id (PK)     │    │ id (PK)     │
│ path        │    │ shortId(FK) │    │ username    │
│ originalUrl │    │ ip          │    │ password    │
│ title       │    │ userAgent   │    │ isDefault   │
│ password    │    │ referer     │    └─────────────┘
│ expiresAt   │    │ createdAt   │
│ ...         │    └─────────────┘
└─────────────┘
       │
       │        ┌─────────────┐    ┌─────────────┐
       │        │ DomainRule  │    │   Setting   │
       │        │             │    │             │
       │        │ id (PK)     │    │ key (PK)    │
       │        │ domain      │    │ value       │
       │        │ type        │    └─────────────┘
       │        │ active      │
       │        └─────────────┘
       │
       │        ┌─────────────┐
       └────────│     Log     │
                │             │
                │ id (PK)     │
                │ type        │
                │ message     │
                │ details     │
                │ ip          │
                │ userAgent   │
                │ createdAt   │
                └─────────────┘
```

### 核心数据模型

#### 1. ShortLink (短链模型)
```prisma
model ShortLink {
  id           String   @id @default(uuid())
  path         String   @unique              // 短链路径
  originalUrl  String                        // 原始URL
  title        String?                       // 页面标题
  password     String?                       // 访问密码
  expiresAt    DateTime?                     // 过期时间
  requireConfirm Boolean @default(false)     // 需要确认
  enableIntermediate Boolean @default(true)  // 启用过渡页
  views        Int      @default(0)          // 访问次数
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  visitLogs    VisitLog[]                    // 访问日志
}
```

#### 2. VisitLog (访问日志)
```prisma
model VisitLog {
  id        String   @id @default(uuid())
  shortId   String                          // 关联短链ID
  ip        String?                         // 访问者IP
  userAgent String?                         // 用户代理
  referer   String?                         // 来源页面
  createdAt DateTime @default(now())
  shortLink ShortLink @relation(fields: [shortId], references: [id], onDelete: Cascade)
}
```

#### 3. DomainRule (域名规则)
```prisma
model DomainRule {
  id     String @id @default(uuid())
  domain String @unique                     // 域名
  type   String                            // "whitelist" | "blacklist"
  active Boolean @default(true)            // 是否启用
  createdAt DateTime @default(now())
}
```

### 数据库操作最佳实践

#### 1. 连接管理
```typescript
// lib/db.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

#### 2. 事务处理
```typescript
// 创建短链时同时记录日志
const result = await prisma.$transaction(async (tx) => {
  const shortLink = await tx.shortLink.create({
    data: { path, originalUrl, title }
  })
  
  await tx.log.create({
    data: {
      type: 'create',
      message: `短链创建: ${path}`,
      details: JSON.stringify({ originalUrl })
    }
  })
  
  return shortLink
})
```

#### 3. 查询优化
```typescript
// 使用索引和分页
const links = await prisma.shortLink.findMany({
  where: {
    originalUrl: { contains: search }
  },
  orderBy: { createdAt: 'desc' },
  skip: (page - 1) * limit,
  take: limit,
  include: {
    _count: { select: { visitLogs: true } }
  }
})
```

## 🔌 API 设计

### RESTful API 规范

#### 1. URL 设计规范
```
GET    /api/links           # 获取短链列表
POST   /api/links           # 创建短链
GET    /api/links/[id]      # 获取单个短链
PUT    /api/links/[id]      # 更新短链
DELETE /api/links/[id]      # 删除短链

GET    /api/domains         # 获取域名规则
POST   /api/domains         # 添加域名规则
DELETE /api/domains/[id]    # 删除域名规则

GET    /api/logs            # 获取日志列表
GET    /api/logs/stats      # 获取统计数据
POST   /api/logs/cleanup    # 清理日志
```

#### 2. 响应格式规范
```typescript
// 成功响应
interface SuccessResponse<T> {
  success: true
  data: T
  message?: string
}

// 错误响应
interface ErrorResponse {
  success: false
  error: string
  code?: string
  details?: any
}

// 分页响应
interface PaginatedResponse<T> {
  success: true
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
```

#### 3. 错误处理
```typescript
// lib/api-utils.ts
export function handleApiError(error: any) {
  console.error('API Error:', error)
  
  if (error.code === 'P2002') {
    return NextResponse.json({
      success: false,
      error: '数据已存在'
    }, { status: 409 })
  }
  
  return NextResponse.json({
    success: false,
    error: '服务器内部错误'
  }, { status: 500 })
}
```

### API 实现示例

#### 1. 短链创建 API
```typescript
// app/api/links/route.ts
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { originalUrl, customPath, password } = body
    
    // 验证URL格式
    if (!isValidUrl(originalUrl)) {
      return NextResponse.json({
        success: false,
        error: 'URL格式无效'
      }, { status: 400 })
    }
    
    // 检查域名权限
    const domainCheck = await checkDomainAccess(originalUrl)
    if (!domainCheck.allowed) {
      return NextResponse.json({
        success: false,
        error: domainCheck.reason
      }, { status: 403 })
    }
    
    // 生成短链路径
    const path = customPath || generateShortPath()
    
    // 抓取页面标题
    const title = await fetchPageTitle(originalUrl)
    
    // 创建短链
    const shortLink = await prisma.shortLink.create({
      data: {
        path,
        originalUrl,
        title,
        password: password ? await hashPassword(password) : null
      }
    })
    
    return NextResponse.json({
      success: true,
      data: {
        ...shortLink,
        shortUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/${path}`
      }
    })
    
  } catch (error) {
    return handleApiError(error)
  }
}
```

#### 2. 访问统计 API
```typescript
// app/api/logs/stats/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || '7d'
  const linkId = searchParams.get('linkId')
  
  const days = parseInt(period.replace('d', ''))
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  const where = {
    createdAt: { gte: startDate },
    ...(linkId && { shortId: linkId })
  }
  
  const [totalVisits, dailyStats, topLinks] = await Promise.all([
    // 总访问量
    prisma.visitLog.count({ where }),
    
    // 每日统计
    prisma.visitLog.groupBy({
      by: ['createdAt'],
      where,
      _count: true,
      orderBy: { createdAt: 'asc' }
    }),
    
    // 热门链接
    prisma.visitLog.groupBy({
      by: ['shortId'],
      where,
      _count: true,
      orderBy: { _count: { shortId: 'desc' } },
      take: 10
    })
  ])
  
  return NextResponse.json({
    success: true,
    data: {
      totalVisits,
      dailyStats,
      topLinks
    }
  })
}
```

## 🎨 前端组件

### 组件设计原则

1. **单一职责**：每个组件只负责一个功能
2. **可复用性**：通过 props 配置不同状态
3. **类型安全**：完整的 TypeScript 类型定义
4. **响应式**：适配不同屏幕尺寸
5. **可访问性**：支持键盘导航和屏幕阅读器

### 核心组件详解

#### 1. HomeView 组件
```typescript
// components/HomeView.tsx
interface HomeViewProps {
  initialLinks?: ShortLink[]
  isAdmin?: boolean
}

export default function HomeView({ initialLinks, isAdmin }: HomeViewProps) {
  const [links, setLinks] = useState(initialLinks || [])
  const [loading, setLoading] = useState(false)
  const [url, setUrl] = useState('')
  
  // 创建短链
  const handleCreateLink = async (data: CreateLinkData) => {
    setLoading(true)
    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      const result = await response.json()
      if (result.success) {
        setLinks(prev => [result.data, ...prev])
        setUrl('')
        showNotification('短链创建成功！')
      } else {
        showNotification(result.error, 'error')
      }
    } catch (error) {
      showNotification('创建失败，请重试', 'error')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="space-y-6">
      {/* 创建表单 */}
      <CreateLinkForm 
        onSubmit={handleCreateLink}
        loading={loading}
      />
      
      {/* 短链列表 */}
      <LinkList 
        links={links}
        onUpdate={setLinks}
        isAdmin={isAdmin}
      />
    </div>
  )
}
```

#### 2. SafeRedirectView 组件
```typescript
// components/SafeRedirectView.tsx
interface SafeRedirectViewProps {
  originalUrl: string
  title?: string
  requirePassword?: boolean
  requireConfirm?: boolean
  enableIntermediate?: boolean
  onRedirect: (url: string) => void
}

export default function SafeRedirectView({
  originalUrl,
  title,
  requirePassword,
  requireConfirm,
  enableIntermediate,
  onRedirect
}: SafeRedirectViewProps) {
  const [password, setPassword] = useState('')
  const [countdown, setCountdown] = useState(5)
  const [showPassword, setShowPassword] = useState(requirePassword)
  const [showConfirm, setShowConfirm] = useState(requireConfirm)
  
  // 自动跳转倒计时
  useEffect(() => {
    if (!showPassword && !showConfirm && enableIntermediate) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            onRedirect(originalUrl)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      return () => clearInterval(timer)
    }
  }, [showPassword, showConfirm, enableIntermediate, originalUrl, onRedirect])
  
  // 密码验证
  const handlePasswordSubmit = async () => {
    try {
      const response = await fetch(`/api/visit/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      
      const result = await response.json()
      if (result.success) {
        setShowPassword(false)
        if (!requireConfirm) {
          onRedirect(originalUrl)
        }
      } else {
        showNotification('密码错误', 'error')
      }
    } catch (error) {
      showNotification('验证失败', 'error')
    }
  }
  
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="cute-card max-w-md w-full p-8 text-center">
        {/* 图标 */}
        <div className="w-16 h-16 bg-blue-100 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
          <Zap size={32} />
        </div>
        
        {/* 标题 */}
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          {title || '即将离开 ShortLink'}
        </h2>
        
        {/* 描述 */}
        <p className="text-slate-500 mb-6 text-sm leading-relaxed">
          {showPassword ? '请输入访问密码' : 
           showConfirm ? '请确认是否继续访问' :
           '正在前往目标链接，请确认链接安全性。'}
        </p>
        
        {/* 目标URL显示 */}
        <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left border border-slate-100">
          <div className="text-xs text-slate-400 uppercase font-bold mb-1">
            目标链接
          </div>
          <div className="text-primary truncate font-medium">
            {originalUrl}
          </div>
        </div>
        
        {/* 密码输入 */}
        {showPassword && (
          <div className="space-y-4 mb-6">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入访问密码"
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
            />
            <button
              onClick={handlePasswordSubmit}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              确认访问
            </button>
          </div>
        )}
        
        {/* 确认按钮 */}
        {showConfirm && !showPassword && (
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => onRedirect(originalUrl)}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              继续访问
            </button>
            <button
              onClick={() => window.history.back()}
              className="flex-1 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
            >
              取消
            </button>
          </div>
        )}
        
        {/* 倒计时 */}
        {!showPassword && !showConfirm && enableIntermediate && (
          <div className="mb-4 text-sm text-slate-400 font-medium animate-pulse">
            <Clock size={14} className="inline mr-1 relative -top-[1px]" />
            将在 {countdown} 秒后自动跳转...
          </div>
        )}
      </div>
    </div>
  )
}
```

### 状态管理

#### 1. 多语言上下文
```typescript
// lib/LanguageContext.tsx
interface LanguageContextType {
  language: 'zh' | 'en'
  setLanguage: (lang: 'zh' | 'en') => void
  t: (key: string, params?: Record<string, string>) => string
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<'zh' | 'en'>('zh')
  
  const t = useCallback((key: string, params?: Record<string, string>) => {
    let text = translations[language][key] || key
    
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(`{${param}}`, value)
      })
    }
    
    return text
  }, [language])
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}
```

#### 2. 管理员上下文
```typescript
// lib/AdminContext.tsx
interface AdminContextType {
  isLoggedIn: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  checkAuth: () => Promise<boolean>
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  
  const login = async (username: string, password: string) => {
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      
      const result = await response.json()
      if (result.success) {
        setIsLoggedIn(true)
        return true
      }
      return false
    } catch {
      return false
    }
  }
  
  const logout = () => {
    setIsLoggedIn(false)
    document.cookie = 'admin-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  }
  
  return (
    <AdminContext.Provider value={{ isLoggedIn, login, logout, checkAuth }}>
      {children}
    </AdminContext.Provider>
  )
}
```

## 🧪 测试指南

### 测试策略

1. **单元测试**：测试独立的函数和组件
2. **集成测试**：测试组件间的交互
3. **API 测试**：测试后端接口逻辑
4. **E2E 测试**：测试完整的用户流程

### 测试环境配置

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    globals: true,
    css: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

### 测试示例

#### 1. 工具函数测试
```typescript
// test/lib/utils.test.ts
import { describe, it, expect } from 'vitest'
import { isValidUrl, generateShortPath, extractDomain } from '@/lib/utils'

describe('工具函数测试', () => {
  describe('isValidUrl', () => {
    it('应该验证有效的URL', () => {
      expect(isValidUrl('https://example.com')).toBe(true)
      expect(isValidUrl('http://localhost:3000')).toBe(true)
      expect(isValidUrl('ftp://files.example.com')).toBe(true)
    })
    
    it('应该拒绝无效的URL', () => {
      expect(isValidUrl('not-a-url')).toBe(false)
      expect(isValidUrl('javascript:alert(1)')).toBe(false)
      expect(isValidUrl('')).toBe(false)
    })
  })
  
  describe('generateShortPath', () => {
    it('应该生成指定长度的路径', () => {
      const path = generateShortPath(6)
      expect(path).toHaveLength(6)
      expect(/^[a-zA-Z0-9]+$/.test(path)).toBe(true)
    })
    
    it('应该生成唯一的路径', () => {
      const paths = Array.from({ length: 100 }, () => generateShortPath())
      const uniquePaths = new Set(paths)
      expect(uniquePaths.size).toBe(paths.length)
    })
  })
})
```

#### 2. 组件测试
```typescript
// test/components/HomeView.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HomeView from '@/components/HomeView'
import { LanguageProvider } from '@/lib/LanguageContext'

// 模拟 fetch
global.fetch = vi.fn()

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <LanguageProvider>
      {component}
    </LanguageProvider>
  )
}

describe('HomeView 组件测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  it('应该正确渲染组件', () => {
    renderWithProviders(<HomeView />)
    
    expect(screen.getByPlaceholderText(/粘贴长链接/)).toBeInTheDocument()
    expect(screen.getByText('生成')).toBeInTheDocument()
  })
  
  it('应该处理URL输入和生成', async () => {
    const user = userEvent.setup()
    
    // 模拟成功响应
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          id: '1',
          path: 'abc123',
          originalUrl: 'https://example.com',
          shortUrl: 'http://localhost:3000/abc123'
        }
      })
    } as Response)
    
    renderWithProviders(<HomeView />)
    
    const input = screen.getByPlaceholderText(/粘贴长链接/)
    const button = screen.getByText('生成')
    
    await user.type(input, 'https://example.com')
    await user.click(button)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalUrl: 'https://example.com' })
      })
    })
  })
})
```

#### 3. API 测试
```typescript
// test/api/links.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { POST, GET } from '@/app/api/links/route'
import { prisma } from '@/lib/db'

describe('短链 API 测试', () => {
  beforeEach(async () => {
    // 清理测试数据
    await prisma.shortLink.deleteMany()
  })
  
  afterEach(async () => {
    // 清理测试数据
    await prisma.shortLink.deleteMany()
  })
  
  describe('POST /api/links', () => {
    it('应该创建新的短链', async () => {
      const request = new Request('http://localhost:3000/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalUrl: 'https://example.com'
        })
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.originalUrl).toBe('https://example.com')
      expect(data.data.path).toBeDefined()
    })
    
    it('应该拒绝无效的URL', async () => {
      const request = new Request('http://localhost:3000/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalUrl: 'not-a-url'
        })
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('URL格式无效')
    })
  })
})
```

### 运行测试

```bash
# 运行所有测试
bun run test

# 监听模式
bun run test:watch

# 生成覆盖率报告
bun run test:coverage

# 运行测试 UI
bun run test:ui
```

## 🚀 部署流程

### 生产环境检查清单

- [ ] 环境变量配置完成
- [ ] 数据库连接正常
- [ ] 构建成功无错误
- [ ] 测试通过
- [ ] 安全配置检查
- [ ] 性能优化完成
- [ ] 监控配置就绪

### Vercel 部署

1. **项目配置**
```json
// vercel.json
{
  "buildCommand": "bun run build",
  "devCommand": "bun run dev",
  "installCommand": "bun install",
  "framework": "nextjs",
  "env": {
    "DATABASE_URL": "@database-url",
    "NEXT_PUBLIC_BASE_URL": "@base-url",
    "ENCRYPTION_KEY": "@encryption-key"
  }
}
```

2. **数据库迁移**
```bash
# 在 Vercel 项目设置中添加构建命令
bun run build && bun run db:push
```

### Docker 部署

```dockerfile
# Dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

# 安装依赖
FROM base AS deps
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# 构建应用
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# 生产镜像
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["bun", "server.js"]
```

### 性能优化

1. **图片优化**
```typescript
// next.config.ts
const nextConfig = {
  images: {
    domains: ['example.com'],
    formats: ['image/webp', 'image/avif'],
  },
  experimental: {
    optimizeCss: true,
  }
}
```

2. **缓存策略**
```typescript
// 静态资源缓存
export const revalidate = 3600 // 1小时

// API 响应缓存
export async function GET() {
  const data = await fetchData()
  
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
    }
  })
}
```

## ❓ 常见问题

### 开发环境问题

#### Q: Bun 安装失败
```bash
# 解决方案1：使用 npm 安装
npm install

# 解决方案2：清理缓存
bun pm cache rm
bun install
```

#### Q: 数据库连接失败
```bash
# 检查数据库文件权限
ls -la dev.db

# 重新初始化数据库
rm dev.db
bun run setup
```

#### Q: TypeScript 类型错误
```bash
# 重新生成 Prisma 客户端
bun run db:generate

# 重启 TypeScript 服务
# VS Code: Ctrl+Shift+P -> "TypeScript: Restart TS Server"
```

### 生产环境问题

#### Q: 构建失败
```bash
# 检查依赖版本兼容性
bun outdated

# 清理构建缓存
rm -rf .next
bun run build
```

#### Q: 数据库迁移失败
```bash
# 检查数据库连接
bun run db:studio

# 手动运行迁移
bun run db:migrate
```

#### Q: 性能问题
```bash
# 分析构建产物
bun run build
bunx @next/bundle-analyzer

# 检查数据库查询
# 使用 Prisma Studio 查看慢查询
```

### 功能问题

#### Q: 短链访问404
1. 检查路径是否存在于数据库
2. 检查 Next.js 动态路由配置
3. 检查服务器重写规则

#### Q: 域名过滤不生效
1. 检查域名规则配置
2. 检查域名匹配逻辑
3. 检查缓存是否需要清理

#### Q: 多语言切换失败
1. 检查 LanguageContext 是否正确包装
2. 检查翻译文件是否完整
3. 检查浏览器本地存储

---

## 📚 参考资料

- [Next.js 官方文档](https://nextjs.org/docs)
- [Prisma 官方文档](https://www.prisma.io/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Vitest 测试框架](https://vitest.dev/)
- [TypeScript 手册](https://www.typescriptlang.org/docs)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！请遵循项目的代码规范和提交规范。

---

**Happy Coding! 🎉**