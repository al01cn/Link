'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, ExternalLink, Lock, Clock, AlertCircle, ArrowRight, Shield, Zap } from 'lucide-react'
import { TranslationKey } from '@/lib/translations'
import TurnstileWidget from './TurnstileWidget'

interface SafeRedirectViewProps {
  targetUrl: string
  title?: string
  hasPassword: boolean
  requireConfirm: boolean
  waitTime: number
  captchaEnabled: boolean
  onProceed: (password?: string, captchaToken?: string) => void
  onCancel: () => void
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
}

export default function SafeRedirectView({ 
  targetUrl, 
  title, 
  hasPassword, 
  requireConfirm, 
  waitTime,
  captchaEnabled,
  onProceed, 
  onCancel,
  t
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
  
  // 显示按钮的条件：需要密码 或 需要手动确认（与人机验证无关）
  const showButtons = hasPassword || requireConfirm
  
  // 启用倒计时的条件：不显示按钮时（自动模式）且人机验证已通过（如果启用）
  const enableCountdown = !showButtons && (!captchaEnabled || captchaVerified)

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
    if (domainBlocked) {
      return '目标被拦截'
    }
    if (title) {
      return truncateTitle(title)
    }
    return getDomain(targetUrl)
  }

  // 获取描述文字
  const getDescription = () => {
    if (domainBlocked) {
      return `${blockReason}，${blockCountdown} 秒后自动关闭...`
    }
    if (captchaEnabled && showCaptcha && !captchaVerified) {
      return '请完成人机验证后继续...'
    }
    if (hasPassword) {
      return '确认密码后，将前往目标链接...'
    }
    if (requireConfirm) {
      return '点击确认后，前往目标链接。'
    }
    if (enableCountdown) {
      return '请耐心等待前往目标链接...'
    }
    return '正在前往目标链接...'
  }

  // 获取图标和颜色
  const getIconAndColor = () => {
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
    // 检查域名访问权限
    checkDomainAccess()
  }, [])

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
          setBlockReason(data.reason || '目标被拦截')
        }
      }
    } catch (error) {
      console.error('检查域名访问权限失败:', error)
    }
  }

  useEffect(() => {
    if (!enableCountdown || domainBlocked) return

    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    } else {
      onProceed() // 自动跳转
    }
  }, [countdown, enableCountdown, onProceed, domainBlocked])

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

  const handleAuth = () => {
    if (hasPassword && !password) {
      setError(t('passwordError'))
      return
    }
    
    if (captchaEnabled && showCaptcha && !captchaToken) {
      setCaptchaError(t('captchaRequired'))
      return
    }
    
    onProceed(password, captchaToken)
  }

  // 处理人机验证成功
  const handleCaptchaSuccess = (token: string) => {
    setCaptchaToken(token)
    setCaptchaError('')
    setCaptchaVerified(true)
    // 如果只需要人机验证（不需要密码和手动确认），验证通过后开始倒计时
    if (captchaEnabled && !hasPassword && !requireConfirm) {
      // 重置倒计时，开始自动跳转
      setCountdown(waitTime)
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
        
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          {getDisplayTitle()}
        </h2>
        <p className="text-slate-500 mb-6 text-sm leading-relaxed">
          {getDescription()}
        </p>

        {/* 域名被拦截时不显示目标链接信息 */}
        {!domainBlocked && (
          <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left border border-slate-100 relative overflow-hidden group">
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

        {/* 域名被拦截时不显示密码输入 */}
        {!domainBlocked && hasPassword && (
          <div className={`mb-6 text-left ${isClient ? 'animate__animated animate__fadeIn' : ''}`}>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
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
                className="w-full bg-transparent outline-none text-slate-800"
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
        {!domainBlocked && captchaEnabled && !captchaVerified && (
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

        {/* 倒计时消息（仅自动跳转模式且域名未被拦截） */}
        {!domainBlocked && !showButtons && (
          <div className={`mb-4 text-sm text-slate-400 font-medium ${isClient ? 'animate__animated animate__pulse animate__infinite' : ''}`}>
            <Clock size={14} className="inline mr-1 relative -top-[1px]" />
            {t('redirectingIn', { s: countdown })}
          </div>
        )}

        {/* 操作按钮（仅手动确认或密码模式且域名未被拦截） */}
        {!domainBlocked && showButtons && (
          <div className={`flex gap-3 ${isClient ? 'animate__animated animate__fadeInUp' : ''}`}>
            <button 
              onClick={onCancel}
              className="flex-1 px-4 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors text-sm"
            >
              {t('cancel')}
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
      </div>
    </div>
  )
}