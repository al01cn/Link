'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, ExternalLink, Lock, Clock, AlertCircle, ArrowRight } from 'lucide-react'

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
  
  // 显示按钮的条件：需要密码 或 需要手动确认
  const showButtons = hasPassword || requireConfirm
  
  // 启用倒计时的条件：启用过渡页且不显示按钮时（自动模式）
  const enableCountdown = enableIntermediate && !showButtons

  useEffect(() => {
    if (!enableCountdown) return

    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    } else {
      handleProceed() // 自动跳转
    }
  }, [countdown, enableCountdown])

  const handleProceed = async (inputPassword?: string) => {
    if (isProcessing) return
    
    setIsProcessing(true)
    setError('')

    try {
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
  }

  const handleCancel = () => {
    window.history.back()
  }

  return (
    <div className="min-h-screen bg-[--color-bg-surface] preview-grid">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="cute-card max-w-md w-full p-8 text-center animate-fade-in">
          <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 relative">
            <AlertTriangle size={32} />
            {enableCountdown && countdown > 0 && (
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

          {hasPassword && (
            <div className="mb-6 text-left animate-fade-in">
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
                <div className="flex items-center gap-1 text-[--color-error] text-xs mt-2 font-medium animate-fade-in">
                  <AlertCircle size={12} />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* 倒计时消息（仅自动跳转模式） */}
          {enableCountdown && !isProcessing && (
            <div className="mb-4 text-sm text-slate-400 font-medium animate-fade-in">
              <Clock size={14} className="inline mr-1 relative -top-px" />
              将在 {countdown} 秒后自动跳转...
            </div>
          )}

          {/* 处理中状态 */}
          {isProcessing && (
            <div className="mb-4 text-sm text-[--color-primary] font-medium animate-fade-in flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-[--color-primary]/30 border-t-[--color-primary] rounded-full animate-spin"></div>
              正在跳转...
            </div>
          )}

          {/* 操作按钮（仅手动确认或密码模式） */}
          {showButtons && !isProcessing && (
            <div className="flex gap-3 animate-fade-in">
              <button 
                onClick={handleCancel}
                className="flex-1 px-4 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors text-sm"
              >
                取消访问
              </button>
              <button 
                onClick={() => handleProceed()}
                disabled={hasPassword && !password}
                className={`flex-1 shine-effect bg-[--color-primary] text-white px-4 py-3 rounded-xl font-medium hover:bg-[--color-primary-hover] transition-colors shadow-lg shadow-blue-200 text-sm flex items-center justify-center gap-2 ${
                  hasPassword && !password ? 'opacity-50 cursor-not-allowed' : ''
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