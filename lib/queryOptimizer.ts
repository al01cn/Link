import { PrismaClient } from '@prisma/client'
import { dbPool } from './dbPool'

// 查询优化配置
interface QueryConfig {
  useIndex?: boolean // 是否使用索引提示
  limit?: number // 结果限制
  cache?: boolean // 是否缓存结果
  timeout?: number // 查询超时时间（毫秒）
}

// 查询统计信息
interface QueryStats {
  query: string
  executionTime: number
  resultCount: number
  timestamp: number
  fromCache: boolean
}

class QueryOptimizer {
  private queryCache = new Map<string, { data: any; timestamp: number }>()
  private queryStats: QueryStats[] = []
  private readonly cacheTTL = 300000 // 5分钟缓存
  private readonly maxCacheSize = 100
  private readonly maxStatsSize = 1000

  // 优化的短链查询
  async findShortLinkByPath(
    path: string, 
    config: QueryConfig = {}
  ): Promise<any> {
    const cacheKey = `shortlink:${path}`
    const startTime = Date.now()

    // 检查缓存
    if (config.cache !== false) {
      const cached = this.getFromCache(cacheKey)
      if (cached) {
        this.recordStats({
          query: `findShortLinkByPath(${path})`,
          executionTime: Date.now() - startTime,
          resultCount: cached ? 1 : 0,
          timestamp: Date.now(),
          fromCache: true
        })
        return cached
      }
    }

    try {
      const result = await dbPool.executeWithRetry(async (prisma) => {
        // 使用索引优化的查询
        return await prisma.shortLink.findUnique({
          where: { path },
          include: {
            visitLogs: {
              take: 10, // 只获取最近10条访问记录
              orderBy: { createdAt: 'desc' }
            }
          }
        })
      })

      // 缓存结果
      if (config.cache !== false && result) {
        this.setCache(cacheKey, result)
      }

      this.recordStats({
        query: `findShortLinkByPath(${path})`,
        executionTime: Date.now() - startTime,
        resultCount: result ? 1 : 0,
        timestamp: Date.now(),
        fromCache: false
      })

      return result
    } catch (error) {
      console.error('查询短链失败:', error)
      throw error
    }
  }

