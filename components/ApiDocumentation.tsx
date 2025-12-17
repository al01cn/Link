/**
 * @fileoverview API文档组件 - 提供完整的API接口文档展示功能（API Documentation Component - Provides complete API interface documentation display functionality）
 * @description 该组件包含三个主要部分：API端点列表、TO跳转规则说明和OpenAPI规范文档。支持端点详情展开/折叠、代码复制、OpenAPI规范下载等功能。
 * (This component contains three main parts: API endpoint list, TO redirect rules documentation, and OpenAPI specification. Supports endpoint details expand/collapse, code copying, OpenAPI spec download and other features.)
 * 
 * @author ShortLink Team
 * @version 1.0.0
 * @since 2024-12-17
 * 
 * @requires react
 * @requires lucide-react
 */

'use client'

import { useState } from 'react'
import { Book, ChevronDown, ChevronRight, Copy, Check, X, Download, ExternalLink } from 'lucide-react'

/**
 * API端点接口定义（API endpoint interface definition）
 * @interface ApiEndpoint
 * @description 定义API端点的完整结构，包括请求方法、路径、参数等（Defines the complete structure of API endpoints including request method, path, parameters, etc.）
 */
interface ApiEndpoint {
  /** HTTP请求方法（HTTP request method） */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  /** API路径（API path） */
  path: string
  /** 接口摘要（API summary） */
  summary: string
  /** 接口详细描述（Detailed API description） */
  description: string
  /** 请求参数数组（Request parameters array） */
  parameters?: Array<{
    /** 参数名称（Parameter name） */
    name: string
    /** 参数类型（Parameter type） */
    type: string
    /** 是否必需（Whether required） */
    required: boolean
    /** 参数描述（Parameter description） */
    description: string
    /** 示例值（Example value） */
    example?: any
  }>
  /** 请求体定义（Request body definition） */
  requestBody?: {
    /** 请求体类型（Request body type） */
    type: string
    /** 请求体属性（Request body properties） */
    properties: Record<string, {
      /** 属性类型（Property type） */
      type: string
      /** 是否必需（Whether required） */
      required: boolean
      /** 属性描述（Property description） */
      description: string
      /** 示例值（Example value） */
      example?: any
    }>
  }
  /** 响应定义（Response definitions） */
  responses: Record<string, {
    /** 响应描述（Response description） */
    description: string
    /** 响应示例（Response example） */
    example?: any
  }>
}

/**
 * API端点配置数组（API endpoints configuration array）
 * @description 包含所有可用API端点的完整定义和文档（Contains complete definitions and documentation for all available API endpoints）
 * @type {ApiEndpoint[]}
 */
