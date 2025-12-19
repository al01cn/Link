import { useState, useEffect } from 'react'

/**
 * 客户端专用的主机名获取 Hook
 * 优先级：环境变量 > 客户端 hostname（智能端口处理） > 空字符串
 * 智能端口处理：HTTP 80端口和HTTPS 443端口不显示，其他端口显示
 */
export function useHostname(): string {
  const [hostname, setHostname] = useState<string>('')
  
  useEffect(() => {
    // 延迟执行，确保组件完全挂载
    const timer = setTimeout(() => {
      // 1. 优先使用环境变量（如果设置了就直接使用）
      const envBaseUrl = process.env.NEXT_PUBLIC_BASE_URL
      if (envBaseUrl) {
        const hostnameFromEnv = envBaseUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
        setHostname(hostnameFromEnv)
        return
      }
      
      // 2. 其次从客户端获取（生产环境动态域名，智能端口处理）
      if (typeof window !== 'undefined') {
        const windowHostname = window.location.hostname
        const port = window.location.port
        const protocol = window.location.protocol
        
        // 判断是否需要显示端口
        // HTTP 默认端口 80，HTTPS 默认端口 443，这两种情况不显示端口
        const shouldShowPort = port && 
                              !((protocol === 'http:' && port === '80') || 
                                (protocol === 'https:' && port === '443'))
        
        const finalHostname = shouldShowPort ? `${windowHostname}:${port}` : windowHostname
        setHostname(finalHostname)
        return
      }
      
      // 3. 如果都获取不到，设置为空字符串
      setHostname('')
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])
  
  return hostname
}