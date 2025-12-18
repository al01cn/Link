import { NextResponse } from 'next/server'
import { translateForRequest } from '@/lib/translations'
import { getBaseUrl } from '@/lib/utils'

/**
 * 动态生成OpenAPI规范（Generate OpenAPI specification dynamically）
 * 
 * @description 生成完整的灵狼Link API OpenAPI 3.0.3规范文档，包含所有接口定义、数据模型和响应格式
 *              Generate complete AL01 Link API OpenAPI 3.0.3 specification document with all endpoint definitions, data models and response formats
 * 
 * @param {Request} request - HTTP请求对象，包含lang查询参数用于多语言支持
 * @returns {Promise<NextResponse>} 包含OpenAPI规范的JSON响应（JSON response containing OpenAPI specification）
 * 
 * @throws {Error} 当生成规范失败时抛出错误（Throws error when specification generation fails）
 * 
 * @example
 * // GET /api/openapi?lang=zh (默认中文)
 * // GET /api/openapi?lang=en (英文版本)
 * // 返回完整的OpenAPI 3.0.3规范
 * {
 *   "openapi": "3.0.3",
 *   "info": {
 *     "title": "灵狼Link API",
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
    const baseUrl = getBaseUrl(request)
    
    /**
     * 获取语言参数（Get language parameter）
     * @type {string}
     */
    const url = new URL(request.url)
    const lang = url.searchParams.get('lang') || 'zh' // 默认中文
    const isEnglish = lang === 'en'

    /**
     * 多语言文本辅助函数（Multilingual text helper function）
     */
    const t = (zhText: string, enText: string) => isEnglish ? enText : zhText

    
    /**
     * OpenAPI 3.0.3规范对象（OpenAPI 3.0.3 specification object）
     */
    const openApiSpec = {
      "openapi": "3.0.3",
      "info": {
        "title": t("灵狼Link API", "AL01 Link API"),
        "description": t(
          "简单、安全、强大的短链生成工具 API 接口文档",
          "Simple, secure, powerful link shortener API documentation"
        ),
        "version": "1.0.0",
        "contact": {
          "name": t("灵狼Link 支持", "AL01 Link Support")
        }
      },
      "servers": [
        {
          "url": baseUrl,
          "description": isEnglish 
            ? (process.env.NODE_ENV === 'production' ? 'Production Environment' : 'Development Environment')
            : (process.env.NODE_ENV === 'production' ? '生产环境' : '开发环境')
        }
      ],
      "tags": [
        {
          "name": t("短链管理", "Link Management"),
          "description": t("短链接的创建、查询和管理", "Short link creation, query and management")
        },
        {
          "name": t("域名管理", "Domain Management"), 
          "description": t("域名白名单/黑名单规则管理", "Domain whitelist/blacklist rule management")
        },
        {
          "name": t("系统设置", "System Settings"),
          "description": t("系统配置和设置管理", "System configuration and settings management")
        },
        {
          "name": t("管理员", "Admin"),
          "description": t("管理员认证和账户管理", "Administrator authentication and account management")
        },
        {
          "name": t("访问控制", "Access Control"),
          "description": t("短链访问和跳转控制", "Short link access and redirect control")
        }
      ],
      "paths": {
        "/api/links": {
          "get": {
            "tags": [t("短链管理", "Link Management")],
            "summary": t("获取短链列表", "Get Short Link List"),
            "description": t("获取最近创建的50个短链接列表", "Get a list of the 50 most recently created short links"),
            "responses": {
              "200": {
                "description": t("获取成功", "Retrieved successfully"),
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
            "tags": [t("短链管理", "Link Management")],
            "summary": t("创建短链", "Create Short Link"),
            "description": t(
              "创建一个新的短链接，支持自定义路径、密码保护、过期时间等功能",
              "Create a new short link with support for custom paths, password protection, expiration time and other features"
            ),
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
                "description": t("创建成功", "Created successfully"),
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
            "tags": [t("短链管理", "Link Management")],
            "summary": t("获取短链详情", "Get Short Link Details"),
            "description": t("获取单个短链的详细信息，包括密码（需要管理员权限）", "Get detailed information of a single short link, including password (requires admin privileges)"),
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
                "description": t("短链ID", "Short link ID")
              }
            ],
            "responses": {
              "200": {
                "description": t("获取成功", "Retrieved successfully"),
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
            "tags": [t("短链管理", "Link Management")],
            "summary": t("删除短链", "Delete Short Link"),
            "description": t("删除指定的短链接", "Delete the specified short link"),
            "parameters": [
              {
                "name": "id",
                "in": "path",
                "required": true,
                "schema": {
                  "type": "integer"
                },
                "description": t("短链ID", "Short link ID")
              }
            ],
            "responses": {
              "200": {
                "description": t("删除成功", "Deleted successfully"),
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
            "tags": [t("访问控制", "Access Control")],
            "summary": t("快速跳转模式", "Quick Redirect Mode"),
            "description": t(
              "通过 /to 路径实现快速跳转，支持URL参数和Token高级传参。url和token必须提供其中一个，Token优先级高于URL参数。Token模式支持独立的人机验证控制。",
              "Quick redirect through /to path, supports URL parameters and Token advanced parameters. Either url or token must be provided, Token has higher priority than URL parameters. Token mode supports independent CAPTCHA control."
            ),
            "parameters": [
              {
                "name": "url",
                "in": "query",
                "required": false,
                "schema": {
                  "type": "string",
                  "format": "uri"
                },
                "description": t(
                  "目标URL地址，支持URL编码和未编码格式（与token二选一，必填其中一个）",
                  "Target URL address, supports URL encoded and unencoded formats (choose one with token, required)"
                )
              },
              {
                "name": "auto",
                "in": "query",
                "required": false,
                "schema": {
                  "type": "boolean",
                  "default": true
                },
                "description": t(
                  "跳转模式控制，true=自动跳转，false=直接跳转",
                  "Redirect mode control, true=auto redirect, false=direct redirect"
                )
              },
              {
                "name": "token",
                "in": "query",
                "required": false,
                "schema": {
                  "type": "string"
                },
                "description": t(
                  "Base64编码的JSON配置，支持高级参数设置（与url二选一，必填其中一个）",
                  "Base64-encoded JSON configuration, supports advanced parameter settings (choose one with url, required)"
                )
              }
            ],
            "responses": {
              "200": {
                "description": t("处理成功", "Processing successful"),
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
            "tags": [t("访问控制", "Access Control")],
            "summary": t("获取短链信息", "Get Short Link Info"),
            "description": t("通过短链路径获取链接信息，用于跳转前的预处理", "Get link information through short link path for pre-processing before redirect"),
            "parameters": [
              {
                "name": "path",
                "in": "path",
                "required": true,
                "schema": {
                  "type": "string"
                },
                "description": t("短链路径", "Short link path")
              }
            ],
            "responses": {
              "200": {
                "description": t("获取成功", "Retrieved successfully"),
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
                "description": t("短链已过期", "Short link expired"),
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
            "tags": [t("访问控制", "Access Control")],
            "summary": t("访问短链", "Visit Short Link"),
            "description": t("验证密码并记录访问，返回目标URL", "Verify password and record access, return target URL"),
            "parameters": [
              {
                "name": "path",
                "in": "path",
                "required": true,
                "schema": {
                  "type": "string"
                },
                "description": t("短链路径", "Short link path")
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
                "description": t("访问成功", "Access successful"),
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
                "description": t("短链已过期", "Short link expired"),
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
            "tags": [t("系统设置", "System Settings")],
            "summary": t("获取系统设置", "Get System Settings"),
            "description": t("获取系统安全模式、跳转等待时间和域名规则配置", "Get system security mode, redirect wait time and domain rules configuration"),
            "responses": {
              "200": {
                "description": t("获取成功", "Retrieved successfully"),
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
            "tags": [t("系统设置", "System Settings")],
            "summary": t("更新系统设置", "Update System Settings"),
            "description": t("更新系统安全模式和跳转等待时间配置", "Update system security mode and redirect wait time configuration"),
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
                "description": t("更新成功", "Updated successfully"),
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
            "tags": [t("域名管理", "Domain Management")],
            "summary": t("获取域名规则", "Get Domain Rules"),
            "description": t("获取域名白名单/黑名单规则列表", "Get domain whitelist/blacklist rules list"),
            "parameters": [
              {
                "name": "type",
                "in": "query",
                "schema": {
                  "type": "string",
                  "enum": ["whitelist", "blacklist"]
                },
                "description": t("规则类型", "Rule type")
              }
            ],
            "responses": {
              "200": {
                "description": t("获取成功", "Retrieved successfully"),
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
            "tags": [t("域名管理", "Domain Management")],
            "summary": t("添加域名规则", "Add Domain Rule"),
            "description": t("添加新的域名白名单或黑名单规则", "Add new domain whitelist or blacklist rule"),
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
                "description": t("添加成功", "Added successfully"),
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
            "tags": [t("域名管理", "Domain Management")],
            "summary": t("删除域名规则", "Delete Domain Rule"),
            "description": t("删除指定的域名规则", "Delete the specified domain rule"),
            "parameters": [
              {
                "name": "id",
                "in": "path",
                "required": true,
                "schema": {
                  "type": "string",
                  "format": "uuid"
                },
                "description": t("域名规则UUID", "Domain rule UUID")
              }
            ],
            "responses": {
              "200": {
                "description": t("删除成功", "Deleted successfully"),
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
            "tags": [t("域名管理", "Domain Management")],
            "summary": t("检查域名访问权限", "Check Domain Access"),
            "description": t("检查指定URL的域名是否允许创建短链", "Check if the domain of specified URL is allowed to create short links"),
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
                "description": t("检查完成", "Check completed"),
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
            "tags": [t("管理员", "Admin")],
            "summary": t("管理员登录", "Admin Login"),
            "description": t("管理员账户登录，获取访问令牌", "Admin account login, get access token"),
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
                "description": t("登录成功", "Login successful"),
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
            "tags": [t("管理员", "Admin")],
            "summary": t("修改管理员密码", "Change Admin Password"),
            "description": t("修改管理员用户名和密码，需要管理员权限", "Change admin username and password, requires admin privileges"),
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
                "description": t("修改成功", "Modified successfully"),
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
                "description": t("短链ID", "Short link ID")
              },
              "path": {
                "type": "string",
                "description": t("短链路径", "Short link path")
              },
              "shortUrl": {
                "type": "string",
                "description": t("完整短链URL", "Complete short link URL")
              },
              "originalUrl": {
                "type": "string",
                "description": t("原始URL", "Original URL")
              },
              "title": {
                "type": "string",
                "description": t("页面标题", "Page title")
              },
              "views": {
                "type": "integer",
                "description": t("访问次数", "View count")
              },
              "createdAt": {
                "type": "string",
                "format": "date-time",
                "description": t("创建时间", "Creation time")
              },
              "hasPassword": {
                "type": "boolean",
                "description": t("是否有密码保护", "Whether password protected")
              },
              "requireConfirm": {
                "type": "boolean",
                "description": t("是否需要确认跳转", "Whether confirmation required for redirect")
              },
              "enableIntermediate": {
                "type": "boolean",
                "description": t("是否启用中间页", "Whether intermediate page enabled")
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
                "description": t("原始URL地址", "Original URL address")
              },
              "customPath": {
                "type": "string",
                "description": t("自定义短链路径", "Custom short link path")
              },
              "password": {
                "type": "string",
                "description": t("访问密码", "Access password")
              },
              "expiresAt": {
                "type": "string",
                "format": "date-time",
                "description": t("过期时间", "Expiration time")
              },
              "requireConfirm": {
                "type": "boolean",
                "default": false,
                "description": t("是否需要确认跳转", "Whether confirmation required for redirect")
              },
              "enableIntermediate": {
                "type": "boolean",
                "default": true,
                "description": t("是否启用中间页", "Whether intermediate page enabled")
              }
            }
          },
          "LinkDetail": {
            "type": "object",
            "properties": {
              "id": {
                "type": "integer",
                "description": t("短链ID", "Short link ID")
              },
              "password": {
                "type": "string",
                "nullable": true,
                "description": t("解密后的密码", "Decrypted password")
              },
              "hasPassword": {
                "type": "boolean",
                "description": t("是否有密码保护", "Whether password protected")
              }
            }
          },
          "ToResponse": {
            "type": "object",
            "properties": {
              "originalUrl": {
                "type": "string",
                "description": t("目标URL", "Target URL")
              },
              "title": {
                "type": "string",
                "description": t("页面标题", "Page title")
              },
              "requireConfirm": {
                "type": "boolean",
                "description": t("是否需要确认跳转", "Whether confirmation required for redirect")
              },
              "enableIntermediate": {
                "type": "boolean",
                "description": t("是否启用中间页", "Whether intermediate page enabled")
              },
              "auto": {
                "type": "boolean",
                "description": t("是否自动跳转", "Whether auto redirect")
              },
              "msg": {
                "type": "string",
                "description": t("子标题消息", "Subtitle message")
              },
              "captchaEnabled": {
                "type": "boolean",
                "description": t("是否启用人机验证（Cloudflare Turnstile）", "Whether CAPTCHA enabled (Cloudflare Turnstile)")
              }
            }
          },
          "ToTokenConfig": {
            "type": "object",
            "description": t(
              "TO跳转Token配置（Base64编码前的JSON格式）",
              "TO redirect Token configuration (JSON format before Base64 encoding)"
            ),
            "required": ["url"],
            "properties": {
              "url": {
                "type": "string",
                "format": "uri",
                "description": t("目标URL地址", "Target URL address")
              },
              "auto": {
                "type": "boolean",
                "default": true,
                "description": t("开启自动跳转，false为直接跳转", "Enable auto redirect, false for direct redirect")
              },
              "requireConfirm": {
                "type": "boolean",
                "default": false,
                "description": t("是否开启二次确认（与auto互斥，优先级更高）", "Whether to enable secondary confirmation (mutually exclusive with auto, higher priority)")
              },
              "title": {
                "type": "string",
                "description": t("页面标题，仅在自动跳转或二次确认时显示", "Page title, only displayed in auto redirect or secondary confirmation")
              },
              "msg": {
                "type": "string",
                "default": t("正在前往目标链接...", "Redirecting to target link..."),
                "description": t("子标题消息，仅在自动跳转或二次确认时显示", "Subtitle message, only displayed in auto redirect or secondary confirmation")
              },
              "turnstile": {
                "type": "boolean",
                "default": false,
                "description": t("是否启用人机验证（Cloudflare Turnstile），独立于全局设置", "Whether to enable CAPTCHA (Cloudflare Turnstile), independent of global settings")
              }
            },
            "example": {
              "url": "https://github.com",
              "requireConfirm": true,
              "title": t("跳转到GitHub", "Jump to GitHub"),
              "msg": t("欢迎访问代码仓库", "Welcome to code repository"),
              "turnstile": true
            }
          },
          "VisitInfo": {
            "type": "object",
            "properties": {
              "id": {
                "type": "integer",
                "description": t("短链ID", "Short link ID")
              },
              "originalUrl": {
                "type": "string",
                "description": t("目标URL", "Target URL")
              },
              "title": {
                "type": "string",
                "description": t("页面标题", "Page title")
              },
              "hasPassword": {
                "type": "boolean",
                "description": t("是否有密码保护", "Whether password protected")
              },
              "requireConfirm": {
                "type": "boolean",
                "description": t("是否需要确认跳转", "Whether confirmation required for redirect")
              },
              "enableIntermediate": {
                "type": "boolean",
                "description": t("是否启用中间页", "Whether intermediate page enabled")
              }
            }
          },
          "VisitRequest": {
            "type": "object",
            "properties": {
              "password": {
                "type": "string",
                "description": t("访问密码（如果需要）", "Access password (if required)")
              }
            }
          },
          "VisitResponse": {
            "type": "object",
            "properties": {
              "originalUrl": {
                "type": "string",
                "description": t("目标URL", "Target URL")
              },
              "title": {
                "type": "string",
                "description": t("页面标题", "Page title")
              }
            }
          },
          "SystemSettings": {
            "type": "object",
            "properties": {
              "securityMode": {
                "type": "string",
                "enum": ["whitelist", "blacklist"],
                "description": t("安全模式", "Security mode")
              },
              "waitTime": {
                "type": "integer",
                "description": t("跳转等待时间（秒）", "Redirect wait time (seconds)")
              },
              "domainRules": {
                "type": "array",
                "items": {
                  "$ref": "#/components/schemas/DomainRule"
                },
                "description": t("域名规则列表", "Domain rules list")
              }
            }
          },
          "UpdateSettingsRequest": {
            "type": "object",
            "properties": {
              "securityMode": {
                "type": "string",
                "enum": ["whitelist", "blacklist"],
                "description": t("安全模式", "Security mode")
              },
              "waitTime": {
                "type": "integer",
                "description": t("跳转等待时间（秒）", "Redirect wait time (seconds)")
              }
            }
          },
          "DomainRule": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string",
                "format": "uuid",
                "description": t("规则ID", "Rule ID")
              },
              "domain": {
                "type": "string",
                "description": t("域名", "Domain")
              },
              "type": {
                "type": "string",
                "enum": ["whitelist", "blacklist"],
                "description": t("规则类型", "Rule type")
              },
              "active": {
                "type": "boolean",
                "description": t("是否激活", "Whether active")
              },
              "createdAt": {
                "type": "string",
                "format": "date-time",
                "description": t("创建时间", "Creation time")
              }
            }
          },
          "CreateDomainRuleRequest": {
            "type": "object",
            "required": ["domain", "type"],
            "properties": {
              "domain": {
                "type": "string",
                "description": t("域名", "Domain")
              },
              "type": {
                "type": "string",
                "enum": ["whitelist", "blacklist"],
                "description": t("规则类型", "Rule type")
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
                "description": t("要检查的URL", "URL to check")
              }
            }
          },
          "CheckDomainResponse": {
            "type": "object",
            "properties": {
              "allowed": {
                "type": "boolean",
                "description": t("是否允许访问", "Whether access allowed")
              },
              "reason": {
                "type": "string",
                "description": t("允许或拒绝的原因", "Reason for allow or deny")
              },
              "domain": {
                "type": "string",
                "description": t("提取的域名", "Extracted domain")
              },
              "securityMode": {
                "type": "string",
                "description": t("当前安全模式", "Current security mode")
              }
            }
          },
          "LoginRequest": {
            "type": "object",
            "required": ["username", "password"],
            "properties": {
              "username": {
                "type": "string",
                "description": t("用户名", "Username")
              },
              "password": {
                "type": "string",
                "description": t("密码", "Password")
              }
            }
          },
          "LoginResponse": {
            "type": "object",
            "properties": {
              "success": {
                "type": "boolean",
                "description": t("登录是否成功", "Whether login successful")
              },
              "token": {
                "type": "string",
                "description": t("JWT访问令牌", "JWT access token")
              },
              "isDefault": {
                "type": "boolean",
                "description": t("是否为默认账户", "Whether default account")
              },
              "username": {
                "type": "string",
                "description": t("用户名", "Username")
              }
            }
          },
          "ChangePasswordRequest": {
            "type": "object",
            "required": ["currentPassword", "newUsername", "newPassword"],
            "properties": {
              "currentPassword": {
                "type": "string",
                "description": t("当前密码", "Current password")
              },
              "newUsername": {
                "type": "string",
                "description": t("新用户名", "New username")
              },
              "newPassword": {
                "type": "string",
                "minLength": 6,
                "description": t("新密码（至少6位）", "New password (at least 6 characters)")
              }
            }
          },
          "ChangePasswordResponse": {
            "type": "object",
            "properties": {
              "success": {
                "type": "boolean",
                "description": t("修改是否成功", "Whether modification successful")
              },
              "message": {
                "type": "string",
                "description": t("响应消息", "Response message")
              }
            }
          },
          "SuccessResponse": {
            "type": "object",
            "properties": {
              "success": {
                "type": "boolean",
                "description": t("操作是否成功", "Whether operation successful")
              }
            }
          },
          "DeleteResponse": {
            "type": "object",
            "properties": {
              "success": {
                "type": "boolean",
                "description": t("删除是否成功", "Whether deletion successful")
              },
              "message": {
                "type": "string",
                "description": t("响应消息", "Response message")
              },
              "deletedRule": {
                "type": "object",
                "description": t("被删除的规则信息", "Deleted rule information")
              }
            }
          },
          "ErrorResponse": {
            "type": "object",
            "properties": {
              "error": {
                "type": "string",
                "description": t("错误信息", "Error message")
              }
            }
          }
        },
        "responses": {
          "BadRequest": {
            "description": t("请求参数错误", "Request parameter error"),
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "Unauthorized": {
            "description": t("未授权访问", "Unauthorized access"),
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "Forbidden": {
            "description": t("访问被禁止", "Access forbidden"),
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "NotFound": {
            "description": t("资源不存在", "Resource not found"),
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "ServerError": {
            "description": t("服务器错误", "Server error"),
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
    return NextResponse.json({ 
      error: translateForRequest(request, 'downloadOpenApiSpecFailed') 
    }, { status: 500 })
  }
}