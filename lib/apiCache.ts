import { NextResponse } from 'next/server'

// API 响应缓存配置
interface CacheConfig {
  ttl: number // 缓存时间（秒）
  staleWhileRevalidate?: number // 过期后仍可使用的时间（秒）
  tags?: string[] // 缓存标签，用于批量失效
  vary?: string[] // 根据请求头变化的缓存
}

interface CachedResponse {
  data: any
  headers: Record<string, string>
  status: number
  timestamp: number
  etag: string
  tags: string[]
}

class ApiCache {
  private cache = new Map<string, CachedResponse>()
  private tagIndex = new Map<string, Set<string>>() // 标签到缓存键的映射
  private readonly maxSize = 1000 // 最大缓存条目数

  // 生成缓存键
  private generateKey(
    url: string, 
    method: string, 
    headers?: Record<string, string>,
    vary?: string[]
  ): string {
    let key = `${method}:${url}`
    
    if (vary && headers) {
      const varyParts = vary.map(header => 
        `${header}:${headers[header] || ''}`
      ).join('|')
      key += `|${varyParts}`
    }
    
    return key
  }

  // 生成 ETag
  private generateETag(data: any): string {
    const content = JSON.stringify(data)
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    return `"${Math.abs(hash).toString(36)}"`
  }

  // 设置缓存
  set(
    url: string,
    method: string,
    response: NextResponse,
    config: CacheConfig,
    requestHeaders?: Record<string, string>
  ): void {
    const key = this.generateKey(url, method, requestHeaders, config.vary)
    
    // 检查缓存大小限制
    if (this.cache.size >= this.maxSize) {
      this.evictOldest()
    }

    const data = response.body
    const etag = this.generateETag(data)
    
    const cachedResponse: CachedResponse = {
      data,
      headers: Object.fromEntries(response.headers.entries()),
      status: response.status,
      timestamp: Date.now(),
      etag,
      tags: config.tags || []
    }

    this.cache.set(key, cachedResponse)

    // 更新标签索引
    if (config.tags) {
      config.tags.forEach(tag => {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set())
        }
        this.tagIndex.get(tag)!.add(key)
      })
    }
  }

  // 获取缓存
  get(
    url: string,
    method: string,
    config: CacheConfig,
    requestHeaders?: Record<string, string>
  ): CachedResponse | null {
    const key = this.generateKey(url, method, requestHeaders, config.vary)
    const cached = this.cache.get(key)
    
    if (!cached) return null

    const now = Date.now()
    const age = (now - cached.timestamp) / 1000 // 转换为秒

    // 检查是否过期
    if (age > config.ttl) {
      // 如果支持 stale-while-revalidate，检查是否在宽限期内
      if (config.staleWhileRevalidate && age <= config.ttl + config.staleWhileRevalidate) {
        // 返回过期数据，但标记需要重新验证
        return { ...cached, headers: { ...cached.headers, 'x-cache-status': 'stale' } }
      }
      
      // 完全过期，删除缓存
      this.delete(key)
      return null
    }

    // 添加缓存状态头
    return {
      ...cached,
      headers: {
        ...cached.headers,
        'x-cache-status': 'hit',
        'x-cache-age': age.toString(),
        'etag': cached.etag
      }
    }
  }

  // 检查 ETag 是否匹配
  checkETag(
    url: string,
    method: string,
    ifNoneMatch: string,
    requestHeaders?: Record<string, string>
  ): boolean {
    const key = this.generateKey(url, method, requestHeaders)
    const cached = this.cache.get(key)
    
    return cached ? cached.etag === ifNoneMatch : false
  }

  // 删除单个缓存
  private delete(key: string): void {
    const cached = this.cache.get(key)
    if (cached) {
      // 从标签索引中移除
      cached.tags.forEach(tag => {
        const tagSet = this.tagIndex.get(tag)
        if (tagSet) {
          tagSet.delete(key)
          if (tagSet.size === 0) {
            this.tagIndex.delete(tag)
          }
        }
      })
      
      this.cache.delete(key)
    }
  }

  // 根据标签批量失效缓存
  invalidateByTag(tag: string): void {
    const keys = this.tagIndex.get(tag)
    if (keys) {
      keys.forEach(key => this.delete(key))
    }
  }

  // 根据URL模式失效缓存
  invalidateByPattern(pattern: RegExp): void {
    const keysToDelete: string[] = []
    
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        keysToDelete.push(key)
      }
    }
    
    keysToDelete.forEach(key => this.delete(key))
  }

  // 清空所有缓存
  clear(): void {
    this.cache.clear()
    this.tagIndex.clear()
  }

  // 淘汰最旧的缓存条目
  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTime = Date.now()
    
    for (const [key, cached] of this.cache.entries()) {
      if (cached.timestamp < oldestTime) {
        oldestTime = cached.timestamp
        oldestKey = key
      }
    }
    
    if (oldestKey) {
      this.delete(oldestKey)
    }
  }

  // 清理过期缓存
  cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []
    
    for (const [key, cached] of this.cache.entries()) {
      const age = (now - cached.timestamp) / 1000
      // 删除超过1小时的缓存
      if (age > 3600) {
        keysToDelete.push(key)
      }
    }
    
    keysToDelete.forEach(key => this.delete(key))
  }

  // 获取缓存统计信息
  getStats(): {
    size: number
    maxSize: number
    hitRate: number
    tags: number
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // 需要在使用中统计
      tags: this.tagIndex.size
    }
  }
}

// 创建全局缓存实例
export const apiCache = new ApiCache()

// 定期清理过期缓存
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    apiCache.cleanup()
  }, 300000) // 每5分钟清理一次
}

// 缓存装饰器函数
export function withCache(config: CacheConfig) {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function(request: Request, ...args: any[]) {
      const url = new URL(request.url)
      const method = request.method
      const requestHeaders = Object.fromEntries(request.headers.entries())
      
      // 检查 If-None-Match 头
      const ifNoneMatch = request.headers.get('if-none-match')
      if (ifNoneMatch && apiCache.checkETag(url.pathname, method, ifNoneMatch, requestHeaders)) {
        return new NextResponse(null, { status: 304 })
      }
      
      // 尝试从缓存获取
      const cached = apiCache.get(url.pathname, method, config, requestHeaders)
      if (cached) {
        return new NextResponse(cached.data, {
          status: cached.status,
          headers: cached.headers
        })
      }
      
      // 执行原始方法
      const response = await originalMethod.call(this, request, ...args)
      
      // 只缓存成功的响应
      if (response.status >= 200 && response.status < 300) {
        apiCache.set(url.pathname, method, response, config, requestHeaders)
      }
      
      return response
    }
  }
}