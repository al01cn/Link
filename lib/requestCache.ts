// 简单的请求缓存机制，防止重复请求
class RequestCache {
  private cache = new Map<string, Promise<any>>()
  private results = new Map<string, { data: any; timestamp: number }>()
  private readonly TTL = 5000 // 5秒缓存时间

  async get<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    // 检查缓存的结果
    const cached = this.results.get(key)
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.data
    }

    // 检查正在进行的请求
    if (this.cache.has(key)) {
      return this.cache.get(key)!
    }

    // 创建新的请求
    const promise = fetcher().then(data => {
      // 缓存结果
      this.results.set(key, { data, timestamp: Date.now() })
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

  clear() {
    this.cache.clear()
    this.results.clear()
  }

  clearExpired() {
    const now = Date.now()
    for (const [key, result] of this.results.entries()) {
      if (now - result.timestamp >= this.TTL) {
        this.results.delete(key)
      }
    }
  }
}

export const requestCache = new RequestCache()

// 定期清理过期缓存
if (typeof window !== 'undefined') {
  setInterval(() => {
    requestCache.clearExpired()
  }, 10000) // 每10秒清理一次
}