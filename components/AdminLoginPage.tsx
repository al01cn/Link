'use client'

import { useState } from 'react'
import { Lock, User, Eye, EyeOff, AlertCircle, Shield, Globe } from 'lucide-react'
import { useAdmin } from '@/lib/AdminContext'
import { useLanguage } from '@/lib/LanguageContext'
import { useTheme } from '@/lib/ThemeContext'
import { useNotificationDialog } from '@/lib/useDialog'
import NotificationDialog from './NotificationDialog'

export default function AdminLoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAdmin()
  const { language, setLanguage, t } = useLanguage()
  
  // 获取主题状态用于调试和强制样式
  const { resolvedTheme } = useTheme()
  
  // 通知对话框 hook
  const notificationDialog = useNotificationDialog()
  
  const toggleLang = () => setLanguage(language === 'zh' ? 'en' : 'zh')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError(t('pleaseEnterUsernamePassword'))
      return
    }

    // 防止重复提交
    if (isLoading) return

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (response.ok) {
        // 传递默认账号标识给login函数
        await login(data.token, data.username, data.isDefault)
      } else {
        setError(data.error || t('loginFailed'))
      }
    } catch (error) {
      console.error('登录错误:', error)
      setError(t('networkError'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[--color-bg-surface] preview-grid flex items-center justify-center p-4">
      {/* 语言切换按钮 */}
      <div className="absolute top-6 right-6">
        <button 
          onClick={toggleLang}
          className="cute-btn w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/80 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 transition-colors relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm"
          title={t('switchLanguage')}
        >
          <Globe size={18} />
          <span className="sr-only">{t('switchLanguage')}</span>
          <span className="absolute -bottom-1 -right-1 text-[10px] font-bold bg-slate-200 dark:bg-slate-700 px-1 rounded text-slate-600 dark:text-slate-300">
            {language.toUpperCase()}
          </span>
        </button>
      </div>
      
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md animate__animated animate__fadeIn"
        style={{
          backgroundColor: resolvedTheme === 'dark' ? '#1e293b' : '#ffffff'
        }}
      >
        <div className="p-8">
          <div className="text-center mb-8">
            <div 
              className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{
                backgroundColor: resolvedTheme === 'dark' ? 'rgba(30, 58, 138, 0.3)' : '#dbeafe'
              }}
            >
              <Shield 
                className="text-blue-600 dark:text-blue-400" 
                size={32}
                style={{
                  color: resolvedTheme === 'dark' ? '#60a5fa' : '#2563eb'
                }}
              />
            </div>
            <h1 
              className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-2"
              style={{
                color: resolvedTheme === 'dark' ? '#e2e8f0' : '#1e293b'
              }}
            >
              {t('appTitle')} {t('management')}
            </h1>
            <p 
              className="text-slate-500 dark:text-slate-400"
              style={{
                color: resolvedTheme === 'dark' ? '#cbd5e1' : '#64748b'
              }}
            >
              {t('pleaseLoginToContinue')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div>
              <label 
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                style={{
                  color: resolvedTheme === 'dark' ? '#d1d5db' : '#374151'
                }}
              >
                {t('username')}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  style={{
                    backgroundColor: resolvedTheme === 'dark' ? '#334155' : '#ffffff',
                    borderColor: resolvedTheme === 'dark' ? '#64748b' : '#e2e8f0',
                    color: resolvedTheme === 'dark' ? '#f1f5f9' : '#0f172a'
                  }}
                  placeholder={t('enterUsername')}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label 
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                style={{
                  color: resolvedTheme === 'dark' ? '#d1d5db' : '#374151'
                }}
              >
                {t('loginPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  style={{
                    backgroundColor: resolvedTheme === 'dark' ? '#334155' : '#ffffff',
                    borderColor: resolvedTheme === 'dark' ? '#64748b' : '#e2e8f0',
                    color: resolvedTheme === 'dark' ? '#f1f5f9' : '#0f172a'
                  }}
                  placeholder={t('enterLoginPassword')}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !username.trim() || !password.trim()}
              className="w-full py-3 px-4 bg-blue-600 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('loggingIn')}
                </>
              ) : (
                t('login')
              )}
            </button>
          </form>


        </div>
      </div>

      {/* 通知对话框 */}
      <NotificationDialog
        isOpen={notificationDialog.isOpen}
        onClose={notificationDialog.onClose}
        title={notificationDialog.options.title}
        message={notificationDialog.options.message}
        type={notificationDialog.options.type}
        confirmText={notificationDialog.options.confirmText}
      />
    </div>
  )
}