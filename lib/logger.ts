/**
 * 企业级日志系统
 * @description 提供结构化、安全的日志记录功能
 */

import { PrismaClient } from '@prisma/client'
import { NextRequest } from 'next/server'

const prisma = new PrismaClient()

/**
 * 日志级别枚举
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * 日志类型枚举
 */
export enum LogType {
  VISIT = 'visit',
  CREATE = 'create',
  ERROR = 'error',
  SECURITY = 'security',
  ADMIN = 'admin',
  SYSTEM = 'system'
}

/**
 * 日志分类枚举
 */
export enum LogCategory {
  AUTH = 'auth',
  ACCESS = 'access',
  OPERATION = 'operation',
  SECURITY = 'security',
  SYSTEM = 'system',
  GENERAL = 'general'
}

/**
 * 风险级别枚举
 */
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * 日志条目接口
 */
export interface LogEntry {
  type: LogType
  level?: LogLevel
  category?: LogCategory
  messageKey: string
  messageParams?: Record<string, any>
  details?: Record<string, any>
  stackTrace?: string
  action?: string
  resource?: string
  method?: string
  endpoint?: string
  statusCode?: number
  responseTime?: number
  riskLevel?: RiskLevel
  tags?: string[]
  userId?: string
  username?: string
  sessionId?: string
  requestId?: string
}

/**
 * 请求上下文接口
 */
export interface RequestContext {
  ip?: string
  userAgent?: string
  referer?: string
  method?: string
  endpoint?: string
  requestId?: string
  sessionId?: string
  userId?: string
  username?: string
}

/**
 * 企业级日志记录器
 */
export class Logger {
  /**
   * 从请求中提取上下文信息
   */
  static extractRequestContext(request: NextRequest): RequestContext {
    return {
      ip: request.headers.get('x-forwarded-for') || 
          request.headers.get('x-real-ip') || 
          'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      referer: request.headers.get('referer') || undefined,
      method: request.method,
      endpoint: request.nextUrl.pathname,
      requestId: request.headers.get('x-request-id') || undefined,
      sessionId: request.headers.get('x-session-id') || undefined,
    }
  }

  /**
   * 脱敏敏感信息
   */
  static sanitizeData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data
    }

    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'auth', 'credential',
      'ssn', 'credit_card', 'phone', 'email', 'address'
    ]

    const sanitized = { ...data }

    for (const [key, value] of Object.entries(sanitized)) {
      const lowerKey = key.toLowerCase()
      
      // 检查是否为敏感字段
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        if (typeof value === 'string' && value.length > 0) {
          // 保留前2位和后2位，中间用*替代
          if (value.length <= 4) {
            sanitized[key] = '****'
          } else {
            sanitized[key] = value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2)
          }
        } else {
          sanitized[key] = '[REDACTED]'
        }
      } else if (typeof value === 'object' && value !== null) {
        // 递归处理嵌套对象
        sanitized[key] = Logger.sanitizeData(value)
      }
    }

    return sanitized
  }

  /**
   * 记录日志
   */
  static async log(entry: LogEntry, context?: RequestContext): Promise<void> {
    try {
      // 脱敏处理
      const sanitizedDetails = entry.details ? Logger.sanitizeData(entry.details) : null
      const sanitizedParams = entry.messageParams ? Logger.sanitizeData(entry.messageParams) : null

      await prisma.log.create({
        data: {
          type: entry.type,
          level: entry.level || LogLevel.INFO,
          category: entry.category || LogCategory.GENERAL,
          messageKey: entry.messageKey,
          messageParams: sanitizedParams ? JSON.stringify(sanitizedParams) : null,
          details: sanitizedDetails ? JSON.stringify(sanitizedDetails) : null,
          stackTrace: entry.stackTrace,
          action: entry.action,
          resource: entry.resource,
          method: entry.method || context?.method,
          endpoint: entry.endpoint || context?.endpoint,
          statusCode: entry.statusCode,
          responseTime: entry.responseTime,
          riskLevel: entry.riskLevel || RiskLevel.LOW,
          tags: entry.tags ? JSON.stringify(entry.tags) : null,
          userId: entry.userId || context?.userId,
          username: entry.username || context?.username,
          sessionId: entry.sessionId || context?.sessionId,
          requestId: entry.requestId || context?.requestId,
          ip: context?.ip,
          userAgent: context?.userAgent,
          referer: context?.referer,
        }
      })
    } catch (error) {
      // 日志记录失败时输出到控制台，避免无限循环
      console.error('日志记录失败:', error)
    }
  }

  /**
   * 记录访问日志
   */
  static async logVisit(path: string, url: string, context?: RequestContext): Promise<void> {
    await Logger.log({
      type: LogType.VISIT,
      level: LogLevel.INFO,
      category: LogCategory.ACCESS,
      messageKey: 'logVisitShortLink',
      messageParams: { path, url },
      action: 'visit',
      resource: `shortlink:${path}`,
      riskLevel: RiskLevel.LOW,
      tags: ['access', 'shortlink']
    }, context)
  }

  /**
   * 记录创建日志
   */
  static async logCreate(path: string, url: string, context?: RequestContext): Promise<void> {
    await Logger.log({
      type: LogType.CREATE,
      level: LogLevel.INFO,
      category: LogCategory.OPERATION,
      messageKey: 'logCreateShortLink',
      messageParams: { path, url },
      action: 'create',
      resource: `shortlink:${path}`,
      riskLevel: RiskLevel.LOW,
      tags: ['create', 'shortlink']
    }, context)
  }

  /**
   * 记录错误日志
   */
  static async logError(error: Error, context?: RequestContext, details?: Record<string, any>): Promise<void> {
    await Logger.log({
      type: LogType.ERROR,
      level: LogLevel.ERROR,
      category: LogCategory.SYSTEM,
      messageKey: 'logSystemError',
      messageParams: { error: error.message },
      details,
      stackTrace: error.stack,
      riskLevel: RiskLevel.MEDIUM,
      tags: ['error', 'system']
    }, context)
  }

  /**
   * 记录安全日志
   */
  static async logSecurity(
    action: string, 
    resource: string, 
    riskLevel: RiskLevel = RiskLevel.HIGH,
    context?: RequestContext,
    details?: Record<string, any>
  ): Promise<void> {
    await Logger.log({
      type: LogType.SECURITY,
      level: LogLevel.WARN,
      category: LogCategory.SECURITY,
      messageKey: 'logSecurityEvent',
      messageParams: { action, resource },
      action,
      resource,
      details,
      riskLevel,
      tags: ['security', 'alert']
    }, context)
  }

  /**
   * 记录管理员操作日志
   */
  static async logAdmin(
    action: string,
    resource: string,
    context?: RequestContext,
    details?: Record<string, any>
  ): Promise<void> {
    await Logger.log({
      type: LogType.ADMIN,
      level: LogLevel.INFO,
      category: LogCategory.OPERATION,
      messageKey: 'logAdminOperation',
      messageParams: { action, resource },
      action,
      resource,
      details,
      riskLevel: RiskLevel.MEDIUM,
      tags: ['admin', 'operation']
    }, context)
  }

  /**
   * 记录系统日志
   */
  static async logSystem(
    message: string,
    level: LogLevel = LogLevel.INFO,
    details?: Record<string, any>
  ): Promise<void> {
    await Logger.log({
      type: LogType.SYSTEM,
      level,
      category: LogCategory.SYSTEM,
      messageKey: 'logSystemMessage',
      messageParams: { message },
      details,
      riskLevel: RiskLevel.LOW,
      tags: ['system']
    })
  }
}

export default Logger