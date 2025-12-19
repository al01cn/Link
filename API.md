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
- [配置管理 API](#配置管理-api)
- [系统监控 API](#系统监控-api)
- [人机验证 API](#人机验证-api)
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

管理员接口需要通过 JWT Token 认证：

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
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "isDefault": false,
  "username": "admin"
}
```

### Token 使用方法

成功登录后，需要在后续请求的 Header 中携带 Token：

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**完整请求示例：**

```bash
# 1. 首先登录获取 Token
curl -X POST https://your-domain.com/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your-password"
  }'

# 2. 使用返回的 Token 访问管理员接口
curl -X GET https://your-domain.com/api/settings \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 3. 更新系统设置
curl -X PUT https://your-domain.com/api/settings \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "securityMode": "whitelist",
    "waitTime": 5
  }'
```

### 默认管理员账户

**首次部署时的默认凭据：**
- 用户名：`Loooong`
- 密码：`Loooong123`

**⚠️ 安全提醒：**
- 首次登录后请立即修改默认密码
- 登录响应中的 `isDefault: true` 表示正在使用默认密码
- 系统会强制要求修改默认凭据以确保安全

### Token 管理

**Token 特性：**
- **有效期**：24小时
- **格式**：JWT (JSON Web Token)
- **存储**：建议存储在安全的地方（如 sessionStorage）
- **刷新**：Token 过期后需要重新登录获取新的 Token

**Token 验证失败的常见原因：**
1. Token 已过期（24小时后）
2. Token 格式错误或被篡改
3. 管理员账户被删除或禁用
4. 请求头格式错误（缺少 "Bearer " 前缀）

**错误响应示例：**

```json
{
  "success": false,
  "error": "Token已过期，请重新登录",
  "code": "TOKEN_EXPIRED"
}
```

### 权限标识

在本文档中，需要管理员权限的接口会标注 🔒 **需要管理员权限**。

### 安全最佳实践

1. **HTTPS 传输**：生产环境必须使用 HTTPS 协议
2. **Token 存储**：不要在 localStorage 中长期存储 Token
3. **定期更换**：建议定期更换管理员密码
4. **权限最小化**：只在必要时使用管理员权限
5. **日志监控**：监控管理员操作日志，及时发现异常行为
- Token 过期后需要重新登录获取新的 Token

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

🔒 **需要管理员权限**

清理指定时间之前的访问日志。

```http
DELETE /api/logs/cleanup?days=30
Authorization: Bearer your-admin-token
```

**查询参数：**

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| days | number | 30 | 保留最近N天的日志 |

**响应示例：**

```json
{
  "success": true,
  "deletedCount": 1234
}
```

### 导出访问日志

🔒 **需要管理员权限**

导出访问日志数据，支持 CSV 和 JSON 格式。

```http
GET /api/logs/export?format=csv&startDate=2024-12-01&endDate=2024-12-18&type=visit&limit=10000
Authorization: Bearer your-admin-token
```

**查询参数：**

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| format | string | csv | 导出格式：csv、json |
| startDate | string | - | 开始日期 (YYYY-MM-DD) |
| endDate | string | - | 结束日期 (YYYY-MM-DD) |
| type | string | - | 日志类型 |
| level | string | - | 日志级别 |
| category | string | - | 日志分类 |
| riskLevel | string | - | 风险级别 |
| limit | number | 10000 | 导出数量限制（最大50000） |

**响应：** 返回 CSV 或 JSON 文件下载

## 🛡️ 域名管理 API

### 获取域名规则

🔒 **需要管理员权限**

获取域名白名单/黑名单规则。

```http
GET /api/domains?type=whitelist&active=true
Authorization: Bearer your-admin-token
```

**查询参数：**

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| type | string | - | 规则类型 (whitelist, blacklist) |
| active | boolean | - | 是否启用 |

**响应示例：**

```json
[
  {
    "id": "uuid-1",
    "domain": "example.com",
    "type": "whitelist",
    "active": true,
    "createdAt": "2024-12-18T10:00:00Z"
  }
]
```

### 添加域名规则

🔒 **需要管理员权限**

添加新的域名规则。

```http
POST /api/domains
Authorization: Bearer your-admin-token
Content-Type: application/json