const API_ENDPOINTS: ApiEndpoint[] = [
  {
    method: 'POST',
    path: '/api/links',
    summary: '创建短链',
    description: '创建一个新的短链接，支持自定义路径、密码保护、过期时间等功能',
    requestBody: {
      type: 'object',
      properties: {
        originalUrl: { type: 'string', required: true, description: '原始URL地址', example: 'https://example.com' },
        customPath: { type: 'string', required: false, description: '自定义短链路径', example: 'my-link' },
        password: { type: 'string', required: false, description: '访问密码', example: 'secret123' },
        expiresAt: { type: 'string', required: false, description: '过期时间 (ISO 8601)', example: '2024-12-31T23:59:59Z' },
        requireConfirm: { type: 'boolean', required: false, description: '是否需要确认跳转', example: false },
        enableIntermediate: { type: 'boolean', required: false, description: '是否启用中间页', example: true }
      }
    },
    responses: {
      '200': {
        description: '创建成功',
        example: {
          id: 1,
          path: 'abc123',
          shortUrl: 'http://localhost:3000/abc123',
          originalUrl: 'https://example.com',
          title: 'Example Domain',
          views: 0,
          createdAt: '2024-01-01T00:00:00Z',
          hasPassword: false,
          requireConfirm: false,
          enableIntermediate: true
        }
      },
      '400': { description: '请求参数错误' },
      '403': { description: '域名访问被禁止' },
      '500': { description: '服务器错误' }
    }
  },
  {
    method: 'GET',
    path: '/api/links',
    summary: '获取短链列表',
    description: '获取最近创建的50个短链接列表',
    responses: {
      '200': {
        description: '获取成功',
        example: [
          {
            id: 1,
            path: 'abc123',
            shortUrl: 'http://localhost:3000/abc123',
            originalUrl: 'https://example.com',
            title: 'Example Domain',
            views: 5,
            createdAt: '2024-01-01T00:00:00Z',
            hasPassword: false,
            requireConfirm: false,
            enableIntermediate: true
          }
        ]
      },
      '500': { description: '服务器错误' }
    }
  },
  {
    method: 'GET',
    path: '/api/to',
    summary: '快速跳转模式',
    description: '通过 /to 路径实现快速跳转，支持URL参数和Token高级传参。url和token必须提供其中一个，Token优先级高于URL参数。支持三种跳转模式：href（直接跳转，不获取链接信息）、auto（自动跳转，获取链接信息后倒计时）、confirm（二次确认，获取链接信息后显示确认按钮）。Token模式支持独立的人机验证控制。',
    parameters: [
      { name: 'url', type: 'string', required: true, description: '目标URL地址，支持URL编码和未编码格式（与token二选一）', example: 'https://example.com' },
      { name: 'type', type: 'string', required: false, description: '跳转类型：href=直接跳转（不获取链接信息），auto=自动跳转（获取链接信息后倒计时），confirm=二次确认（获取链接信息后显示确认按钮）。默认：auto', example: 'auto' },
      { name: 'token', type: 'string', required: true, description: 'Base64编码的JSON配置，支持高级参数设置（与url二选一）。支持turnstile参数控制人机验证', example: 'eyJ1cmwiOiJodHRwczovL2V4YW1wbGUuY29tIiwidHlwZSI6ImF1dG8iLCJ0dXJuc3RpbGUiOnRydWV9' }
    ],
    responses: {
      '200': {
        description: '处理成功',
        example: {
          originalUrl: 'https://example.com',
          title: 'Example Domain',
          type: 'auto',
          enableIntermediate: true,
          msg: '正在前往目标链接...',
          captchaEnabled: false
        }
      },
      '400': { description: '必须提供url或token参数其中一个，或参数格式无效' },
      '500': { description: '服务器错误' }
    }
  },
  {
    method: 'GET',
    path: '/api/settings',
    summary: '获取系统设置',
    description: '获取系统安全模式、跳转等待时间和域名规则配置',
    responses: {
      '200': {
        description: '获取成功',
        example: {
          securityMode: 'whitelist',
          waitTime: 5,
          domainRules: [
            { id: 1, domain: 'example.com', type: 'whitelist', active: true, createdAt: '2024-01-01T00:00:00Z' }
          ]
        }
      },
      '500': { description: '服务器错误' }
    }
  },
  {
    method: 'PUT',
    path: '/api/settings',
    summary: '更新系统设置',
    description: '更新系统安全模式和跳转等待时间配置',
    requestBody: {
      type: 'object',
      properties: {
        securityMode: { type: 'string', required: false, description: '安全模式 (whitelist/blacklist)', example: 'whitelist' },
        waitTime: { type: 'number', required: false, description: '跳转等待时间（秒）', example: 5 }
      }
    },
    responses: {
      '200': { description: '更新成功', example: { success: true } },
      '500': { description: '服务器错误' }
    }
  },
  {
    method: 'GET',
    path: '/api/domains',
    summary: '获取域名规则',
    description: '获取域名白名单/黑名单规则列表',
    parameters: [
      { name: 'type', type: 'string', required: false, description: '规则类型 (whitelist/blacklist)', example: 'whitelist' }
    ],
    responses: {
      '200': {
        description: '获取成功',
        example: [
          { id: 1, domain: 'example.com', type: 'whitelist', active: true, createdAt: '2024-01-01T00:00:00Z' }
        ]
      },
      '500': { description: '服务器错误' }
    }
  },
  {
    method: 'POST',
    path: '/api/domains',
    summary: '添加域名规则',
    description: '添加新的域名白名单或黑名单规则',
    requestBody: {
      type: 'object',
      properties: {
        domain: { type: 'string', required: true, description: '域名', example: 'example.com' },
        type: { type: 'string', required: true, description: '规则类型 (whitelist/blacklist)', example: 'whitelist' }
      }
    },
    responses: {
      '200': {
        description: '添加成功',
        example: { id: 1, domain: 'example.com', type: 'whitelist', active: true, createdAt: '2024-01-01T00:00:00Z' }
      },
      '400': { description: '域名格式无效或已存在' },
      '500': { description: '服务器错误' }
    }
  },
  {
    method: 'POST',
    path: '/api/check-domain',
    summary: '检查域名访问权限',
    description: '检查指定URL的域名是否允许创建短链',
    requestBody: {
      type: 'object',
      properties: {
        url: { type: 'string', required: true, description: '要检查的URL', example: 'https://example.com' }
      }
    },
    responses: {
      '200': {
        description: '检查完成',
        example: {
          allowed: true,
          reason: '域名在白名单中',
          domain: 'example.com',
          securityMode: 'whitelist'
        }
      },
      '400': { description: '缺少URL参数或URL无效' },
      '500': { description: '服务器错误' }
    }
  },
  {
    method: 'POST',
    path: '/api/admin/login',
    summary: '管理员登录',
    description: '管理员账户登录，获取访问令牌',
    requestBody: {
      type: 'object',
      properties: {
        username: { type: 'string', required: true, description: '用户名', example: 'admin' },
        password: { type: 'string', required: true, description: '密码', example: 'password123' }
      }
    },
    responses: {
      '200': {
        description: '登录成功',
        example: {
          success: true,
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          isDefault: false,
          username: 'admin'
        }
      },
      '400': { description: '用户名和密码不能为空' },
      '401': { description: '用户名或密码错误' },
      '500': { description: '服务器错误' }
    }
  },
  {
    method: 'POST',
    path: '/api/admin/change-password',
    summary: '修改管理员密码',
    description: '修改管理员用户名和密码，需要管理员权限',
    requestBody: {
      type: 'object',
      properties: {
        currentPassword: { type: 'string', required: true, description: '当前密码', example: 'oldpassword' },
        newUsername: { type: 'string', required: true, description: '新用户名', example: 'newadmin' },
        newPassword: { type: 'string', required: true, description: '新密码（至少6位）', example: 'newpassword123' }
      }
    },
    responses: {
      '200': {
        description: '修改成功',
        example: {
          success: true,
          message: '管理员信息修改成功'
        }
      },
      '400': { description: '参数错误或用户名已存在' },
      '401': { description: '未授权或当前密码错误' },
      '404': { description: '管理员账户不存在' },
      '500': { description: '服务器错误' }
    }
  },
  {
    method: 'GET',
    path: '/api/links/{id}',
    summary: '获取短链详情',
    description: '获取单个短链的详细信息，包括密码（需要管理员权限）',
    parameters: [
      { name: 'id', type: 'number', required: true, description: '短链ID', example: 1 }
    ],
    responses: {
      '200': {
        description: '获取成功',
        example: {
          id: 1,
          password: 'decrypted-password',
          hasPassword: true
        }
      },
      '400': { description: '无效的ID' },
      '401': { description: '需要管理员权限' },
      '404': { description: '短链不存在' },
      '500': { description: '服务器错误' }
    }
  },
  {
    method: 'DELETE',
    path: '/api/links/{id}',
    summary: '删除短链',
    description: '删除指定的短链接',
    parameters: [
      { name: 'id', type: 'number', required: true, description: '短链ID', example: 1 }
    ],
    responses: {
      '200': { description: '删除成功', example: { success: true } },
      '400': { description: '无效的ID' },
      '500': { description: '服务器错误' }
    }
  },
  {
    method: 'DELETE',
    path: '/api/domains/{id}',
    summary: '删除域名规则',
    description: '删除指定的域名规则',
    parameters: [
      { name: 'id', type: 'string', required: true, description: '域名规则UUID', example: '123e4567-e89b-12d3-a456-426614174000' }
    ],
    responses: {
      '200': {
        description: '删除成功',
        example: {
          success: true,
          message: '删除成功',
          deletedRule: { id: '123e4567-e89b-12d3-a456-426614174000', domain: 'example.com' }
        }
      },
      '400': { description: '无效的ID格式或存在关联数据' },
      '404': { description: '域名规则不存在' },
      '500': { description: '服务器错误' }
    }
  },
  {
    method: 'GET',
    path: '/api/visit/{path}',
    summary: '获取短链信息',
    description: '通过短链路径获取链接信息，用于跳转前的预处理',
    parameters: [
      { name: 'path', type: 'string', required: true, description: '短链路径', example: 'abc123' }
    ],
    responses: {
      '200': {
        description: '获取成功',
        example: {
          id: 1,
          originalUrl: 'https://example.com',
          title: 'Example Domain',
          hasPassword: false,
          requireConfirm: true,
          enableIntermediate: true
        }
      },
      '404': { description: '短链不存在' },
      '410': { description: '短链已过期' },
      '500': { description: '服务器错误' }
    }
  },
  {
    method: 'POST',
    path: '/api/visit/{path}',
    summary: '访问短链',
    description: '验证密码并记录访问，返回目标URL',
    parameters: [
      { name: 'path', type: 'string', required: true, description: '短链路径', example: 'abc123' }
    ],
    requestBody: {
      type: 'object',
      properties: {
        password: { type: 'string', required: false, description: '访问密码（如果需要）', example: 'secret123' }
      }
    },
    responses: {
      '200': {
        description: '访问成功',
        example: {
          originalUrl: 'https://example.com',
          title: 'Example Domain'
        }
      },
      '401': { description: '密码错误' },
      '404': { description: '短链不存在' },
      '410': { description: '短链已过期' },
      '500': { description: '服务器错误' }
    }
  }
]

