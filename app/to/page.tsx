'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AlertTriangle, ExternalLink, Clock, ArrowRight, Shield, Zap, AlertCircle, Globe } from 'lucide-react'
import { preloadTargetUrl } from '@/lib/utils'
import { useLanguage, LanguageProvider } from '@/lib/LanguageContext'
import { useTheme, ThemeProvider } from '@/lib/ThemeContext'
import TurnstileWidget from '@/components/TurnstileWidget'
import ThemeToggle from '@/components/ThemeToggle'

// 跳转类型枚举
type RedirectType = 'href' | 'auto' | 'confirm'



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
  const { t, language, setLanguage } = useLanguage()
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
  const [preloadEnabled, setPreloadEnabled] = useState(true)
  const [hasJumped, setHasJumped] = useState(false) // 防止重复跳转


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
        setCountdown(prev => {
          if (prev <= 1) {
            // 倒计时结束，触发跳转
            setTimeout(() => handleProceed(), 0) // 使用 setTimeout 确保状态更新完成
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [targetUrl, error, isLoading, redirectType, captchaEnabled, captchaVerified]) // 移除 countdown 依赖，避免循环

  // 自动跳转模式的预加载逻辑
  useEffect(() => {
    if (!preloadEnabled || !targetUrl || error || isLoading) return
    
    // 在倒计时开始时进行预加载（人机验证通过后）
    if (redirectType === 'auto' && countdown === 5 && (!captchaEnabled || captchaVerified)) {
      preloadTargetUrl(targetUrl)
    }
  }, [preloadEnabled, targetUrl, error, isLoading, redirectType, countdown, captchaEnabled, captchaVerified])

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
        
        // 加载系统设置
        try {
          const settingsResponse = await fetch('/api/public-settings')
          if (settingsResponse.ok) {
            const settingsData = await settingsResponse.json()
            setPreloadEnabled(settingsData.preloadEnabled !== false) // 默认启用
          }
        } catch (error) {
          console.error('加载系统设置失败:', error)
          // 设置失败不影响主要功能，使用默认值
        }

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
    if (isLoading || hasJumped) return
    
    setHasJumped(true) // 标记已经开始跳转
    
    // 如果启用了人机验证但未验证，阻止跳转
    if (captchaEnabled && !captchaVerified) {
      setCaptchaError(t('captchaRequired'))
      return
    }
    
    // 验证通过后，如果启用预加载且未进行过预加载，则立即开始预加载
    if (preloadEnabled && targetUrl && !captchaEnabled) {
      preloadTargetUrl(targetUrl)
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
    // 人机验证通过后，如果启用预加载且是确认模式，则开始预加载
    if (preloadEnabled && targetUrl && redirectType === 'confirm') {
      preloadTargetUrl(targetUrl)
    }
    // 注意：不再重置倒计时，让现有的倒计时逻辑自然处理
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
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">{t('accessError')}</h2>
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
      {/* 顶部控制栏 */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
        {/* 主题切换 */}
        <ThemeToggle t={t} />
        
        {/* 语言切换 */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-full p-1 transition-colors">
          <button
            onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
            className="cute-btn w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm relative"
            title={t('switchLanguage')}
          >
            <Globe size={16} />
            <span className="absolute -bottom-1 -right-1 text-[8px] font-bold bg-slate-200 dark:bg-slate-600 px-1 rounded text-slate-600 dark:text-slate-300 leading-none">
              {language.toUpperCase()}
            </span>
          </button>
        </div>
      </div>

      <div className="min-h-screen flex items-center justify-center p-4">
        <div className={`cute-card max-w-md w-full p-8 text-center ${isClient ? 'animate-fade-in' : ''}`}>
          <div className={`w-16 h-16 ${getIconAndColor().bgColor} ${getIconAndColor().color} rounded-full flex items-center justify-center mx-auto mb-6`}>
            {(() => {
              const IconComponent = getIconAndColor().icon
              return <IconComponent size={32} />
            })()}
          </div>
          
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
            {getDisplayTitle()}
          </h2>
          <p className="text-slate-500 mb-6 text-sm leading-relaxed">
            {message}
          </p>

          <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4 mb-6 text-left border border-slate-100 dark:border-slate-600 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-50 group-hover:opacity-100 transition-opacity">
              <ExternalLink size={16} className="text-slate-400" />
            </div>
            <div className="text-xs text-slate-400 uppercase font-bold mb-1">{t('targetUrl')}</div>
            <div className="text-[--color-primary] font-medium break-all text-sm leading-tight max-h-12 overflow-hidden">
              {targetUrl.length > 60 ? `${targetUrl.substring(0, 60)}...` : targetUrl}
            </div>
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
    <ThemeProvider>
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
    </ThemeProvider>
  )
}