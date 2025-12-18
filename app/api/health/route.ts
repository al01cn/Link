import { NextRequest, NextResponse } from 'next/server'
import { dbPool } from '@/lib/dbPool'
import { requestCache } from '@/lib/requestCache'
import { performanceMonitor } from '@/lib/performance'

/**
 * 系统健康检查API端点
 * 用于监控系统各组件的健康状态
 */

interface HealthStatus {
  status: 'healthy' | 'warning' | 'error'
  timestamp: string
  uptime: number
  version: string
  checks: {
    database: {
      status: 'healthy' | 'warning' | 'error'
      responseTime: number
      message: string
    }
    memory: {
      status: 'healthy' | 'warning' | 'error'
      usage: {
        used: number
        total: number
        percentage: number
      }
      message: string
    }
    cache: {
      status: 'healthy' | 'warning' | 'error'
      stats: any
      message: string
    }
    api: {
      status: 'healthy' | 'warning' | 'error'
      metrics: any
      message: string
    }
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<HealthStatus>> {
  const startTime = Date.now()
  
  try {
    // 数据库健康检查
    const dbCheck = await checkDatabase()
    
    // 内存使用检查
    const memoryCheck = checkMemory()
    
    // 缓存健康检查
    const cacheCheck = checkCache()
    
    // API性能检查
    const apiCheck = checkApi()
    
    // 确定总体状态
    const overallStatus = determineOverallStatus([
      dbCheck.status,
      memoryCheck.status,
      cacheCheck.status,
      apiCheck.status
    ])
    
    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: dbCheck,
        memory: memoryCheck,
        cache: cacheCheck,
        api: apiCheck
      }
    }
    
    // 根据健康状态设置HTTP状态码
    const httpStatus = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'warning' ? 200 : 503
    
    const response = NextResponse.json(healthStatus, { status: httpStatus })
    
    // 添加响应头
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('X-Health-Check-Time', `${Date.now() - startTime}ms`)
    
    return response
    
  } catch (error) {
    console.error('健康检查失败:', error)
    
    const errorStatus: HealthStatus = {
      status: 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: { status: 'error', responseTime: 0, message: '检查失败' },
        memory: { status: 'error', usage: { used: 0, total: 0, percentage: 0 }, message: '检查失败' },
        cache: { status: 'error', stats: null, message: '检查失败' },
        api: { status: 'error', metrics: null, message: '检查失败' }
      }
    }
    
    return NextResponse.json(errorStatus, { status: 503 })
  }
}

// 数据库健康检查
async function checkDatabase(): Promise<HealthStatus['checks']['database']> {
  const startTime = Date.now()
  
  try {
    const isHealthy = await dbPool.healthCheck()
    const responseTime = Date.now() - startTime
    
    if (!isHealthy) {
      return {
        status: 'error',
        responseTime,
        message: '数据库连接失败'
      }
    }
    
    let status: 'healthy' | 'warning' | 'error' = 'healthy'
    let message = '数据库运行正常'
    
    if (responseTime > 1000) {
      status = 'error'
      message = `数据库响应超时 (${responseTime}ms)`
    } else if (responseTime > 500) {
      status = 'warning'
      message = `数据库响应较慢 (${responseTime}ms)`
    }
    
    return {
      status,
      responseTime,
      message
    }
  } catch (error) {
    return {
      status: 'error',
      responseTime: Date.now() - startTime,
      message: `数据库检查异常: ${error}`
    }
  }
}

// 内存使用检查
function checkMemory(): HealthStatus['checks']['memory'] {
  const memoryUsage = process.memoryUsage()
  const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024
  const heapTotalMB = memoryUsage.heapTotal / 1024 / 1024
  const usagePercentage = (heapUsedMB / heapTotalMB) * 100
  
  let status: 'healthy' | 'warning' | 'error' = 'healthy'
  let message = '内存使用正常'
  
  if (usagePercentage > 90) {
    status = 'error'
    message = `内存使用过高 (${usagePercentage.toFixed(1)}%)`
  } else if (usagePercentage > 75) {
    status = 'warning'
    message = `内存使用较高 (${usagePercentage.toFixed(1)}%)`
  }
  
  return {
    status,
    usage: {
      used: Math.round(heapUsedMB),
      total: Math.round(heapTotalMB),
      percentage: Math.round(usagePercentage)
    },
    message
  }
}

// 缓存健康检查
function checkCache(): HealthStatus['checks']['cache'] {
  try {
    const cacheStats = requestCache.getStats()
    
    let status: 'healthy' | 'warning' | 'error' = 'healthy'
    let message = '缓存系统正常'
    
    if (cacheStats.hitRate < 0.3) {
      status = 'error'
      message = `缓存命中率过低 (${(cacheStats.hitRate * 100).toFixed(1)}%)`
    } else if (cacheStats.hitRate < 0.6) {
      status = 'warning'
      message = `缓存命中率较低 (${(cacheStats.hitRate * 100).toFixed(1)}%)`
    }
    
    return {
      status,
      stats: {
        size: cacheStats.size,
        hitRate: Math.round(cacheStats.hitRate * 100) / 100
      },
      message
    }
  } catch (error) {
    return {
      status: 'error',
      stats: null,
      message: `缓存检查失败: ${error}`
    }
  }
}

// API性能检查
function checkApi(): HealthStatus['checks']['api'] {
  try {
    const apiStats = performanceMonitor.getStats()
    const realTimeMetrics = performanceMonitor.getRealTimeMetrics()
    
    let status: 'healthy' | 'warning' | 'error' = 'healthy'
    let message = 'API性能正常'
    
    if (apiStats.averageResponseTime > 2000) {
      status = 'error'
      message = `API响应时间过长 (${apiStats.averageResponseTime.toFixed(0)}ms)`
    } else if (apiStats.averageResponseTime > 1000) {
      status = 'warning'
      message = `API响应时间较长 (${apiStats.averageResponseTime.toFixed(0)}ms)`
    }
    
    if (apiStats.errorRate > 0.1) {
      status = 'error'
      message = `API错误率过高 (${(apiStats.errorRate * 100).toFixed(1)}%)`
    } else if (apiStats.errorRate > 0.05) {
      status = 'warning'
      message = `API错误率较高 (${(apiStats.errorRate * 100).toFixed(1)}%)`
    }
    
    return {
      status,
      metrics: {
        totalRequests: apiStats.totalRequests,
        averageResponseTime: Math.round(apiStats.averageResponseTime),
        errorRate: Math.round(apiStats.errorRate * 10000) / 100,
        activeRequests: realTimeMetrics.activeRequests
      },
      message
    }
  } catch (error) {
    return {
      status: 'error',
      metrics: null,
      message: `API检查失败: ${error}`
    }
  }
}

// 确定总体健康状态
function determineOverallStatus(statuses: Array<'healthy' | 'warning' | 'error'>): 'healthy' | 'warning' | 'error' {
  if (statuses.includes('error')) return 'error'
  if (statuses.includes('warning')) return 'warning'
  return 'healthy'
}