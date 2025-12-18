# AL01Link Development Documentation

[English](./DEVELOPMENT_EN.md) | [中文](./DEVELOPMENT.md)

## 📋 Table of Contents

- [Development Environment Setup](#development-environment-setup)
- [Project Architecture](#project-architecture)
- [Database Design](#database-design)
- [API Design](#api-design)
- [Frontend Components](#frontend-components)
- [Testing Guide](#testing-guide)
- [Deployment Process](#deployment-process)
- [FAQ](#faq)

## 🛠️ Development Environment Setup

### System Requirements

- **Operating System**: Windows 10+, macOS 10.15+, Ubuntu 18.04+
- **Node.js**: 18.0 or higher
- **Bun**: 1.0 or higher (recommended)
- **Git**: 2.20 or higher
- **Editor**: VS Code (recommended) or other TypeScript-supported editors

### Development Tools Installation

#### 1. Install Node.js
```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Or direct download
# https://nodejs.org/
```

#### 2. Install Bun
```bash
# macOS/Linux
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"
```

#### 3. Install Git
```bash
# Ubuntu/Debian
sudo apt install git

# macOS
brew install git

# Windows
# Download Git for Windows: https://git-scm.com/download/win
```

### VS Code Extensions Recommended

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

### Project Initialization

```bash
# 1. Clone project
git clone https://github.com/your-username/shortlink.git
cd shortlink

# 2. Install dependencies
bun install

# 3. Copy environment variables
cp .env.example .env.local

# 4. Edit environment variables
code .env.local

# 5. Initialize database
bun run setup

# 6. Start development server
bun run dev
```

## 🏗️ Project Architecture

### Technology Stack

- **Frontend Framework**: Next.js 16 (App Router)
- **Development Language**: TypeScript 5.0+
- **Styling Framework**: Tailwind CSS 4.0
- **Database ORM**: Prisma 5.0
- **Database**: SQLite (development) / PostgreSQL (production)
- **Icon Library**: Lucide React
- **Testing Framework**: Vitest + Testing Library
- **Package Manager**: Bun

### Directory Structure Details

```
shortlink/
├── 📁 app/                     # Next.js App Router
│   ├── 📁 api/                # Backend API routes
│   │   ├── 📁 admin/          # Admin related APIs
│   │   │   ├── login/         # Admin login
│   │   │   └── change-password/ # Change password
│   │   ├── 📁 domains/        # Domain management API
│   │   ├── 📁 links/          # Short link management API
│   │   ├── 📁 logs/           # Log management API
│   │   ├── 📁 settings/       # System settings API
│   │   ├── 📁 visit/          # Visit statistics API
│   │   └── 📁 to/             # Quick redirect API
│   ├── 📁 [path]/             # Dynamic routes - short link access
│   │   ├── page.tsx           # Short link page
│   │   └── SafeRedirectClient.tsx # Client redirect component
│   ├── 📁 to/                 # Quick redirect pages
│   │   └── page.tsx           # Quick redirect page
│   ├── 📄 layout.tsx          # Root layout
│   ├── 📄 page.tsx            # Main page
│   ├── 📄 not-found.tsx       # 404 page
│   └── 📄 globals.css         # Global styles
├── 📁 components/              # React components
│   ├── 📄 AdminDropdown.tsx   # Admin dropdown menu
│   ├── 📄 AdminLoginPage.tsx  # Admin login page
│   ├── 📄 AdminSettings.tsx   # Admin settings
│   ├── 📄 ApiDocumentation.tsx # API documentation component
│   ├── 📄 ConfirmDialog.tsx   # Confirmation dialog
│   ├── 📄 EditLinkDialog.tsx  # Edit link dialog
│   ├── 📄 EditPanel.tsx       # Edit panel
│   ├── 📄 HomeView.tsx        # Home view
│   ├── 📄 LogsView.tsx        # Logs view
│   ├── 📄 Navbar.tsx          # Navigation bar
│   ├── 📄 NotificationDialog.tsx # Notification dialog
│   ├── 📄 SafeRedirectView.tsx # Safe redirect view
│   ├── 📄 SettingsView.tsx    # Settings view
│   └── 📄 TurnstileWidget.tsx # Human verification component
├── 📁 lib/                     # Utility library and contexts
│   ├── 📄 AdminContext.tsx    # Admin state management
│   ├── 📄 LanguageContext.tsx # Multi-language state management
│   ├── 📄 db.ts               # Database connection configuration
│   ├── 📄 translations.ts     # Multi-language translation configuration
│   └── 📄 utils.ts            # Common utility functions
├── 📁 prisma/                  # Database related
│   └── 📄 schema.prisma       # Database model definition
├── 📁 scripts/                 # Script files
│   └── 📄 init-db.ts          # Database initialization script
├── 📁 test/                    # Test files
│   ├── 📁 api/                # API tests
│   ├── 📁 components/         # Component tests
│   ├── 📁 integration/        # Integration tests
│   ├── 📁 lib/                # Utility function tests
│   └── 📄 setup.ts            # Test environment configuration
├── 📄 .env.example            # Environment variable template
├── 📄 .gitignore              # Git ignore file
├── 📄 bun.lockb               # Bun lock file
├── 📄 next.config.ts          # Next.js configuration
├── 📄 package.json            # Project configuration
├── 📄 tailwind.config.ts      # Tailwind CSS configuration
├── 📄 tsconfig.json           # TypeScript configuration
└── 📄 vitest.config.ts        # Test configuration
```

### Architecture Design Principles

1. **Layered Architecture**: Clear frontend-backend separation, API layer, business logic layer, data access layer
2. **Component-based**: Reusable React components, single responsibility principle
3. **Type Safety**: Comprehensive TypeScript type definitions
4. **Responsive Design**: Mobile-first responsive layout
5. **Internationalization**: Complete Chinese-English bilingual support

## 🗄️ Database Design

### Data Model Relationship Diagram

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

### Core Data Models

#### 1. ShortLink (Short Link Model)
```prisma
model ShortLink {
  id           String   @id @default(uuid())
  path         String   @unique              // Short link path
  originalUrl  String                        // Original URL
  title        String?                       // Page title
  password     String?                       // Access password
  expiresAt    DateTime?                     // Expiration time
  requireConfirm Boolean @default(false)     // Require confirmation
  enableIntermediate Boolean @default(true)  // Enable transition page
  views        Int      @default(0)          // View count
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  visitLogs    VisitLog[]                    // Visit logs
}
```

#### 2. VisitLog (Visit Log)
```prisma
model VisitLog {
  id        String   @id @default(uuid())
  shortId   String                          // Associated short link ID
  ip        String?                         // Visitor IP
  userAgent String?                         // User agent
  referer   String?                         // Referrer page
  createdAt DateTime @default(now())
  shortLink ShortLink @relation(fields: [shortId], references: [id], onDelete: Cascade)
}
```

#### 3. DomainRule (Domain Rule)
```prisma
model DomainRule {
  id     String @id @default(uuid())
  domain String @unique                     // Domain
  type   String                            // "whitelist" | "blacklist"
  active Boolean @default(true)            // Is active
  createdAt DateTime @default(now())
}
```

### Database Operation Best Practices

#### 1. Connection Management
```typescript
// lib/db.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

#### 2. Transaction Handling
```typescript
// Create short link and log simultaneously
const result = await prisma.$transaction(async (tx) => {
  const shortLink = await tx.shortLink.create({
    data: { path, originalUrl, title }
  })
  
  await tx.log.create({
    data: {
      type: 'create',
      message: `Short link created: ${path}`,
      details: JSON.stringify({ originalUrl })
    }
  })
  
  return shortLink
})
```

#### 3. Query Optimization
```typescript
// Use indexes and pagination
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

## 🔌 API Design

### RESTful API Standards

#### 1. URL Design Standards
```
GET    /api/links           # Get short link list
POST   /api/links           # Create short link
GET    /api/links/[id]      # Get single short link
PUT    /api/links/[id]      # Update short link
DELETE /api/links/[id]      # Delete short link

GET    /api/domains         # Get domain rules
POST   /api/domains         # Add domain rule
DELETE /api/domains/[id]    # Delete domain rule

GET    /api/logs            # Get log list
GET    /api/logs/stats      # Get statistics
POST   /api/logs/cleanup    # Clean logs
```

#### 2. Response Format Standards
```typescript
// Success response
interface SuccessResponse<T> {
  success: true
  data: T
  message?: string
}

// Error response
interface ErrorResponse {
  success: false
  error: string
  code?: string
  details?: any
}

// Paginated response
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

#### 3. Error Handling
```typescript
// lib/api-utils.ts
export function handleApiError(error: any) {
  console.error('API Error:', error)
  
  if (error.code === 'P2002') {
    return NextResponse.json({
      success: false,
      error: 'Data already exists'
    }, { status: 409 })
  }
  
  return NextResponse.json({
    success: false,
    error: 'Internal server error'
  }, { status: 500 })
}
```

### API Implementation Examples

#### 1. Short Link Creation API
```typescript
// app/api/links/route.ts
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { originalUrl, customPath, password } = body
    
    // Validate URL format
    if (!isValidUrl(originalUrl)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid URL format'
      }, { status: 400 })
    }
    
    // Check domain permissions
    const domainCheck = await checkDomainAccess(originalUrl)
    if (!domainCheck.allowed) {
      return NextResponse.json({
        success: false,
        error: domainCheck.reason
      }, { status: 403 })
    }
    
    // Generate short link path
    const path = customPath || generateShortPath()
    
    // Fetch page title
    const title = await fetchPageTitle(originalUrl)
    
    // Create short link
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

#### 2. Visit Statistics API
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
    // Total visits
    prisma.visitLog.count({ where }),
    
    // Daily statistics
    prisma.visitLog.groupBy({
      by: ['createdAt'],
      where,
      _count: true,
      orderBy: { createdAt: 'asc' }
    }),
    
    // Top links
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

## 🎨 Frontend Components

### Component Design Principles

1. **Single Responsibility**: Each component handles only one function
2. **Reusability**: Configure different states through props
3. **Type Safety**: Complete TypeScript type definitions
4. **Responsive**: Adapt to different screen sizes
5. **Accessibility**: Support keyboard navigation and screen readers

### Core Component Details

#### 1. HomeView Component
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
  
  // Create short link
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
        showNotification('Short link created successfully!')
      } else {
        showNotification(result.error, 'error')
      }
    } catch (error) {
      showNotification('Creation failed, please try again', 'error')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Creation form */}
      <CreateLinkForm 
        onSubmit={handleCreateLink}
        loading={loading}
      />
      
      {/* Short link list */}
      <LinkList 
        links={links}
        onUpdate={setLinks}
        isAdmin={isAdmin}
      />
    </div>
  )
}
```

#### 2. SafeRedirectView Component
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
  
  // Auto redirect countdown
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
  
  // Password verification
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
        showNotification('Incorrect password', 'error')
      }
    } catch (error) {
      showNotification('Verification failed', 'error')
    }
  }
  
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="cute-card max-w-md w-full p-8 text-center">
        {/* Icon */}
        <div className="w-16 h-16 bg-blue-100 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
          <Zap size={32} />
        </div>
        
        {/* Title */}
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          {title || 'Leaving AL01Link'}
        </h2>
        
        {/* Description */}
        <p className="text-slate-500 mb-6 text-sm leading-relaxed">
          {showPassword ? 'Please enter access password' : 
           showConfirm ? 'Please confirm to continue' :
           'Redirecting to target link, please verify link safety.'}
        </p>
        
        {/* Target URL display */}
        <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left border border-slate-100">
          <div className="text-xs text-slate-400 uppercase font-bold mb-1">
            Target Link
          </div>
          <div className="text-primary truncate font-medium">
            {originalUrl}
          </div>
        </div>
        
        {/* Password input */}
        {showPassword && (
          <div className="space-y-4 mb-6">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Please enter access password"
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
            />
            <button
              onClick={handlePasswordSubmit}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Confirm Access
            </button>
          </div>
        )}
        
        {/* Confirmation buttons */}
        {showConfirm && !showPassword && (
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => onRedirect(originalUrl)}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue
            </button>
            <button
              onClick={() => window.history.back()}
              className="flex-1 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
        
        {/* Countdown */}
        {!showPassword && !showConfirm && enableIntermediate && (
          <div className="mb-4 text-sm text-slate-400 font-medium animate-pulse">
            <Clock size={14} className="inline mr-1 relative -top-[1px]" />
            Auto redirect in {countdown} seconds...
          </div>
        )}
      </div>
    </div>
  )
}
```

### State Management

#### 1. Multi-language Context
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

#### 2. Admin Context
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

## 🧪 Testing Guide

### Testing Strategy

1. **Unit Tests**: Test independent functions and components
2. **Integration Tests**: Test component interactions
3. **API Tests**: Test backend interface logic
4. **E2E Tests**: Test complete user workflows

### Test Environment Configuration

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

### Test Examples

#### 1. Utility Function Tests
```typescript
// test/lib/utils.test.ts
import { describe, it, expect } from 'vitest'
import { isValidUrl, generateShortPath, extractDomain } from '@/lib/utils'

describe('Utility Function Tests', () => {
  describe('isValidUrl', () => {
    it('should validate valid URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true)
      expect(isValidUrl('http://localhost:3000')).toBe(true)
      expect(isValidUrl('ftp://files.example.com')).toBe(true)
    })
    
    it('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false)
      expect(isValidUrl('javascript:alert(1)')).toBe(false)
      expect(isValidUrl('')).toBe(false)
    })
  })
  
  describe('generateShortPath', () => {
    it('should generate path of specified length', () => {
      const path = generateShortPath(6)
      expect(path).toHaveLength(6)
      expect(/^[a-zA-Z0-9]+$/.test(path)).toBe(true)
    })
    
    it('should generate unique paths', () => {
      const paths = Array.from({ length: 100 }, () => generateShortPath())
      const uniquePaths = new Set(paths)
      expect(uniquePaths.size).toBe(paths.length)
    })
  })
})
```

#### 2. Component Tests
```typescript
// test/components/HomeView.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HomeView from '@/components/HomeView'
import { LanguageProvider } from '@/lib/LanguageContext'

// Mock fetch
global.fetch = vi.fn()

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <LanguageProvider>
      {component}
    </LanguageProvider>
  )
}

describe('HomeView Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  it('should render component correctly', () => {
    renderWithProviders(<HomeView />)
    
    expect(screen.getByPlaceholderText(/Paste long URL/)).toBeInTheDocument()
    expect(screen.getByText('Generate')).toBeInTheDocument()
  })
  
  it('should handle URL input and generation', async () => {
    const user = userEvent.setup()
    
    // Mock successful response
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
    
    const input = screen.getByPlaceholderText(/Paste long URL/)
    const button = screen.getByText('Generate')
    
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

#### 3. API Tests
```typescript
// test/api/links.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { POST, GET } from '@/app/api/links/route'
import { prisma } from '@/lib/db'

describe('Short Link API Tests', () => {
  beforeEach(async () => {
    // Clean test data
    await prisma.shortLink.deleteMany()
  })
  
  afterEach(async () => {
    // Clean test data
    await prisma.shortLink.deleteMany()
  })
  
  describe('POST /api/links', () => {
    it('should create new short link', async () => {
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
    
    it('should reject invalid URLs', async () => {
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
      expect(data.error).toContain('Invalid URL format')
    })
  })
})
```

### Running Tests

```bash
# Run all tests
bun run test

# Watch mode
bun run test:watch

# Generate coverage report
bun run test:coverage

# Run test UI
bun run test:ui
```

## 🚀 Deployment Process

### Production Environment Checklist

- [ ] Environment variables configured
- [ ] Database connection normal
- [ ] Build successful without errors
- [ ] Tests passing
- [ ] Security configuration checked
- [ ] Performance optimization completed
- [ ] Monitoring configuration ready

### Vercel Deployment

1. **Project Configuration**
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

2. **Database Migration**
```bash
# Add build command in Vercel project settings
bun run build && bun run db:push
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Build application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# Production image
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

### Performance Optimization

1. **Image Optimization**
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

2. **Caching Strategy**
```typescript
// Static resource caching
export const revalidate = 3600 // 1 hour

// API response caching
export async function GET() {
  const data = await fetchData()
  
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
    }
  })
}
```

## ❓ FAQ

### Development Environment Issues

#### Q: Bun installation failed
```bash
# Solution 1: Use npm installation
npm install

# Solution 2: Clear cache
bun pm cache rm
bun install
```

#### Q: Database connection failed
```bash
# Check database file permissions
ls -la dev.db

# Reinitialize database
rm dev.db
bun run setup
```

#### Q: TypeScript type errors
```bash
# Regenerate Prisma client
bun run db:generate

# Restart TypeScript service
# VS Code: Ctrl+Shift+P -> "TypeScript: Restart TS Server"
```

### Production Environment Issues

#### Q: Build failed
```bash
# Check dependency version compatibility
bun outdated

# Clear build cache
rm -rf .next
bun run build
```

#### Q: Database migration failed
```bash
# Check database connection
bun run db:studio

# Manually run migration
bun run db:migrate
```

#### Q: Performance issues
```bash
# Analyze build output
bun run build
bunx @next/bundle-analyzer

# Check database queries
# Use Prisma Studio to view slow queries
```

### Feature Issues

#### Q: Short link access 404
1. Check if path exists in database
2. Check Next.js dynamic route configuration
3. Check server rewrite rules

#### Q: Domain filtering not working
1. Check domain rule configuration
2. Check domain matching logic
3. Check if cache needs clearing

#### Q: Multi-language switching failed
1. Check if LanguageContext is properly wrapped
2. Check if translation files are complete
3. Check browser local storage

---

## 📚 References

- [Next.js Official Documentation](https://nextjs.org/docs)
- [Prisma Official Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vitest Testing Framework](https://vitest.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

## 🤝 Contributing

Welcome to submit Issues and Pull Requests! Please follow the project's code standards and commit conventions.

---

**Happy Coding! 🎉**