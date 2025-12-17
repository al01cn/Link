'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AlertTriangle, ExternalLink, Clock, ArrowRight, Shield, Zap, AlertCircle } from 'lucide-react'
import { isValidUrl } from '@/lib/utils'
import { useLanguage, LanguageProvider } from '@/lib/LanguageContext'
import TurnstileWidget from '@/components/TurnstileWidget'

// 跳转类型枚举
type RedirectType = 'href' | 'auto' | 'confirm'

// Token 配置接口
interface TokenConfig {
  url: string
  type?: RedirectType
  title?: string
  msg?: string
  turnstile?: boolean
}

// API 响应接口
interface ToApiResponse {
  originalUrl: string
  title: string
  type: RedirectType
  enableIntermediate: boolean
  msg: string
  captchaEnabled: boolean
}

function ToPageContent() {
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const [targetUrl, setTargetUrl] = useState('')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [countdown, setCountdown] = useState(5)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const [redirectType, setRedirectType] = useState<RedirectType>('auto')
  const [captchaEnabled, setCaptchaEnabled] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const [captchaError, setCaptchaError] = useState('')
  const [captchaVerified, setCaptchaVerified] = useState(false)

  // 客户端水合完成后启用动画
  useEffect(() => {
    setIsClient(true)
    setMessage(t('redirectingToTarget'))
  }, [t])

  useEffect(() => {
    const token = searchParams.get('token')
    const url = searchParams.get('url')
    const type = searchParams.get('type')
    
    // 没有任何参数
    if (!token && !url) {
      setError(t('missingTargetUrlOrToken'))
      setIsLoading(false)
      return
    }

    // 使用 API 接口获取配置
    fetchToConfig(token, url, type)
  }, [searchParams])

  useEffect(() => {
    // 只有在自动跳转模式且已获取到链接信息且人机验证已通过（如果启用）时才启动倒计时
    const canStartCountdown = countdown > 0 && targetUrl && !error && !isLoading && 
                             redirectType === 'auto' && (!captchaEnabled || captchaVerified)
    
    if (canStartCountdown) {
      const timer = setInterval(() => {
        setCountdown(prev => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    } else if (countdown === 0 && targetUrl && redirectType === 'auto' && (!captchaEnabled || captchaVerified)) {
      handleProceed()
    }
  }, [countdown, targetUrl, error, isLoading, redirectType, captchaEnabled, captchaVerified])

  const fetchToConfig = async (token?: string | null, url?: string | null, type?: string | null) => {
    try {
      // 构建 API 请求 URL
      const params = new URLSearchParams()
      if (token) {
        params.append('token', token)
      }
      if (url) {
        params.append('url', url)
      }
      if (type) {
        params.append('type', type)
      }

      const response = await fetch(`/api/to?${params.toString()}`)
      
      if (response.ok) {
        const data: ToApiResponse = await response.json()
        
        // 设置所有配置
        setTargetUrl(data.originalUrl)
        setTitle(data.title)
        setMessage(data.msg)
        setRedirectType(data.type)
        setCaptchaEnabled(data.captchaEnabled)

        // href 模式直接跳转
        if (data.type === 'href') {
          setIsLoading(false)
          handleProceed()
          return
        }
        
        setIsLoading(false)
      } else {
        const errorData = await response.json()
        setError(errorData.error || t('fetchLinkConfigFailed'))
        setIsLoading(false)
      }
    } catch (error) {
      console.error(t('fetchLinkConfigFailed') + ':', error)
      setError(t('networkError'))
      setIsLoading(false)
    }
  }

  const handleProceed = async () => {
    // 防止重复处理
    if (isLoading) return
    
    // 如果启用了人机验证但未验证，阻止跳转
    if (captchaEnabled && !captchaVerified) {
      setCaptchaError(t('captchaRequired'))
      return
    }
    
    setIsLoading(true)

    // 如果启用了人机验证，先验证 token
    if (captchaEnabled && captchaToken) {
      try {
        const response = await fetch('/api/verify-turnstile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: captchaToken })
        })

        if (!response.ok) {
          const errorData = await response.json()
          setCaptchaError(errorData.error || t('captchaFailed'))
          return
        }
      } catch (error) {
        console.error(t('captchaFailed') + ':', error)
        setCaptchaError(t('captchaServiceError'))
        return
      }
    }

    if (targetUrl) {
      // 在跳转前记录TO模式访问统计
      try {
        await fetch('/api/track-to-visit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            targetUrl,
            title,
            type: redirectType,
            source: searchParams.get('token') ? 'token' : 'url'
          })
        })
      } catch (error) {
        console.error(t('trackToVisitFailed') + ':', error)
        // 统计失败不影响跳转
      }
      
      window.location.href = targetUrl
    }
  }

  const handleCancel = () => {
    window.history.back()
  }

  // 处理人机验证成功
  const handleCaptchaSuccess = (token: string) => {
    setCaptchaToken(token)
    setCaptchaError('')
    setCaptchaVerified(true)
    // 如果是自动跳转模式，验证通过后重置倒计时
    if (redirectType === 'auto') {
      setCountdown(5)
    }
  }

  // 处理人机验证失败
  const handleCaptchaError = () => {
    setCaptchaToken('')
    setCaptchaError(t('captchaFailed'))
    setCaptchaVerified(false)
  }

  // 处理人机验证过期
  const handleCaptchaExpire = () => {
    setCaptchaToken('')
    setCaptchaError(t('captchaExpired'))
    setCaptchaVerified(false)
  }

  // 获取显示标题
  const getDisplayTitle = () => {
    if (title) {
      return title.length > 30 ? title.substring(0, 30) + '...' : title
    }
    try {
      return new URL(targetUrl).hostname
    } catch {
      return t('externalLink')
    }
  }

  // 获取图标和颜色
  const getIconAndColor = () => {
    switch (redirectType) {
      case 'href':
        return { 
          icon: ExternalLink, 
          color: 'text-purple-600',
          bgColor: 'bg-purple-100'
        }
      case 'confirm':
        return { 
          icon: Shield, 
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        }
      case 'auto':
      default:
        return { 
          icon: Zap, 
          color: 'text-blue-600',
          bgColor: 'bg-blue-100'
        }
    }
  }

  if (isLoading && redirectType !== 'href') {
    return (
      <div className="min-h-screen bg-[--color-bg-surface] preview-grid flex items-center justify-center">
        <div className="cute-card max-w-md w-full p-8 text-center">
          <div className="w-8 h-8 border-2 border-[--color-primary]/30 border-t-[--color-primary] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">{t('loadingInfo')}</p>
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
          <h2 className="text-2xl font-bold text-slate-800 mb-2">{t('accessError')}</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <button 
            onClick={handleCancel}
            className="px-6 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {t('back')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[--color-bg-surface] preview-grid">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className={`cute-card max-w-md w-full p-8 text-center ${isClient ? 'animate-fade-in' : ''}`}>
          <div className={`w-16 h-16 ${getIconAndColor().bgColor} ${getIconAndColor().color} rounded-full flex items-center justify-center mx-auto mb-6`}>
            {(() => {
              const IconComponent = getIconAndColor().icon
              return <IconComponent size={32} />
            })()}
          </div>
          
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            {getDisplayTitle()}
          </h2>
          <p className="text-slate-500 mb-6 text-sm leading-relaxed">
            {message}
          </p>

          <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left border border-slate-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-50 group-hover:opacity-100 transition-opacity">
              <ExternalLink size={16} className="text-slate-400" />
            </div>
            <div className="text-xs text-slate-400 uppercase font-bold mb-1">{t('targetUrl')}</div>
            <div className="text-[--color-primary] truncate font-medium">{targetUrl}</div>
            {title && (
              <div className="text-sm text-slate-600 mt-2 flex items-center gap-2">
                <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                {title}
              </div>
            )}
          </div>

          {/* 人机验证组件 */}
          {captchaEnabled && !captchaVerified && (
            <div className={`mb-6 ${isClient ? 'animate-fade-in' : ''}`}>
              <TurnstileWidget
                onVerify={handleCaptchaSuccess}
                onError={handleCaptchaError}
                onExpire={handleCaptchaExpire}
                className="mb-4"
              />
              {captchaError && (
                <div className={`flex items-center gap-1 text-red-500 text-xs mt-2 font-medium justify-center ${isClient ? 'animate-fade-in' : ''}`}>
                  <AlertCircle size={12} />
                  {captchaError}
                </div>
              )}
            </div>
          )}

          {/* 倒计时消息（仅自动跳转模式且人机验证已通过） */}
          {countdown > 0 && redirectType === 'auto' && (!captchaEnabled || captchaVerified) && (
            <div className={`mb-4 text-sm text-slate-400 font-medium ${isClient ? 'animate-fade-in' : ''}`}>
              <Clock size={14} className="inline mr-1 relative -top-px" />
              {t('redirectingIn', { s: countdown })}
            </div>
          )}

          {/* 操作按钮（确认模式或人机验证未完成时显示按钮） */}
          {(redirectType !== 'auto' || (captchaEnabled && !captchaVerified)) && (
            <div className={`flex gap-3 ${isClient ? 'animate-fade-in' : ''}`}>
              <button 
                onClick={handleCancel}
                className="flex-1 px-4 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors text-sm"
              >
                {t('cancelVisit')}
              </button>
              <button 
                onClick={handleProceed}
                disabled={captchaEnabled && !captchaVerified}
                className={`flex-1 shine-effect text-white px-4 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-blue-200 text-sm flex items-center justify-center gap-2 ${
                  captchaEnabled && !captchaVerified 
                    ? 'bg-slate-400 cursor-not-allowed' 
                    : 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]'
                }`}
              >
                {redirectType === 'href' ? t('directRedirect') : t('confirmRedirect')} <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ToPage() {
  return (
    <LanguageProvider>
      <Suspense fallback={
        <div className="min-h-screen bg-[--color-bg-surface] preview-grid flex items-center justify-center">
          <div className="cute-card max-w-md w-full p-8 text-center">
            <div className="w-8 h-8 border-2 border-[--color-primary]/30 border-t-[--color-primary] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500">加载中...</p>
          </div>
        </div>
      }>
        <ToPageContent />
      </Suspense>
    </LanguageProvider>
  )
}