/**
 * TO跳转规则配置对象（TO redirect rules configuration object）
 * @description 定义/to路径的跳转规则、参数说明和使用示例（Defines redirect rules, parameter descriptions and usage examples for /to path）
 * @type {Object}
 */
const TO_REDIRECT_RULES = {
  title: 'TO 跳转传参规则',
  description: '通过 /to 路径实现快速跳转，支持URL参数和Token高级传参，提供三种跳转模式',
  /** 跳转规则数组（Redirect rules array） */
  rules: [
    {
      pattern: '/to?url={目标URL}',
      description: 'URL参数跳转（基础模式）',
      example: '/to?url=https://example.com',
      note: '支持URL编码和未编码的URL，默认为自动跳转模式（type=auto）'
    },
    {
      pattern: '/to?url={目标URL}&type={跳转类型}',
      description: '控制跳转类型',
      example: '/to?url=https://example.com&type=confirm',
      note: 'type支持：href（直接跳转，不获取链接信息）、auto（自动跳转，获取链接信息后倒计时）、confirm（二次确认，获取链接信息后显示确认按钮）'
    },
    {
      pattern: '/to?token={Base64编码}',
      description: 'Token参数跳转（高级模式）',
      example: '/to?token=eyJ1cmwiOiJodHRwczovL2V4YW1wbGUuY29tIiwidHlwZSI6ImNvbmZpcm0ifQ==',
      note: 'Token优先级高于URL参数，支持更多自定义选项'
    },
    {
      pattern: '/to?url={目标URL}&token={Base64编码}',
      description: '混合参数（Token优先）',
      example: '/to?url=https://backup.com&token=eyJ1cmwiOiJodHRwczovL2V4YW1wbGUuY29tIn0=',
      note: '当URL和Token同时存在时，优先使用Token中的配置'
    }
  ],
  /** 参数说明数组（Parameters description array） */
  parameters: [
    {
      name: 'url',
      type: 'string',
      required: true,
      description: '目标URL地址，支持URL编码和未编码格式（与token二选一，必填其中一个）',
      example: 'https://example.com 或 https%3A%2F%2Fexample.com'
    },
    {
      name: 'type',
      type: 'string',
      required: false,
      description: '跳转类型：href=直接跳转（不获取链接信息），auto=自动跳转（获取链接信息后倒计时），confirm=二次确认（获取链接信息后显示确认按钮）。默认：auto',
      example: 'auto'
    },
    {
      name: 'token',
      type: 'string',
      required: true,
      description: 'Base64编码的JSON配置，支持高级参数设置（与url二选一，必填其中一个）',
      example: 'eyJ1cmwiOiJodHRwczovL2V4YW1wbGUuY29tIiwidHlwZSI6ImF1dG8ifQ=='
    }
  ],
  /** Token配置模式定义（Token configuration schema definition） */
  tokenSchema: {
    url: {
      type: 'string',
      required: true,
      description: '目标URL地址',
      example: 'https://example.com'
    },
    type: {
      type: 'string',
      required: false,
      description: '跳转类型：href=直接跳转（不获取链接信息），auto=自动跳转（获取链接信息后倒计时），confirm=二次确认（获取链接信息后显示确认按钮）',
      example: 'auto',
      default: 'auto'
    },
    title: {
      type: 'string',
      required: false,
      description: '页面标题，在跳转页面显示',
      example: '跳转到示例网站',
      default: '自动获取'
    },
    msg: {
      type: 'string',
      required: false,
      description: '子标题消息，在跳转页面显示',
      example: '请稍候，正在为您跳转...',
      default: '正在前往目标链接...'
    },
    turnstile: {
      type: 'boolean',
      required: false,
      description: '是否启用 Cloudflare Turnstile 人机验证，独立于全局设置',
      example: 'true',
      default: 'false'
    }
  },
  /** 优先级规则数组（Priority rules array） */
  priority: [
    '1. url和token参数必须提供其中一个，两者都缺失将返回400错误',
    '2. Token参数优先级最高，如果存在Token则忽略URL参数',
    '3. type参数默认值为auto（自动跳转），可通过参数控制跳转类型',
    '4. 三种跳转模式：href（直接跳转，不获取链接信息）、auto（自动跳转，获取链接信息后倒计时）、confirm（二次确认，获取链接信息后显示确认按钮）',
    '5. title和msg在所有模式下都会显示在跳转页面'
  ]
}

