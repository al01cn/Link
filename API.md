# 灵狼Link API 文档

## 📋 目录

- [API 概述](#api-概述)
- [OpenAPI 规范](#openapi-规范)
- [认证方式](#认证方式)
- [响应格式](#响应格式)
- [短链管理 API](#短链管理-api)
- [访问统计 API](#访问统计-api)
- [域名管理 API](#域名管理-api)
- [系统设置 API](#系统设置-api)
- [管理员 API](#管理员-api)
- [快速跳转 API](#快速跳转-api)
- [错误代码](#错误代码)
- [SDK 和示例](#sdk-和示例)

## 🌐 API 概述

灵狼Link 提供完整的 RESTful API，支持短链创建、管理、统计等功能。

### 基础信息

- **Base URL**: `https://your-domain.com/api`
- **协议**: HTTPS
- **数据格式**: JSON
- **字符编码**: UTF-8
- **API 版本**: v1

### 请求头

```http
Content-Type: application/json
Accept: application/json
User-Agent: YourApp/1.0
```

### 速率限制

- **创建短链**: 100 次/小时/IP
- **查询接口**: 1000 次/小时/IP
- **管理接口**: 500 次/小时/IP

## 📄 OpenAPI 规范

灵狼Link 提供完整的 OpenAPI 3.0.3 规范文档，支持多语言切换。

### 获取 OpenAPI 规范

```http
GET /api/openapi?lang={language}
```

**查询参数：**

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| lang | string | zh | 语言代码：zh（中文）、en（英文） |

**响应示例：**

```json
{
  "openapi": "3.0.3",
  "info": {
    "title": "灵狼Link API",
    "description": "简单、安全、强大的短链生成工具 API 接口文档",
    "version": "1.0.0"
  },
  "paths": {
    // 完整的 API 路径定义
  },
  "components": {
    // 数据模型和响应定义
  }
}
```

### 使用方法

**1. 在 Swagger UI 中导入：**
```
https://your-domain.com/api/openapi?lang=zh
```

**2. 在 Postman 中导入：**
- 选择 "Import" → "Link"
- 输入：`https://your-domain.com/api/openapi?lang=en`

**3. 使用 curl 获取：**
```bash
# 获取中文版本（默认）
curl https://your-domain.com/api/openapi

# 获取英文版本
curl https://your-domain.com/api/openapi?lang=en
```

### 规范特性

- ✅ **完整的 API 端点定义**：包含所有接口的详细说明
- ✅ **多语言支持**：支持中文和英文两种语言
- ✅ **详细的请求/响应模式**：包含参数验证规则
- ✅ **错误响应定义**：标准化的错误处理
- ✅ **安全认证方案**：JWT Bearer Token 认证
- ✅ **示例数据**：提供完整的使用示例

## 🔐 认证方式

### 管理员认证

管理员接口需要通过 Cookie 认证：

```http
POST /api/admin/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password"
}
```

成功登录后，服务器会设置认证 Cookie，后续请求会自动携带。

### API 密钥认证（计划中）

```http
Authorization: Bearer your-api-key
```

## 📊 响应格式

### 成功响应

```json
{
  "success": true,
  "data": {
    // 响应数据
  },
  "message": "操作成功"
}
```

### 错误响应

```json
{
  "success": false,
  "error": "错误描述",
  "code": "ERROR_CODE",
  "details": {
    // 详细错误信息
  }
}
```

### 分页响应

```json
{
  "success": true,
  "data": [
    // 数据列表
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## 🔗 短链管理 API

### 创建短链

创建一个新的短链。

```http
POST /api/links
Content-Type: application/json

{
  "originalUrl": "https://example.com",
  "customPath": "custom",           // 可选：自定义路径
  "password": "secret",             // 可选：访问密码（明文，系统会自动加密存储）
  "requireConfirm": true,           // 可选：需要确认
  "enableIntermediate": true,       // 可选：启用过渡页
  "expiresAt": "2024-12-31T23:59:59Z" // 可选：过期时间
}
```

**密码保护说明：**

- **存储方式**：密码以 AES 加密方式存储，确保安全性
- **验证方式**：支持手动输入和自动填充两种验证模式
- **自动填充**：可通过 `?pwd=password` 参数实现自动填充
- **兼容性**：支持明文密码和加密字符串两种格式的自动填充

**响应示例：**

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "path": "abc123",
    "originalUrl": "https://example.com",
    "title": "Example Domain",
    "shortUrl": "https://your-domain.com/abc123",
    "password": null,
    "requireConfirm": false,
    "enableIntermediate": true,
    "expiresAt": null,
    "views": 0,
    "createdAt": "2024-12-18T10:00:00Z",
    "updatedAt": "2024-12-18T10:00:00Z"
  }
}
```

**错误响应：**

```json
{
  "success": false,
  "error": "URL格式无效",
  "code": "INVALID_URL"
}
```

### 获取短链列表

获取短链列表，支持分页和搜索。

```http
GET /api/links?page=1&limit=20&search=example&sortBy=createdAt&sortOrder=desc
```

**查询参数：**

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| page | number | 1 | 页码 |
| limit | number | 20 | 每页数量 |
| search | string | - | 搜索关键词 |
| sortBy | string | createdAt | 排序字段 |
| sortOrder | string | desc | 排序方向 |

**响应示例：**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "path": "abc123",
      "originalUrl": "https://example.com",
      "title": "Example Domain",
      "shortUrl": "https://your-domain.com/abc123",
      "views": 42,
      "createdAt": "2024-12-18T10:00:00Z",
      "_count": {
        "visitLogs": 42
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 获取单个短链

获取指定短链的详细信息。

```http
GET /api/links/{id}
```

**响应示例：**

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "path": "abc123",
    "originalUrl": "https://example.com",
    "title": "Example Domain",
    "shortUrl": "https://your-domain.com/abc123",
    "password": null,
    "requireConfirm": false,
    "enableIntermediate": true,
    "expiresAt": null,
    "views": 42,
    "createdAt": "2024-12-18T10:00:00Z",
    "updatedAt": "2024-12-18T10:00:00Z",
    "visitLogs": [
      {
        "id": "log-uuid",
        "ip": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "referer": "https://google.com",
        "createdAt": "2024-12-18T11:00:00Z"
      }
    ]
  }
}
```

### 更新短链

更新指定短链的信息。

```http
PUT /api/links/{id}
Content-Type: application/json

{
  "originalUrl": "https://new-example.com",
  "password": "new-secret",
  "requireConfirm": false,
  "enableIntermediate": true,
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

**响应示例：**

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "path": "abc123",
    "originalUrl": "https://new-example.com",
    "title": "New Example Domain",
    "shortUrl": "https://your-domain.com/abc123",
    "updatedAt": "2024-12-18T12:00:00Z"
  }
}
```

### 删除短链

删除指定的短链。

```http
DELETE /api/links/{id}
```

**响应示例：**

```json
{
  "success": true,
  "message": "短链删除成功"
}
```

### 批量删除短链

批量删除多个短链。

```http
DELETE /api/links
Content-Type: application/json

{
  "ids": ["uuid-1", "uuid-2", "uuid-3"]
}
```

**响应示例：**

```json
{
  "success": true,
  "data": {
    "deleted": 3,
    "failed": 0
  },
  "message": "批量删除完成"
}
```

## 📈 访问统计 API

### 获取访问统计

获取访问统计数据。

```http
GET /api/logs/stats?period=7d&linkId=uuid&type=summary
```

**查询参数：**

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| period | string | 7d | 统计周期 (1d, 7d, 30d, 90d) |
| linkId | string | - | 指定短链ID |
| type | string | summary | 统计类型 (summary, daily, hourly) |

**响应示例：**

```json
{
  "success": true,
  "data": {
    "totalVisits": 1234,
    "totalLinks": 56,
    "todayVisits": 89,
    "yesterdayVisits": 67,
    "dailyStats": [
      {
        "date": "2024-12-18",
        "visits": 89,
        "uniqueVisitors": 45
      }
    ],
    "topLinks": [
      {
        "id": "uuid-1",
        "path": "abc123",
        "originalUrl": "https://example.com",
        "visits": 234
      }
    ],
    "topReferrers": [
      {
        "referer": "https://google.com",
        "visits": 123
      }
    ]
  }
}
```

### 获取访问日志

获取详细的访问日志。

```http
GET /api/logs?page=1&limit=50&type=visit&linkId=uuid&startDate=2024-12-01&endDate=2024-12-18
```

**查询参数：**

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| page | number | 1 | 页码 |
| limit | number | 50 | 每页数量 |
| type | string | - | 日志类型 |
| linkId | string | - | 短链ID |
| startDate | string | - | 开始日期 |
| endDate | string | - | 结束日期 |

**响应示例：**

```json
{
  "success": true,
  "data": [
    {
      "id": "log-uuid",
      "type": "visit",
      "message": "短链访问: abc123",
      "details": {
        "path": "abc123",
        "originalUrl": "https://example.com"
      },
      "ip": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2024-12-18T11:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 500,
    "totalPages": 10
  }
}
```

### 清理访问日志

清理指定时间之前的访问日志。

```http
POST /api/logs/cleanup
Content-Type: application/json

{
  "days": 30,  // 保留最近30天的日志
  "type": "visit"  // 可选：指定日志类型
}
```

**响应示例：**

```json
{
  "success": true,
  "data": {
    "deleted": 1234
  },
  "message": "清理完成，删除了 1234 条日志"
}
```

## 🛡️ 域名管理 API

### 获取域名规则

获取域名白名单/黑名单规则。

```http
GET /api/domains?type=whitelist&active=true
```

**查询参数：**

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| type | string | - | 规则类型 (whitelist, blacklist) |
| active | boolean | - | 是否启用 |

**响应示例：**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "domain": "example.com",
      "type": "whitelist",
      "active": true,
      "createdAt": "2024-12-18T10:00:00Z"
    }
  ]
}
```

### 添加域名规则

添加新的域名规则。

```http
POST /api/domains
Content-Type: application/json

{
  "domain": "example.com",
  "type": "whitelist",  // "whitelist" | "blacklist"
  "active": true
}
```

**响应示例：**

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "domain": "example.com",
    "type": "whitelist",
    "active": true,
    "createdAt": "2024-12-18T10:00:00Z"
  }
}
```

### 更新域名规则

更新指定的域名规则。

```http
PUT /api/domains/{id}
Content-Type: application/json

{
  "active": false
}
```

### 删除域名规则

删除指定的域名规则。

```http
DELETE /api/domains/{id}
```

### 检查域名权限

检查指定URL的域名是否被允许。

```http
GET /api/check-domain?url=https://example.com/path
```

**响应示例：**

```json
{
  "success": true,
  "data": {
    "allowed": true,
    "domain": "example.com",
    "reason": "域名在白名单中",
    "matchedRule": {
      "id": "uuid-1",
      "domain": "example.com",
      "type": "whitelist"
    }
  }
}
```

## ⚙️ 系统设置 API

### 获取系统设置

获取系统配置信息。

```http
GET /api/settings
```

**响应示例：**

```json
{
  "success": true,
  "data": {
    "domainFilterMode": "whitelist",
    "enableTurnstile": false,
    "defaultRedirectMode": "intermediate",
    "allowCustomPath": true,
    "maxPathLength": 20,
    "enablePasswordProtection": true,
    "enableExpirationDate": true,
    "defaultExpirationDays": 365,
    "autoFillPasswordEnabled": true,  // 密码自动填充功能
    "preloadEnabled": true,           // 预加载功能
    "waitTime": 3                     // 跳转等待时间（秒）
  }
}
```

**新增配置项说明：**

| 配置项 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| autoFillPasswordEnabled | boolean | true | 是否启用密码自动填充功能 |
| preloadEnabled | boolean | true | 是否启用目标页面预加载 |
| waitTime | number | 3 | 自动跳转等待时间（秒） |

### 更新系统设置

更新系统配置。

```http
PUT /api/settings
Content-Type: application/json

{
  "domainFilterMode": "blacklist",
  "enableTurnstile": true,
  "defaultRedirectMode": "direct",
  "autoFillPasswordEnabled": false,  // 禁用密码自动填充
  "preloadEnabled": true,            // 启用预加载
  "waitTime": 5                      // 设置等待时间为5秒
}
```

**响应示例：**

```json
{
  "success": true,
  "data": {
    "updated": 3
  },
  "message": "设置更新成功"
}
```

## 👤 管理员 API

### 管理员登录

管理员身份验证。

```http
POST /api/admin/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password"
}
```

**响应示例：**

```json
{
  "success": true,
  "data": {
    "username": "admin",
    "isDefault": false
  },
  "message": "登录成功"
}
```

### 修改管理员密码

修改当前管理员密码。

```http
POST /api/admin/change-password
Content-Type: application/json

{
  "currentPassword": "old-password",
  "newPassword": "new-password"
}
```

**响应示例：**

```json
{
  "success": true,
  "message": "密码修改成功"
}
```

## ⚡ 快速跳转 API

### 临时跳转

创建临时跳转链接，不保存到数据库。

```http
GET /to?url=https://example.com
```

**响应**: 重定向到目标URL或显示安全确认页面

### 跟踪临时跳转

记录临时跳转的访问日志。

```http
POST /api/track-to-visit
Content-Type: application/json

{
  "url": "https://example.com",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

**响应示例：**

```json
{
  "success": true,
  "message": "访问记录已保存"
}
```

### 短链访问

访问短链并记录统计信息。

```http
GET /{path}
```

**响应**: 根据短链配置进行重定向或显示确认页面

### 验证短链密码

验证密码保护的短链。支持两种密码验证模式：

1. **手动输入模式**：用户手动输入明文密码
2. **自动填充模式**：通过 `pwd` 参数传递密码（支持明文和加密字符串）

```http
POST /api/visit/{path}
Content-Type: application/json

{
  "password": "secret",
  "isAutoFill": false  // 可选：是否为自动填充模式，默认 false
}
```

**请求参数：**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| password | string | 是 | 访问密码（明文或加密字符串） |
| isAutoFill | boolean | 否 | 是否为自动填充模式，默认 false |

**验证模式说明：**

**手动输入模式** (`isAutoFill: false`)：
- 只接受明文密码
- 用于用户在中间页手动输入密码的场景
- 系统会将明文密码与存储的加密密码进行比对

**自动填充模式** (`isAutoFill: true`)：
- 支持明文密码和加密字符串两种格式
- 用于通过 URL 参数 `pwd` 传递密码的场景
- 系统会智能识别并验证两种格式

**响应示例：**

```json
{
  "success": true,
  "data": {
    "originalUrl": "https://example.com",
    "title": "Example Domain",
    "requireConfirm": false,
    "enableIntermediate": true
  }
}
```

**错误响应：**

```json
{
  "success": false,
  "error": "密码错误",
  "code": "PASSWORD_INCORRECT"
}
```

### 密码自动填充

通过 URL 参数传递密码，实现自动填充和验证。

**使用方式：**

```bash
# 方式1：传递明文密码
https://your-domain.com/abc123?pwd=mypassword

# 方式2：传递加密密码字符串
https://your-domain.com/abc123?pwd=U2FsdGVkX1+encrypted_password_string
```

**工作流程：**

1. 系统从 URL 中获取 `pwd` 参数
2. 自动填充到密码输入框
3. 如果启用自动填充功能，自动提交验证
4. 系统智能识别明文密码或加密字符串并进行验证

**安全特性：**

- ✅ **手动输入保护**：手动输入模式只接受明文密码，防止误用
- ✅ **智能识别**：自动填充模式智能识别密码格式
- ✅ **加密传输**：建议使用 HTTPS 协议传输密码
- ✅ **向后兼容**：兼容旧的明文密码存储格式

**配置选项：**

可以在系统设置中控制密码自动填充功能：

```http
PUT /api/settings
Content-Type: application/json

{
  "autoFillPasswordEnabled": true  // 启用/禁用密码自动填充
}
```

## ❌ 错误代码

### 通用错误

| 错误代码 | HTTP状态码 | 描述 |
|----------|------------|------|
| INVALID_REQUEST | 400 | 请求格式无效 |
| UNAUTHORIZED | 401 | 未授权访问 |
| FORBIDDEN | 403 | 禁止访问 |
| NOT_FOUND | 404 | 资源不存在 |
| METHOD_NOT_ALLOWED | 405 | 请求方法不允许 |
| RATE_LIMITED | 429 | 请求频率超限 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |

### 业务错误

| 错误代码 | HTTP状态码 | 描述 |
|----------|------------|------|
| INVALID_URL | 400 | URL格式无效 |
| DOMAIN_NOT_ALLOWED | 403 | 域名不在允许列表中 |
| PATH_EXISTS | 409 | 短链路径已存在 |
| PATH_INVALID | 400 | 短链路径格式无效 |
| PASSWORD_REQUIRED | 401 | 需要密码验证 |
| PASSWORD_INCORRECT | 401 | 密码错误 |
| LINK_EXPIRED | 410 | 短链已过期 |
| LINK_NOT_FOUND | 404 | 短链不存在 |

### 错误响应示例

```json
{
  "success": false,
  "error": "域名不在允许列表中",
  "code": "DOMAIN_NOT_ALLOWED",
  "details": {
    "domain": "blocked-site.com",
    "reason": "域名在黑名单中"
  }
}
```

## 🛠️ SDK 和示例

### JavaScript SDK

```javascript
class AL01LinkAPI {
  constructor(baseURL, apiKey = null) {
    this.baseURL = baseURL
    this.apiKey = apiKey
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}/api${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`
    }

    const response = await fetch(url, {
      ...options,
      headers
    })

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error)
    }

    return data
  }

  // 创建短链
  async createLink(linkData) {
    return this.request('/links', {
      method: 'POST',
      body: JSON.stringify(linkData)
    })
  }

  // 获取短链列表
  async getLinks(params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/links?${query}`)
  }

  // 获取统计数据
  async getStats(params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/logs/stats?${query}`)
  }

  // 验证短链密码
  async verifyPassword(path, password, isAutoFill = false) {
    return this.request(`/visit/${path}`, {
      method: 'POST',
      body: JSON.stringify({ password, isAutoFill })
    })
  }

  // 获取短链信息（用于中间页显示）
  async getLinkInfo(path) {
    return this.request(`/visit/${path}`)
  }
}

// 使用示例
const api = new AL01LinkAPI('https://your-domain.com')

// 创建带密码的短链
try {
  const result = await api.createLink({
    originalUrl: 'https://example.com',
    customPath: 'my-link',
    password: 'secret123',  // 设置访问密码
    requireConfirm: true,   // 需要确认
    enableIntermediate: true // 启用中间页
  })
  console.log('短链创建成功:', result.data.shortUrl)
} catch (error) {
  console.error('创建失败:', error.message)
}

// 验证短链密码
try {
  // 手动输入模式（用户在页面输入明文密码）
  const result = await api.verifyPassword('my-link', 'secret123', false)
  console.log('密码验证成功:', result.data.originalUrl)
  
  // 自动填充模式（通过 pwd 参数传递）
  const autoResult = await api.verifyPassword('my-link', 'secret123', true)
  console.log('自动验证成功:', autoResult.data.originalUrl)
} catch (error) {
  console.error('密码验证失败:', error.message)
}
```

### Python SDK

```python
import requests
from typing import Optional, Dict, Any

class AL01LinkAPI:
    def __init__(self, base_url: str, api_key: Optional[str] = None):
        self.base_url = base_url
        self.api_key = api_key
        self.session = requests.Session()
        
        if api_key:
            self.session.headers.update({
                'Authorization': f'Bearer {api_key}'
            })

    def request(self, endpoint: str, method: str = 'GET', data: Optional[Dict] = None) -> Dict[str, Any]:
        url = f"{self.base_url}/api{endpoint}"
        
        response = self.session.request(
            method=method,
            url=url,
            json=data,
            headers={'Content-Type': 'application/json'}
        )
        
        result = response.json()
        
        if not result.get('success'):
            raise Exception(result.get('error', 'Unknown error'))
            
        return result

    def create_link(self, original_url: str, **kwargs) -> Dict[str, Any]:
        """创建短链"""
        data = {'originalUrl': original_url, **kwargs}
        return self.request('/links', 'POST', data)

    def get_links(self, **params) -> Dict[str, Any]:
        """获取短链列表"""
        query = '&'.join([f"{k}={v}" for k, v in params.items()])
        endpoint = f"/links?{query}" if query else "/links"
        return self.request(endpoint)

    def get_stats(self, **params) -> Dict[str, Any]:
        """获取统计数据"""
        query = '&'.join([f"{k}={v}" for k, v in params.items()])
        endpoint = f"/logs/stats?{query}" if query else "/logs/stats"
        return self.request(endpoint)

# 使用示例
api = AL01LinkAPI('https://your-domain.com')

try:
    # 创建短链
    result = api.create_link(
        original_url='https://example.com',
        custom_path='my-link'
    )
    print(f"短链创建成功: {result['data']['shortUrl']}")
    
    # 获取统计数据
    stats = api.get_stats(period='7d')
    print(f"总访问量: {stats['data']['totalVisits']}")
    
except Exception as e:
    print(f"操作失败: {e}")
```

### cURL 示例

```bash
# 创建短链
curl -X POST https://your-domain.com/api/links \
  -H "Content-Type: application/json" \
  -d '{
    "originalUrl": "https://example.com",
    "customPath": "my-link"
  }'

# 获取短链列表
curl -X GET "https://your-domain.com/api/links?page=1&limit=10"

# 获取统计数据
curl -X GET "https://your-domain.com/api/logs/stats?period=7d"

# 检查域名权限
curl -X GET "https://your-domain.com/api/check-domain?url=https://example.com"
```

### Postman 集合

可以导入以下 Postman 集合来快速测试 API：

```json
{
  "info": {
    "name": "灵狼Link API",
    "description": "灵狼Link API 测试集合",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "https://your-domain.com",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "创建短链",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"originalUrl\": \"https://example.com\",\n  \"customPath\": \"test\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/links",
          "host": ["{{baseUrl}}"],
          "path": ["api", "links"]
        }
      }
    }
  ]
}
```

---

## 📞 API 支持

如果在使用 API 过程中遇到问题：

- 📧 **技术支持**: api-support@yourcompany.com
- 📖 **在线文档**: https://docs.al01link.com/api
- 🐛 **问题反馈**: https://github.com/your-username/al01link/issues
- 💬 **开发者社区**: https://discord.gg/al01link

---

**Happy Coding! 🚀**