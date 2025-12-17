'use client'

import { useState, useEffect, useRef } from 'react'
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle, X, User } from 'lucide-react'
import { useAdmin } from '@/lib/AdminContext'
import { useLanguage } from '@/lib/LanguageContext'
// 动态导入dialog-polyfill避免SSR问题

interface AdminSettingsProps {
  onClose: () => void
}

export default function AdminSettings({ onClose }: AdminSettingsProps) {
  const { logout } = useAdmin()
  const { t } = useLanguage()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)

  // 初始化 dialog polyfill 并打开弹窗
  useEffect(() => {
    const initDialog = async () => {
      const dialog = dialogRef.current
      if (dialog) {
        // 为不支持原生 dialog 的浏览器添加 polyfill
        if (!dialog.showModal) {
          const dialogPolyfill = await import('dialog-polyfill')
          dialogPolyfill.default.registerDialog(dialog)
        }
        dialog.showModal()
      }
    }

    initDialog()

    return () => {
      const dialog = dialogRef.current
      if (dialog && dialog.open) {
        dialog.close()
      }
    }
  }, [])

  // 处理弹窗关闭
  const handleClose = () => {
    const dialog = dialogRef.current
    if (dialog) {
      dialog.close()
    }
    onClose()
  }

  // 处理点击背景关闭
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current
    if (dialog && e.target === dialog) {
      handleClose()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentPassword.trim() || !newUsername.trim() || !newPassword.trim()) {
      setError(t('pleaseEnterAllFields'))
      return
    }

    if (newPassword !== confirmPassword) {
      setError(t('passwordMismatch'))
      return
    }

    if (newPassword.length < 6) {
      setError(t('newPasswordMinLength'))
      return
    }

    // 防止重复提交
    if (isLoading) return

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          currentPassword,
          newUsername,
          newPassword
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          logout() // 登出，要求用新凭据重新登录
          handleClose()
        }, 2000)
      } else {
        setError(data.error || t('modifyFailed'))
      }
    } catch (error) {
      console.error('修改管理员信息错误:', error)
      setError(t('networkErrorRetry'))
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <dialog 
        ref={dialogRef}
        className="backdrop:bg-black/50 bg-transparent p-4 rounded-2xl"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate__animated animate__fadeIn">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">{t('modifySuccess')}</h2>
            <p className="text-slate-500 text-sm mb-6">{t('adminInfoUpdated')}</p>
            <div className="w-8 h-8 border-2 border-green-300 border-t-green-600 rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      </dialog>
    )
  }

  return (
    <dialog 
      ref={dialogRef}
      className="backdrop:bg-black/50 bg-transparent p-4 rounded-2xl"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate__animated animate__fadeIn">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800">{t('adminSettings')}</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-400"
              disabled={isLoading}
            >
              <X size={20} />
            </button>
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
                {t('currentPassword')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder={t('enterCurrentPassword')}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  disabled={isLoading}
                >
                  {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('newUsername')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder={t('enterNewUsername')}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('newPassword')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder={t('enterNewPassword')}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  disabled={isLoading}
                >
                  {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('confirmNewPassword')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder={t('enterNewPasswordAgain')}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  disabled={isLoading}
                >
                  {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-3 px-4 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                disabled={isLoading}
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('saving')}
                  </>
                ) : (
                  t('saveChanges')
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </dialog>
  )
}