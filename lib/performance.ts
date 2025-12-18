import { NextRequest, NextResponse } from 'next/server'

// 性能指标接口
interface PerformanceMetrics {
  requestId: string
  method: string
  url: string
  startTime: number
  endTime?: number
  duration?: number
  memoryUsage?: NodeJS.MemoryUsage
  statusCode?: number
  responseSize?: number
  userAgent?: string
  ip?: string
}

// 性能监控类
class PerformanceMonitor {
  private metrics = new Map<string, PerformanceMetrics>()
  private readonly maxMetrics = 1000 // 最大保存的指标数量
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    this.startCleanup()
  }

  // 开始监控请求
  startRequest(request: NextRequest): string {
    const requestId = this.generateRequestId()
    const url = new URL(request.url)
    
    const metrics: PerformanceMetrics = {
      requestId,
      method: request.method,
      url: url.pathname + url.search,
      startTime: Date.now(),
      memoryUsage: process.memoryUsage(),
      userAgent: request.headers.get('user-agent') || undefined,
      ip: request.headers.get('x-forwarded-for') || 
          request.headers.get('x-real-ip') || 
          undefined
    }

    this.metrics.set(requestId, metrics)
    
    // 如果指标过多，清理旧的
    if (this.metrics.size > this.maxMetrics) {
      this.cleanupOldMetrics()
    }

    return requestId
  }

  // 结束监控请求
  endRequest(requestId: string, response?: NextResponse): PerformanceMetrics | null {
    const metrics = this.metrics.get(requestId)
    if (!metrics) return null

    const endTime = Date.now()
    const updatedMetrics: PerformanceMetrics = {
      ...metrics,
      endTime,
      duration: endTime - metrics.startTime,
      statusCode: response?.status,
      responseSize: this.getResponseSize(response)
    }

    this.metrics.set(requestId, updatedMetrics)

    // 记录慢请求
    if (updatedMetrics.duration && updatedMetrics.duration > 1000) {
      console.warn(`慢请求检测: ${updatedMetrics.method} ${updatedMetrics.url} - ${updatedMetrics.duration}ms`)
    }

    return updatedMetrics
  }

  // 获取响应大小
  private getResponseSize(response?: NextResponse): number | undefined {
    if (!response) return undefined
    
    const contentLength = response.headers.get('content-length')
    return contentLength ? parseInt(contentLength) : undefined
  }

  // 生成请求ID
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 清理旧指标
  private cleanupOldMetrics(): void {
    const entries = Array.from(this.metrics.entries())
    entries.sort((a, b) => a[1].startTime - b[1].startTime)
    
    // 删除最旧的一半指标
    const toDelete = entries.slice(0, Math.floor(entries.length / 2))
    toDelete.forEach(([requestId]) => this.metrics.delete(requestId))
  }

  // 获取性能统计
  getStats(): {
    totalRequests: number
    averageResponseTime: number
    slowRequests: number
    errorRate: number
    memoryUsage: NodeJS.MemoryUsage
    topSlowEndpoints: Array<{ url: string; avgDuration: number; count: number }>
  } {
    const metrics = Array.from(this.metrics.values())
    const completedMetrics = metrics.filter(m => m.duration !== undefined)
    
    if (completedMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        slowRequests: 0,
        errorRate: 0,
        memoryUsage: process.memoryUsage(),
        topSlowEndpoints: []
      }
    }

    const totalDuration = completedMetrics.reduce((sum, m) => sum + (m.duration || 0), 0)
    const averageResponseTime = totalDuration / completedMetrics.length
    const slowRequests = completedMetrics.filter(m => (m.duration || 0) > 1000).length
    const errorRequests = completedMetrics.filter(m => 
      m.statusCode && m.statusCode >= 400
    ).length
    const errorRate = errorRequests / completedMetrics.length

    // 计算最慢的端点
    const endpointStats = new Map<string, { totalDuration: number; count: number }>()
    completedMetrics.forEach(m => {
      const key = `${m.method} ${m.url.split('?')[0]}` // 忽略查询参数
      const existing = endpointStats.get(key) || { totalDuration: 0, count: 0 }
      existing.totalDuration += m.duration || 0
      existing.count += 1
      endpointStats.set(key, existing)
    })

    const topSlowEndpoints = Array.from(endpointStats.entries())
      .map(([url, stats]) => ({
        url,
        avgDuration: stats.totalDuration / stats.count,
        count: stats.count
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 10)

    return {
      totalRequests: completedMetrics.length,
      averageResponseTime,
      slowRequests,
      errorRate,
      memoryUsage: process.memoryUsage(),
      topSlowEndpoints
    }
  }

  // 获取实时指标
  getRealTimeMetrics(): {
    activeRequests: number
    recentRequests: PerformanceMetrics[]
    systemLoad: NodeJS.MemoryUsage
  } {
    const now = Date.now()
    const activeRequests = Array.from(this.metrics.values())
      .filter(m => !m.endTime).length
    
    const recentRequests = Array.from(this.metrics.values())
      .filter(m => m.endTime && (now - m.endTime) < 60000) // 最近1分钟
      .sort((a, b) => (b.endTime || 0) - (a.endTime || 0))
      .slice(0, 20)

    return {
      activeRequests,
      recentRequests,
      systemLoad: process.memoryUsage()
    }
  }

  // 启动定期清理
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      const cutoff = now - 3600000 // 1小时前
      
      for (const [requestId, metrics] of this.metrics.entries()) {
        if (metrics.endTime && metrics.endTime < cutoff) {
          this.metrics.delete(requestId)
        }
      }
    }, 300000) // 每5分钟清理一次
  }

  // 停止监控
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.metrics.clear()
  }
}

// 创建全局性能监控实例
export const performanceMonitor = new PerformanceMonitor()

// 性能监控装饰器
export function withPerformanceMonitoring() {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function(request: NextRequest, ...args: any[]) {
      const requestId = performanceMonitor.startRequest(request)
      
      try {
        const response = await originalMethod.call(this, request, ...args)
        performanceMonitor.endRequest(requestId, response)
        
        // 添加性能头部
        if (response instanceof NextResponse) {
          const metrics = performanceMonitor.endRequest(requestId, response)
          if (metrics?.duration) {
            response.headers.set('X-Response-Time', `${metrics.duration}ms`)
            response.headers.set('X-Request-ID', requestId)
          }
        }
        
        return response
      } catch (error) {
        performanceMonitor.endRequest(requestId)
        throw error
      }
    }
  }
}

// 中间件函数
export function createPerformanceMiddleware() {
  return async function(request: NextRequest) {
    const requestId = performanceMonitor.startRequest(request)
    
    // 将请求ID添加到请求头中，供后续使用
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-request-id', requestId)
    
    return new NextRequest(request, {
      headers: requestHeaders
    })
  }
}

// 进程退出时清理
process.on('beforeExit', () => {
  performanceMonitor.destroy()
})