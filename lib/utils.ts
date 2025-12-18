import { nanoid } from 'nanoid'

// 获取动态的基础URL
export function getBaseUrl(request?: Request): string {
  // 优先使用环境变量
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL
  }
  
  // 在客户端，从当前窗口获取
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.host}`
  }
  
  // 服务端：尝试从请求头获取
  if (request) {
    const host = request.headers.get('host')
    const protocol = request.headers.get('x-forwarded-proto') || 
                    (request.headers.get('x-forwarded-ssl') === 'on' ? 'https' : 'http')
    
    if (host) {
      return `${protocol}://${host}`
    }
  }
  
  // 服务端fallback：从其他环境变量尝试获取
  const vercelUrl = process.env.VERCEL_URL
  if (vercelUrl) {
    return `https://${vercelUrl}`
  }
  
  const port = process.env.PORT || '3000'
  return `http://localhost:${port}`
}

// 生成短链 URL（优先级：环境变量 > 请求 host > 只返回路径）
export function generateShortUrl(path: string, request?: Request): string {
  // 1. 优先使用环境变量
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return `${process.env.NEXT_PUBLIC_BASE_URL}/${path}`
  }
  
  // 2. 其次从请求头获取 host
  if (request) {
    const host = request.headers.get('host')
    const protocol = request.headers.get('x-forwarded-proto') || 
                    (request.headers.get('x-forwarded-ssl') === 'on' ? 'https' : 'http')
    
    if (host) {
      return `${protocol}://${host}/${path}`
    }
  }
  
  // 3. 如果都获取不到，只返回路径
  return path
}

// 获取动态的主机名（不包含协议）
export function getHostname(request?: Request): string {
  // 优先使用环境变量
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL.replace(/^https?:\/\//, '')
  }
  
  // 在客户端，从当前窗口获取
  if (typeof window !== 'undefined') {
    return window.location.host
  }
  
  // 服务端：尝试从请求头获取
  if (request) {
    const host = request.headers.get('host')
    if (host) {
      return host
    }
  }
  
  // 服务端fallback：从其他环境变量尝试获取
  const vercelUrl = process.env.VERCEL_URL
  if (vercelUrl) {
    return vercelUrl
  }
  
  const port = process.env.PORT || '3000'
  return `localhost:${port}`
}

// 生成短链路径
export function generateShortPath(length: number = 6): string {
  return nanoid(length)
}

// 验证UUID格式
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// 验证URL格式
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

// 提取域名
export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

// 验证域名规则格式
export function validateDomainRule(domain: string): {
  isValid: boolean
  error?: string
  normalizedDomain?: string
} {
  if (!domain || !domain.trim()) {
    return { isValid: false, error: '域名不能为空' }
  }

  const trimmedDomain = domain.trim().toLowerCase()

  // 检查是否包含协议
  if (trimmedDomain.includes('://')) {
    return { isValid: false, error: '请输入域名，不要包含协议（如 http://）' }
  }

  // 检查是否包含路径
  if (trimmedDomain.includes('/')) {
    return { isValid: false, error: '请输入域名，不要包含路径' }
  }

  // 支持的格式：
  // 1. *.example.com - 匹配所有子域名（包括主域名）
  // 2. example.com - 只匹配主域名
  // 3. sub.example.com - 只匹配特定子域名

  if (trimmedDomain.startsWith('*.')) {
    // 通配符格式验证
    const baseDomain = trimmedDomain.substring(2)
    if (!baseDomain || baseDomain.includes('*')) {
      return { isValid: false, error: '通配符格式错误，应为 *.example.com' }
    }
    
    // 验证基础域名格式
    const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/
    if (!domainRegex.test(baseDomain)) {
      return { isValid: false, error: '域名格式不正确' }
    }
    
    return { isValid: true, normalizedDomain: trimmedDomain }
  } else {
    // 普通域名格式验证
    const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/
    if (!domainRegex.test(trimmedDomain)) {
      return { isValid: false, error: '域名格式不正确' }
    }
    
    return { isValid: true, normalizedDomain: trimmedDomain }
  }
}

// 获取页面标题
export async function fetchPageTitle(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AL01Link/1.0)'
      }
    })
    
    if (!response.ok) return null
    
    const html = await response.text()
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    
    return titleMatch ? titleMatch[1].trim() : null
  } catch {
    return null
  }
}

