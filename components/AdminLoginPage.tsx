'use client'

import { useState } from 'react'
import { Lock, User, Eye, EyeOff, AlertCircle, Shield, Globe } from 'lucide-react'
import { useAdmin } from '@/lib/AdminContext'
import { useTranslation, type Language } from '@/lib/translations'
import { useNotificationDialog } from '@/lib/useDialog'
import NotificationDialog from './NotificationDialog'

export default function AdminLoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [lang, setLang] = useState<Language>('zh')
  const { login } = useAdmin()
  const t = useTranslation(lang)
  
  // 通知对话框 hook
  const notificationDialog = useNotificationDialog()
  
  const toggleLang = () => setLang(prev => prev === 'zh' ? 'en' : 'zh')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError(t('pleaseEnterUsernamePassword'))
      return
    }

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
        login(data.token, data.username)
        
        // 如果是默认账户，提示修改密码
        if (data.isDefault) {
          notificationDialog.notify({
            type: 'warning',
            title: '安全提醒',
            message: t('defaultAccountWarning')
          })
        }
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
          className="cute-btn w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/80 text-slate-600 transition-colors relative bg-white/60 backdrop-blur-sm"
          title={t('switchLanguage')}
        >
          <Globe size={18} />
          <span className="sr-only">{t('switchLanguage')}</span>
          <span className="absolute -bottom-1 -right-1 text-[10px] font-bold bg-slate-200 px-1 rounded text-slate-600">
            {lang.toUpperCase()}
          </span>
        </button>
      </div>
      
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate__animated animate__fadeIn">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="text-blue-600" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">{t('appTitle')} {t('management')}</h1>
            <p className="text-slate-500">{t('pleaseLoginToContinue')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('username')}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder={t('enterUsername')}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('loginPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder={t('enterLoginPassword')}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !username.trim() || !password.trim()}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
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

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              {t('defaultAccount')}: Loooong / Loooong123
            </p>
          </div>
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