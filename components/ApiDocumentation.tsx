/**
 * @fileoverview API文档组件 - 提供完整的API接口文档展示功能（API Documentation Component - Provides complete API interface documentation display functionality）
 * @description 该组件包含三个主要部分：API端点列表、TO跳转规则说明和OpenAPI规范文档。支持端点详情展开/折叠、代码复制、OpenAPI规范下载等功能。
 * (This component contains three main parts: API endpoint list, TO redirect rules documentation, and OpenAPI specification. Supports endpoint details expand/collapse, code copying, OpenAPI spec download and other features.)
 * 
 * @author AL01 Link Team
 * @version 1.0.0
 * @since 2024-12-17
 * 
 * @requires react
 * @requires lucide-react
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { Book, ChevronDown, ChevronRight, Copy, Check, X, Download, ExternalLink } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'

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
 * 获取API端点配置数组（Get API endpoints configuration array）
 * @description 包含所有可用API端点的完整定义和文档（Contains complete definitions and documentation for all available API endpoints）
 * @param t 翻译函数（Translation function）
 * @returns {ApiEndpoint[]} API端点数组（API endpoints array）
 */
const getApiEndpoints = (t: (key: any, params?: Record<string, string | number>) => string): ApiEndpoint[] => [
  {
    method: 'POST',
    path: '/api/links',
    summary: t('createShortLink'),
    description: t('createShortLinkDesc'),
    requestBody: {
      type: 'object',
      properties: {
        originalUrl: { type: 'string', required: true, description: t('originalUrlDesc'), example: 'https://example.com' },
        customPath: { type: 'string', required: false, description: t('customPathDesc'), example: 'my-link' },
        password: { type: 'string', required: false, description: t('passwordDesc'), example: 'secret123' },
        expiresAt: { type: 'string', required: false, description: t('expiresAtDesc'), example: '2024-12-31T23:59:59Z' },
        requireConfirm: { type: 'boolean', required: false, description: t('requireConfirmDesc'), example: false },
        enableIntermediate: { type: 'boolean', required: false, description: t('enableIntermediateDesc'), example: true }
      }
    },
    responses: {
      '200': {
        description: t('apiCreateSuccess'),
        example: {
          id: 1,
          path: 'abc123',
          shortUrl: 'http://localhost:3000/abc123',
          originalUrl: 'https://example.com',
          title: t('exampleDomain'),
          views: 0,
          createdAt: '2024-01-01T00:00:00Z',
          hasPassword: false,
          requireConfirm: false,
          enableIntermediate: true
        }
      },
      '400': { description: t('apiRequestParamError') },
      '403': { description: t('apiDomainAccessForbidden') },
      '500': { description: t('apiServerError') }
    }
  },
  {
    method: 'GET',
    path: '/api/links',
    summary: t('getShortLinkList'),
    description: t('getShortLinkListDesc'),
    responses: {
      '200': {
        description: t('apiGetSuccess'),
        example: [
          {
            id: 1,
            path: 'abc123',
            shortUrl: 'http://localhost:3000/abc123',
            originalUrl: 'https://example.com',
            title: t('exampleDomain'),
            views: 5,
            createdAt: '2024-01-01T00:00:00Z',
            hasPassword: false,
            requireConfirm: false,
            enableIntermediate: true
          }
        ]
      },
      '500': { description: t('apiServerError') }
    }
  },
  {
    method: 'GET',
    path: '/api/to',
    summary: t('quickRedirectMode'),
    description: t('quickRedirectModeDesc'),
    parameters: [
      { name: 'url', type: 'string', required: true, description: t('targetUrlParamDesc'), example: 'https://example.com' },
      { name: 'type', type: 'string', required: false, description: t('jumpTypeParamDesc'), example: 'auto' },
      { name: 'token', type: 'string', required: true, description: t('base64EncodedJson'), example: 'eyJ1cmwiOiJodHRwczovL2V4YW1wbGUuY29tIiwidHlwZSI6ImF1dG8iLCJ0dXJuc3RpbGUiOnRydWV9' }
    ],
    responses: {
      '200': {
        description: t('apiProcessingSuccess'),
        example: {
          originalUrl: 'https://example.com',
          title: t('exampleDomain'),
          type: 'auto',
          enableIntermediate: true,
          msg: t('redirectingToTarget'),
          captchaEnabled: false
        }
      },
      '400': { description: t('apiMissingUrlOrToken') },
      '500': { description: t('apiServerError') }
    }
  },
  {
    method: 'GET',
    path: '/api/settings',
    summary: t('getSystemSettings') + ' 🔒',
    description: t('getSystemSettingsDesc') + ' ' + t('adminRequired'),
    responses: {
      '200': {
        description: t('apiGetSuccess'),
        example: {
          securityMode: 'blacklist',
          waitTime: 3,
          captchaEnabled: false,
          preloadEnabled: true,
          autoFillPasswordEnabled: true,
          nanoidLength: 6,
          domainRules: [
            { id: 1, domain: 'example.com', type: 'whitelist', active: true, createdAt: '2024-01-01T00:00:00Z' }
          ]
        }
      },
      '401': { description: t('apiAdminRequired') },
      '500': { description: '服务器错误' }
    }
  },
  {
    method: 'PUT',
    path: '/api/settings',
    summary: t('updateSystemSettings') + ' 🔒',
    description: t('updateSystemSettingsDesc') + ' ' + t('adminRequired'),
    requestBody: {
      type: 'object',
      properties: {
        securityMode: { type: 'string', required: false, description: t('securityModeDesc'), example: 'blacklist' },
        waitTime: { type: 'number', required: false, description: t('waitTimeDesc'), example: 3 },
        captchaEnabled: { type: 'boolean', required: false, description: t('captchaEnabledDesc'), example: false },
        preloadEnabled: { type: 'boolean', required: false, description: t('preloadEnabledDesc'), example: true },
        autoFillPasswordEnabled: { type: 'boolean', required: false, description: t('autoFillPasswordEnabledDesc'), example: true },
        nanoidLength: { type: 'number', required: false, description: t('nanoidLengthDesc'), example: 6 }
      }
    },
    responses: {
      '200': { description: t('apiUpdateSuccess'), example: { success: true } },
      '401': { description: t('apiAdminRequired') },
      '500': { description: t('apiServerError') }
    }
  },
  {
    method: 'GET',
    path: '/api/public-settings',
    summary: t('getPublicSettings'),
    description: t('getPublicSettingsDesc'),
    responses: {
      '200': {
        description: t('apiGetSuccess'),
        example: {
          waitTime: 3,
          captchaEnabled: false,
          preloadEnabled: true,
          autoFillPasswordEnabled: true
        }
      },
      '500': { description: t('apiServerError') }
    }
  },
  {
    method: 'GET',
    path: '/api/domains',
    summary: t('getDomainRules') + ' 🔒',
    description: t('getDomainRulesDesc') + ' ' + t('adminRequired'),
    parameters: [
      { name: 'type', type: 'string', required: false, description: t('ruleTypeDesc'), example: 'whitelist' }
    ],
    responses: {
      '200': {
        description: t('apiGetSuccess'),
        example: [
          { id: 1, domain: 'example.com', type: 'whitelist', active: true, createdAt: '2024-01-01T00:00:00Z' }
        ]
      },
      '401': { description: t('apiAdminRequired') },
      '500': { description: t('apiServerError') }
    }
  },
  {
    method: 'POST',
    path: '/api/domains',
    summary: t('addDomainRule') + ' 🔒',
    description: t('addDomainRuleDesc') + ' ' + t('adminRequired'),
    requestBody: {
      type: 'object',
      properties: {
        domain: { type: 'string', required: true, description: t('domainDesc'), example: 'example.com' },
        type: { type: 'string', required: true, description: t('ruleTypeDesc'), example: 'whitelist' }
      }
    },
    responses: {
      '200': {
        description: t('apiCreateSuccess'),
        example: { id: 1, domain: 'example.com', type: 'whitelist', active: true, createdAt: '2024-01-01T00:00:00Z' }
      },
      '400': { description: t('apiInvalidDomainFormat') },
      '401': { description: t('apiAdminRequired') },
      '500': { description: t('apiServerError') }
    }
  },
  {
    method: 'POST',
    path: '/api/check-domain',
    summary: t('checkDomainAccess'),
    description: t('checkDomainAccessDesc'),
    requestBody: {
      type: 'object',
      properties: {
        url: { type: 'string', required: true, description: t('urlToCheckDesc'), example: 'https://example.com' }
      }
    },
    responses: {
      '200': {
        description: t('checkCompleteDesc'),
        example: {
          allowed: true,
          reason: t('domainInWhitelistDesc'),
          domain: 'example.com',
          securityMode: 'blacklist'
        }
      },
      '400': { description: t('apiMissingUrlParam') },
      '500': { description: t('apiServerError') }
    }
  },
  {
    method: 'POST',
    path: '/api/admin/login',
    summary: t('adminLogin'),
    description: t('adminLoginDesc'),
    requestBody: {
      type: 'object',
      properties: {
        username: { type: 'string', required: true, description: t('usernameParamDesc'), example: 'admin' },
        password: { type: 'string', required: true, description: t('passwordParamDesc'), example: 'password123' }
      }
    },
    responses: {
      '200': {
        description: t('apiLoginSuccess'),
        example: {
          success: true,
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          isDefault: false,
          username: 'admin'
        }
      },
      '400': { description: t('apiUsernamePasswordRequired') },
      '401': { description: t('apiInvalidCredentials') },
      '500': { description: t('apiServerError') }
    }
  },
  {
    method: 'GET',
    path: '/api/admin/check-default',
    summary: t('checkDefaultPassword') + ' 🔒',
    description: t('checkDefaultPasswordDesc') + ' ' + t('adminRequired'),
    responses: {
      '200': {
        description: t('apiGetSuccess'),
        example: {
          success: true,
          isDefault: false,
          username: 'admin'
        }
      },
      '401': { description: t('apiAdminRequired') },
      '404': { description: t('apiAdminNotFound') },
      '500': { description: t('apiServerError') }
    }
  },
  {
    method: 'POST',
    path: '/api/admin/change-password',
    summary: t('changeAdminPassword') + ' 🔒',
    description: t('changeAdminPasswordDesc') + ' ' + t('adminRequired'),
    requestBody: {
      type: 'object',
      properties: {
        currentPassword: { type: 'string', required: true, description: t('currentPasswordParamDesc'), example: 'oldpassword' },
        newUsername: { type: 'string', required: true, description: t('newUsernameParamDesc'), example: 'newadmin' },
        newPassword: { type: 'string', required: true, description: t('newPasswordParamDesc'), example: 'newpassword123' }
      }
    },
    responses: {
      '200': {
        description: t('apiModifySuccess'),
        example: {
          success: true,
          message: t('apiAdminInfoModified')
        }
      },
      '400': { description: t('apiParamErrorOrUserExists') },
      '401': { description: t('apiUnauthorizedOrWrongPassword') },
      '404': { description: t('apiAdminNotFound') },
      '500': { description: t('apiServerError') }
    }
  },
  {
    method: 'GET',
    path: '/api/links/{id}',
    summary: t('getShortLinkDetails'),
    description: t('getShortLinkDetailsDesc'),
    parameters: [
      { name: 'id', type: 'number', required: true, description: t('shortLinkIdDesc'), example: 1 }
    ],
    responses: {
      '200': {
        description: t('apiGetSuccess'),
        example: {
          id: 1,
          password: 'decrypted-password',
          hasPassword: true
        }
      },
      '400': { description: t('apiInvalidId') },
      '401': { description: t('apiAdminRequired') },
      '404': { description: t('apiLinkNotFound') },
      '500': { description: t('apiServerError') }
    }
  },
  {
    method: 'DELETE',
    path: '/api/links/{id}',
    summary: t('deleteShortLink'),
    description: t('deleteShortLinkDesc'),
    parameters: [
      { name: 'id', type: 'number', required: true, description: t('shortLinkIdDesc'), example: 1 }
    ],
    responses: {
      '200': { description: t('apiDeleteSuccess'), example: { success: true } },
      '400': { description: t('apiInvalidId') },
      '500': { description: t('apiServerError') }
    }
  },
  {
    method: 'DELETE',
    path: '/api/domains/{id}',
    summary: t('deleteDomainRule') + ' 🔒',
    description: t('deleteDomainRuleDesc') + ' ' + t('adminRequired'),
    parameters: [
      { name: 'id', type: 'string', required: true, description: t('domainRuleUuidDesc'), example: '123e4567-e89b-12d3-a456-426614174000' }
    ],
    responses: {
      '200': {
        description: t('apiDeleteSuccess'),
        example: {
          success: true,
          message: t('apiDeleteSuccess'),
          deletedRule: { id: '123e4567-e89b-12d3-a456-426614174000', domain: 'example.com' }
        }
      },
      '400': { description: t('apiInvalidIdFormat') },
      '401': { description: t('apiAdminRequired') },
      '404': { description: t('apiDomainRuleNotFound') },
      '500': { description: t('apiServerError') }
    }
  },
  {
    method: 'GET',
    path: '/api/config/export',
    summary: t('exportConfig') + ' 🔒',
    description: t('exportConfigDesc') + ' ' + t('adminRequired'),
    parameters: [
      { name: 'type', type: 'string', required: false, description: t('exportTypeDesc'), example: 'all' },
      { name: 'token', type: 'string', required: true, description: t('adminTokenDesc'), example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
    ],
    responses: {
      '200': {
        description: t('exportSuccess'),
        example: {
          version: '1.0',
          exportTime: '2024-12-18T10:00:00Z',
          type: 'all',
          settings: { securityMode: 'blacklist', waitTime: 3 },
          domainRules: [{ domain: 'example.com', type: 'whitelist', active: true }],
          links: [{ id: 'uuid-1', path: 'abc123', originalUrl: 'https://example.com' }]
        }
      },
      '401': { description: t('apiAdminRequired') },
      '500': { description: t('apiServerError') }
    }
  },
  {
    method: 'POST',
    path: '/api/config/import',
    summary: t('importConfig') + ' 🔒',
    description: t('importConfigDesc') + ' ' + t('adminRequired'),
    requestBody: {
      type: 'object',
      properties: {
        data: { type: 'object', required: true, description: t('configDataDesc'), example: {} },
        type: { type: 'string', required: false, description: t('importTypeDesc'), example: 'all' }
      }
    },
    responses: {
      '200': {
        description: t('importSuccess'),
        example: {
          success: true,
          message: t('importSuccess'),
          importedCount: 15
        }
      },
      '400': { description: t('apiInvalidConfigData') },
      '401': { description: t('apiAdminRequired') },
      '500': { description: t('apiServerError') }
    }
  },
  {
    method: 'GET',
    path: '/api/health',
    summary: t('healthCheck'),
    description: t('healthCheckDesc'),
    responses: {
      '200': {
        description: t('systemHealthy'),
        example: {
          status: 'healthy',
          timestamp: '2024-12-18T10:00:00Z',
          uptime: 86400,
          version: '1.0.0',
          checks: {
            database: { status: 'healthy', responseTime: 25, message: t('databaseNormal') },
            memory: { status: 'healthy', usage: { used: 128, total: 512, percentage: 25 }, message: t('memoryNormal') },
            cache: { status: 'healthy', stats: { size: 1024, hitRate: 0.85 }, message: t('cacheNormal') },
            api: { status: 'healthy', metrics: { totalRequests: 10000, averageResponseTime: 150, errorRate: 0.01 }, message: t('apiNormal') }
          }
        }
      },
      '503': { description: t('systemUnhealthy') }
    }
  },
  {
    method: 'POST',
    path: '/api/verify-turnstile',
    summary: t('verifyTurnstile'),
    description: t('verifyTurnstileDesc'),
    requestBody: {
      type: 'object',
      properties: {
        token: { type: 'string', required: true, description: t('turnstileTokenDesc'), example: 'turnstile-response-token' }
      }
    },
    responses: {
      '200': {
        description: t('verificationSuccess'),
        example: {
          success: true,
          message: t('verificationSuccess')
        }
      },
      '400': {
        description: t('verificationFailed'),
        example: {
          success: false,
          error: t('captchaFailed'),
          details: ['invalid-input-response']
        }
      },
      '500': { description: t('captchaServiceError') }
    }
  },
  {
    method: 'DELETE',
    path: '/api/logs/cleanup',
    summary: t('cleanupLogs') + ' 🔒',
    description: t('cleanupLogsDesc') + ' ' + t('adminRequired'),
    parameters: [
      { name: 'days', type: 'number', required: false, description: t('retentionDaysDesc'), example: 30 }
    ],
    responses: {
      '200': {
        description: t('cleanupSuccess'),
        example: {
          success: true,
          deletedCount: 1234
        }
      },
      '400': { description: t('apiInvalidParams') },
      '401': { description: t('apiAdminRequired') },
      '500': { description: t('apiServerError') }
    }
  },
  {
    method: 'GET',
    path: '/api/logs/export',
    summary: t('exportLogs') + ' 🔒',
    description: t('exportLogsDesc') + ' ' + t('adminRequired'),
    parameters: [
      { name: 'format', type: 'string', required: false, description: t('exportFormatDesc'), example: 'csv' },
      { name: 'startDate', type: 'string', required: false, description: t('startDateDesc'), example: '2024-12-01' },
      { name: 'endDate', type: 'string', required: false, description: t('endDateDesc'), example: '2024-12-18' },
      { name: 'type', type: 'string', required: false, description: t('logTypeDesc'), example: 'visit' },
      { name: 'limit', type: 'number', required: false, description: t('exportLimitDesc'), example: 10000 }
    ],
    responses: {
      '200': { description: t('exportFileDownload') },
      '401': { description: t('apiAdminRequired') },
      '500': { description: t('apiServerError') }
    }
  },
  {
    method: 'POST',
    path: '/api/track-visit/{path}',
    summary: t('trackVisit'),
    description: t('trackVisitDesc'),
    parameters: [
      { name: 'path', type: 'string', required: true, description: t('shortLinkPathDesc'), example: 'abc123' }
    ],
    responses: {
      '200': {
        description: t('trackSuccess'),
        example: { success: true }
      },
      '404': { description: t('apiLinkNotFound') },
      '410': { description: t('apiLinkExpired') },
      '500': { description: t('apiServerError') }
    }
  },
  {
    method: 'POST',
    path: '/api/track-to-visit',
    summary: t('trackToVisit'),
    description: t('trackToVisitDesc'),
    requestBody: {
      type: 'object',
      properties: {
        url: { type: 'string', required: true, description: t('targetUrlDesc'), example: 'https://example.com' }
      }
    },
    responses: {
      '200': {
        description: t('trackSuccess'),
        example: { success: true, message: t('visitRecorded') }
      },
      '500': { description: t('apiServerError') }
    }
  },
  {
    method: 'GET',
    path: '/api/logs/stats',
    summary: t('getLogStats') + ' 🔒',
    description: t('getLogStatsDesc') + ' ' + t('adminRequired'),
    parameters: [
      { name: 'period', type: 'string', required: false, description: t('statsPeriodDesc'), example: '7d' },
      { name: 'linkId', type: 'string', required: false, description: t('linkIdDesc'), example: 'uuid-string' },
      { name: 'type', type: 'string', required: false, description: t('statsTypeDesc'), example: 'summary' }
    ],
    responses: {
      '200': {
        description: t('apiGetSuccess'),
        example: {
          total: 1234,
          todayCount: 89,
          yesterdayCount: 67,
          thisWeekCount: 456,
          thisMonthCount: 1234,
          typeStats: { visit: 800, admin: 200, error: 34 },
          levelStats: { info: 1000, warn: 200, error: 34 },
          categoryStats: { access: 800, system: 400, security: 34 },
          riskLevelStats: { low: 1000, medium: 200, high: 34 },
          last24Hours: [{ hour: '2024-12-18T10:00:00Z', count: 45 }],
          last7Days: [{ date: '2024-12-18', count: 89 }],
          topLinks: [{ id: 'uuid-1', path: 'abc123', visits: 234 }],
          topReferrers: [{ referer: 'https://google.com', visits: 123 }],
          avgResponseTime: 150,
          slowRequests: 5
        }
      },
      '401': { description: t('apiAdminRequired') },
      '500': { description: t('apiServerError') }
    }
  },
  {
    method: 'GET',
    path: '/api/logs',
    summary: t('getLogs') + ' 🔒',
    description: t('getLogsDesc') + ' ' + t('adminRequired'),
    parameters: [
      { name: 'page', type: 'number', required: false, description: t('pageNumberDesc'), example: 1 },
      { name: 'limit', type: 'number', required: false, description: t('pageLimitDesc'), example: 50 },
      { name: 'type', type: 'string', required: false, description: t('logTypeDesc'), example: 'visit' },
      { name: 'level', type: 'string', required: false, description: t('logLevelDesc'), example: 'info' },
      { name: 'category', type: 'string', required: false, description: t('logCategoryDesc'), example: 'access' },
      { name: 'riskLevel', type: 'string', required: false, description: t('riskLevelDesc'), example: 'low' },
      { name: 'startDate', type: 'string', required: false, description: t('startDateDesc'), example: '2024-12-01' },
      { name: 'endDate', type: 'string', required: false, description: t('endDateDesc'), example: '2024-12-18' },
      { name: 'search', type: 'string', required: false, description: t('searchTermDesc'), example: 'keyword' },
      { name: 'sortBy', type: 'string', required: false, description: t('sortFieldDesc'), example: 'createdAt' },
      { name: 'sortOrder', type: 'string', required: false, description: t('sortOrderDesc'), example: 'desc' }
    ],
    responses: {
      '200': {
        description: t('apiGetSuccess'),
        example: {
          logs: [
            {
              id: 'log-uuid',
              type: 'visit',
              level: 'info',
              category: 'access',
              message: '短链访问: abc123',
              details: { path: 'abc123', originalUrl: 'https://example.com' },
              ip: '192.168.1.1',
              userAgent: 'Mozilla/5.0...',
              riskLevel: 'low',
              createdAt: '2024-12-18T11:00:00Z'
            }
          ],
          total: 500,
          page: 1,
          limit: 50,
          totalPages: 10
        }
      },
      '401': { description: t('apiAdminRequired') },
      '500': { description: t('apiServerError') }
    }
  },
  {
    method: 'GET',
    path: '/api/visit/{path}',
    summary: t('getShortLinkInfo'),
    description: t('getShortLinkInfoDesc'),
    parameters: [
      { name: 'path', type: 'string', required: true, description: t('shortLinkPathDesc'), example: 'abc123' }
    ],
    responses: {
      '200': {
        description: t('apiGetSuccess'),
        example: {
          id: 1,
          originalUrl: 'https://example.com',
          title: t('exampleDomain'),
          hasPassword: false,
          requireConfirm: true,
          enableIntermediate: true
        }
      },
      '404': { description: t('apiLinkNotFound') },
      '410': { description: t('apiLinkExpired') },
      '500': { description: t('apiServerError') }
    }
  },
  {
    method: 'POST',
    path: '/api/visit/{path}',
    summary: t('visitShortLink'),
    description: t('visitShortLinkDesc'),
    parameters: [
      { name: 'path', type: 'string', required: true, description: t('shortLinkPathDesc'), example: 'abc123' }
    ],
    requestBody: {
      type: 'object',
      properties: {
        password: { type: 'string', required: false, description: t('accessPasswordIfNeededDesc'), example: 'secret123' },
        isAutoFill: { type: 'boolean', required: false, description: t('isAutoFillDesc'), example: false }
      }
    },
    responses: {
      '200': {
        description: t('apiGetSuccess'),
        example: {
          originalUrl: 'https://example.com',
          title: t('exampleDomain')
        }
      },
      '401': { description: t('apiPasswordRequired') },
      '404': { description: t('apiLinkNotFound') },
      '410': { description: t('apiLinkExpired') },
      '500': { description: t('apiServerError') }
    }
  }
]

/**
 * TO跳转规则配置对象（TO redirect rules configuration object）
 * @description 定义/to路径的跳转规则、参数说明和使用示例（Defines redirect rules, parameter descriptions and usage examples for /to path）
 * @type {Object}
 */
const getToRedirectRules = (t: (key: any, params?: Record<string, string | number>) => string) => ({
  title: t('toRedirectRulesTitle'),
  description: t('toRedirectRulesDesc'),
  /** 跳转规则数组（Redirect rules array） */
  rules: [
    {
      pattern: t('targetUrlPattern'),
      description: t('urlParamRedirect'),
      example: '/to?url=https://example.com',
      note: t('urlParamNote')
    },
    {
      pattern: t('targetUrlTypePattern'),
      description: t('controlRedirectType'),
      example: '/to?url=https://example.com&type=confirm',
      note: t('typeParamNote')
    },
    {
      pattern: t('tokenPattern'),
      description: t('tokenParamRedirect'),
      example: '/to?token=eyJ1cmwiOiJodHRwczovL2V4YW1wbGUuY29tIiwidHlwZSI6ImNvbmZpcm0ifQ==',
      note: t('tokenParamNote')
    },
    {
      pattern: t('targetUrlTokenPattern'),
      description: t('mixedParams'),
      example: '/to?url=https://backup.com&token=eyJ1cmwiOiJodHRwczovL2V4YW1wbGUuY29tIn0=',
      note: t('mixedParamNote')
    }
  ],
  /** 参数说明数组（Parameters description array） */
  parameters: [
    {
      name: 'url',
      type: 'string',
      required: true,
      description: t('targetUrlDesc'),
      example: 'https://example.com 或 https%3A%2F%2Fexample.com'
    },
    {
      name: 'type',
      type: 'string',
      required: false,
      description: t('jumpTypeDesc'),
      example: 'auto'
    },
    {
      name: 'token',
      type: 'string',
      required: true,
      description: t('tokenConfigDesc2'),
      example: 'eyJ1cmwiOiJodHRwczovL2V4YW1wbGUuY29tIiwidHlwZSI6ImF1dG8ifQ=='
    },

  ],
  /** Token配置模式定义（Token configuration schema definition） */
  tokenSchema: {
    url: {
      type: 'string',
      required: true,
      description: t('targetUrlSimpleDesc'),
      example: 'https://example.com'
    },
    type: {
      type: 'string',
      required: false,
      description: t('jumpTypeDesc'),
      example: 'auto',
      default: 'auto'
    },
    title: {
      type: 'string',
      required: false,
      description: t('pageTitle'),
      example: t('jumpToExampleSite'),
      default: t('autoRetrieve')
    },
    msg: {
      type: 'string',
      required: false,
      description: t('subtitleMessage'),
      example: t('pleaseWaitRedirecting'),
      default: t('redirectingToTargetDefault')
    },
    turnstile: {
      type: 'boolean',
      required: false,
      description: t('enableTurnstileVerification'),
      example: 'true',
      default: 'false'
    }
  },
  /** 优先级规则数组（Priority rules array） */
  priority: [
    t('priorityRule1'),
    t('priorityRule2'),
    t('priorityRule3'),
    t('priorityRule4'),
    t('priorityRule5')
  ]
})

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
  const dialogRef = useRef<HTMLDialogElement>(null)
  const { t, language } = useLanguage()
  /** 展开的端点集合（Set of expanded endpoints） */
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set())
  /** 当前复制的文本标识（Current copied text identifier） */
  const [copiedText, setCopiedText] = useState<string | null>(null)
  /** 当前激活的标签页（Currently active tab） */
  const [activeTab, setActiveTab] = useState<'endpoints' | 'authentication' | 'to-rules' | 'password-autofill' | 'openapi'>('endpoints')
  /** 当前主题状态 */
  const [isDarkMode, setIsDarkMode] = useState(false)

  // 获取本地化的 API 端点数据
  const apiEndpoints = getApiEndpoints(t)
  // 获取本地化的 TO 跳转规则数据
  const toRedirectRules = getToRedirectRules(t)

  // 初始化主题状态
  useEffect(() => {
    if (typeof document !== 'undefined') {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    }
  }, [])

  // 控制dialog的打开和关闭
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      dialog.showModal()
      // 更新主题状态
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    } else {
      dialog.close()
    }
  }, [isOpen])

  // 监听主题变化
  useEffect(() => {
    if (!isOpen) return

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          setIsDarkMode(document.documentElement.classList.contains('dark'))
        }
      })
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [isOpen])

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
      console.error(t('copyFailed') + ':', err)
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

  return (
    <dialog
      ref={dialogRef}
      className="backdrop:bg-black/50 backdrop:backdrop-blur-sm bg-transparent rounded-lg w-full max-w-6xl h-[90vh] p-0"
      onClose={onClose}
    >
      <div className={`rounded-lg shadow-xl w-full h-full flex flex-col border ${isDarkMode ? 'bg-slate-800 text-slate-200 border-slate-600' : 'bg-white text-gray-900 border-gray-200'}`}>
        {/* 头部 */}
        <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-slate-600' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white">
              <Book size={18} />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{t('apiDocumentation')}</h2>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>{t('appTitle')} {t('apiDocumentation')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* 标签页和操作按钮 */}
        <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between border-b ${isDarkMode ? 'border-slate-600' : 'border-gray-200'}`}>
          <div className="flex overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('endpoints')}
              className={`px-3 sm:px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'endpoints'
                  ? `border-blue-500 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`
                  : `border-transparent ${isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-gray-600 hover:text-gray-900'}`
                }`}
            >
              {t('apiEndpoints')}
            </button>
            <button
              onClick={() => setActiveTab('authentication')}
              className={`px-3 sm:px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'authentication'
                  ? `border-blue-500 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`
                  : `border-transparent ${isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-gray-600 hover:text-gray-900'}`
                }`}
            >
              {t('adminAuthentication')}
            </button>
            <button
              onClick={() => setActiveTab('to-rules')}
              className={`px-3 sm:px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'to-rules'
                  ? `border-blue-500 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`
                  : `border-transparent ${isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-gray-600 hover:text-gray-900'}`
                }`}
            >
              {t('toRedirectRules')}
            </button>
            <button
              onClick={() => setActiveTab('password-autofill')}
              className={`px-3 sm:px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'password-autofill'
                  ? `border-blue-500 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`
                  : `border-transparent ${isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-gray-600 hover:text-gray-900'}`
                }`}
            >
              {t('passwordAutoFill')}
            </button>
            <button
              onClick={() => setActiveTab('openapi')}
              className={`px-3 sm:px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'openapi'
                  ? `border-blue-500 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`
                  : `border-transparent ${isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-gray-600 hover:text-gray-900'}`
                }`}
            >
              {t('openApiSpec')}
            </button>
          </div>

          {/* OpenAPI 操作按钮 */}
          <div className="flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-0">
            <button
              onClick={() => window.open(`/api/openapi?lang=${language}`, '_blank')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
              title={t('viewOpenApiSpec')}
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
                  const response = await fetch(`/api/openapi?lang=${language}`)
                  const spec = await response.json()
                  const blob = new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const link = document.createElement('a')
                  link.href = url
                  link.download = `al01link-openapi-${language}.json`
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                  URL.revokeObjectURL(url)
                } catch (error) {
                  console.error(t('downloadOpenApiSpecFailed') + ':', error)
                }
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
              title={t('downloadOpenApiSpecFile')}
            >
              <Download size={16} />
              {t('download')}
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'endpoints' ? (
            <div className="space-y-4">
              {apiEndpoints.map((endpoint, index) => {
                const key = `${endpoint.method}-${endpoint.path}`
                const isExpanded = expandedEndpoints.has(key)

                return (
                  <div key={index} className={`border rounded-lg overflow-hidden ${isDarkMode ? 'border-slate-600' : 'border-gray-200'}`}>
                    {/* 接口头部 */}
                    <div
                      className={`p-4 cursor-pointer transition-colors ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-50 hover:bg-gray-100'}`}
                      onClick={() => toggleEndpoint(key)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-md text-xs font-bold border ${getMethodColor(endpoint.method)}`}>
                            {endpoint.method}
                          </span>
                          <code className={`text-sm font-mono ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>{endpoint.path}</code>
                          <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>{endpoint.summary}</span>
                        </div>
                        <div className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
                          {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        </div>
                      </div>
                    </div>

                    {/* 接口详情 */}
                    {isExpanded && (
                      <div className={`p-4 space-y-4 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
                        <p className={`${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{endpoint.description}</p>

                        {/* 请求参数 */}
                        {endpoint.parameters && (
                          <div>
                            <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{t('requestParameters')}</h4>
                            <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                              {endpoint.parameters.map((param, i) => (
                                <div key={i} className="flex items-start gap-3 py-2">
                                  <code className={`text-sm font-mono ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{param.name}</code>
                                  <span className={`px-2 py-1 rounded text-xs ${param.required 
                                    ? `${isDarkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-800'}` 
                                    : `${isDarkMode ? 'bg-slate-600 text-slate-300' : 'bg-gray-100 text-gray-600'}`
                                  }`}>
                                    {param.required ? t('required') : t('optional')}
                                  </span>
                                  <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>{param.type}</span>
                                  <span className={`text-sm flex-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{param.description}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 请求体 */}
                        {endpoint.requestBody && (
                          <div>
                            <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{t('requestBody')}</h4>
                            <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                              {Object.entries(endpoint.requestBody.properties).map(([key, prop]) => (
                                <div key={key} className="flex items-start gap-3 py-2">
                                  <code className={`text-sm font-mono ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{key}</code>
                                  <span className={`px-2 py-1 rounded text-xs ${prop.required 
                                    ? `${isDarkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-800'}` 
                                    : `${isDarkMode ? 'bg-slate-600 text-slate-300' : 'bg-gray-100 text-gray-600'}`
                                  }`}>
                                    {prop.required ? t('required') : t('optional')}
                                  </span>
                                  <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>{prop.type}</span>
                                  <span className={`text-sm flex-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{prop.description}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 响应示例 */}
                        <div>
                          <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{t('responseExample')}</h4>
                          {Object.entries(endpoint.responses).map(([status, response]) => (
                            <div key={status} className="mb-3">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${status.startsWith('2') 
                                  ? `${isDarkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800'}` 
                                  : `${isDarkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-800'}`
                                }`}>
                                  {status}
                                </span>
                                <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>{response.description}</span>
                              </div>
                              {response.example && (
                                <div className="relative">
                                  <p className={`text-sm mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>{t('example')}:</p>
                                  <pre className={`p-3 rounded-lg text-sm overflow-x-auto ${isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-gray-900 text-gray-100'}`}>
                                    <code>{JSON.stringify(response.example, null, 2)}</code>
                                  </pre>
                                  <button
                                    onClick={() => copyToClipboard(JSON.stringify(response.example, null, 2), `${key}-${status}`)}
                                    className={`absolute top-2 right-2 p-1 rounded transition-colors ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-700'}`}
                                  >
                                    {copiedText === `${key}-${status}` ? (
                                      <Check size={16} className="text-green-400" />
                                    ) : (
                                      <Copy size={16} className={isDarkMode ? 'text-slate-500' : 'text-gray-400'} />
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
          ) : activeTab === 'authentication' ? (
            <div className="space-y-6">
              {/* 管理员认证 */}
              <div>
                <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{t('adminAuthentication')}</h3>
                <p className={`mb-4 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  {t('authenticationDesc')}
                </p>
                
                {/* 认证流程 */}
                <div className={`border rounded-lg p-4 mb-6 ${isDarkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'}`}>
                  <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{t('authenticationFlow')}</h4>
                  <ol className={`text-sm space-y-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    <li className="flex items-start gap-2">
                      <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">1</span>
                      <span>{t('authStep1')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">2</span>
                      <span>{t('authStep2')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">3</span>
                      <span>{t('authStep3')}</span>
                    </li>
                  </ol>
                </div>

                {/* 获取Token */}
                <div>
                  <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{t('getAdminToken')}</h4>
                  <div className={`border rounded-lg p-4 ${isDarkMode ? 'border-slate-600 bg-slate-800' : 'border-gray-200 bg-white'}`}>
                    <p className={`text-sm mb-3 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                      {t('getTokenDesc')}
                    </p>
                    <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-gray-900 text-gray-100'}`}>
                      <pre className="text-green-400 text-sm overflow-x-auto">
{`POST /api/admin/login
Content-Type: application/json

{
  "username": "admin",
  "password": "your_password"
}`}
                      </pre>
                    </div>
                    <p className={`text-sm mt-3 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                      {t('responseExample')}
                    </p>
                    <div className={`p-3 rounded-lg mt-2 ${isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-gray-900 text-gray-100'}`}>
                      <pre className="text-blue-400 text-sm overflow-x-auto">
{`{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "isDefault": false,
  "username": "admin"
}`}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* 使用Token */}
                <div>
                  <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{t('useTokenCallApi')}</h4>
                  <div className={`border rounded-lg p-4 ${isDarkMode ? 'border-slate-600 bg-slate-800' : 'border-gray-200 bg-white'}`}>
                    <p className={`text-sm mb-3 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                      {t('useTokenDesc')}
                    </p>
                    <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-gray-900 text-gray-100'}`}>
                      <pre className="text-green-400 text-sm overflow-x-auto">
{`curl -X GET "${typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'}/api/settings" \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \\
  -H "Content-Type: application/json"`}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Token管理 */}
                <div>
                  <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{t('tokenManagement')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`border rounded-lg p-4 ${isDarkMode ? 'border-green-700 bg-green-900/20' : 'border-green-200 bg-green-50'}`}>
                      <h5 className={`font-medium mb-2 ${isDarkMode ? 'text-green-300' : 'text-green-900'}`}>{t('tokenValidity')}</h5>
                      <p className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
                        {t('tokenValidityDesc')}
                      </p>
                    </div>
                    <div className={`border rounded-lg p-4 ${isDarkMode ? 'border-blue-700 bg-blue-900/20' : 'border-blue-200 bg-blue-50'}`}>
                      <h5 className={`font-medium mb-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-900'}`}>{t('tokenStorage')}</h5>
                      <p className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                        {t('tokenStorageDesc')}
                      </p>
                    </div>
                    <div className={`border rounded-lg p-4 ${isDarkMode ? 'border-purple-700 bg-purple-900/20' : 'border-purple-200 bg-purple-50'}`}>
                      <h5 className={`font-medium mb-2 ${isDarkMode ? 'text-purple-300' : 'text-purple-900'}`}>{t('permissionVerification')}</h5>
                      <p className={`text-sm ${isDarkMode ? 'text-purple-400' : 'text-purple-700'}`}>
                        {t('permissionVerificationDesc')}
                      </p>
                    </div>
                    <div className={`border rounded-lg p-4 ${isDarkMode ? 'border-orange-700 bg-orange-900/20' : 'border-orange-200 bg-orange-50'}`}>
                      <h5 className={`font-medium mb-2 ${isDarkMode ? 'text-orange-300' : 'text-orange-900'}`}>{t('securityRecommendation')}</h5>
                      <p className={`text-sm ${isDarkMode ? 'text-orange-400' : 'text-orange-700'}`}>
                        {t('securityRecommendationDesc')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 错误处理 */}
                <div>
                  <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{t('errorHandling')}</h4>
                  <div className="space-y-3">
                    <div className={`border rounded-lg p-4 ${isDarkMode ? 'border-red-700 bg-red-900/20' : 'border-red-200 bg-red-50'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${isDarkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-800'}`}>401</span>
                        <span className={`font-medium ${isDarkMode ? 'text-red-300' : 'text-red-900'}`}>{t('unauthorizedAccess')}</span>
                      </div>
                      <p className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>
                        {t('unauthorizedDesc')}
                      </p>
                    </div>
                    <div className={`border rounded-lg p-4 ${isDarkMode ? 'border-orange-700 bg-orange-900/20' : 'border-orange-200 bg-orange-50'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${isDarkMode ? 'bg-orange-900/50 text-orange-300' : 'bg-orange-100 text-orange-800'}`}>403</span>
                        <span className={`font-medium ${isDarkMode ? 'text-orange-300' : 'text-orange-900'}`}>{t('insufficientPermissions')}</span>
                      </div>
                      <p className={`text-sm ${isDarkMode ? 'text-orange-400' : 'text-orange-700'}`}>
                        {t('insufficientPermissionsDesc')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* API示例 */}
                <div>
                  <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{t('completeApiExample')}</h4>
                  <div className={`border rounded-lg p-4 ${isDarkMode ? 'border-slate-600 bg-slate-800' : 'border-gray-200 bg-white'}`}>
                    <div className="space-y-4">
                      <div>
                        <p className={`text-sm mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>1. {t('loginGetToken')}</p>
                        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-gray-900 text-gray-100'}`}>
                          <pre className="text-green-400 text-sm overflow-x-auto">
{`curl -X POST "${typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'}/api/admin/login" \\
  -H "Content-Type: application/json" \\
  -d '{"username":"admin","password":"admin123"}'`}
                          </pre>
                        </div>
                      </div>
                      <div>
                        <p className={`text-sm mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>2. {t('useTokenCallAdminApi')}</p>
                        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-gray-900 text-gray-100'}`}>
                          <pre className="text-green-400 text-sm overflow-x-auto">
{`curl -X GET "${typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'}/api/settings" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \\
  -H "Content-Type: application/json"`}
                          </pre>
                        </div>
                      </div>
                      <div>
                        <p className={`text-sm mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>3. {t('modifySystemSettings')}</p>
                        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-gray-900 text-gray-100'}`}>
                          <pre className="text-green-400 text-sm overflow-x-auto">
{`curl -X PUT "${typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'}/api/settings" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{"waitTime":5,"captchaEnabled":true}'`}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'to-rules' ? (
            <div className="space-y-6">
              {/* TO 跳转规则 */}
              <div>
                <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{toRedirectRules.title}</h3>
                <p className={`mb-4 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{toRedirectRules.description}</p>

                <div className="space-y-4">
                  {toRedirectRules.rules.map((rule, index) => (
                    <div key={index} className={`border rounded-lg p-4 ${isDarkMode ? 'border-slate-600 bg-slate-800' : 'border-gray-200 bg-white'}`}>
                      <div className="flex items-start gap-3 mb-2">
                        <code className={`px-3 py-1 rounded-md text-sm font-mono ${isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
                          {rule.pattern}
                        </code>
                      </div>
                      <p className={`mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{rule.description}</p>
                      <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                        <p className={`text-sm mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>{t('example')}:</p>
                        <code className={`text-sm font-mono ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{rule.example}</code>
                      </div>
                      <p className={`text-sm mt-2 italic ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>{rule.note}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 参数说明 */}
              <div>
                <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{t('parameterDescription')}</h4>
                <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                  {toRedirectRules.parameters.map((param, index) => (
                    <div key={index} className="flex items-start gap-3 py-2">
                      <code className={`text-sm font-mono ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{param.name}</code>
                      <span className={`px-2 py-1 rounded text-xs ${param.required 
                        ? `${isDarkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-800'}` 
                        : `${isDarkMode ? 'bg-slate-600 text-slate-300' : 'bg-gray-100 text-gray-600'}`
                      }`}>
                        {param.required ? t('required') : t('optional')}
                      </span>
                      <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>{param.type}</span>
                      <span className={`text-sm flex-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{param.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Token配置说明 */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">{t('tokenConfigFormat')}</h4>
                <p className="text-sm text-gray-600 mb-3">{t('tokenConfigDesc')}</p>
                <div className="bg-gray-50 rounded-lg p-4">
                  {Object.entries(toRedirectRules.tokenSchema).map(([key, schema]) => (
                    <div key={key} className="flex items-start gap-3 py-2">
                      <code className="text-sm font-mono text-blue-600">{key}</code>
                      <span className={`px-2 py-1 rounded text-xs ${schema.required ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}>
                        {schema.required ? t('required') : t('optional')}
                      </span>
                      <span className="text-sm text-gray-600">{schema.type}</span>
                      <div className="flex-1">
                        <span className="text-sm text-gray-700">{schema.description}</span>
                        {'default' in schema && schema.default && (
                          <span className="text-xs text-gray-500 block">{t('defaultValue')}: {String(schema.default)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 优先级规则 */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">{t('priorityRules')}</h4>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <ul className="text-sm text-gray-700 space-y-1">
                    {toRedirectRules.priority.map((rule, index) => (
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
                <h4 className="font-semibold text-gray-900 mb-3">{t('usageExamples')}</h4>
                <div className="space-y-3">
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2"># {t('basicUrlRedirect')}</p>
                    <div className="overflow-x-auto">
                      <code className="text-green-400 text-sm whitespace-nowrap">https://yourdomain.com/to?url=https://github.com</code>
                    </div>
                  </div>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2"># {t('directRedirectMode')}</p>
                    <div className="overflow-x-auto">
                      <code className="text-green-400 text-sm whitespace-nowrap">https://yourdomain.com/to?url=https://github.com&type=href</code>
                    </div>
                  </div>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2"># {t('confirmRedirectMode')}</p>
                    <div className="overflow-x-auto">
                      <code className="text-green-400 text-sm whitespace-nowrap">https://yourdomain.com/to?url=https://github.com&type=confirm</code>
                    </div>
                  </div>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2"># {t('tokenAdvancedConfig')}</p>
                    <div className="overflow-x-auto">
                      <code className="text-green-400 text-xs break-all">
                        https://yourdomain.com/to?token=eyJ1cmwiOiJodHRwczovL2dpdGh1Yi5jb20iLCJ0eXBlIjoiY29uZmlybSIsInRpdGxlIjoi6Lez6L2s5YiwR2l0SHViIiwibXNnIjoi5qyi6L+O6KeE6KeI572R56uZ5Lit5b+DIn0=
                      </code>
                    </div>
                  </div>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2"># {t('tokenDecodeExample')}</p>
                    <pre className="text-green-400 text-xs overflow-x-auto">
                      {`{
  "url": "https://github.com",
  "type": "confirm",
  "title": "${t('jumpToGitHub')}",
  "msg": "${t('welcomeToWebCenter')}"
}`}
                    </pre>
                  </div>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2"># {t('captchaTokenConfig')}</p>
                    <div className="overflow-x-auto">
                      <code className="text-green-400 text-xs break-all">
                        https://yourdomain.com/to?token=eyJ1cmwiOiJodHRwczovL2V4YW1wbGUuY29tIiwidHlwZSI6ImF1dG8iLCJ0dXJuc3RpbGUiOnRydWV9
                      </code>
                    </div>
                  </div>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2"># {t('captchaTokenDecodeExample')}</p>
                    <pre className="text-green-400 text-xs overflow-x-auto">
                      {`{
  "url": "https://example.com",
  "type": "auto",
  "title": "${t('secureRedirect')}",
  "msg": "${t('securityVerificationInProgress')}",
  "turnstile": true
}`}
                    </pre>
                  </div>

                </div>
              </div>
            </div>
          ) : activeTab === 'password-autofill' ? (
            <div className="space-y-6">
              {/* 密码自动填充功能 */}
              <div>
                <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{t('passwordAutoFill')}</h3>
                <p className={`mb-4 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{t('passwordAutoFillDesc')}</p>
                
                {/* 功能概述 */}
                <div className={`border rounded-lg p-4 mb-6 ${isDarkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'}`}>
                  <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{t('featureOverview')}</h4>
                  <p className={`text-sm mb-3 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{t('passwordAutoFillOverview')}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <span className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{t('manualInputMode')}</span>
                        <p className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>{t('manualInputModeDesc')}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <span className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{t('autoFillMode')}</span>
                        <p className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>{t('autoFillModeDesc')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 使用方式 */}
                <div>
                  <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{t('usageMethod')}</h4>
                  <div className="space-y-4">
                    <div className={`border rounded-lg p-4 ${isDarkMode ? 'border-slate-600 bg-slate-800' : 'border-gray-200 bg-white'}`}>
                      <h5 className={`font-medium mb-2 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{t('plainTextPassword')}</h5>
                      <p className={`text-sm mb-3 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>{t('plainTextPasswordDesc')}</p>
                      <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-gray-900 text-gray-100'}`}>
                        <code className="text-green-400 text-sm">https://yourdomain.com/abc123?pwd=mypassword</code>
                      </div>
                    </div>
                    
                    <div className={`border rounded-lg p-4 ${isDarkMode ? 'border-slate-600 bg-slate-800' : 'border-gray-200 bg-white'}`}>
                      <h5 className={`font-medium mb-2 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{t('encryptedPassword')}</h5>
                      <p className={`text-sm mb-3 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>{t('encryptedPasswordDesc')}</p>
                      <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-gray-900 text-gray-100'}`}>
                        <code className="text-green-400 text-sm break-all">https://yourdomain.com/abc123?pwd=U2FsdGVkX1+encrypted_password_string</code>
                      </div>
                    </div>
                  </div>
                </div>

                {/* API 参数说明 */}
                <div>
                  <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{t('apiParameters')}</h4>
                  <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 py-2">
                        <code className={`text-sm font-mono ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>pwd</code>
                        <span className={`px-2 py-1 rounded text-xs ${isDarkMode ? 'bg-slate-600 text-slate-300' : 'bg-gray-100 text-gray-600'}`}>{t('optional')}</span>
                        <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>string</span>
                        <span className={`text-sm flex-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{t('pwdParamDesc')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 验证流程 */}
                <div>
                  <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{t('verificationProcess')}</h4>
                  <div className={`border rounded-lg p-4 ${isDarkMode ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'}`}>
                    <ol className={`text-sm space-y-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      <li className="flex items-start gap-2">
                        <span className="bg-yellow-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">1</span>
                        <span>{t('step1GetPwdParam')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-yellow-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">2</span>
                        <span>{t('step2AutoFillPassword')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-yellow-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">3</span>
                        <span>{t('step3SmartVerification')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-yellow-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">4</span>
                        <span>{t('step4AutoSubmit')}</span>
                      </li>
                    </ol>
                  </div>
                </div>

                {/* 安全特性 */}
                <div>
                  <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{t('securityFeatures')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`border rounded-lg p-4 ${isDarkMode ? 'border-green-700 bg-green-900/20' : 'border-green-200 bg-green-50'}`}>
                      <h5 className={`font-medium mb-2 ${isDarkMode ? 'text-green-300' : 'text-green-900'}`}>{t('manualInputProtection')}</h5>
                      <p className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>{t('manualInputProtectionDesc')}</p>
                    </div>
                    <div className={`border rounded-lg p-4 ${isDarkMode ? 'border-blue-700 bg-blue-900/20' : 'border-blue-200 bg-blue-50'}`}>
                      <h5 className={`font-medium mb-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-900'}`}>{t('smartRecognition')}</h5>
                      <p className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>{t('smartRecognitionDesc')}</p>
                    </div>
                    <div className={`border rounded-lg p-4 ${isDarkMode ? 'border-purple-700 bg-purple-900/20' : 'border-purple-200 bg-purple-50'}`}>
                      <h5 className={`font-medium mb-2 ${isDarkMode ? 'text-purple-300' : 'text-purple-900'}`}>{t('encryptedTransmission')}</h5>
                      <p className={`text-sm ${isDarkMode ? 'text-purple-400' : 'text-purple-700'}`}>{t('encryptedTransmissionDesc')}</p>
                    </div>
                    <div className={`border rounded-lg p-4 ${isDarkMode ? 'border-orange-700 bg-orange-900/20' : 'border-orange-200 bg-orange-50'}`}>
                      <h5 className={`font-medium mb-2 ${isDarkMode ? 'text-orange-300' : 'text-orange-900'}`}>{t('backwardCompatibility')}</h5>
                      <p className={`text-sm ${isDarkMode ? 'text-orange-400' : 'text-orange-700'}`}>{t('backwardCompatibilityDesc')}</p>
                    </div>
                  </div>
                </div>

                {/* 配置选项 */}
                <div>
                  <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{t('configurationOptions')}</h4>
                  <div className={`border rounded-lg p-4 ${isDarkMode ? 'border-slate-600 bg-slate-800' : 'border-gray-200 bg-white'}`}>
                    <p className={`text-sm mb-3 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>{t('configurationOptionsDesc')}</p>
                    <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-gray-900 text-gray-100'}`}>
                      <pre className="text-green-400 text-sm">
{`PUT /api/settings
Content-Type: application/json

{
  "autoFillPasswordEnabled": true  // ${t('enableDisableAutoFill')}
}`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* OpenAPI 规范 */}
              <div>
                <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{t('openApiVersion')}</h3>
                <p className={`mb-4 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  {t('openApiDesc')}
                </p>

                <div className={`rounded-lg p-4 mb-4 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                  <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{t('specInfo')}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>{t('version')}:</span>
                      <span className={`ml-2 font-mono ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>3.0.3</span>
                    </div>
                    <div>
                      <span className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>{t('apiVersion')}:</span>
                      <span className={`ml-2 font-mono ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>1.0.0</span>
                    </div>
                    <div>
                      <span className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>{t('format')}:</span>
                      <span className={`ml-2 font-mono ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>JSON</span>
                    </div>
                    <div>
                      <span className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>{t('encoding')}:</span>
                      <span className={`ml-2 font-mono ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>UTF-8</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className={`border rounded-lg p-4 ${isDarkMode ? 'border-slate-600 bg-slate-800' : 'border-gray-200 bg-white'}`}>
                    <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{t('supportedTools')}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>Swagger UI - {t('apiDocumentationUI')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>Postman - {t('apiTestingTool')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>Insomnia - {t('restClient')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>OpenAPI Generator - {t('codeGeneration')}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`border rounded-lg p-4 ${isDarkMode ? 'border-slate-600 bg-slate-800' : 'border-gray-200 bg-white'}`}>
                    <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{t('usageMethod')}</h4>
                    <div className="space-y-3">
                      <div>
                        <p className={`text-sm mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>1. {t('importInSwagger')}</p>
                        <code className={`block p-2 rounded text-xs ${isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-gray-900 text-gray-100'}`}>
                          {`https://editor.swagger.io/?url=${typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'}/api/openapi?lang=${language}`}
                        </code>
                      </div>
                      <div>
                        <p className={`text-sm mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>2. {t('importInPostman')}</p>
                        <code className={`block p-2 rounded text-xs ${isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-gray-900 text-gray-100'}`}>
                          {`File → Import → Link → ${typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'}/api/openapi?lang=${language}`}
                        </code>
                      </div>
                      <div>
                        <p className={`text-sm mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>3. {t('getCurlCommand')}</p>
                        <code className={`block p-2 rounded text-xs ${isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-gray-900 text-gray-100'}`}>
                          {`curl -X GET "${typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'}/api/openapi?lang=${language}"`}
                        </code>
                      </div>
                    </div>
                  </div>

                  <div className={`border rounded-lg p-4 ${isDarkMode ? 'border-slate-600 bg-slate-800' : 'border-gray-200 bg-white'}`}>
                    <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{t('specFeatures')}</h4>
                    <ul className={`text-sm space-y-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      <li>• {t('completeApiEndpoints')}</li>
                      <li>• {t('detailedRequestResponse')}</li>
                      <li>• {t('parameterValidation')}</li>
                      <li>• {t('errorResponseDef')}</li>
                      <li>• {t('securityScheme')}</li>
                      <li>• {t('exampleData')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </dialog>
  )
}