// 格式化时间
export function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`
  
  return date.toLocaleDateString('zh-CN')
}

// 格式化剩余时间（用于过期时间显示）
export function formatTimeRemaining(date: Date): { time: string; isImminentExpiry: boolean; isExpired: boolean } {
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  
  // 如果已经过期，返回过期标识
  if (diff <= 0) return { time: '', isImminentExpiry: false, isExpired: true }
  
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 1) return { time: '', isImminentExpiry: true, isExpired: false } // 即将过期的特殊情况
  if (minutes < 60) return { time: `${minutes}分钟`, isImminentExpiry: false, isExpired: false }
  if (hours < 24) return { time: `${hours}小时`, isImminentExpiry: false, isExpired: false }
  if (days < 30) return { time: `${days}天`, isImminentExpiry: false, isExpired: false }
  
  return { time: date.toLocaleDateString('zh-CN'), isImminentExpiry: false, isExpired: false }
}

// 检查域名规则是否匹配
function isDomainMatched(targetDomain: string, ruleDomain: string): boolean {
  // 如果规则以 *. 开头，匹配所有子域名（包括主域名）
  if (ruleDomain.startsWith('*.')) {
    const baseDomain = ruleDomain.substring(2) // 移除 *.
    return targetDomain === baseDomain || targetDomain.endsWith('.' + baseDomain)
  }
  
  // 精确匹配：只匹配指定的域名，不包括子域名
  return targetDomain === ruleDomain
}

// 预加载目标链接
export function preloadTargetUrl(targetUrl: string): void {
  try {
    // 如果是直接访问模式，不进行预加载
    if (window.location.pathname.includes('/direct/')) {
      return
    }

    // 创建预加载元素
    const preloadElements: HTMLElement[] = []

    // DNS 预解析
    const dnsPreconnect = document.createElement('link')
    dnsPreconnect.rel = 'dns-prefetch'
    dnsPreconnect.href = new URL(targetUrl).origin
    document.head.appendChild(dnsPreconnect)
    preloadElements.push(dnsPreconnect)

    // 预连接（包含 DNS 解析、TCP 握手、TLS 协商）
    const preconnect = document.createElement('link')
    preconnect.rel = 'preconnect'
    preconnect.href = new URL(targetUrl).origin
    document.head.appendChild(preconnect)
    preloadElements.push(preconnect)

    // 预获取页面资源
    const prefetch = document.createElement('link')
    prefetch.rel = 'prefetch'
    prefetch.href = targetUrl
    document.head.appendChild(prefetch)
    preloadElements.push(prefetch)

    // 5秒后清理预加载元素，避免内存泄漏
    setTimeout(() => {
      preloadElements.forEach(element => {
        if (element.parentNode) {
          element.parentNode.removeChild(element)
        }
      })
    }, 5000)

    console.log('预加载已启动:', targetUrl)
  } catch (error) {
    console.warn('预加载失败:', error)
  }
}

// 检查域名是否被允许访问（服务端使用）
export async function checkDomainAccessServer(
  domain: string, 
  securityMode: string, 
  domainRules: Array<{ domain: string; type: string }>
): Promise<{
  allowed: boolean
  reason?: string
}> {
  try {
    if (!domain) {
      return { allowed: false, reason: '无效域名' }
    }
    
    // 查找所有匹配的域名规则
    const matchedRules = domainRules.filter(rule => 
      isDomainMatched(domain, rule.domain)
    )
    
    if (matchedRules.length === 0) {
      // 没有匹配的规则
      if (securityMode === 'whitelist') {
        return { allowed: false, reason: '域名不在白名单中' }
      } else {
        return { allowed: true }
      }
    }
    
    // 按权重排序匹配的规则：通配符规则权重最高，但在同类型中更具体的优先
    const sortedRules = matchedRules.sort((a, b) => {
      const aIsWildcard = a.domain.startsWith('*.')
      const bIsWildcard = b.domain.startsWith('*.')
      
      // 通配符规则优先级最高
      if (aIsWildcard && !bIsWildcard) return -1
      if (!aIsWildcard && bIsWildcard) return 1
      
      // 如果都是通配符规则，更具体的（更长的）优先
      if (aIsWildcard && bIsWildcard) {
        return b.domain.length - a.domain.length
      }
      
      // 如果都是精确匹配规则，更具体的（更长的）优先
      return b.domain.length - a.domain.length
    })
    
    // 使用权重最高的规则
    const highestPriorityRule = sortedRules[0]
    
    if (securityMode === 'whitelist') {
      // 白名单模式：只允许白名单内的域名
      if (highestPriorityRule.type === 'whitelist') {
        return { allowed: true }
      }
      return { allowed: false, reason: '域名不在白名单中' }
    } else {
      // 黑名单模式：拦截黑名单内的域名
      if (highestPriorityRule.type === 'blacklist') {
        return { allowed: false, reason: '域名在黑名单中' }
      }
      return { allowed: true }
    }
  } catch (error) {
    console.error('检查域名访问权限失败:', error)
    return { allowed: true } // 出错时默认允许
  }
}