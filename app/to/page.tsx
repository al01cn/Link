'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AlertTriangle, ExternalLink, Clock, ArrowRight } from 'lucide-react'
import { isValidUrl } from '@/lib/utils'
import { useTranslation } from '@/lib/translations'

function ToPageContent() {
  const t = useTranslation('zh') // 默认中文，实际项目中可以从context获取
  const searchParams = useSearchParams()
  const [targetUrl, setTargetUrl] = useState('')
  const [title, setTitle] = useState('')
  const [countdown, setCountdown] = useState(5)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)

  // 客户端水合完成后启用动画
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    const url = searchParams.get('url')
    
    if (!url) {
      setError('缺少目标URL参数') // 这个错误信息可以保持中文，因为是技术错误
      setIsLoading(false)
      return
    }

    if (!isValidUrl(url)) {
      setError('无效的URL格式') // 这个错误信息可以保持中文，因为是技术错误
      setIsLoading(false)
      return
    }

    setTargetUrl(url)
    fetchUrlInfo(url)
  }, [searchParams])

  useEffect(() => {
    if (countdown > 0 && targetUrl && !error) {
      const timer = setInterval(() => {
        setCountdown(prev => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    } else if (countdown === 0 && targetUrl) {
      handleProceed()
    }
  }, [countdown, targetUrl, error])

  const fetchUrlInfo = async (url: string) => {
    try {
      const response = await fetch(`/api/to?url=${encodeURIComponent(url)}`)
      
      if (response.ok) {
        const data = await response.json()
        setTitle(data.title || t('targetUrl'))
      } else {
        const errorData = await response.json()
        setError(errorData.error || '获取链接信息失败')
      }
    } catch (error) {
      console.error('获取链接信息失败:', error)
      setTitle('外部链接')
    } finally {
      setIsLoading(false)
    }
  }

  const handleProceed = () => {
    if (targetUrl) {
      window.location.href = targetUrl
    }
  }

  const handleCancel = () => {
    window.history.back()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[--color-bg-surface] preview-grid flex items-center justify-center">
        <div className="cute-card max-w-md w-full p-8 text-center">
          <div className="w-8 h-8 border-2 border-[--color-primary]/30 border-t-[--color-primary] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">正在获取链接信息...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[--color-bg-surface] preview-grid flex items-center justify-center">
        <div className="cute-card max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">访问错误</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <button 
            onClick={handleCancel}
            className="px-6 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[--color-bg-surface] preview-grid">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className={`cute-card max-w-md w-full p-8 text-center ${isClient ? 'animate-fade-in' : ''}`}>
          <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 relative">
            <AlertTriangle size={32} />
            {countdown > 0 && (
              <div className="absolute -top-2 -right-2 bg-[--color-primary] text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">
                {countdown}
              </div>
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-slate-800 mb-2">即将离开 ShortLink</h2>
          <p className="text-slate-500 mb-6 text-sm leading-relaxed">
            正在前往外部链接，请确认链接安全性。
          </p>

          <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left border border-slate-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-50 group-hover:opacity-100 transition-opacity">
              <ExternalLink size={16} className="text-slate-400" />
            </div>
            <div className="text-xs text-slate-400 uppercase font-bold mb-1">目标链接</div>
            <div className="text-[--color-primary] truncate font-medium">{targetUrl}</div>
            {title && (
              <div className="text-sm text-slate-600 mt-2 flex items-center gap-2">
                <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                {title}
              </div>
            )}
          </div>

          {/* 倒计时消息 */}
          {countdown > 0 && (
            <div className={`mb-4 text-sm text-slate-400 font-medium ${isClient ? 'animate-fade-in' : ''}`}>
              <Clock size={14} className="inline mr-1 relative -top-px" />
              将在 {countdown} 秒后自动跳转...
            </div>
          )}

          {/* 操作按钮 */}
          <div className={`flex gap-3 ${isClient ? 'animate-fade-in' : ''}`}>
            <button 
              onClick={handleCancel}
              className="flex-1 px-4 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors text-sm"
            >
              取消访问
            </button>
            <button 
              onClick={handleProceed}
              className="flex-1 shine-effect bg-[--color-primary] text-white px-4 py-3 rounded-xl font-medium hover:bg-[--color-primary-hover] transition-colors shadow-lg shadow-blue-200 text-sm flex items-center justify-center gap-2"
            >
              立即跳转 <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ToPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[--color-bg-surface] preview-grid flex items-center justify-center">
        <div className="cute-card max-w-md w-full p-8 text-center">
          <div className="w-8 h-8 border-2 border-[--color-primary]/30 border-t-[--color-primary] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">正在加载...</p>
        </div>
      </div>
    }>
      <ToPageContent />
    </Suspense>
  )
}