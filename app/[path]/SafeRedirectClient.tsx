'use client'

import { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, ExternalLink, Lock, Clock, AlertCircle, ArrowRight, Shield, Zap } from 'lucide-react'
import TurnstileWidget from '@/components/TurnstileWidget'

interface SafeRedirectClientProps {
  path: string
  targetUrl: string
  title?: string
  hasPassword: boolean
  requireConfirm: boolean
  enableIntermediate: boolean
}

export default function SafeRedirectClient({ 
  path,
  targetUrl, 
  title, 
  hasPassword, 
  requireConfirm, 
  enableIntermediate 
}: SafeRedirectClientProps) {
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
  
  // 显示按钮的条件：需要密码 或 需要手动确认（与人机验证无关）
  const showButtons = hasPassword || requireConfirm
  
  // 启用倒计时的条件：启用过渡页且不显示按钮时（自动模式）且人机验证已通过（如果启用）
  const enableCountdown = enableIntermediate && !showButtons && (!captchaEnabled || captchaVerified)

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



  // 处理跳转逻辑
  const handleProceed = useCallback(async (inputPassword?: string) => {
    if (isProcessing) return
    
    // 检查人机验证
    if (captchaEnabled && showCaptcha && !captchaVerified) {
      setCaptchaError('请完成人机验证')
      return
    }
    
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
          setCaptchaError(captchaErrorData.error || '人机验证失败，请重试')
          setIsProcessing(false)
          return
        }
      }

      const response = await fetch(`/api/visit/${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          password: inputPassword || password 
        })
      })

      if (response.ok) {
        const data = await response.json()
        // 跳转到目标URL
        window.location.href = data.originalUrl
      } else {
        const errorData = await response.json()
        setError(errorData.error || '访问失败')
        setIsProcessing(false)
      }
    } catch (error) {
      console.error('访问失败:', error)
      setError('网络错误，请重试')
      setIsProcessing(false)
    }
  }, [isProcessing, path, password])

  // 客户端水合完成后启用动画
  useEffect(() => {
    setIsClient(true)
    // 检查域名访问权限
    checkDomainAccess()
    // 加载系统设置
    loadSystemSettings()
  }, [])

  // 加载系统设置
  const loadSystemSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setCaptchaEnabled(data.captchaEnabled || false)
        if (data.captchaEnabled) {
          setShowCaptcha(true)
        }
        // 更新倒计时时间
        setCountdown(data.waitTime || 5)
      }
    } catch (error) {
      console.error('加载系统设置失败:', error)
    }
  }

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
      handleProceed() // 自动跳转
    }
  }, [countdown, enableCountdown, handleProceed, domainBlocked])

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
    // 如果只需要人机验证（不需要密码和手动确认），验证通过后开始倒计时
    if (captchaEnabled && !hasPassword && !requireConfirm && enableIntermediate) {
      // 重置倒计时，开始自动跳转
      setCountdown(5) // 使用默认倒计时时间
    }
  }

  // 处理人机验证失败
  const handleCaptchaError = () => {
    setCaptchaToken('')
    setCaptchaError('人机验证失败，请重试')
    setCaptchaVerified(false)
  }

  // 处理人机验证过期
  const handleCaptchaExpire = () => {
    setCaptchaToken('')
    setCaptchaError('人机验证已过期，请重新验证')
    setCaptchaVerified(false)
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
            {getDescription()}
          </p>

          {/* 域名被拦截时不显示目标链接信息 */}
          {!domainBlocked && (
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
          )}

          {/* 域名被拦截时不显示密码输入 */}
          {!domainBlocked && hasPassword && (
            <div className={`mb-6 text-left ${isClient ? 'animate-fade-in' : ''}`}>
              <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <Lock size={14} className="text-[--color-warning]" /> 
                此链接受密码保护
              </label>
              <div className={`cute-input-wrapper bg-white rounded-lg px-4 py-3 flex items-center gap-2 ${
                error ? 'border-[--color-error] ring-1 ring-[--color-error]' : ''
              }`}>
                <Lock size={18} className="text-slate-400" />
                <input 
                  type="password" 
                  placeholder="请输入访问密码"
                  className="w-full bg-transparent outline-none text-slate-800"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && !isProcessing && handleProceed()}
                  disabled={isProcessing}
                />
              </div>
              {error && (
                <div className={`flex items-center gap-1 text-[--color-error] text-xs mt-2 font-medium ${isClient ? 'animate-fade-in' : ''}`}>
                  <AlertCircle size={12} />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* 人机验证组件 */}
          {!domainBlocked && captchaEnabled && !captchaVerified && (
            <div className={`mb-6 ${isClient ? 'animate-fade-in' : ''}`}>
              <TurnstileWidget
                onVerify={handleCaptchaSuccess}
                onError={handleCaptchaError}
                onExpire={handleCaptchaExpire}
                className="mb-4"
              />
              {captchaError && (
                <div className={`flex items-center gap-1 text-[--color-error] text-xs mt-2 font-medium justify-center ${isClient ? 'animate-fade-in' : ''}`}>
                  <AlertCircle size={12} />
                  {captchaError}
                </div>
              )}
            </div>
          )}

          {/* 倒计时消息（仅自动跳转模式且域名未被拦截） */}
          {!domainBlocked && enableCountdown && !isProcessing && (
            <div className={`mb-4 text-sm text-slate-400 font-medium ${isClient ? 'animate-fade-in' : ''}`}>
              <Clock size={14} className="inline mr-1 relative -top-px" />
              将在 {countdown} 秒后自动跳转...
            </div>
          )}

          {/* 处理中状态（域名未被拦截时） */}
          {!domainBlocked && isProcessing && (
            <div className={`mb-4 text-sm text-[--color-primary] font-medium ${isClient ? 'animate-fade-in' : ''} flex items-center justify-center gap-2`}>
              <div className="w-4 h-4 border-2 border-[--color-primary]/30 border-t-[--color-primary] rounded-full animate-spin"></div>
              正在跳转...
            </div>
          )}

          {/* 操作按钮（仅手动确认或密码模式且域名未被拦截） */}
          {!domainBlocked && showButtons && !isProcessing && (
            <div className={`flex gap-3 ${isClient ? 'animate-fade-in' : ''}`}>
              <button 
                onClick={handleCancel}
                className="flex-1 px-4 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors text-sm"
              >
                取消访问
              </button>
              <button 
                onClick={() => handleProceed()}
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
                    验证并跳转
                  </>
                ) : (
                  <>
                    立即跳转 <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}