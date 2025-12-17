import { prisma } from '@/lib/db'
import { NextRequest } from 'next/server'

/**
 * 日志类型枚举
 */
export type LogType = 'visit' | 'create' | 'error' | 'prepare'

/**
 * 日志记录选项接口
 */
interface LogOptions {
  type: LogType
  message: string
  details?: any
  request?: NextRequest
  ip?: string
  userAgent?: string
}

/**
 * 记录系统日志
 * @description 统一的日志记录函数，自动提取请求信息
 * @param options 日志记录选项
 */
export async function logActivity(options: LogOptions): Promise<void> {
  try {
    let ip = options.ip
    let userAgent = options.userAgent

    // 如果提供了request对象，自动提取IP和UserAgent
    if (options.request) {
      ip = options.request.headers.get('x-forwarded-for') || 
           options.request.headers.get('x-real-ip') || 
           'unknown'
      userAgent = options.request.headers.get('user-agent') || 'unknown'
    }

    await prisma.log.create({
      data: {
        type: options.type,
        message: options.message,
        details: options.details ? JSON.stringify(options.details) : null,
        ip: ip || 'unknown',
        userAgent: userAgent || 'unknown'
      }
    })
  } catch (error) {
    // 日志记录失败不应该影响主要功能
    console.error('记录日志失败:', error)
  }
}

/**
 * 记录访问日志
 * @description 记录短链访问活动
 */
export async function logVisit(
  path: string, 
  originalUrl: string, 
  request: NextRequest, 
  details?: any
): Promise<void> {
  await logActivity({
    type: 'visit',
    message: `访问短链: ${path} -> ${originalUrl}`,
    details: {
      path,
      originalUrl,
      ...details
    },
    request
  })
}

/**
 * 记录创建日志
 * @description 记录短链创建活动
 */
export async function logCreate(
  path: string, 
  originalUrl: string, 
  request: NextRequest, 
  details?: any
): Promise<void> {
  await logActivity({
    type: 'create',
    message: `创建短链: ${path} -> ${originalUrl}`,
    details: {
      path,
      originalUrl,
      ...details
    },
    request
  })
}

/**
 * 记录错误日志
 * @description 记录系统错误
 */
export async function logError(
  message: string, 
  error: any, 
  request?: NextRequest, 
  details?: any
): Promise<void> {
  await logActivity({
    type: 'error',
    message,
    details: {
      error: error?.message || String(error),
      stack: error?.stack,
      ...details
    },
    request
  })
}