import { useState, useEffect } from 'react'

/**
 * 客户端专用的主机名获取 Hook
 * 解决 SSR 水合问题，确保在客户端正确显示当前域名
 */
export function useHostname(): string {
  const [hostname, setHostname] = useState<string>('xx.com')
  
  useEffect(() => {
    // 延迟执行，确保组件完全挂载
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        console.log('获取主机名:', window.location.host) // 调试日志
        setHostname(window.location.host || 'xxx.com')
      }
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])
  
  return hostname
}