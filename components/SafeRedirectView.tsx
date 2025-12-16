'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, ExternalLink, Lock, Clock, AlertCircle, ArrowRight } from 'lucide-react'
import { TranslationKey } from '@/lib/translations'

interface SafeRedirectViewProps {
  targetUrl: string
  title?: string
  hasPassword: boolean
  requireConfirm: boolean
  waitTime: number
  onProceed: (password?: string) => void
  onCancel: () => void
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
}

export default function SafeRedirectView({ 
  targetUrl, 
  title, 
  hasPassword, 
  requireConfirm, 
  waitTime,
  onProceed, 
  onCancel,
  t
}: SafeRedirectViewProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(waitTime)
  
  // 显示按钮的条件：需要密码 或 需要手动确认
  const showButtons = hasPassword || requireConfirm
  
  // 启用倒计时的条件：不显示按钮时（自动模式）
  const enableCountdown = !showButtons

  useEffect(() => {
    if (!enableCountdown) return

    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    } else {
      onProceed() // 自动跳转
    }
  }, [countdown, enableCountdown, onProceed])

  const handleAuth = () => {
    if (hasPassword && !password) {
      setError(t('passwordError'))
      return
    }
    
    onProceed(password)
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="cute-card max-w-md w-full p-8 text-center animate-fade-in">
        <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 relative">
          <AlertTriangle size={32} />
          {enableCountdown && countdown > 0 && (
            <div className="absolute -top-2 -right-2 bg-[--color-primary] text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">
              {countdown}
            </div>
          )}
        </div>
        
        <h2 className="text-2xl font-bold text-slate-800 mb-2">{t('leaving')}</h2>
        <p className="text-slate-500 mb-6 text-sm leading-relaxed">
          {t('leavingDesc')}
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

        {hasPassword && (
          <div className="mb-6 text-left animate-fade-in">
            <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Lock size={14} className="text-[--color-warning]" /> 
              {t('passwordProtected')}
            </label>
            <div className={`cute-input-wrapper bg-white rounded-lg px-4 py-3 flex items-center gap-2 ${
              error ? 'border-[--color-error] ring-1 ring-[--color-error]' : ''
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
              <div className="flex items-center gap-1 text-[--color-error] text-xs mt-2 font-medium animate-fade-in">
                <AlertCircle size={12} />
                {error}
              </div>
            )}
          </div>
        )}

        {/* 倒计时消息（仅自动跳转模式） */}
        {!showButtons && (
          <div className="mb-4 text-sm text-slate-400 font-medium animate-fade-in">
            <Clock size={14} className="inline mr-1 relative -top-px" />
            {t('redirectingIn', { s: countdown })}
          </div>
        )}

        {/* 操作按钮（仅手动确认或密码模式） */}
        {showButtons && (
          <div className="flex gap-3 animate-fade-in">
            <button 
              onClick={onCancel}
              className="flex-1 px-4 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors text-sm"
            >
              {t('cancel')}
            </button>
            <button 
              onClick={handleAuth}
              className="flex-1 shine-effect bg-[--color-primary] text-white px-4 py-3 rounded-xl font-medium hover:bg-[--color-primary-hover] transition-colors shadow-lg shadow-blue-200 text-sm flex items-center justify-center gap-2"
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