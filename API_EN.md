# AL01Link API Documentation

[English](./API_EN.md) | [中文](./API.md)

## 📋 Table of Contents

- [API Overview](#api-overview)
- [OpenAPI Specification](#openapi-specification)
- [Authentication](#authentication)
- [Response Format](#response-format)
- [Short Link Management API](#short-link-management-api)
- [Visit Statistics API](#visit-statistics-api)
- [Domain Management API](#domain-management-api)
- [System Settings API](#system-settings-api)
- [Admin API](#admin-api)
- [Quick Redirect API](#quick-redirect-api)
- [Error Codes](#error-codes)
- [SDK and Examples](#sdk-and-examples)

## 🌐 API Overview

AL01Link provides a complete RESTful API supporting short link creation, management, statistics, and other functions.

### Basic Information

- **Base URL**: `https://your-domain.com/api`
- **Protocol**: HTTPS
- **Data Format**: JSON
- **Character Encoding**: UTF-8
- **API Version**: v1

### Request Headers

```http
Content-Type: application/json
Accept: application/json
User-Agent: YourApp/1.0
```

### Rate Limiting

- **Create Short Links**: 100 requests/hour/IP
- **Query Interfaces**: 1000 requests/hour/IP
- **Management Interfaces**: 500 requests/hour/IP

## 📄 OpenAPI Specification

AL01Link provides complete OpenAPI 3.0.3 specification documentation with multi-language support.

### Get OpenAPI Specification

```http
GET /api/openapi?lang={language}
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| lang | string | zh | Language code: zh (Chinese), en (English) |

**Response Example:**

```json
{
  "openapi": "3.0.3",
  "info": {
    "title": "AL01Link API",
    "description": "Simple, secure, powerful URL shortening tool API documentation",
    "version": "1.0.0"
  },
  "paths": {
    // Complete API path definitions
  },
  "components": {
    // Data models and response definitions
  }
}
```

### Usage

**1. Import in Swagger UI:**
```
https://your-domain.com/api/openapi?lang=en
```

**2. Import in Postman:**
- Select "Import" → "Link"
- Enter: `https://your-domain.com/api/openapi?lang=en`

**3. Get with curl:**
```bash
# Get Chinese version (default)
curl https://your-domain.com/api/openapi

# Get English version
curl https://your-domain.com/api/openapi?lang=en
```

### Specification Features

- ✅ **Complete API endpoint definitions**: Includes detailed descriptions of all interfaces
- ✅ **Multi-language support**: Supports Chinese and English
- ✅ **Detailed request/response schemas**: Includes parameter validation rules
- ✅ **Error response definitions**: Standardized error handling
- ✅ **Security authentication schemes**: JWT Bearer Token authentication
- ✅ **Example data**: Provides complete usage examples

## 🔐 Authentication

### Admin Authentication

Admin interfaces require Cookie authentication:

```http
POST /api/admin/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password"
}
```

After successful login, the server sets authentication cookies, and subsequent requests automatically carry them.

### API Key Authentication (Planned)

```http
Authorization: Bearer your-api-key
```

## 📊 Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE",
  "details": {
    // Detailed error information
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [
    // Data list
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## 🔗 Short Link Management API

### Create Short Link

Create a new short link.

```http
POST /api/links
Content-Type: application/json

{
  "originalUrl": "https://example.com",
  "customPath": "custom",           // Optional: custom path
  "password": "secret",             // Optional: access password (plaintext, system will encrypt automatically)
  "requireConfirm": true,           // Optional: require confirmation
  "enableIntermediate": true,       // Optional: enable intermediate page
  "expiresAt": "2024-12-31T23:59:59Z" // Optional: expiration time
}
```

**Password Protection Description:**

- **Storage Method**: Passwords are stored using AES encryption to ensure security
- **Verification Method**: Supports both manual input and auto-fill verification modes
- **Auto-fill**: Can be achieved through `?pwd=password` parameter
- **Compatibility**: Supports both plaintext passwords and encrypted strings for auto-fill

**Response Example:**

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

**Error Response:**

```json
{
  "success": false,
  "error": "Invalid URL format",
  "code": "INVALID_URL"
}
```

### Get Short Link List

Get short link list with pagination and search support.

```http
GET /api/links?page=1&limit=20&search=example&sortBy=createdAt&sortOrder=desc
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| search | string | - | Search keyword |
| sortBy | string | createdAt | Sort field |
| sortOrder | string | desc | Sort direction |

**Response Example:**

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

### Get Single Short Link

Get detailed information of a specific short link.

```http
GET /api/links/{id}
```

**Response Example:**

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

### Update Short Link

Update information of a specific short link.

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

**Response Example:**

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

### Delete Short Link

Delete a specific short link.

```http
DELETE /api/links/{id}
```

**Response Example:**

```json
{
  "success": true,
  "message": "Short link deleted successfully"
}
```

### Batch Delete Short Links

Delete multiple short links in batch.

```http
DELETE /api/links
Content-Type: application/json

{
  "ids": ["uuid-1", "uuid-2", "uuid-3"]
}
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "deleted": 3,
    "failed": 0
  },
  "message": "Batch deletion completed"
}
```

## 📈 Visit Statistics API

### Get Visit Statistics

Get visit statistics data.

```http
GET /api/logs/stats?period=7d&linkId=uuid&type=summary
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| period | string | 7d | Statistics period (1d, 7d, 30d, 90d) |
| linkId | string | - | Specific short link ID |
| type | string | summary | Statistics type (summary, daily, hourly) |

**Response Example:**

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

### Get Visit Logs

Get detailed visit logs.

```http
GET /api/logs?page=1&limit=50&type=visit&linkId=uuid&startDate=2024-12-01&endDate=2024-12-18
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 50 | Items per page |
| type | string | - | Log type |
| linkId | string | - | Short link ID |
| startDate | string | - | Start date |
| endDate | string | - | End date |

**Response Example:**

```json
{
  "success": true,
  "data": [
    {
      "id": "log-uuid",
      "type": "visit",
      "message": "Short link visit: abc123",
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

### Clean Visit Logs

Clean visit logs before a specified time.

```http
POST /api/logs/cleanup
Content-Type: application/json

{
  "days": 30,  // Keep logs from the last 30 days
  "type": "visit"  // Optional: specify log type
}
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "deleted": 1234
  },
  "message": "Cleanup completed, deleted 1234 logs"
}
```

## 🛡️ Domain Management API

### Get Domain Rules

Get domain whitelist/blacklist rules.

```http
GET /api/domains?type=whitelist&active=true
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| type | string | - | Rule type (whitelist, blacklist) |
| active | boolean | - | Whether enabled |

**Response Example:**

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

### Add Domain Rule

Add a new domain rule.

```http
POST /api/domains
Content-Type: application/json

{
  "domain": "example.com",
  "type": "whitelist",  // "whitelist" | "blacklist"
  "active": true
}
```

**Response Example:**

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

### Update Domain Rule

Update a specific domain rule.

```http
PUT /api/domains/{id}
Content-Type: application/json

{
  "active": false
}
```

### Delete Domain Rule

Delete a specific domain rule.

```http
DELETE /api/domains/{id}
```

### Check Domain Permission

Check if a URL's domain is allowed.

```http
GET /api/check-domain?url=https://example.com/path
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "allowed": true,
    "domain": "example.com",
    "reason": "Domain is in whitelist",
    "matchedRule": {
      "id": "uuid-1",
      "domain": "example.com",
      "type": "whitelist"
    }
  }
}
```

## ⚙️ System Settings API

### Get System Settings

Get system configuration information.

```http
GET /api/settings
```

**Response Example:**

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
    "autoFillPasswordEnabled": true,  // Password auto-fill feature
    "preloadEnabled": true,           // Preload feature
    "waitTime": 3                     // Redirect wait time (seconds)
  }
}
```

**New Configuration Items:**

| Configuration | Type | Default | Description |
|---------------|------|---------|-------------|
| autoFillPasswordEnabled | boolean | true | Whether to enable password auto-fill feature |
| preloadEnabled | boolean | true | Whether to enable target page preloading |
| waitTime | number | 3 | Auto-redirect wait time (seconds) |

### Update System Settings

Update system configuration.

```http
PUT /api/settings
Content-Type: application/json

{
  "domainFilterMode": "blacklist",
  "enableTurnstile": true,
  "defaultRedirectMode": "direct",
  "autoFillPasswordEnabled": false,  // Disable password auto-fill
  "preloadEnabled": true,            // Enable preloading
  "waitTime": 5                      // Set wait time to 5 seconds
}
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "updated": 3
  },
  "message": "Settings updated successfully"
}
```

## 👤 Admin API

### Admin Login

Admin authentication.

```http
POST /api/admin/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password"
}
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "username": "admin",
    "isDefault": false
  },
  "message": "Login successful"
}
```

### Change Admin Password

Change current admin password.

```http
POST /api/admin/change-password
Content-Type: application/json

{
  "currentPassword": "old-password",
  "newPassword": "new-password"
}
```

**Response Example:**

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

## ⚡ Quick Redirect API

### Temporary Redirect

Create temporary redirect link without saving to database.

```http
GET /to?url=https://example.com
```

**Response**: Redirect to target URL or show security confirmation page

### Track Temporary Redirect

Record visit logs for temporary redirects.

```http
POST /api/track-to-visit
Content-Type: application/json

{
  "url": "https://example.com",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

**Response Example:**

```json
{
  "success": true,
  "message": "Visit record saved"
}
```

### Short Link Access

Access short link and record statistics.

```http
GET /{path}
```

**Response**: Redirect or show confirmation page based on short link configuration

### Verify Short Link Password

Verify password-protected short links. Supports two password verification modes:

1. **Manual Input Mode**: User manually enters plaintext password
2. **Auto-fill Mode**: Pass password through `pwd` parameter (supports plaintext and encrypted strings)

```http
POST /api/visit/{path}
Content-Type: application/json

{
  "password": "secret",
  "isAutoFill": false  // Optional: whether it's auto-fill mode, default false
}
```

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| password | string | Yes | Access password (plaintext or encrypted string) |
| isAutoFill | boolean | No | Whether it's auto-fill mode, default false |

**Verification Mode Description:**

**Manual Input Mode** (`isAutoFill: false`):
- Only accepts plaintext passwords
- Used for scenarios where users manually enter passwords on intermediate pages
- System compares plaintext password with stored encrypted password

**Auto-fill Mode** (`isAutoFill: true`):
- Supports both plaintext passwords and encrypted strings
- Used for scenarios where passwords are passed through URL parameter `pwd`
- System intelligently recognizes and verifies both formats

**Response Example:**

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

**Error Response:**

```json
{
  "success": false,
  "error": "Incorrect password",
  "code": "PASSWORD_INCORRECT"
}
```

### Password Auto-fill

Pass password through URL parameter for auto-fill and verification.

**Usage:**

```bash
# Method 1: Pass plaintext password
https://your-domain.com/abc123?pwd=mypassword

# Method 2: Pass encrypted password string
https://your-domain.com/abc123?pwd=U2FsdGVkX1+encrypted_password_string
```

**Workflow:**

1. System gets `pwd` parameter from URL
2. Auto-fills password input field
3. If auto-fill feature is enabled, automatically submits verification
4. System intelligently recognizes plaintext password or encrypted string and verifies

**Security Features:**

- ✅ **Manual Input Protection**: Manual input mode only accepts plaintext passwords, preventing misuse
- ✅ **Intelligent Recognition**: Auto-fill mode intelligently recognizes password format
- ✅ **Encrypted Transmission**: Recommend using HTTPS protocol for password transmission
- ✅ **Backward Compatibility**: Compatible with legacy plaintext password storage format

**Configuration Options:**

You can control password auto-fill feature in system settings:

```http
PUT /api/settings
Content-Type: application/json

{
  "autoFillPasswordEnabled": true  // Enable/disable password auto-fill
}
```

## ❌ Error Codes

### General Errors

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| INVALID_REQUEST | 400 | Invalid request format |
| UNAUTHORIZED | 401 | Unauthorized access |
| FORBIDDEN | 403 | Forbidden access |
| NOT_FOUND | 404 | Resource not found |
| METHOD_NOT_ALLOWED | 405 | Request method not allowed |
| RATE_LIMITED | 429 | Request rate exceeded |
| INTERNAL_ERROR | 500 | Internal server error |

### Business Errors

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| INVALID_URL | 400 | Invalid URL format |
| DOMAIN_NOT_ALLOWED | 403 | Domain not in allowed list |
| PATH_EXISTS | 409 | Short link path already exists |
| PATH_INVALID | 400 | Invalid short link path format |
| PASSWORD_REQUIRED | 401 | Password verification required |
| PASSWORD_INCORRECT | 401 | Incorrect password |
| LINK_EXPIRED | 410 | Short link expired |
| LINK_NOT_FOUND | 404 | Short link not found |

### Error Response Example

```json
{
  "success": false,
  "error": "Domain not in allowed list",
  "code": "DOMAIN_NOT_ALLOWED",
  "details": {
    "domain": "blocked-site.com",
    "reason": "Domain is in blacklist"
  }
}
```

## 🛠️ SDK and Examples

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

  // Create short link
  async createLink(linkData) {
    return this.request('/links', {
      method: 'POST',
      body: JSON.stringify(linkData)
    })
  }

  // Get short link list
  async getLinks(params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/links?${query}`)
  }

  // Get statistics data
  async getStats(params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/logs/stats?${query}`)
  }

  // Verify short link password
  async verifyPassword(path, password, isAutoFill = false) {
    return this.request(`/visit/${path}`, {
      method: 'POST',
      body: JSON.stringify({ password, isAutoFill })
    })
  }

  // Get short link info (for intermediate page display)
  async getLinkInfo(path) {
    return this.request(`/visit/${path}`)
  }
}

// Usage example
const api = new AL01LinkAPI('https://your-domain.com')

// Create password-protected short link
try {
  const result = await api.createLink({
    originalUrl: 'https://example.com',
    customPath: 'my-link',
    password: 'secret123',  // Set access password
    requireConfirm: true,   // Require confirmation
    enableIntermediate: true // Enable intermediate page
  })
  console.log('Short link created successfully:', result.data.shortUrl)
} catch (error) {
  console.error('Creation failed:', error.message)
}

// Verify short link password
try {
  // Manual input mode (user enters plaintext password on page)
  const result = await api.verifyPassword('my-link', 'secret123', false)
  console.log('Password verification successful:', result.data.originalUrl)
  
  // Auto-fill mode (passed through pwd parameter)
  const autoResult = await api.verifyPassword('my-link', 'secret123', true)
  console.log('Auto verification successful:', autoResult.data.originalUrl)
} catch (error) {
  console.error('Password verification failed:', error.message)
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
        """Create short link"""
        data = {'originalUrl': original_url, **kwargs}
        return self.request('/links', 'POST', data)

    def get_links(self, **params) -> Dict[str, Any]:
        """Get short link list"""
        query = '&'.join([f"{k}={v}" for k, v in params.items()])
        endpoint = f"/links?{query}" if query else "/links"
        return self.request(endpoint)

    def get_stats(self, **params) -> Dict[str, Any]:
        """Get statistics data"""
        query = '&'.join([f"{k}={v}" for k, v in params.items()])
        endpoint = f"/logs/stats?{query}" if query else "/logs/stats"
        return self.request(endpoint)

# Usage example
api = AL01LinkAPI('https://your-domain.com')

try:
    # Create short link
    result = api.create_link(
        original_url='https://example.com',
        custom_path='my-link'
    )
    print(f"Short link created successfully: {result['data']['shortUrl']}")
    
    # Get statistics data
    stats = api.get_stats(period='7d')
    print(f"Total visits: {stats['data']['totalVisits']}")
    
except Exception as e:
    print(f"Operation failed: {e}")
```

### cURL Examples

```bash
# Create short link
curl -X POST https://your-domain.com/api/links \
  -H "Content-Type: application/json" \
  -d '{
    "originalUrl": "https://example.com",
    "customPath": "my-link"
  }'

# Get short link list
curl -X GET "https://your-domain.com/api/links?page=1&limit=10"

# Get statistics data
curl -X GET "https://your-domain.com/api/logs/stats?period=7d"

# Check domain permission
curl -X GET "https://your-domain.com/api/check-domain?url=https://example.com"
```

### Postman Collection

You can import the following Postman collection to quickly test the API:

```json
{
  "info": {
    "name": "AL01Link API",
    "description": "AL01Link API test collection",
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
      "name": "Create Short Link",
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

## 📞 API Support

If you encounter issues while using the API:

- 📧 **Technical Support**: api-support@yourcompany.com
- 📖 **Online Documentation**: https://docs.al01link.com/api
- 🐛 **Issue Reporting**: https://github.com/your-username/al01link/issues
- 💬 **Developer Community**: https://discord.gg/al01link

---

**Happy Coding! 🚀**