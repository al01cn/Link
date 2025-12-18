'use client'

import { useState, useRef, useEffect } from 'react'
import { AlertTriangle, Eye, EyeOff, Lock, User, Shield } from 'lucide-react'
import { TranslationKey } from '@/lib/translations'

interface ForcePasswordChangeDialogProps {
  isOpen: boolean
  username: string
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
  onPasswordChanged: () => void
}

export default function ForcePasswordChangeDialog({ 
  isOpen, 
  username, 
  t, 
  onPasswordChanged 
}: ForcePasswordChangeDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newUsername, setNewUsername] = useState(username)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // 控制dialog的打开
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      dialog.showModal()
    }
  }, [isOpen])

  // 验证表单
  const validateForm = () => {
    if (!currentPassword.trim()) {
      setError(t('enterCurrentPassword'))
      return false
    }
    if (!newUsername.trim()) {
      setError(t('enterNewUsername'))
      return false
    }
    if (newPassword.length < 6) {
      setError(t('newPasswordMinLength'))
      return false
    }
    if (newPassword !== confirmPassword) {
      setError(t('passwordMismatch'))
      return false
    }
    
    // 防止使用默认凭据
    if (newUsername === 'Loooong' && newPassword === 'Loooong123') {
      setError(t('cannotUseDefaultCredentials'))
      return false
    }
    
    // 防止单独使用默认用户名或密码
    if (newUsername === 'Loooong') {
      setError(t('cannotUseDefaultUsername'))
      return false
    }
    
    if (newPassword === 'Loooong123') {
      setError(t('cannotUseDefaultPassword'))
      return false
    }
    
    return true
  }

  // 提交修改
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const token = sessionStorage.getItem('adminToken')
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newUsername,
          newPassword
        })
      })

      const data = await response.json()

      if (response.ok) {
        // 密码修改成功，清除当前token，用户需要重新登录
        sessionStorage.removeItem('adminToken')
        sessionStorage.removeItem('adminUsername')
        onPasswordChanged()
      } else {
        setError(data.error || t('modifyFailed'))
      }
    } catch (error) {
      console.error('修改密码错误:', error)
      setError(t('networkErrorRetry'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <dialog 
      ref={dialogRef}
      className="backdrop:bg-black/80 backdrop:backdrop-blur-sm bg-transparent p-0 max-w-md w-full rounded-2xl"
      onClose={(e) => {
        // 阻止关闭对话框
        e.preventDefault()
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* 警告头部 */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle size={24} />
            <h2 className="text-xl font-bold">{t('securityWarning')}</h2>
          </div>
          <p className="text-red-100 text-sm">
            {t('defaultPasswordRisk')}
          </p>
        </div>

        {/* 表单内容 */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 当前密码 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('currentPassword')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  placeholder={t('enterCurrentPassword')}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* 新用户名 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('newUsername')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full pl-10 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  placeholder={t('enterNewUsername')}
                  required
                />
              </div>
            </div>

            {/* 新密码 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('newPassword')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  placeholder={t('enterNewPassword')}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* 确认新密码 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('confirmNewPassword')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  placeholder={t('enterNewPasswordAgain')}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* 安全提示 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-700 text-sm">
                <strong>{t('securityRecommendations')}</strong>
                <br />• {t('useStrongPassword')}
                <br />• {t('avoidEasyGuess')}
                <br />• {t('regularlyChange')}
              </p>
            </div>

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('changingPassword')}
                </>
              ) : (
                <>
                  <Shield size={20} />
                  {t('changePasswordNow')}
                </>
              )}
            </button>
          </form>

          {/* 底部说明 */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center">
              {t('cannotCloseDialog')}
            </p>
          </div>
        </div>
      </div>
    </dialog>
  )
}