  // 优化的短链列表查询
  async findShortLinks(
    options: {
      limit?: number
      offset?: number
      orderBy?: 'newest' | 'oldest' | 'views'
      includeExpired?: boolean
    } = {},
    config: QueryConfig = {}
  ): Promise<any[]> {
    const { limit = 50, offset = 0, orderBy = 'newest', includeExpired = true } = options
    const cacheKey = `shortlinks:${JSON.stringify(options)}`
    const startTime = Date.now()

    // 检查缓存
    if (config.cache !== false) {
      const cached = this.getFromCache(cacheKey)
      if (cached) {
        this.recordStats({
          query: `findShortLinks(${JSON.stringify(options)})`,
          executionTime: Date.now() - startTime,
          resultCount: cached.length,
          timestamp: Date.now(),
          fromCache: true
        })
        return cached
      }
    }

    try {
      const result = await dbPool.executeWithRetry(async (prisma) => {
        const where: any = {}
        
        // 如果不包含过期链接，添加过期时间过滤
        if (!includeExpired) {
          where.OR = [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }

        // 构建排序条件
        let orderByClause: any
        switch (orderBy) {
          case 'oldest':
            orderByClause = { createdAt: 'asc' }
            break
          case 'views':
            orderByClause = { views: 'desc' }
            break
          default:
            orderByClause = { createdAt: 'desc' }
        }

        return await prisma.shortLink.findMany({
          where,
          orderBy: orderByClause,
          take: Math.min(limit, 100), // 限制最大查询数量
          skip: offset,
          select: {
            id: true,
            path: true,
            originalUrl: true,
            title: true,
            views: true,
            createdAt: true,
            expiresAt: true,
            requireConfirm: true,
            enableIntermediate: true,
            // 不包含密码字段以提高安全性，通过计算字段判断是否有密码
            _count: {
              select: {
                visitLogs: true
              }
            }
          }
        })
      })

      // 缓存结果（较短的缓存时间，因为数据可能频繁变化）
      if (config.cache !== false) {
        this.setCache(cacheKey, result, 60000) // 1分钟缓存
      }

      this.recordStats({
        query: `findShortLinks(${JSON.stringify(options)})`,
        executionTime: Date.now() - startTime,
        resultCount: result.length,
        timestamp: Date.now(),
        fromCache: false
      })

      return result
    } catch (error) {
      console.error('查询短链列表失败:', error)
      throw error
    }
  }

  // 优化的访问记录插入
  async recordVisit(
    shortLinkId: string,
    visitData: {
      ip?: string
      userAgent?: string
      referer?: string
    }
  ): Promise<void> {
    const startTime = Date.now()

    try {
      await dbPool.executeWithRetry(async (prisma) => {
        // 使用事务确保数据一致性
        await prisma.$transaction([
          // 插入访问记录
          prisma.visitLog.create({
            data: {
              shortId: shortLinkId,
              ip: visitData.ip,
              userAgent: visitData.userAgent,
              referer: visitData.referer
            }
          }),
          // 更新访问计数
          prisma.shortLink.update({
            where: { id: shortLinkId },
            data: { views: { increment: 1 } }
          })
        ])
      })

      // 清除相关缓存
      this.invalidateCache(`shortlink:*`)
      this.invalidateCache(`shortlinks:*`)

      this.recordStats({
        query: `recordVisit(${shortLinkId})`,
        executionTime: Date.now() - startTime,
        resultCount: 1,
        timestamp: Date.now(),
        fromCache: false
      })
    } catch (error) {
      console.error('记录访问失败:', error)
      throw error
    }
  }

  // 批量清理过期链接
  async cleanupExpiredLinks(): Promise<number> {
    const startTime = Date.now()

    try {
      const result = await dbPool.executeWithRetry(async (prisma) => {
        return await prisma.shortLink.deleteMany({
          where: {
            expiresAt: {
              lt: new Date()
            }
          }
        })
      })

      // 清除所有缓存
      this.clearCache()

      this.recordStats({
        query: 'cleanupExpiredLinks()',
        executionTime: Date.now() - startTime,
        resultCount: result.count,
        timestamp: Date.now(),
        fromCache: false
      })

      return result.count
    } catch (error) {
      console.error('清理过期链接失败:', error)
      throw error
    }
  }

  // 获取数据库统计信息
  async getDatabaseStats(): Promise<{
    totalLinks: number
    activeLinks: number
    expiredLinks: number
    totalVisits: number
    avgResponseTime: number
  }> {
    const cacheKey = 'db:stats'
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      const result = await dbPool.executeWithRetry(async (prisma) => {
        const [totalLinks, activeLinks, expiredLinks, totalVisits] = await Promise.all([
          prisma.shortLink.count(),
          prisma.shortLink.count({
            where: {
              OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } }
              ]
            }
          }),
          prisma.shortLink.count({
            where: {
              expiresAt: { lt: new Date() }
            }
          }),
          prisma.visitLog.count()
        ])

        return { totalLinks, activeLinks, expiredLinks, totalVisits }
      })

      // 计算平均响应时间
      const recentStats = this.queryStats.slice(-100) // 最近100次查询
      const avgResponseTime = recentStats.length > 0
        ? recentStats.reduce((sum, stat) => sum + stat.executionTime, 0) / recentStats.length
        : 0

      const stats = { ...result, avgResponseTime }
      
      // 缓存统计信息
      this.setCache(cacheKey, stats, 30000) // 30秒缓存
      
      return stats
    } catch (error) {
      console.error('获取数据库统计失败:', error)
      throw error
    }
  }

  // 缓存管理方法
  private getFromCache(key: string): any | null {
    const cached = this.queryCache.get(key)
    if (!cached) return null

    if (Date.now() - cached.timestamp > this.cacheTTL) {
      this.queryCache.delete(key)
      return null
    }

    return cached.data
  }

  private setCache(key: string, data: any, ttl: number = this.cacheTTL): void {
    // 检查缓存大小限制
    if (this.queryCache.size >= this.maxCacheSize) {
      // 删除最旧的缓存项
      const oldestKey = Array.from(this.queryCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0]
      this.queryCache.delete(oldestKey)
    }

    this.queryCache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  private invalidateCache(pattern: string): void {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'))
      for (const key of this.queryCache.keys()) {
        if (regex.test(key)) {
          this.queryCache.delete(key)
        }
      }
    } else {
      this.queryCache.delete(pattern)
    }
  }

  private clearCache(): void {
    this.queryCache.clear()
  }

  // 统计记录方法
  private recordStats(stats: QueryStats): void {
    this.queryStats.push(stats)
    
    // 限制统计数据大小
    if (this.queryStats.length > this.maxStatsSize) {
      this.queryStats = this.queryStats.slice(-this.maxStatsSize / 2)
    }
  }

  // 获取查询统计
  getQueryStats(): {
    totalQueries: number
    avgExecutionTime: number
    cacheHitRate: number
    slowQueries: QueryStats[]
  } {
    if (this.queryStats.length === 0) {
      return {
        totalQueries: 0,
        avgExecutionTime: 0,
        cacheHitRate: 0,
        slowQueries: []
      }
    }

    const totalQueries = this.queryStats.length
    const avgExecutionTime = this.queryStats.reduce((sum, stat) => sum + stat.executionTime, 0) / totalQueries
    const cacheHits = this.queryStats.filter(stat => stat.fromCache).length
    const cacheHitRate = cacheHits / totalQueries
    const slowQueries = this.queryStats
      .filter(stat => stat.executionTime > 1000)
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 10)

    return {
      totalQueries,
      avgExecutionTime,
      cacheHitRate,
      slowQueries
    }
  }
}

// 导出单例实例
export const queryOptimizer = new QueryOptimizer()