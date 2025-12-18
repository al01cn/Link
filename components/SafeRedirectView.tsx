'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, ExternalLink, Lock, Clock, AlertCircle, ArrowRight, Shield, Zap } from 'lucide-react'
import { TranslationKey } from '@/lib/translations'
import { preloadTargetUrl } from '@/lib/utils'
import TurnstileWidget from './TurnstileWidget'

interface SafeRedirectViewProps {
  targetUrl: string
  title?: string
  hasPassword: boolean
  requireConfirm: boolean
  waitTime: number
  captchaEnabled: boolean
  preloadEnabled: boolean
  autoFillPasswordEnabled: boolean
  onProceed: (password?: string, captchaToken?: string) => void
  onCancel: () => void
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
  // TO模式相关参数
  isToMode?: boolean
  redirectType?: string
  source?: string
  // 密码自动填充参数
  autoFillPassword?: string
  // 过期时间
  expiresAt?: string
}

export default function SafeRedirectView({ 
  targetUrl, 
  title, 
  hasPassword, 
  requireConfirm, 
  waitTime,
  captchaEnabled,
  preloadEnabled,
  autoFillPasswordEnabled,
  onProceed, 
  onCancel,
  t,
  isToMode = false,
  redirectType = 'auto',
  source = 'unknown',
  autoFillPassword,
  expiresAt
}: SafeRedirectViewProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(waitTime)
  const [isClient, setIsClient] = useState(false)
  const [domainBlocked, setDomainBlocked] = useState(false)
  const [blockReason, setBlockReason] = useState('')
  const [blockCountdown, setBlockCountdown] = useState(5)
  const [captchaToken, setCaptchaToken] = useState('')
  const [captchaError, setCaptchaError] = useState('')
  const [showCaptcha, setShowCaptcha] = useState(false)
  const [captchaVerified, setCaptchaVerified] = useState(false)
  const [autoFillAttempted, setAutoFillAttempted] = useState(false)
  const [isExpired, setIsExpired] = useState(false)
  const [hasJumped, setHasJumped] = useState(false) // 防止重复跳转
  
  // 检查链接是否过期
  const checkIfExpired = () => {
    if (!expiresAt) return false
    return new Date(expiresAt) <= new Date()
  }

  // 显示按钮的条件：需要密码 或 需要手动确认（与人机验证无关）
  const showButtons = hasPassword || requireConfirm
  
  // 启用倒计时的条件：不显示按钮时（自动模式）且人机验证已通过（如果启用）且未过期
  const enableCountdown = !showButtons && (!captchaEnabled || captchaVerified) && !isExpired

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
      // 注意：SafeRedirectView 没有直接的语言上下文，需要通过其他方式获取语言设置
      // 这里使用浏览器语言作为备选方案
      const locale = typeof navigator !== 'undefined' ? navigator.language : 'zh-CN'
      return expiresAt 
        ? t('linkExpiredWithTime', { time: new Date(expiresAt).toLocaleString(locale) })
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

  // 客户端水合完成后启用动画
  useEffect(() => {
    setIsClient(true)
    
    // 检查过期状态
    if (checkIfExpired()) {
      setIsExpired(true)
      return // 如果过期，不执行后续逻辑
    }
    
    // 检查域名访问权限
    checkDomainAccess()
    // 处理密码自动填充
    handleAutoFillPassword()
  }, [])

  // 处理密码自动填充
  const handleAutoFillPassword = () => {
    if (autoFillPasswordEnabled && autoFillPassword && hasPassword && !autoFillAttempted) {
      setPassword(autoFillPassword)
      setAutoFillAttempted(true)
      
      // 如果没有人机验证或人机验证已通过，自动提交
      if (!captchaEnabled || captchaVerified) {
        // 延迟一点时间让用户看到自动填充的过程
        // 注意：这里传递的是原始的 autoFillPassword，可能是明文密码或加密字符串
        setTimeout(() => {
          handleAuth()
        }, 500)
      }
    }
  }

  // 监听人机验证状态变化，如果验证通过且有自动填充密码，则自动提交
  useEffect(() => {
    if (captchaVerified && autoFillPasswordEnabled && autoFillPassword && hasPassword && password === autoFillPassword && !autoFillAttempted) {
      setAutoFillAttempted(true)
      // 直接调用跳转逻辑，避免循环依赖
      setTimeout(async () => {
        if (isToMode) {
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
                source
              })
            })
          } catch (error) {
            console.error(t('trackToVisitFailed') + ':', error)
          }
          window.location.href = targetUrl
        } else {
          onProceed(autoFillPassword, captchaToken)
        }
      }, 500)
    }
  }, [captchaVerified, autoFillPasswordEnabled, autoFillPassword, hasPassword, password, autoFillAttempted, isToMode, targetUrl, title, redirectType, source, captchaToken, onProceed, t])

  // 监听 captchaEnabled 变化
  useEffect(() => {
    if (captchaEnabled) {
      setShowCaptcha(true)
    }
  }, [captchaEnabled])

  // 检查域名访问权限
  const checkDomainAccess = async () => {
    try {
      const response = await fetch('/api/check-domain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: targetUrl })
      })

      if (response.ok) {
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

  useEffect(() => {
    if (!enableCountdown || domainBlocked) return

    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            // 倒计时结束，触发跳转
            setTimeout(() => handleAutoRedirect(), 0) // 使用 setTimeout 确保状态更新完成
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [enableCountdown, domainBlocked]) // 移除 countdown 和 onProceed 依赖，避免循环

  // 预加载逻辑
  useEffect(() => {
    if (!preloadEnabled || domainBlocked) return
    
    // 自动跳转模式：在倒计时开始时进行预加载（人机验证通过后）
    if (!showButtons && enableCountdown && countdown === waitTime) {
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
  }, [preloadEnabled, domainBlocked, showButtons, enableCountdown, countdown, waitTime, targetUrl, captchaEnabled, captchaVerified])

  // 处理自动跳转
  const handleAutoRedirect = async () => {
    if (hasJumped) return // 防止重复跳转
    setHasJumped(true) // 标记已经开始跳转
    
    if (isToMode) {
      // TO模式：记录TO访问统计
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
            source
          })
        })
      } catch (error) {
        console.error(t('trackToVisitFailed') + ':', error)
        // 统计失败不影响跳转
      }
      // 直接跳转
      window.location.href = targetUrl
    } else {
      // 普通模式：调用原有的跳转逻辑
      onProceed()
    }
  }

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

  const handleAuth = async () => {
    // 检查是否过期
    if (checkIfExpired()) {
      setIsExpired(true)
      return
    }
    
    if (hasPassword && !password) {
      setError(t('passwordError'))
      return
    }
    
    if (captchaEnabled && showCaptcha && !captchaToken) {
      setCaptchaError(t('captchaRequired'))
      return
    }
    
    // 注意：预加载逻辑已移至 useEffect 中处理，这里不再重复预加载
    
    if (isToMode) {
      // TO模式：记录TO访问统计后直接跳转
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
            source
          })
        })
      } catch (error) {
        console.error(t('trackToVisitFailed') + ':', error)
        // 统计失败不影响跳转
      }
      // 直接跳转
      window.location.href = targetUrl
    } else {
      // 普通模式：调用原有的跳转逻辑
      onProceed(password, captchaToken)
    }
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
        handleAuth()
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
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className={`cute-card max-w-md w-full p-8 text-center ${isClient ? 'animate__animated animate__zoomIn' : ''}`}>
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
          {getDescription()}
        </p>

        {/* 过期或域名被拦截时不显示目标链接信息 */}
        {!isExpired && !domainBlocked && (
          <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4 mb-6 text-left border border-slate-100 dark:border-slate-600 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-50 group-hover:opacity-100 transition-opacity">
              <ExternalLink size={16} className="text-slate-400" />
            </div>
            <div className="text-xs text-slate-400 uppercase font-bold mb-1">{t('targetUrl')}</div>
            <div className="text-[var(--color-primary)] truncate font-medium">{targetUrl}</div>
            {title && (
              <div className="text-sm text-slate-600 mt-2 flex items-center gap-2">
                <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                {title}
              </div>
            )}
          </div>
        )}

        {/* 过期或域名被拦截时不显示密码输入 */}
        {!isExpired && !domainBlocked && hasPassword && (
          <div className={`mb-6 text-left ${isClient ? 'animate__animated animate__fadeIn' : ''}`}>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              <Lock size={14} className="text-[var(--color-warning)]" /> 
              {t('passwordProtected')}
            </label>
            <div className={`cute-input-wrapper bg-white rounded-lg px-4 py-3 flex items-center gap-2 ${
              error ? 'border-[var(--color-error)] ring-1 ring-[var(--color-error)]' : ''
            }`}>
              <Lock size={18} className="text-slate-400" />
              <input 
                type="password" 
                placeholder={t('enterPassword')}
                className="w-full bg-transparent outline-none text-slate-800 dark:text-slate-200"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
              />
            </div>
            {error && (
              <div className={`flex items-center gap-1 text-[var(--color-error)] text-xs mt-2 font-medium ${isClient ? 'animate__animated animate__headShake' : ''}`}>
                <AlertCircle size={12} />
                {error}
              </div>
            )}
          </div>
        )}

        {/* 人机验证组件 */}
        {!isExpired && !domainBlocked && captchaEnabled && !captchaVerified && (
          <div className={`mb-6 ${isClient ? 'animate__animated animate__fadeIn' : ''}`}>
            <TurnstileWidget
              onVerify={handleCaptchaSuccess}
              onError={handleCaptchaError}
              onExpire={handleCaptchaExpire}
              className="mb-4"
            />
            {captchaError && (
              <div className={`flex items-center gap-1 text-[var(--color-error)] text-xs mt-2 font-medium justify-center ${isClient ? 'animate__animated animate__headShake' : ''}`}>
                <AlertCircle size={12} />
                {captchaError}
              </div>
            )}
          </div>
        )}

        {/* 倒计时消息（仅自动跳转模式且未过期且域名未被拦截） */}
        {!isExpired && !domainBlocked && !showButtons && (
          <div className={`mb-4 text-sm text-slate-400 font-medium ${isClient ? 'animate__animated animate__pulse animate__infinite' : ''}`}>
            <Clock size={14} className="inline mr-1 relative -top-[1px]" />
            {t('redirectingIn', { s: countdown })}
          </div>
        )}

        {/* 操作按钮（仅手动确认或密码模式且未过期且域名未被拦截） */}
        {!isExpired && !domainBlocked && showButtons && (
          <div className={`flex gap-3 ${isClient ? 'animate__animated animate__fadeInUp' : ''}`}>
            <button 
              onClick={onCancel}
              className="flex-1 px-4 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors text-sm"
            >
              {t('cancelVisit')}
            </button>
            <button 
              onClick={handleAuth}
              disabled={(hasPassword && !password) || (captchaEnabled && !captchaVerified)}
              className={`flex-1 shine-effect text-white px-4 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-blue-200 text-sm flex items-center justify-center gap-2 ${
                (hasPassword && !password) || (captchaEnabled && !captchaVerified) 
                  ? 'bg-slate-400 cursor-not-allowed' 
                  : 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]'
              }`}
            >
              {hasPassword ? (
                <>
                  <Lock size={16} />
                  {t('verifyAndJump')}
                </>
              ) : (
                <>
                  {t('continue')} <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        )}

        {/* 过期状态的返回按钮 */}
        {isExpired && (
          <div className={`flex justify-center ${isClient ? 'animate__animated animate__fadeInUp' : ''}`}>
            <button 
              onClick={onCancel}
              className="px-6 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors text-sm border border-slate-200 hover:border-slate-300"
            >
              {t('goBack')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}