/**
 * API文档组件属性接口（API documentation component props interface）
 * @interface ApiDocumentationProps
 * @description 定义API文档弹窗组件的属性类型（Defines prop types for API documentation modal component）
 */
interface ApiDocumentationProps {
  /** 弹窗是否打开（Whether the modal is open） */
  isOpen: boolean
  /** 关闭弹窗的回调函数（Callback function to close the modal） */
  onClose: () => void
}

/**
 * API文档组件（API Documentation Component）
 * @description 显示完整的API文档，包括端点列表、TO跳转规则和OpenAPI规范（Displays complete API documentation including endpoint list, TO redirect rules and OpenAPI specification）
 * @param {ApiDocumentationProps} props - 组件属性（Component props）
 * @param {boolean} props.isOpen - 弹窗是否打开（Whether the modal is open）
 * @param {() => void} props.onClose - 关闭弹窗的回调函数（Callback function to close the modal）
 * @returns {JSX.Element | null} API文档弹窗组件或null（API documentation modal component or null）
 * 
 * @example
 * ```tsx
 * <ApiDocumentation 
 *   isOpen={showApiDocs} 
 *   onClose={() => setShowApiDocs(false)} 
 * />
 * ```
 */
export default function ApiDocumentation({ isOpen, onClose }: ApiDocumentationProps) {
  /** 展开的端点集合（Set of expanded endpoints） */
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set())
  /** 当前复制的文本标识（Current copied text identifier） */
  const [copiedText, setCopiedText] = useState<string | null>(null)
  /** 当前激活的标签页（Currently active tab） */
  const [activeTab, setActiveTab] = useState<'endpoints' | 'to-rules' | 'openapi'>('endpoints')

  /**
   * 切换端点展开状态（Toggle endpoint expansion state）
   * @description 控制API端点详情的展开和折叠状态（Controls the expansion and collapse state of API endpoint details）
   * @param {string} key - 端点的唯一标识符（Unique identifier for the endpoint）
   * @returns {void}
   */
  const toggleEndpoint = (key: string) => {
    const newExpanded = new Set(expandedEndpoints)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedEndpoints(newExpanded)
  }

  /**
   * 复制文本到剪贴板（Copy text to clipboard）
   * @description 将指定文本复制到剪贴板并显示复制成功状态（Copies specified text to clipboard and shows copy success state）
   * @param {string} text - 要复制的文本内容（Text content to copy）
   * @param {string} key - 复制操作的唯一标识符（Unique identifier for the copy operation）
   * @returns {Promise<void>}
   * @throws {Error} 当剪贴板API不可用时抛出错误（Throws error when clipboard API is not available）
   */
  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(key)
      setTimeout(() => setCopiedText(null), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  /**
   * 获取HTTP方法对应的颜色样式（Get color styles for HTTP methods）
   * @description 根据HTTP请求方法返回对应的Tailwind CSS颜色类名（Returns corresponding Tailwind CSS color classes based on HTTP request method）
   * @param {string} method - HTTP请求方法（HTTP request method）
   * @returns {string} Tailwind CSS颜色类名字符串（Tailwind CSS color class names string）
   * 
   * @example
   * ```typescript
   * getMethodColor('GET') // 返回: 'bg-green-100 text-green-800 border-green-200'
   * getMethodColor('POST') // 返回: 'bg-blue-100 text-blue-800 border-blue-200'
   * ```
   */
  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800 border-green-200'
      case 'POST': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'PUT': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'DELETE': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white">
              <Book size={18} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">API 文档</h2>
              <p className="text-sm text-gray-600">ShortLink API 接口文档</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 标签页和操作按钮 */}
        <div className="flex items-center justify-between border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('endpoints')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'endpoints'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              API 接口
            </button>
            <button
              onClick={() => setActiveTab('to-rules')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'to-rules'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              TO 跳转规则
            </button>
            <button
              onClick={() => setActiveTab('openapi')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'openapi'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              OpenAPI 规范
            </button>
          </div>
          
          {/* OpenAPI 操作按钮 */}
          <div className="flex items-center gap-2 px-6">
            <button
              onClick={() => window.open('/api/openapi', '_blank')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              title="查看 OpenAPI 规范"
            >
              <ExternalLink size={16} />
              OpenAPI
            </button>
            <button
              /**
               * 下载OpenAPI规范文件（Download OpenAPI specification file）
               * @description 从API端点获取OpenAPI规范并触发文件下载（Fetches OpenAPI specification from API endpoint and triggers file download）
               * @async
               * @returns {Promise<void>}
               * @throws {Error} 当获取或下载OpenAPI规范失败时（When fetching or downloading OpenAPI specification fails）
               */
              onClick={async () => {
                try {
                  const response = await fetch('/api/openapi')
                  const spec = await response.json()
                  const blob = new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const link = document.createElement('a')
                  link.href = url
                  link.download = 'shortlink-openapi.json'
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                  URL.revokeObjectURL(url)
                } catch (error) {
                  console.error('下载OpenAPI规范失败:', error)
                }
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              title="下载 OpenAPI 规范文件"
            >
              <Download size={16} />
              下载
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'endpoints' ? (
            <div className="space-y-4">
              {API_ENDPOINTS.map((endpoint, index) => {
                const key = `${endpoint.method}-${endpoint.path}`
                const isExpanded = expandedEndpoints.has(key)
                
                return (
                  <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* 接口头部 */}
                    <div
                      className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => toggleEndpoint(key)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-md text-xs font-bold border ${getMethodColor(endpoint.method)}`}>
                            {endpoint.method}
                          </span>
                          <code className="text-sm font-mono text-gray-800">{endpoint.path}</code>
                          <span className="text-sm text-gray-600">{endpoint.summary}</span>
                        </div>
                        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      </div>
                    </div>

                    {/* 接口详情 */}
                    {isExpanded && (
                      <div className="p-4 space-y-4">
                        <p className="text-gray-700">{endpoint.description}</p>

                        {/* 请求参数 */}
                        {endpoint.parameters && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">请求参数</h4>
                            <div className="bg-gray-50 rounded-lg p-3">
                              {endpoint.parameters.map((param, i) => (
                                <div key={i} className="flex items-start gap-3 py-2">
                                  <code className="text-sm font-mono text-blue-600">{param.name}</code>
                                  <span className={`px-2 py-1 rounded text-xs ${param.required ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}>
                                    {param.required ? '必需' : '可选'}
                                  </span>
                                  <span className="text-sm text-gray-600">{param.type}</span>
                                  <span className="text-sm text-gray-700 flex-1">{param.description}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 请求体 */}
                        {endpoint.requestBody && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">请求体</h4>
                            <div className="bg-gray-50 rounded-lg p-3">
                              {Object.entries(endpoint.requestBody.properties).map(([key, prop]) => (
                                <div key={key} className="flex items-start gap-3 py-2">
                                  <code className="text-sm font-mono text-blue-600">{key}</code>
                                  <span className={`px-2 py-1 rounded text-xs ${prop.required ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}>
                                    {prop.required ? '必需' : '可选'}
                                  </span>
                                  <span className="text-sm text-gray-600">{prop.type}</span>
                                  <span className="text-sm text-gray-700 flex-1">{prop.description}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 响应示例 */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">响应示例</h4>
                          {Object.entries(endpoint.responses).map(([status, response]) => (
                            <div key={status} className="mb-3">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                  status.startsWith('2') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {status}
                                </span>
                                <span className="text-sm text-gray-600">{response.description}</span>
                              </div>
                              {response.example && (
                                <div className="relative">
                                  <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-sm overflow-x-auto">
                                    <code>{JSON.stringify(response.example, null, 2)}</code>
                                  </pre>
                                  <button
                                    onClick={() => copyToClipboard(JSON.stringify(response.example, null, 2), `${key}-${status}`)}
                                    className="absolute top-2 right-2 p-1 hover:bg-gray-700 rounded transition-colors"
                                  >
                                    {copiedText === `${key}-${status}` ? (
                                      <Check size={16} className="text-green-400" />
                                    ) : (
                                      <Copy size={16} className="text-gray-400" />
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : activeTab === 'to-rules' ? (
            <div className="space-y-6">
              {/* TO 跳转规则 */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{TO_REDIRECT_RULES.title}</h3>
                <p className="text-gray-700 mb-4">{TO_REDIRECT_RULES.description}</p>
                
                <div className="space-y-4">
                  {TO_REDIRECT_RULES.rules.map((rule, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-3 mb-2">
                        <code className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-sm font-mono">
                          {rule.pattern}
                        </code>
                      </div>
                      <p className="text-gray-700 mb-2">{rule.description}</p>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-600 mb-1">示例:</p>
                        <code className="text-sm font-mono text-green-600">{rule.example}</code>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 italic">{rule.note}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 参数说明 */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">参数说明</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  {TO_REDIRECT_RULES.parameters.map((param, index) => (
                    <div key={index} className="flex items-start gap-3 py-2">
                      <code className="text-sm font-mono text-blue-600">{param.name}</code>
                      <span className={`px-2 py-1 rounded text-xs ${param.required ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}>
                        {param.required ? '必需' : '可选'}
                      </span>
                      <span className="text-sm text-gray-600">{param.type}</span>
                      <span className="text-sm text-gray-700 flex-1">{param.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Token配置说明 */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Token 配置格式</h4>
                <p className="text-sm text-gray-600 mb-3">Token是Base64编码的JSON对象，支持以下字段：</p>
                <div className="bg-gray-50 rounded-lg p-4">
                  {Object.entries(TO_REDIRECT_RULES.tokenSchema).map(([key, schema]) => (
                    <div key={key} className="flex items-start gap-3 py-2">
                      <code className="text-sm font-mono text-blue-600">{key}</code>
                      <span className={`px-2 py-1 rounded text-xs ${schema.required ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}>
                        {schema.required ? '必需' : '可选'}
                      </span>
                      <span className="text-sm text-gray-600">{schema.type}</span>
                      <div className="flex-1">
                        <span className="text-sm text-gray-700">{schema.description}</span>
                        {'default' in schema && schema.default && (
                          <span className="text-xs text-gray-500 block">默认值: {String(schema.default)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 优先级规则 */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">优先级规则</h4>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <ul className="text-sm text-gray-700 space-y-1">
                    {TO_REDIRECT_RULES.priority.map((rule, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-yellow-600 font-bold">•</span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 使用示例 */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">使用示例</h4>
                <div className="space-y-3">
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2"># 基础URL跳转（默认自动跳转）</p>
                    <div className="overflow-x-auto">
                      <code className="text-green-400 text-sm whitespace-nowrap">https://yourdomain.com/to?url=https://github.com</code>
                    </div>
                  </div>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2"># 直接跳转模式</p>
                    <div className="overflow-x-auto">
                      <code className="text-green-400 text-sm whitespace-nowrap">https://yourdomain.com/to?url=https://github.com&type=href</code>
                    </div>
                  </div>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2"># 二次确认模式</p>
                    <div className="overflow-x-auto">
                      <code className="text-green-400 text-sm whitespace-nowrap">https://yourdomain.com/to?url=https://github.com&type=confirm</code>
                    </div>
                  </div>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2"># Token高级配置</p>
                    <div className="overflow-x-auto">
                      <code className="text-green-400 text-xs break-all">
                        https://yourdomain.com/to?token=eyJ1cmwiOiJodHRwczovL2dpdGh1Yi5jb20iLCJ0eXBlIjoiY29uZmlybSIsInRpdGxlIjoi6Lez6L2s5YiwR2l0SHViIiwibXNnIjoi5qyi6L+O6KeE6KeI572R56uZ5Lit5b+DIn0=
                      </code>
                    </div>
                  </div>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2"># Token解码示例</p>
                    <pre className="text-green-400 text-xs overflow-x-auto">
{`{
  "url": "https://github.com",
  "type": "confirm",
  "title": "跳转到GitHub",
  "msg": "欢迎访问网站中心"
}`}
                    </pre>
                  </div>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2"># 启用人机验证的Token配置</p>
                    <div className="overflow-x-auto">
                      <code className="text-green-400 text-xs break-all">
                        https://yourdomain.com/to?token=eyJ1cmwiOiJodHRwczovL2V4YW1wbGUuY29tIiwidHlwZSI6ImF1dG8iLCJ0dXJuc3RpbGUiOnRydWV9
                      </code>
                    </div>
                  </div>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2"># 人机验证Token解码示例</p>
                    <pre className="text-green-400 text-xs overflow-x-auto">
{`{
  "url": "https://example.com",
  "type": "auto",
  "title": "安全跳转",
  "msg": "正在进行安全验证...",
  "turnstile": true
}`}
                    </pre>
                  </div>

                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* OpenAPI 规范 */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">OpenAPI 3.0.3 规范</h3>
                <p className="text-gray-700 mb-4">
                  完整的 API 规范文档，符合 OpenAPI 3.0.3 标准，可用于生成客户端 SDK、API 测试工具等。
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">规范信息</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">版本:</span>
                      <span className="ml-2 font-mono">3.0.3</span>
                    </div>
                    <div>
                      <span className="text-gray-600">API 版本:</span>
                      <span className="ml-2 font-mono">1.0.0</span>
                    </div>
                    <div>
                      <span className="text-gray-600">格式:</span>
                      <span className="ml-2 font-mono">JSON</span>
                    </div>
                    <div>
                      <span className="text-gray-600">编码:</span>
                      <span className="ml-2 font-mono">UTF-8</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">支持的工具</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Swagger UI - API 文档界面</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Postman - API 测试工具</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Insomnia - REST 客户端</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>OpenAPI Generator - 代码生成</span>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">使用方法</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-700 mb-2">1. 在 Swagger UI 中导入：</p>
                        <code className="block bg-gray-900 text-gray-100 p-2 rounded text-xs">
                          {`https://editor.swagger.io/?url=${typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'}/api/openapi`}
                        </code>
                      </div>
                      <div>
                        <p className="text-sm text-gray-700 mb-2">2. 在 Postman 中导入：</p>
                        <code className="block bg-gray-900 text-gray-100 p-2 rounded text-xs">
                          {`File → Import → Link → ${typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'}/api/openapi`}
                        </code>
                      </div>
                      <div>
                        <p className="text-sm text-gray-700 mb-2">3. 使用 curl 获取：</p>
                        <code className="block bg-gray-900 text-gray-100 p-2 rounded text-xs">
                          {`curl -X GET ${typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'}/api/openapi`}
                        </code>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">规范特性</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• 完整的 API 端点定义</li>
                      <li>• 详细的请求/响应模式</li>
                      <li>• 参数验证规则</li>
                      <li>• 错误响应定义</li>
                      <li>• 安全认证方案</li>
                      <li>• 示例数据</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}