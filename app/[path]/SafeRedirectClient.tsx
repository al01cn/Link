'use client'

import { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, ExternalLink, Lock, Clock, AlertCircle, ArrowRight, Shield, Zap, Globe } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'
import { useTheme } from '@/lib/ThemeContext'
import { requestCache } from '@/lib/requestCache'
import { preloadTargetUrl } from '@/lib/utils'
import TurnstileWidget from '@/components/TurnstileWidget'
import ThemeToggle from '@/components/ThemeToggle'

interface SafeRedirectClientProps {
  path: string
  targetUrl: string
  title?: string
  description?: string // 添加简介描述字段
  hasPassword: boolean
  requireConfirm: boolean
  enableIntermediate: boolean
  autoFillPassword?: string
  expiresAt?: string // 添加过期时间字段
  autoRedirect?: boolean // 添加自动重定向标志
}

export default function SafeRedirectClient({ 
  path,
  targetUrl, 
  title, 
  description,
  hasPassword, 
  requireConfirm, 
  enableIntermediate,
  autoFillPassword,
  expiresAt,
  autoRedirect = false
}: SafeRedirectClientProps) {

  // 如果是自动重定向模式，返回加载指示器并在客户端执行跳转
  if (autoRedirect) {
    // 使用 useEffect 在客户端执行跳转
    useEffect(() => {
      window.location.href = targetUrl
    }, [targetUrl])

    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-500 text-sm">正在跳转...</p>
        </div>
      </div>
    )
  }

  const { t, language, setLanguage } = useLanguage()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(5) // 默认5秒倒计时
  const [isProcessing, setIsProcessing] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [domainBlocked, setDomainBlocked] = useState(false)
  const [blockReason, setBlockReason] = useState('')
  const [blockCountdown, setBlockCountdown] = useState(5)
  const [captchaEnabled, setCaptchaEnabled] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const [captchaError, setCaptchaError] = useState('')
  const [showCaptcha, setShowCaptcha] = useState(false)
  const [captchaVerified, setCaptchaVerified] = useState(false)
  const [preloadEnabled, setPreloadEnabled] = useState(true)
  const [autoFillPasswordEnabled, setAutoFillPasswordEnabled] = useState(true)
  const [autoFillAttempted, setAutoFillAttempted] = useState(false)
  const [hasJumped, setHasJumped] = useState(false) // 防止重复跳转
  
  // 检查链接是否过期 - 在服务端和客户端都能正确计算
  const checkIfExpired = () => {
    if (!expiresAt) return false
    return new Date(expiresAt) <= new Date()
  }
  
  // 直接计算过期状态，避免水合不匹配
  const isExpired = checkIfExpired()

  // 显示按钮的条件：需要密码 或 需要手动确认（与人机验证无关）
  const showButtons = hasPassword || requireConfirm
  
  // 启用倒计时的条件：启用过渡页且不显示按钮时（自动模式）且人机验证已通过（如果启用）且未过期
  const enableCountdown = enableIntermediate && !showButtons && (!captchaEnabled || captchaVerified) && !isExpired

  // 获取域名
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname
    } catch {
      return url
    }
  }

  // 截取标题（最多30个字符）
  const truncateTitle = (title: string, maxLength: number = 30) => {
    if (title.length <= maxLength) return title
    return title.substring(0, maxLength) + '...'
  }

  // 获取显示标题
  const getDisplayTitle = () => {
    if (isExpired) {
      return t('linkExpired')
    }
    if (domainBlocked) {
      return t('targetBlocked')
    }
    if (title) {
      return truncateTitle(title)
    }
    return getDomain(targetUrl)
  }

  // 获取描述文字
  const getDescription = () => {
    if (isExpired) {
      return expiresAt 
        ? t('linkExpiredWithTime', { time: new Date(expiresAt).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US') })
        : t('linkExpiredDesc')
    }
    if (domainBlocked) {
      return t('blockReasonWithCountdown', { reason: blockReason, countdown: blockCountdown })
    }
    if (captchaEnabled && showCaptcha && !captchaVerified) {
      return t('completeCaptchaToContinue')
    }
    if (hasPassword) {
      return t('confirmPasswordToRedirect')
    }
    if (requireConfirm) {
      return t('clickConfirmToRedirect')
    }
    if (enableCountdown) {
      return t('pleaseWaitForRedirect')
    }
    return t('redirectingToTarget')
  }

  // 获取图标和颜色
  const getIconAndColor = () => {
    if (isExpired) {
      return { 
        icon: Clock, 
        color: 'text-red-500',
        bgColor: 'bg-red-100'
      }
    }
    if (domainBlocked) {
      return { 
        icon: AlertTriangle, 
        color: 'text-red-500',
        bgColor: 'bg-red-100'
      }
    }
    if (hasPassword) {
      return { 
        icon: Lock, 
        color: 'text-[var(--color-warning)]',
        bgColor: 'bg-orange-100'
      }
    }
    if (requireConfirm) {
      return { 
        icon: Shield, 
        color: 'text-[var(--color-success)]',
        bgColor: 'bg-green-100'
      }
    }
    return { 
      icon: Zap, 
      color: 'text-[var(--color-primary)]',
      bgColor: 'bg-blue-100'
    }
  }



  // 处理跳转逻辑
  const handleProceed = useCallback(async (inputPassword?: string) => {
    if (isProcessing || hasJumped) return
    
    setHasJumped(true) // 标记已经开始跳转
    
    // 检查是否过期
    if (isExpired) {
      return
    }
    
    // 检查人机验证
    if (captchaEnabled && showCaptcha && !captchaVerified) {
      setCaptchaError(t('captchaRequired'))
      return
    }
    
    // 注意：预加载逻辑已移至 useEffect 中处理，这里不再重复预加载
    
    setIsProcessing(true)
    setError('')
    setCaptchaError('')

    try {
      // 如果启用了人机验证，先验证 captcha token
      if (captchaEnabled && captchaToken) {
        const captchaResponse = await fetch('/api/verify-turnstile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: captchaToken })
        })

        if (!captchaResponse.ok) {
          const captchaErrorData = await captchaResponse.json()
          setCaptchaError(captchaErrorData.error || t('captchaFailed'))
          setIsProcessing(false)
          return
        }
      }

      // 验证密码（如果需要）
      const response = await fetch(`/api/visit/${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          password: inputPassword || password,
          isAutoFill: !!inputPassword // 如果有 inputPassword 参数，说明是自动填充
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // 在跳转前记录访问统计
        try {
          await fetch(`/api/track-visit/${path}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            }
          })
        } catch (trackError) {
          console.error(t('trackVisitFailed') + ':', trackError)
          // 统计失败不影响跳转
        }
        
        // 跳转到目标URL
        window.location.href = data.originalUrl
      } else {
        const errorData = await response.json()
        setError(errorData.error || t('accessFailed'))
        setIsProcessing(false)
      }
    } catch (error) {
      console.error(t('accessFailed') + ':', error)
      setError(t('networkError'))
      setIsProcessing(false)
    }
  }, [isProcessing, path, password, captchaEnabled, showCaptcha, captchaVerified, captchaToken, preloadEnabled, domainBlocked, targetUrl, t])

  // 客户端水合完成后启用动画
  useEffect(() => {
    let isMounted = true // 防止组件卸载后设置状态
    
    setIsClient(true)
    
    // 如果过期，不执行后续逻辑
    if (isExpired) {
      return
    }
    
    // 检查域名访问权限
    const checkDomain = async () => {
      try {
        const response = await fetch('/api/check-domain', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: targetUrl })
        })

        if (response.ok && isMounted) {
          const data = await response.json()
          if (!data.allowed) {
            setDomainBlocked(true)
            setBlockReason(data.reason || t('targetBlocked'))
          }
        }
      } catch (error) {
        console.error(t('checkDomainAccessFailed') + ':', error)
      }
    }
    
    // 加载系统设置
    const loadSettings = async () => {
      try {
        const data = await requestCache.get('public-settings', async () => {
          const response = await fetch('/api/public-settings')
          if (response.ok) {
            return response.json()
          }
          throw new Error('加载设置失败')
        })
        
        if (isMounted) {
          setCaptchaEnabled(data.captchaEnabled || false)
          setPreloadEnabled(data.preloadEnabled !== false) // 默认启用
          setAutoFillPasswordEnabled(data.autoFillPasswordEnabled !== false) // 默认启用
          if (data.captchaEnabled) {
            setShowCaptcha(true)
          }
          // 更新倒计时时间
          setCountdown(data.waitTime || 5)
        }
      } catch (error) {
        console.error(t('loadingSettings') + ':', error)
      }
    }

    checkDomain()
    loadSettings()

    return () => {
      isMounted = false
    }
  }, [])

  // 处理密码自动填充
  useEffect(() => {
    if (autoFillPasswordEnabled && autoFillPassword && hasPassword && !autoFillAttempted) {
      setPassword(autoFillPassword)
      setAutoFillAttempted(true)
      
      // 如果没有人机验证或人机验证已通过，自动提交
      if (!captchaEnabled || captchaVerified) {
        // 延迟一点时间让用户看到自动填充的过程
        // 注意：这里传递的是原始的 autoFillPassword，可能是明文密码或加密字符串
        setTimeout(() => {
          handleProceed(autoFillPassword)
        }, 500)
      }
    }
  }, [autoFillPasswordEnabled, autoFillPassword, hasPassword, autoFillAttempted, captchaEnabled, captchaVerified])

  // 监听人机验证状态变化，如果验证通过且有自动填充密码，则自动提交
  useEffect(() => {
    if (captchaVerified && autoFillPasswordEnabled && autoFillPassword && hasPassword && password === autoFillPassword && !autoFillAttempted) {
      setAutoFillAttempted(true)
      setTimeout(() => {
        handleProceed(autoFillPassword)
      }, 500)
    }
  }, [captchaVerified, autoFillPasswordEnabled, autoFillPassword, hasPassword, password, autoFillAttempted])



  useEffect(() => {
    if (!enableCountdown || domainBlocked) return

    if (countdown > 0) {
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
  }, [enableCountdown, domainBlocked]) // 移除 countdown 和 handleProceed 依赖，避免循环

  // 预加载逻辑
  useEffect(() => {
    if (!preloadEnabled || domainBlocked) return
    
    // 自动跳转模式：在倒计时开始时进行预加载（人机验证通过后）
    if (!showButtons && enableCountdown && countdown === 5) { // 使用默认倒计时时间
      preloadTargetUrl(targetUrl)
      return
    }
    
    // 手动确认模式：如果没有启用人机验证，立即预加载
    if (showButtons && !captchaEnabled) {
      preloadTargetUrl(targetUrl)
      return
    }
    
    // 手动确认模式：如果启用了人机验证，在验证通过后预加载
    if (showButtons && captchaEnabled && captchaVerified) {
      preloadTargetUrl(targetUrl)
    }
  }, [preloadEnabled, domainBlocked, showButtons, enableCountdown, countdown, targetUrl, captchaEnabled, captchaVerified])

  // 域名被拦截时的倒计时
  useEffect(() => {
    if (!domainBlocked) return

    if (blockCountdown > 0) {
      const timer = setInterval(() => {
        setBlockCountdown(prev => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    } else {
      // 5秒后自动关闭标签页
      window.close()
    }
  }, [blockCountdown, domainBlocked])

  const handleCancel = () => {
    window.history.back()
  }

  // 处理人机验证成功
  const handleCaptchaSuccess = (token: string) => {
    setCaptchaToken(token)
    setCaptchaError('')
    setCaptchaVerified(true)
    // 注意：不再重置倒计时，让现有的倒计时逻辑自然处理
    // 人机验证通过后，如果有自动填充的密码，自动提交
    if (autoFillPasswordEnabled && autoFillPassword && hasPassword && password === autoFillPassword) {
      setTimeout(() => {
        handleProceed(autoFillPassword)
      }, 500)
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
        {!isClient ? (
          // 服务端渲染时显示加载状态，避免水合不匹配
          <div className="cute-card max-w-md w-full p-6 sm:p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Zap size={32} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2 wrap-break-word">加载中...</h2>
            <p className="text-slate-500 mb-6 text-sm leading-relaxed">正在准备跳转</p>
          </div>
        ) : (
          <div className="cute-card max-w-md w-full p-6 sm:p-8 text-center animate-fade-in">
            <div className={`w-16 h-16 ${getIconAndColor().bgColor} ${getIconAndColor().color} rounded-full flex items-center justify-center mx-auto mb-6`}>
              {(() => {
                const IconComponent = getIconAndColor().icon
                return <IconComponent size={32} />
              })()}
            </div>
            
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2 wrap-break-word">
              {getDisplayTitle()}
            </h2>
            <p className="text-slate-500 mb-6 text-sm leading-relaxed wrap-break-word">
              {getDescription()}
            </p>

            {/* 目标链接信息 */}
            <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-3 sm:p-4 mb-6 text-left border border-slate-100 dark:border-slate-600 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-50 group-hover:opacity-100 transition-opacity">
                <ExternalLink size={16} className="text-slate-400" />
              </div>
              <div className="text-xs text-slate-400 uppercase font-bold mb-1">{t('targetUrl')}</div>
              <div className="text-[--color-primary] font-medium break-all text-sm leading-tight max-h-12 overflow-hidden">
                {targetUrl.length > 60 ? `${targetUrl.substring(0, 60)}...` : targetUrl}
              </div>
              {title && (
                <div className="text-sm text-slate-600 mt-2 flex items-start gap-2">
                  <div className="w-1 h-1 bg-slate-400 rounded-full mt-2 shrink-0"></div>
                  <div className="wrap-break-word min-w-0 flex-1">{title}</div>
                </div>
              )}
              {description && (
                <div className="text-sm text-slate-500 mt-2 leading-relaxed wrap-break-word">
                  {description}
                </div>
              )}
            </div>

            {/* 密码输入 */}
            {!isExpired && !domainBlocked && hasPassword && (
              <div className="mb-6 text-left">
                <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2 wrap-break-word">
                  <Lock size={14} className="text-[--color-warning] shrink-0" /> 
                  <span className="min-w-0">{t('passwordProtected')}</span>
                </label>
                <div className={`cute-input-wrapper bg-white rounded-lg px-3 sm:px-4 py-3 flex items-center gap-2 ${
                  error ? 'border-[--color-error] ring-1 ring-[--color-error]' : ''
                }`}>
                  <Lock size={18} className="text-slate-400 shrink-0" />
                  <input 
                    type="password" 
                    placeholder={t('enterPassword')}
                    className="w-full bg-transparent outline-none text-slate-800 min-w-0"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && !isProcessing && handleProceed()}
                    disabled={isProcessing}
                  />
                </div>
                {error && (
                  <div className="flex items-start gap-1 text-[--color-error] text-xs mt-2 font-medium">
                    <AlertCircle size={12} className="shrink-0 mt-0.5" />
                    <span className="wrap-break-word min-w-0">{error}</span>
                  </div>
                )}
              </div>
            )}

            {/* 人机验证组件 */}
            {!isExpired && !domainBlocked && captchaEnabled && !captchaVerified && (
              <div className="mb-6">
                <TurnstileWidget
                  onVerify={handleCaptchaSuccess}
                  onError={handleCaptchaError}
                  onExpire={handleCaptchaExpire}
                  className="mb-4"
                />
                {captchaError && (
                  <div className="flex items-start gap-1 text-[--color-error] text-xs mt-2 font-medium justify-center">
                    <AlertCircle size={12} className="shrink-0 mt-0.5" />
                    <span className="wrap-break-word min-w-0 text-center">{captchaError}</span>
                  </div>
                )}
              </div>
            )}

            {/* 倒计时消息 */}
            {!isExpired && !domainBlocked && enableCountdown && !isProcessing && (
              <div className="mb-4 text-sm text-slate-400 font-medium flex items-center justify-center gap-1 wrap-break-word">
                <Clock size={14} className="shrink-0" />
                <span className="min-w-0">{t('redirectingIn', { s: countdown })}</span>
              </div>
            )}

            {/* 处理中状态 */}
            {!isExpired && !domainBlocked && isProcessing && (
              <div className="mb-4 text-sm text-[--color-primary] font-medium flex items-center justify-center gap-2 wrap-break-word">
                <div className="w-4 h-4 border-2 border-[--color-primary]/30 border-t-[--color-primary] rounded-full animate-spin shrink-0"></div>
                <span className="min-w-0">{t('processing')}</span>
              </div>
            )}

            {/* 操作按钮 */}
            {!isExpired && !domainBlocked && showButtons && !isProcessing && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={handleCancel}
                  className="flex-1 px-4 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors text-sm min-w-0"
                >
                  {t('cancelVisit')}
                </button>
                <button 
                  onClick={() => handleProceed()}
                  disabled={(hasPassword && !password) || (captchaEnabled && !captchaVerified)}
                  className={`flex-1 shine-effect text-white px-4 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-blue-200 text-sm flex items-center justify-center gap-2 min-w-0 ${
                    (hasPassword && !password) || (captchaEnabled && !captchaVerified) 
                      ? 'bg-slate-400 cursor-not-allowed' 
                      : 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]'
                  }`}
                >
                  {hasPassword ? (
                    <>
                      <Lock size={16} className="shrink-0" />
                      <span className="truncate">{t('verifyAndJump')}</span>
                    </>
                  ) : (
                    <>
                      <span className="truncate">{t('continue')}</span>
                      <ArrowRight size={16} className="shrink-0" />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* 过期状态的返回按钮 */}
            {isExpired && (
              <div className="flex justify-center">
                <button 
                  onClick={handleCancel}
                  className="px-4 sm:px-6 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors text-sm border border-slate-200 hover:border-slate-300 min-w-0 wrap-break-word"
                >
                  {t('goBack')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}