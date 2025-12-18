// 增强的请求缓存机制，支持多级缓存和智能过期
interface CacheEntry<T> {
  data: T
  timestamp: number
  accessCount: number
  lastAccess: number
}

interface CacheOptions {
  ttl?: number // 缓存时间（毫秒）
  maxSize?: number // 最大缓存条目数
  staleWhileRevalidate?: boolean // 是否支持过期后后台更新
}

class RequestCache {
  private cache = new Map<string, Promise<any>>()
  private results = new Map<string, CacheEntry<any>>()
  private readonly defaultTTL = 30000 // 30秒默认缓存时间
  private readonly maxSize = 100 // 最大缓存条目数
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    this.startCleanup()
  }

  async get<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    options: CacheOptions = {}
  ): Promise<T> {
    const ttl = options.ttl ?? this.defaultTTL
    const staleWhileRevalidate = options.staleWhileRevalidate ?? true
    
    // 检查缓存的结果
    const cached = this.results.get(key)
    const now = Date.now()
    
    if (cached) {
      cached.accessCount++
      cached.lastAccess = now
      
      // 如果缓存未过期，直接返回
      if (now - cached.timestamp < ttl) {
        return cached.data
      }
      
      // 如果支持 stale-while-revalidate，返回过期数据并后台更新
      if (staleWhileRevalidate) {
        this.backgroundRefresh(key, fetcher, ttl)
        return cached.data
      }
    }

    // 检查正在进行的请求
    if (this.cache.has(key)) {
      return this.cache.get(key)!
    }

    // 创建新的请求
    const promise = fetcher().then(data => {
      // 缓存结果
      this.results.set(key, {
        data,
        timestamp: now,
        accessCount: 1,
        lastAccess: now
      })
      
      // 检查缓存大小限制
      this.enforceMaxSize()
      
      // 清除请求缓存
      this.cache.delete(key)
      return data
    }).catch(error => {
      // 请求失败时清除缓存
      this.cache.delete(key)
      throw error
    })

    this.cache.set(key, promise)
    return promise
  }

  // 后台刷新缓存
  private async backgroundRefresh<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttl: number
  ): Promise<void> {
    try {
      const data = await fetcher()
      this.results.set(key, {
        data,
        timestamp: Date.now(),
        accessCount: this.results.get(key)?.accessCount ?? 1,
        lastAccess: Date.now()
      })
    } catch (error) {
      console.warn(`后台刷新缓存失败 [${key}]:`, error)
    }
  }

  // 强制缓存大小限制
  private enforceMaxSize(): void {
    if (this.results.size <= this.maxSize) return
    
    // 按访问频率和最近访问时间排序，删除最不常用的条目
    const entries = Array.from(this.results.entries())
    entries.sort((a, b) => {
      const scoreA = a[1].accessCount * 0.7 + (Date.now() - a[1].lastAccess) * -0.3
      const scoreB = b[1].accessCount * 0.7 + (Date.now() - b[1].lastAccess) * -0.3
      return scoreA - scoreB
    })
    
    // 删除最不常用的条目
    const toDelete = entries.slice(0, entries.length - this.maxSize)
    toDelete.forEach(([key]) => this.results.delete(key))
  }

  // 预加载缓存
  async preload<T>(key: string, fetcher: () => Promise<T>): Promise<void> {
    if (!this.results.has(key) && !this.cache.has(key)) {
      try {
        await this.get(key, fetcher)
      } catch (error) {
        console.warn(`预加载缓存失败 [${key}]:`, error)
      }
    }
  }

  // 使缓存失效
  invalidate(key: string): void {
    this.cache.delete(key)
    this.results.delete(key)
  }

  // 使匹配模式的缓存失效
  invalidatePattern(pattern: RegExp): void {
    for (const key of this.results.keys()) {
      if (pattern.test(key)) {
        this.invalidate(key)
      }
    }
  }

  clear(): void {
    this.cache.clear()
    this.results.clear()
  }

  // 清理过期缓存
  clearExpired(ttl: number = this.defaultTTL): void {
    const now = Date.now()
    for (const [key, result] of this.results.entries()) {
      if (now - result.timestamp >= ttl) {
        this.results.delete(key)
      }
    }
  }

  // 获取缓存统计信息
  getStats(): {
    size: number
    hitRate: number
    entries: Array<{ key: string; age: number; accessCount: number }>
  } {
    const now = Date.now()
    const entries = Array.from(this.results.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      accessCount: entry.accessCount
    }))
    
    const totalAccess = entries.reduce((sum, entry) => sum + entry.accessCount, 0)
    const hitRate = totalAccess > 0 ? (totalAccess - this.cache.size) / totalAccess : 0
    
    return {
      size: this.results.size,
      hitRate,
      entries
    }
  }

  // 启动定期清理
  private startCleanup(): void {
    if (typeof window !== 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.clearExpired()
      }, 60000) // 每分钟清理一次
    }
  }

  // 停止清理
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.clear()
  }
}

export const requestCache = new RequestCache()

// 页面卸载时清理缓存
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    requestCache.destroy()
  })
}