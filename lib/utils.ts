import { nanoid } from 'nanoid'

// 生成短链路径
export function generateShortPath(length: number = 6): string {
  return nanoid(length)
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

// 获取页面标题
export async function fetchPageTitle(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ShortLink/1.0)'
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
    
    // 查找匹配的域名规则
    const matchedRule = domainRules.find(rule => 
      domain === rule.domain || domain.endsWith('.' + rule.domain)
    )
    
    if (securityMode === 'whitelist') {
      // 白名单模式：只允许白名单内的域名
      if (matchedRule && matchedRule.type === 'whitelist') {
        return { allowed: true }
      }
      return { allowed: false, reason: '域名不在白名单中' }
    } else {
      // 黑名单模式：拦截黑名单内的域名
      if (matchedRule && matchedRule.type === 'blacklist') {
        return { allowed: false, reason: '域名在黑名单中' }
      }
      return { allowed: true }
    }
  } catch (error) {
    console.error('检查域名访问权限失败:', error)
    return { allowed: true } // 出错时默认允许
  }
}