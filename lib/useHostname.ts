import { useState, useEffect } from 'react'

/**
 * 客户端专用的主机名获取 Hook
 * 优先级：客户端 hostname（不含端口） > 环境变量 > 空字符串
 * 这样确保生产环境可以动态获取当前访问的域名，且不显示端口号
 */
export function useHostname(): string {
  const [hostname, setHostname] = useState<string>('')
  
  useEffect(() => {
    // 延迟执行，确保组件完全挂载
    const timer = setTimeout(() => {
      // 1. 优先从客户端 hostname 获取（生产环境动态域名，不包含端口）
      if (typeof window !== 'undefined' && window.location.hostname) {
        setHostname(window.location.hostname)
        return
      }
      
      // 2. 其次使用环境变量（开发环境或备用）
      const envBaseUrl = process.env.NEXT_PUBLIC_BASE_URL
      if (envBaseUrl) {
        const hostnameFromEnv = envBaseUrl.replace(/^https?:\/\//, '').replace(/:\d+$/, '').replace(/\/$/, '')
        setHostname(hostnameFromEnv)
        return
      }
      
      // 3. 如果都获取不到，设置为空字符串
      setHostname('')
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])
  
  return hostname
}