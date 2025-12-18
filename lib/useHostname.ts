import { useState, useEffect } from 'react'

/**
 * 客户端专用的主机名获取 Hook
 * 优先级：环境变量 > 客户端 host > 空字符串
 */
export function useHostname(): string {
  const [hostname, setHostname] = useState<string>('')
  
  useEffect(() => {
    // 延迟执行，确保组件完全挂载
    const timer = setTimeout(() => {
      // 1. 优先使用环境变量
      const envBaseUrl = process.env.NEXT_PUBLIC_BASE_URL
      if (envBaseUrl) {
        const hostnameFromEnv = envBaseUrl.replace(/^https?:\/\//, '')
        setHostname(hostnameFromEnv)
        return
      }
      
      // 2. 其次从客户端 host 获取
      if (typeof window !== 'undefined' && window.location.host) {
        setHostname(window.location.host)
        return
      }
      
      // 3. 如果都获取不到，设置为空字符串
      setHostname('')
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])
  
  return hostname
}