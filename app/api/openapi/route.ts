import { NextResponse } from 'next/server'
import { translateForRequest } from '@/lib/translations'

/**
 * 动态生成OpenAPI规范（Generate OpenAPI specification dynamically）
 * 
 * @description 生成完整的ShortLink API OpenAPI 3.0.3规范文档，包含所有接口定义、数据模型和响应格式
 *              Generate complete ShortLink API OpenAPI 3.0.3 specification document with all endpoint definitions, data models and response formats
 * 
 * @returns {Promise<NextResponse>} 包含OpenAPI规范的JSON响应（JSON response containing OpenAPI specification）
 * 
 * @throws {Error} 当生成规范失败时抛出错误（Throws error when specification generation fails）
 * 
 * @example
 * // GET /api/openapi
 * // 返回完整的OpenAPI 3.0.3规范
 * {
 *   "openapi": "3.0.3",
 *   "info": {
 *     "title": "ShortLink API",
 *     "version": "1.0.0"
 *   },
 *   "paths": { ... },
 *   "components": { ... }
 * }
 */
export async function GET(request: Request) {
  try {
    /** 
     * 基础URL地址（Base URL address）
     * @type {string}
     */
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    
    /**
     * OpenAPI 3.0.3规范对象（OpenAPI 3.0.3 specification object）
     * 
     * @description 完整的API文档规范，包含所有接口定义、数据模型、安全配置和响应格式
     *              Complete API documentation specification including all endpoint definitions, data models, security configurations and response formats
     * 
     * @type {object}
     */
    const openApiSpec = {
      "openapi": "3.0.3",
      "info": {
        "title": "ShortLink API",
        "description": "简单、安全、强大的短链生成工具 API 接口文档",
        "version": "1.0.0",
        "contact": {
          "name": "ShortLink Support"
        }
      },
      "servers": [
        {
          "url": baseUrl,
          "description": process.env.NODE_ENV === 'production' ? '生产环境' : '开发环境'
        }
      ],
      "tags": [
        {
          "name": "短链管理",
          "description": "短链接的创建、查询和管理"
        },
        {
          "name": "域名管理", 
          "description": "域名白名单/黑名单规则管理"
        },
        {
          "name": "系统设置",
          "description": "系统配置和设置管理"
        },
        {
          "name": "管理员",
          "description": "管理员认证和账户管理"
        },
        {
          "name": "访问控制",
          "description": "短链访问和跳转控制"
        }
      ],
      "paths": {
        "/api/links": {
          "get": {
            "tags": ["短链管理"],
            "summary": "获取短链列表",
            "description": "获取最近创建的50个短链接列表",
            "responses": {
              "200": {
                "description": "获取成功",
                "content": {
                  "application/json": {
                    "schema": {
                      "type": "array",
                      "items": {
                        "$ref": "#/components/schemas/ShortLink"
                      }
                    }
                  }
                }
              },
              "500": {
                "$ref": "#/components/responses/ServerError"
              }
            }
          },
          "post": {
            "tags": ["短链管理"],
            "summary": "创建短链",
            "description": "创建一个新的短链接，支持自定义路径、密码保护、过期时间等功能",
            "requestBody": {
              "required": true,
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/CreateLinkRequest"
                  }
                }
              }
            },
            "responses": {
              "200": {
                "description": "创建成功",
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/ShortLink"
                    }
                  }
                }
              },
              "400": {
                "$ref": "#/components/responses/BadRequest"
              },
              "403": {
                "$ref": "#/components/responses/Forbidden"
              },
              "500": {
                "$ref": "#/components/responses/ServerError"
              }
            }
          }
        },
        "/api/links/{id}": {
          "get": {
            "tags": ["短链管理"],
            "summary": "获取短链详情",
            "description": "获取单个短链的详细信息，包括密码（需要管理员权限）",
            "security": [
              {
                "bearerAuth": []
              }
            ],
            "parameters": [
              {
                "name": "id",
                "in": "path",
                "required": true,
                "schema": {
                  "type": "integer"
                },
                "description": "短链ID"
              }
            ],
            "responses": {
              "200": {
                "description": "获取成功",
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/LinkDetail"
                    }
                  }
                }
              },
              "400": {
                "$ref": "#/components/responses/BadRequest"
              },
              "401": {
                "$ref": "#/components/responses/Unauthorized"
              },
              "404": {
                "$ref": "#/components/responses/NotFound"
              },
              "500": {
                "$ref": "#/components/responses/ServerError"
              }
            }
          },
          "delete": {
            "tags": ["短链管理"],
            "summary": "删除短链",
            "description": "删除指定的短链接",
            "parameters": [
              {
                "name": "id",
                "in": "path",
                "required": true,
                "schema": {
                  "type": "integer"
                },
                "description": "短链ID"
              }
            ],
            "responses": {
              "200": {
                "description": "删除成功",
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/SuccessResponse"
                    }
                  }
                }
              },
              "400": {
                "$ref": "#/components/responses/BadRequest"
              },
              "500": {
                "$ref": "#/components/responses/ServerError"
              }
            }
          }
        },
        "/api/to": {
          "get": {
            "tags": ["访问控制"],
            "summary": "快速跳转模式",
            "description": "通过 /to 路径实现快速跳转，支持URL参数和Token高级传参。url和token必须提供其中一个，Token优先级高于URL参数。Token模式支持独立的人机验证控制。",
            "parameters": [
              {
                "name": "url",
                "in": "query",
                "required": false,
                "schema": {
                  "type": "string",
                  "format": "uri"
                },
                "description": "目标URL地址，支持URL编码和未编码格式（与token二选一，必填其中一个）"
              },
              {
                "name": "auto",
                "in": "query",
                "required": false,
                "schema": {
                  "type": "boolean",
                  "default": true
                },
                "description": "跳转模式控制，true=自动跳转，false=直接跳转"
              },
              {
                "name": "token",
                "in": "query",
                "required": false,
                "schema": {
                  "type": "string"
                },
                "description": "Base64编码的JSON配置，支持高级参数设置（与url二选一，必填其中一个）"
              }
            ],
            "responses": {
              "200": {
                "description": "处理成功",
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/ToResponse"
                    }
                  }
                }
              },
              "400": {
                "$ref": "#/components/responses/BadRequest"
              },
              "500": {
                "$ref": "#/components/responses/ServerError"
              }
            }
          }
        },
        "/api/visit/{path}": {
          "get": {
            "tags": ["访问控制"],
            "summary": "获取短链信息",
            "description": "通过短链路径获取链接信息，用于跳转前的预处理",
            "parameters": [
              {
                "name": "path",
                "in": "path",
                "required": true,
                "schema": {
                  "type": "string"
                },
                "description": "短链路径"
              }
            ],
            "responses": {
              "200": {
                "description": "获取成功",
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/VisitInfo"
                    }
                  }
                }
              },
              "404": {
                "$ref": "#/components/responses/NotFound"
              },
              "410": {
                "description": "短链已过期",
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/ErrorResponse"
                    }
                  }
                }
              },
              "500": {
                "$ref": "#/components/responses/ServerError"
              }
            }
          },
          "post": {
            "tags": ["访问控制"],
            "summary": "访问短链",
            "description": "验证密码并记录访问，返回目标URL",
            "parameters": [
              {
                "name": "path",
                "in": "path",
                "required": true,
                "schema": {
                  "type": "string"
                },
                "description": "短链路径"
              }
            ],
            "requestBody": {
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/VisitRequest"
                  }
                }
              }
            },
            "responses": {
              "200": {
                "description": "访问成功",
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/VisitResponse"
                    }
                  }
                }
              },
              "401": {
                "$ref": "#/components/responses/Unauthorized"
              },
              "404": {
                "$ref": "#/components/responses/NotFound"
              },
              "410": {
                "description": "短链已过期",
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/ErrorResponse"
                    }
                  }
                }
              },
              "500": {
                "$ref": "#/components/responses/ServerError"
              }
            }
          }
        },
        "/api/settings": {
          "get": {
            "tags": ["系统设置"],
            "summary": "获取系统设置",
            "description": "获取系统安全模式、跳转等待时间和域名规则配置",
            "responses": {
              "200": {
                "description": "获取成功",
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/SystemSettings"
                    }
                  }
                }
              },
              "500": {
                "$ref": "#/components/responses/ServerError"
              }
            }
          },
          "put": {
            "tags": ["系统设置"],
            "summary": "更新系统设置",
            "description": "更新系统安全模式和跳转等待时间配置",
            "requestBody": {
              "required": true,
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/UpdateSettingsRequest"
                  }
                }
              }
            },
            "responses": {
              "200": {
                "description": "更新成功",
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/SuccessResponse"
                    }
                  }
                }
              },
              "500": {
                "$ref": "#/components/responses/ServerError"
              }
            }
          }
        },
        "/api/domains": {
          "get": {
            "tags": ["域名管理"],
            "summary": "获取域名规则",
            "description": "获取域名白名单/黑名单规则列表",
            "parameters": [
              {
                "name": "type",
                "in": "query",
                "schema": {
                  "type": "string",
                  "enum": ["whitelist", "blacklist"]
                },
                "description": "规则类型"
              }
            ],
            "responses": {
              "200": {
                "description": "获取成功",
                "content": {
                  "application/json": {
                    "schema": {
                      "type": "array",
                      "items": {
                        "$ref": "#/components/schemas/DomainRule"
                      }
                    }
                  }
                }
              },
              "500": {
                "$ref": "#/components/responses/ServerError"
              }
            }
          },
          "post": {
            "tags": ["域名管理"],
            "summary": "添加域名规则",
            "description": "添加新的域名白名单或黑名单规则",
            "requestBody": {
              "required": true,
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/CreateDomainRuleRequest"
                  }
                }
              }
            },
            "responses": {
              "200": {
                "description": "添加成功",
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/DomainRule"
                    }
                  }
                }
              },
              "400": {
                "$ref": "#/components/responses/BadRequest"
              },
              "500": {
                "$ref": "#/components/responses/ServerError"
              }
            }
          }
        },
        "/api/domains/{id}": {
          "delete": {
            "tags": ["域名管理"],
            "summary": "删除域名规则",
            "description": "删除指定的域名规则",
            "parameters": [
              {
                "name": "id",
                "in": "path",
                "required": true,
                "schema": {
                  "type": "string",
                  "format": "uuid"
                },
                "description": "域名规则UUID"
              }
            ],
            "responses": {
              "200": {
                "description": "删除成功",
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/DeleteResponse"
                    }
                  }
                }
              },
              "400": {
                "$ref": "#/components/responses/BadRequest"
              },
              "404": {
                "$ref": "#/components/responses/NotFound"
              },
              "500": {
                "$ref": "#/components/responses/ServerError"
              }
            }
          }
        },
        "/api/check-domain": {
          "post": {
            "tags": ["域名管理"],
            "summary": "检查域名访问权限",
            "description": "检查指定URL的域名是否允许创建短链",
            "requestBody": {
              "required": true,
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/CheckDomainRequest"
                  }
                }
              }
            },
            "responses": {
              "200": {
                "description": "检查完成",
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/CheckDomainResponse"
                    }
                  }
                }
              },
              "400": {
                "$ref": "#/components/responses/BadRequest"
              },
              "500": {
                "$ref": "#/components/responses/ServerError"
              }
            }
          }
        },
        "/api/admin/login": {
          "post": {
            "tags": ["管理员"],
            "summary": "管理员登录",
            "description": "管理员账户登录，获取访问令牌",
            "requestBody": {
              "required": true,
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/LoginRequest"
                  }
                }
              }
            },
            "responses": {
              "200": {
                "description": "登录成功",
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/LoginResponse"
                    }
                  }
                }
              },
              "400": {
                "$ref": "#/components/responses/BadRequest"
              },
              "401": {
                "$ref": "#/components/responses/Unauthorized"
              },
              "500": {
                "$ref": "#/components/responses/ServerError"
              }
            }
          }
        },
        "/api/admin/change-password": {
          "post": {
            "tags": ["管理员"],
            "summary": "修改管理员密码",
            "description": "修改管理员用户名和密码，需要管理员权限",
            "security": [
              {
                "bearerAuth": []
              }
            ],
            "requestBody": {
              "required": true,
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ChangePasswordRequest"
                  }
                }
              }
            },
            "responses": {
              "200": {
                "description": "修改成功",
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/ChangePasswordResponse"
                    }
                  }
                }
              },
              "400": {
                "$ref": "#/components/responses/BadRequest"
              },
              "401": {
                "$ref": "#/components/responses/Unauthorized"
              },
              "404": {
                "$ref": "#/components/responses/NotFound"
              },
              "500": {
                "$ref": "#/components/responses/ServerError"
              }
            }
          }
        }
      },
      "components": {
        "securitySchemes": {
          "bearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
          }
        },
        "schemas": {
          "ShortLink": {
            "type": "object",
            "properties": {
              "id": {
                "type": "integer",
                "description": "短链ID"
              },
              "path": {
                "type": "string",
                "description": "短链路径"
              },
              "shortUrl": {
                "type": "string",
                "description": "完整短链URL"
              },
              "originalUrl": {
                "type": "string",
                "description": "原始URL"
              },
              "title": {
                "type": "string",
                "description": "页面标题"
              },
              "views": {
                "type": "integer",
                "description": "访问次数"
              },
              "createdAt": {
                "type": "string",
                "format": "date-time",
                "description": "创建时间"
              },
              "hasPassword": {
                "type": "boolean",
                "description": "是否有密码保护"
              },
              "requireConfirm": {
                "type": "boolean",
                "description": "是否需要确认跳转"
              },
              "enableIntermediate": {
                "type": "boolean",
                "description": "是否启用中间页"
              }
            }
          },
          "CreateLinkRequest": {
            "type": "object",
            "required": ["originalUrl"],
            "properties": {
              "originalUrl": {
                "type": "string",
                "format": "uri",
                "description": "原始URL地址"
              },
              "customPath": {
                "type": "string",
                "description": "自定义短链路径"
              },
              "password": {
                "type": "string",
                "description": "访问密码"
              },
              "expiresAt": {
                "type": "string",
                "format": "date-time",
                "description": "过期时间"
              },
              "requireConfirm": {
                "type": "boolean",
                "default": false,
                "description": "是否需要确认跳转"
              },
              "enableIntermediate": {
                "type": "boolean",
                "default": true,
                "description": "是否启用中间页"
              }
            }
          },
          "LinkDetail": {
            "type": "object",
            "properties": {
              "id": {
                "type": "integer",
                "description": "短链ID"
              },
              "password": {
                "type": "string",
                "nullable": true,
                "description": "解密后的密码"
              },
              "hasPassword": {
                "type": "boolean",
                "description": "是否有密码保护"
              }
            }
          },
          "ToResponse": {
            "type": "object",
            "properties": {
              "originalUrl": {
                "type": "string",
                "description": "目标URL"
              },
              "title": {
                "type": "string",
                "description": "页面标题"
              },
              "requireConfirm": {
                "type": "boolean",
                "description": "是否需要确认跳转"
              },
              "enableIntermediate": {
                "type": "boolean",
                "description": "是否启用中间页"
              },
              "auto": {
                "type": "boolean",
                "description": "是否自动跳转"
              },
              "msg": {
                "type": "string",
                "description": "子标题消息"
              },
              "captchaEnabled": {
                "type": "boolean",
                "description": "是否启用人机验证（Cloudflare Turnstile）"
              }
            }
          },
          "ToTokenConfig": {
            "type": "object",
            "description": "TO跳转Token配置（Base64编码前的JSON格式）",
            "required": ["url"],
            "properties": {
              "url": {
                "type": "string",
                "format": "uri",
                "description": "目标URL地址"
              },
              "auto": {
                "type": "boolean",
                "default": true,
                "description": "开启自动跳转，false为直接跳转"
              },
              "requireConfirm": {
                "type": "boolean",
                "default": false,
                "description": "是否开启二次确认（与auto互斥，优先级更高）"
              },
              "title": {
                "type": "string",
                "description": "页面标题，仅在自动跳转或二次确认时显示"
              },
              "msg": {
                "type": "string",
                "default": "正在前往目标链接...",
                "description": "子标题消息，仅在自动跳转或二次确认时显示"
              },
              "turnstile": {
                "type": "boolean",
                "default": false,
                "description": "是否启用人机验证（Cloudflare Turnstile），独立于全局设置"
              }
            },
            "example": {
              "url": "https://github.com",
              "requireConfirm": true,
              "title": "跳转到GitHub",
              "msg": "欢迎访问代码仓库",
              "turnstile": true
            }
          },
          "VisitInfo": {
            "type": "object",
            "properties": {
              "id": {
                "type": "integer",
                "description": "短链ID"
              },
              "originalUrl": {
                "type": "string",
                "description": "目标URL"
              },
              "title": {
                "type": "string",
                "description": "页面标题"
              },
              "hasPassword": {
                "type": "boolean",
                "description": "是否有密码保护"
              },
              "requireConfirm": {
                "type": "boolean",
                "description": "是否需要确认跳转"
              },
              "enableIntermediate": {
                "type": "boolean",
                "description": "是否启用中间页"
              }
            }
          },
          "VisitRequest": {
            "type": "object",
            "properties": {
              "password": {
                "type": "string",
                "description": "访问密码（如果需要）"
              }
            }
          },
          "VisitResponse": {
            "type": "object",
            "properties": {
              "originalUrl": {
                "type": "string",
                "description": "目标URL"
              },
              "title": {
                "type": "string",
                "description": "页面标题"
              }
            }
          },
          "SystemSettings": {
            "type": "object",
            "properties": {
              "securityMode": {
                "type": "string",
                "enum": ["whitelist", "blacklist"],
                "description": "安全模式"
              },
              "waitTime": {
                "type": "integer",
                "description": "跳转等待时间（秒）"
              },
              "domainRules": {
                "type": "array",
                "items": {
                  "$ref": "#/components/schemas/DomainRule"
                },
                "description": "域名规则列表"
              }
            }
          },
          "UpdateSettingsRequest": {
            "type": "object",
            "properties": {
              "securityMode": {
                "type": "string",
                "enum": ["whitelist", "blacklist"],
                "description": "安全模式"
              },
              "waitTime": {
                "type": "integer",
                "description": "跳转等待时间（秒）"
              }
            }
          },
          "DomainRule": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string",
                "format": "uuid",
                "description": "规则ID"
              },
              "domain": {
                "type": "string",
                "description": "域名"
              },
              "type": {
                "type": "string",
                "enum": ["whitelist", "blacklist"],
                "description": "规则类型"
              },
              "active": {
                "type": "boolean",
                "description": "是否激活"
              },
              "createdAt": {
                "type": "string",
                "format": "date-time",
                "description": "创建时间"
              }
            }
          },
          "CreateDomainRuleRequest": {
            "type": "object",
            "required": ["domain", "type"],
            "properties": {
              "domain": {
                "type": "string",
                "description": "域名"
              },
              "type": {
                "type": "string",
                "enum": ["whitelist", "blacklist"],
                "description": "规则类型"
              }
            }
          },
          "CheckDomainRequest": {
            "type": "object",
            "required": ["url"],
            "properties": {
              "url": {
                "type": "string",
                "format": "uri",
                "description": "要检查的URL"
              }
            }
          },
          "CheckDomainResponse": {
            "type": "object",
            "properties": {
              "allowed": {
                "type": "boolean",
                "description": "是否允许访问"
              },
              "reason": {
                "type": "string",
                "description": "允许或拒绝的原因"
              },
              "domain": {
                "type": "string",
                "description": "提取的域名"
              },
              "securityMode": {
                "type": "string",
                "description": "当前安全模式"
              }
            }
          },
          "LoginRequest": {
            "type": "object",
            "required": ["username", "password"],
            "properties": {
              "username": {
                "type": "string",
                "description": "用户名"
              },
              "password": {
                "type": "string",
                "description": "密码"
              }
            }
          },
          "LoginResponse": {
            "type": "object",
            "properties": {
              "success": {
                "type": "boolean",
                "description": "登录是否成功"
              },
              "token": {
                "type": "string",
                "description": "JWT访问令牌"
              },
              "isDefault": {
                "type": "boolean",
                "description": "是否为默认账户"
              },
              "username": {
                "type": "string",
                "description": "用户名"
              }
            }
          },
          "ChangePasswordRequest": {
            "type": "object",
            "required": ["currentPassword", "newUsername", "newPassword"],
            "properties": {
              "currentPassword": {
                "type": "string",
                "description": "当前密码"
              },
              "newUsername": {
                "type": "string",
                "description": "新用户名"
              },
              "newPassword": {
                "type": "string",
                "minLength": 6,
                "description": "新密码（至少6位）"
              }
            }
          },
          "ChangePasswordResponse": {
            "type": "object",
            "properties": {
              "success": {
                "type": "boolean",
                "description": "修改是否成功"
              },
              "message": {
                "type": "string",
                "description": "响应消息"
              }
            }
          },
          "SuccessResponse": {
            "type": "object",
            "properties": {
              "success": {
                "type": "boolean",
                "description": "操作是否成功"
              }
            }
          },
          "DeleteResponse": {
            "type": "object",
            "properties": {
              "success": {
                "type": "boolean",
                "description": "删除是否成功"
              },
              "message": {
                "type": "string",
                "description": "响应消息"
              },
              "deletedRule": {
                "type": "object",
                "description": "被删除的规则信息"
              }
            }
          },
          "ErrorResponse": {
            "type": "object",
            "properties": {
              "error": {
                "type": "string",
                "description": "错误信息"
              }
            }
          }
        },
        "responses": {
          "BadRequest": {
            "description": "请求参数错误",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "Unauthorized": {
            "description": "未授权访问",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "Forbidden": {
            "description": "访问被禁止",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "NotFound": {
            "description": "资源不存在",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "ServerError": {
            "description": "服务器错误",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      }
    }
    
    /**
     * 返回OpenAPI规范的JSON响应（Return JSON response with OpenAPI specification）
     * 
     * @description 设置适当的CORS头部以允许跨域访问API文档
     *              Set appropriate CORS headers to allow cross-origin access to API documentation
     */
    return NextResponse.json(openApiSpec, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })
  } catch (error) {
    /**
     * 错误处理：记录错误并返回500状态码（Error handling: log error and return 500 status code）
     * 
     * @description 当OpenAPI规范生成过程中发生任何错误时，记录错误信息并返回标准错误响应
     *              When any error occurs during OpenAPI specification generation, log the error and return standard error response
     */
    console.error('生成OpenAPI规范失败:', error)
    return NextResponse.json({ error: translateForRequest(request, 'downloadOpenApiSpecFailed') }, { status: 500 })
  }
}