{
  "domain": "example.com",
  "type": "whitelist"
}
```

**响应示例：**

```json
{
  "id": "uuid-string",
  "domain": "example.com",
  "type": "whitelist",
  "active": true,
  "createdAt": "2024-12-18T10:00:00Z"
}
```

### 更新域名规则

🔒 **需要管理员权限**

更新指定的域名规则。

```http
PUT /api/domains/{id}
Authorization: Bearer your-admin-token
Content-Type: application/json

{
  "active": false
}
```

### 删除域名规则

🔒 **需要管理员权限**

删除指定的域名规则。

```http
DELETE /api/domains/{id}
Authorization: Bearer your-admin-token
```

### 检查域名权限

检查指定URL的域名是否被允许。

```http
GET /api/check-domain?url=https://example.com/path
```

**响应示例：**

```json
{
  "allowed": true,
  "domain": "example.com",
  "reason": "域名在白名单中",
  "matchedRule": {
    "id": "uuid-1",
    "domain": "example.com",
    "type": "whitelist"
  }
}
```

## ⚙️ 系统设置 API

### 获取系统设置

🔒 **需要管理员权限**

获取系统配置信息。

```http
GET /api/settings
Authorization: Bearer your-admin-token
```

**响应示例：**

```json
{
  "securityMode": "blacklist",
  "waitTime": 3,
  "captchaEnabled": false,
  "preloadEnabled": true,
  "autoFillPasswordEnabled": true,
  "nanoidLength": 6,
  "domainRules": [
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

**配置项说明：**

| 配置项 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| securityMode | string | blacklist | 域名过滤模式：whitelist（白名单）、blacklist（黑名单） |
| waitTime | number | 3 | 自动跳转等待时间（秒） |
| captchaEnabled | boolean | false | 是否启用人机验证 |
| preloadEnabled | boolean | true | 是否启用目标页面预加载 |
| autoFillPasswordEnabled | boolean | true | 是否启用密码自动填充功能 |
| nanoidLength | number | 6 | 短链路径长度（5-20个字符） |

### 更新系统设置

🔒 **需要管理员权限**

更新系统配置。

```http
PUT /api/settings
Authorization: Bearer your-admin-token
Content-Type: application/json

{
  "securityMode": "whitelist",
  "waitTime": 5,
  "captchaEnabled": true,
  "preloadEnabled": true,
  "autoFillPasswordEnabled": false,
  "nanoidLength": 8
}
```

**响应示例：**

```json
{
  "success": true
}
```

### 获取公开设置

获取不敏感的系统设置，无需管理员权限。

```http
GET /api/public-settings
```

**响应示例：**

```json
{
  "waitTime": 3,
  "captchaEnabled": false,
  "preloadEnabled": true,
  "autoFillPasswordEnabled": true
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
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "isDefault": false,
  "username": "admin"
}
```

**说明：**
- 首次使用时，系统会自动创建默认管理员账户（用户名：Loooong，密码：Loooong123）
- `isDefault` 字段表示是否使用默认密码，建议首次登录后立即修改
- Token 有效期为 24 小时

### 检查默认密码

🔒 **需要管理员权限**

检查当前管理员是否使用默认密码。

```http
GET /api/admin/check-default
Authorization: Bearer your-admin-token
```

**响应示例：**

```json
{
  "success": true,
  "isDefault": false,
  "username": "admin"
}
```

### 修改管理员信息

🔒 **需要管理员权限**

修改管理员用户名和密码。

```http
POST /api/admin/change-password
Authorization: Bearer your-admin-token
Content-Type: application/json

{
  "currentPassword": "old-password",
  "newUsername": "new-admin",
  "newPassword": "new-password"
}
```

**请求参数：**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| currentPassword | string | 是 | 当前密码 |
| newUsername | string | 是 | 新用户名 |
| newPassword | string | 是 | 新密码（至少6个字符） |

**响应示例：**

```json
{
  "success": true,
  "message": "管理员信息修改成功"
}
```

**安全限制：**
- 不能使用默认用户名 "Loooong"
- 不能使用默认密码 "Loooong123"
- 新密码长度至少 6 个字符
- 新用户名不能与其他管理员重复

## 📦 配置管理 API

### 导出配置

🔒 **需要管理员权限**

导出系统配置和短链数据。

```http
GET /api/config/export?type=all&token=your-admin-token
```

**查询参数：**

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| type | string | all | 导出类型：all（全部）、settings（设置）、links（短链） |
| token | string | - | 管理员Token（用于下载链接） |

**响应示例：**

```json
{
  "version": "1.0",
  "exportTime": "2024-12-18T10:00:00Z",
  "type": "all",
  "settings": {
    "securityMode": "blacklist",
    "waitTime": 3,
    "captchaEnabled": false,
    "preloadEnabled": true,
    "autoFillPasswordEnabled": true
  },
  "domainRules": [
    {
      "domain": "example.com",
      "type": "whitelist",
      "active": true
    }
  ],
  "links": [
    {
      "id": "uuid-1",
      "path": "abc123",
      "originalUrl": "https://example.com",
      "title": "Example Domain",
      "password": "encrypted-password",
      "expiresAt": "2024-12-31T23:59:59Z",
      "requireConfirm": false,
      "enableIntermediate": true,
      "views": 42,
      "createdAt": "2024-12-18T10:00:00Z"
    }
  ]
}
```

### 导入配置

🔒 **需要管理员权限**

导入系统配置和短链数据。

```http
POST /api/config/import
Authorization: Bearer your-admin-token
Content-Type: application/json

{
  "data": {
    "version": "1.0",
    "exportTime": "2024-12-18T10:00:00Z",
    "settings": { ... },
    "domainRules": [ ... ],
    "links": [ ... ]
  },
  "type": "all"
}
```

**请求参数：**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| data | object | 是 | 导出的配置数据 |
| type | string | 否 | 导入类型：all、settings、links |

**响应示例：**

```json
{
  "success": true,
  "message": "导入成功",
  "importedCount": 15
}
```

## 📊 系统监控 API

### 健康检查

获取系统健康状态。

```http
GET /api/health
```

**响应示例：**

```json
{
  "status": "healthy",
  "timestamp": "2024-12-18T10:00:00Z",
  "uptime": 86400,
  "version": "1.0.0",
  "checks": {
    "database": {
      "status": "healthy",
      "responseTime": 25,
      "message": "数据库运行正常"
    },
    "memory": {
      "status": "healthy",
      "usage": {
        "used": 128,
        "total": 512,
        "percentage": 25
      },
      "message": "内存使用正常"
    },
    "cache": {
      "status": "healthy",
      "stats": {
        "size": 1024,
        "hitRate": 0.85
      },
      "message": "缓存系统正常"
    },
    "api": {
      "status": "healthy",
      "metrics": {
        "totalRequests": 10000,
        "averageResponseTime": 150,
        "errorRate": 0.01,
        "activeRequests": 5
      },
      "message": "API性能正常"
    }
  }
}
```

**状态说明：**

| 状态 | HTTP状态码 | 描述 |
|------|------------|------|
| healthy | 200 | 系统运行正常 |
| warning | 200 | 系统有警告但可用 |
| error | 503 | 系统异常不可用 |

## 🤖 人机验证 API

### 验证 Turnstile

验证 Cloudflare Turnstile 人机验证。

```http
POST /api/verify-turnstile
Content-Type: application/json

{
  "token": "turnstile-response-token"
}
```

**请求参数：**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| token | string | 是 | Turnstile 响应令牌 |

**响应示例：**

```json
{
  "success": true,
  "message": "验证成功"
}
```

**错误响应：**

```json
{
  "success": false,
  "error": "人机验证失败",
  "details": ["invalid-input-response"]
}
```

**说明：**
- 开发环境使用测试密钥时会直接返回成功
- 生产环境会向 Cloudflare 验证令牌
- 网络错误时开发环境会跳过验证

## ⚡ 快速跳转 API

### 临时跳转

创建临时跳转链接，不保存到数据库。

```http
GET /to?url=https://example.com
```

**查询参数：**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| url | string | 是 | 目标URL |

**响应：** 重定向到目标URL或显示安全确认页面

### 跟踪临时跳转

记录临时跳转的访问日志。

```http
POST /api/track-to-visit
Content-Type: application/json

{
  "url": "https://example.com"
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

**响应：** 根据短链配置进行重定向或显示确认页面

### 跟踪短链访问

记录短链访问统计（在用户真正跳转时调用）。

```http
POST /api/track-visit/{path}
Content-Type: application/json
```

**响应示例：**

```json
{
  "success": true
}
```

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
Authorization: Bearer your-admin-token
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

### 认证错误

| 错误代码 | HTTP状态码 | 描述 |
|----------|------------|------|
| ADMIN_REQUIRED | 401 | 需要管理员权限 |
| INVALID_CREDENTIALS | 401 | 用户名或密码错误 |
| TOKEN_EXPIRED | 401 | Token已过期 |
| TOKEN_INVALID | 401 | Token无效 |
| ADMIN_NOT_FOUND | 404 | 管理员账户不存在 |

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
| CAPTCHA_FAILED | 400 | 人机验证失败 |
| CAPTCHA_SERVICE_ERROR | 500 | 人机验证服务错误 |

### 系统错误

| 错误代码 | HTTP状态码 | 描述 |
|----------|------------|------|
| DATABASE_ERROR | 500 | 数据库连接错误 |
| CONFIG_ERROR | 500 | 配置错误 |
| EXPORT_FAILED | 500 | 导出失败 |
| IMPORT_FAILED | 500 | 导入失败 |
| CLEANUP_FAILED | 500 | 清理操作失败 |

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

### 管理员权限错误示例

```json
{
  "success": false,
  "error": "需要管理员权限",
  "code": "ADMIN_REQUIRED"
}
```

### 人机验证错误示例

```json
{
  "success": false,
  "error": "人机验证失败",
  "code": "CAPTCHA_FAILED",
  "details": ["invalid-input-response", "timeout-or-duplicate"]
}
```

## 🛠️ SDK 和示例

### JavaScript SDK

```javascript
class AL01LinkAPI {
  constructor(baseURL, adminToken = null) {
    this.baseURL = baseURL
    this.adminToken = adminToken
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}/api${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    if (this.adminToken) {
      headers['Authorization'] = `Bearer ${this.adminToken}`
    }

    const response = await fetch(url, {
      ...options,
      headers
    })

    const data = await response.json()
    
    if (!data.success && !response.ok) {
      throw new Error(data.error || '请求失败')
    }

    return data
  }

  // 管理员登录
  async adminLogin(username, password) {
    const result = await this.request('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    })
    
    if (result.success) {
      this.adminToken = result.token
    }
    
    return result
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

  // 获取系统设置（需要管理员权限）
  async getSettings() {
    return this.request('/settings')
  }

  // 更新系统设置（需要管理员权限）
  async updateSettings(settings) {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    })
  }

  // 获取域名规则（需要管理员权限）
  async getDomainRules(params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/domains?${query}`)
  }

  // 添加域名规则（需要管理员权限）
  async addDomainRule(domain, type) {
    return this.request('/domains', {
      method: 'POST',
      body: JSON.stringify({ domain, type })
    })
  }

  // 导出配置（需要管理员权限）
  async exportConfig(type = 'all') {
    const query = new URLSearchParams({ type, token: this.adminToken }).toString()
    const response = await fetch(`${this.baseURL}/api/config/export?${query}`)
    return response.blob()
  }

  // 导入配置（需要管理员权限）
  async importConfig(data, type = 'all') {
    return this.request('/config/import', {
      method: 'POST',
      body: JSON.stringify({ data, type })
    })
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

  // 系统健康检查
  async healthCheck() {
    return this.request('/health')
  }

  // 验证人机验证
  async verifyTurnstile(token) {
    return this.request('/verify-turnstile', {
      method: 'POST',
      body: JSON.stringify({ token })
    })
  }
}

// 使用示例
const api = new AL01LinkAPI('https://your-domain.com')

// 管理员登录
try {
  const loginResult = await api.adminLogin('admin', 'password')
  console.log('登录成功:', loginResult.username)
  
  // 检查是否使用默认密码
  if (loginResult.isDefault) {
    console.warn('警告：正在使用默认密码，请及时修改！')
  }
} catch (error) {
  console.error('登录失败:', error.message)
}

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

// 管理员操作：更新系统设置
try {
  await api.updateSettings({
    securityMode: 'whitelist',
    waitTime: 5,
    captchaEnabled: true,
    preloadEnabled: true,
    autoFillPasswordEnabled: false
  })
  console.log('设置更新成功')
} catch (error) {
  console.error('设置更新失败:', error.message)
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

// 系统健康检查
try {
  const health = await api.healthCheck()
  console.log('系统状态:', health.status)
  console.log('数据库响应时间:', health.checks.database.responseTime + 'ms')
} catch (error) {
  console.error('健康检查失败:', error.message)
}
```

### Python SDK

```python
import requests
from typing import Optional, Dict, Any

class AL01LinkAPI:
    def __init__(self, base_url: str, admin_token: Optional[str] = None):
        self.base_url = base_url
        self.admin_token = admin_token
        self.session = requests.Session()
        
        if admin_token:
            self.session.headers.update({
                'Authorization': f'Bearer {admin_token}'
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
        
        if not result.get('success') and not response.ok:
            raise Exception(result.get('error', '请求失败'))
            
        return result

    def admin_login(self, username: str, password: str) -> Dict[str, Any]:
        """管理员登录"""
        result = self.request('/admin/login', 'POST', {
            'username': username, 
            'password': password
        })
        
        if result.get('success'):
            self.admin_token = result['token']
            self.session.headers.update({
                'Authorization': f'Bearer {self.admin_token}'
            })
        
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

    def get_settings(self) -> Dict[str, Any]:
        """获取系统设置（需要管理员权限）"""
        return self.request('/settings')

    def update_settings(self, settings: Dict[str, Any]) -> Dict[str, Any]:
        """更新系统设置（需要管理员权限）"""
        return self.request('/settings', 'PUT', settings)

    def get_domain_rules(self, **params) -> Dict[str, Any]:
        """获取域名规则（需要管理员权限）"""
        query = '&'.join([f"{k}={v}" for k, v in params.items()])
        endpoint = f"/domains?{query}" if query else "/domains"
        return self.request(endpoint)

    def add_domain_rule(self, domain: str, rule_type: str) -> Dict[str, Any]:
        """添加域名规则（需要管理员权限）"""
        return self.request('/domains', 'POST', {
            'domain': domain,
            'type': rule_type
        })

    def export_config(self, config_type: str = 'all') -> bytes:
        """导出配置（需要管理员权限）"""
        url = f"{self.base_url}/api/config/export?type={config_type}&token={self.admin_token}"
        response = requests.get(url)
        return response.content

    def import_config(self, data: Dict[str, Any], config_type: str = 'all') -> Dict[str, Any]:
        """导入配置（需要管理员权限）"""
        return self.request('/config/import', 'POST', {
            'data': data,
            'type': config_type
        })

    def health_check(self) -> Dict[str, Any]:
        """系统健康检查"""
        return self.request('/health')

# 使用示例
api = AL01LinkAPI('https://your-domain.com')

try:
    # 管理员登录
    login_result = api.admin_login('admin', 'password')
    print(f"登录成功: {login_result['username']}")
    
    if login_result.get('isDefault'):
        print("警告：正在使用默认密码，请及时修改！")
    
    # 创建短链
    result = api.create_link(
        original_url='https://example.com',
        custom_path='my-link',
        password='secret123'
    )
    print(f"短链创建成功: {result['data']['shortUrl']}")
    
    # 管理员操作：更新系统设置
    api.update_settings({
        'securityMode': 'whitelist',
        'waitTime': 5,
        'captchaEnabled': True,
        'preloadEnabled': True,
        'autoFillPasswordEnabled': False
    })
    print("设置更新成功")
    
    # 获取统计数据
    stats = api.get_stats(period='7d')
    print(f"总访问量: {stats['totalVisits']}")
    
    # 系统健康检查
    health = api.health_check()
    print(f"系统状态: {health['status']}")
    print(f"数据库响应时间: {health['checks']['database']['responseTime']}ms")
    
except Exception as e:
    print(f"操作失败: {e}")
```

### cURL 示例

```bash
# 管理员登录
curl -X POST https://your-domain.com/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password"
  }'

# 使用返回的token进行后续操作
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 创建短链
curl -X POST https://your-domain.com/api/links \
  -H "Content-Type: application/json" \
  -d '{
    "originalUrl": "https://example.com",
    "customPath": "my-link"
  }'

# 获取系统设置（需要管理员权限）
curl -X GET https://your-domain.com/api/settings \
  -H "Authorization: Bearer $TOKEN"

# 更新系统设置（需要管理员权限）
curl -X PUT https://your-domain.com/api/settings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "securityMode": "whitelist",
    "waitTime": 5,
    "captchaEnabled": true
  }'

# 获取短链列表
curl -X GET "https://your-domain.com/api/links?page=1&limit=10"

# 获取统计数据
curl -X GET "https://your-domain.com/api/logs/stats?period=7d"

# 检查域名权限
curl -X GET "https://your-domain.com/api/check-domain?url=https://example.com"

# 系统健康检查
curl -X GET https://your-domain.com/api/health

# 导出配置（需要管理员权限）
curl -X GET "https://your-domain.com/api/config/export?type=all&token=$TOKEN" \
  -o config-backup.json

# 验证人机验证
curl -X POST https://your-domain.com/api/verify-turnstile \
  -H "Content-Type: application/json" \
  -d '{
    "token": "turnstile-response-token"
  }'
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

- 📧 **技术支持**: 通过项目 Issues 反馈问题
- 📖 **在线文档**: 查看项目 README 和 API 文档
- 🐛 **问题反馈**: 在 GitHub 仓库提交 Issue
- 💡 **功能建议**: 欢迎提交 Pull Request

### 常见问题

**Q: 如何获取管理员权限？**
A: 首次部署时使用默认账户（用户名：Loooong，密码：Loooong123）登录，建议立即修改密码。

**Q: Token 过期怎么办？**
A: Token 有效期为 24 小时，过期后需要重新调用 `/api/admin/login` 接口获取新的 Token。

**Q: 如何启用人机验证？**
A: 在系统设置中启用 `captchaEnabled`，并配置 Cloudflare Turnstile 相关环境变量。

**Q: 密码自动填充如何工作？**
A: 通过 URL 参数 `?pwd=password` 传递密码，系统会自动填充并验证，支持明文和加密字符串。

**Q: 如何备份和恢复配置？**
A: 使用 `/api/config/export` 导出配置，使用 `/api/config/import` 导入配置，支持完整备份和增量备份。

---

**Happy Coding! 🚀**