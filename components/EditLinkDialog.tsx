'use client'

import { useState, useEffect, useRef } from 'react'
import { Link2, Lock, Shield, Zap, X, ExternalLink, Calendar, Save, AlertCircle } from 'lucide-react'
import { useConfirmDialog } from '@/lib/useDialog'
import { useLanguage } from '@/lib/LanguageContext'
import { useHostname } from '@/lib/useHostname'
import { truncateDomain } from '@/lib/utils'
import ConfirmDialog from './ConfirmDialog'

interface ShortLink {
  id: string
  path: string
  shortUrl: string
  originalUrl: string
  title?: string
  views: number
  createdAt: string
  hasPassword: boolean
  requireConfirm: boolean
  enableIntermediate: boolean
}

interface EditLinkDialogProps {
  isOpen: boolean
  link: ShortLink | null
  onClose: () => void
  onSave: (updatedLink: ShortLink) => void
  onError: (message: string) => void
}

export default function EditLinkDialog({ 
  isOpen, 
  link, 
  onClose,
  onSave, 
  onError 
}: EditLinkDialogProps) {
  const { t } = useLanguage()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const confirmDialog = useConfirmDialog()
  
  // 获取当前主机名（客户端专用）
  const hostname = useHostname()
  
  // 表单状态
  const [originalUrl, setOriginalUrl] = useState('')
  const [customPath, setCustomPath] = useState('')
  const [password, setPassword] = useState('')
  const [requireConfirm, setRequireConfirm] = useState(false)
  const [enableIntermediate, setEnableIntermediate] = useState(true)
  const [expiresAt, setExpiresAt] = useState('')
  
  // 表单验证状态
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 初始化表单数据
  useEffect(() => {
    if (link) {
      setOriginalUrl(link.originalUrl)
      setCustomPath(link.path)
      setPassword('') // 密码不显示，需要用户重新输入
      setRequireConfirm(link.requireConfirm)
      setEnableIntermediate(link.enableIntermediate)
      setExpiresAt('')
      setErrors({})
    }
  }, [link])

  // 处理密码变化，有密码时自动开启二次确认和中间页
  useEffect(() => {
    if (password.trim()) {
      setRequireConfirm(true)
      setEnableIntermediate(true)
    }
  }, [password])

  // 对话框显示/隐藏处理
  useEffect(() => {
    const initDialog = async () => {
      const dialog = dialogRef.current
      if (isOpen && dialog) {
        if (!dialog.showModal) {
          const dialogPolyfill = await import('dialog-polyfill')
          dialogPolyfill.default.registerDialog(dialog)
        }
        dialog.showModal()
      } else if (!isOpen && dialog && dialog.open) {
        dialog.close()
      }
    }
    initDialog()
  }, [isOpen])

  // 表单验证
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // URL验证
    if (!originalUrl.trim()) {
      newErrors.originalUrl = t('pleaseEnterUrl')
    } else {
      try {
        new URL(originalUrl)
      } catch {
        newErrors.originalUrl = t('pleaseEnterValidUrl')
      }
    }

    // 自定义路径验证
    if (customPath.trim()) {
      if (!/^[a-zA-Z0-9_-]+$/.test(customPath)) {
        newErrors.customPath = t('pathOnlyLettersNumbers')
      } else if (customPath.length < 1) {
        newErrors.customPath = t('pathMinLength')
      }
    }

    // 密码验证
    if (password.trim() && password.length < 4) {
      newErrors.password = t('passwordMinLength')
    }

    // 过期时间验证
    if (expiresAt) {
      const expireDate = new Date(expiresAt)
      if (expireDate <= new Date()) {
        newErrors.expiresAt = t('expireTimeMustBeFuture')
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 处理自动跳转开关变化
  const handleEnableIntermediateChange = (enabled: boolean) => {
    // 如果有密码，不允许禁用中间页
    if (!enabled && password.trim()) {
      return
    }
    setEnableIntermediate(enabled)
    if (enabled) {
      setRequireConfirm(false) // 开启自动跳转时关闭二次确认
    }
  }

  // 处理二次确认开关变化
  const handleRequireConfirmChange = (enabled: boolean) => {
    setRequireConfirm(enabled)
    if (enabled) {
      setEnableIntermediate(true) // 开启二次确认时必须启用中间页
    }
  }

  // 保存更改
  const handleSave = async () => {
    if (!link || !validateForm()) return

    // 防止重复提交
    if (isLoading) return

    setIsLoading(true)
    
    try {
      // 将本地时间转换为 UTC ISO 字符串
      let expiresAtISO: string | undefined = undefined
      if (expiresAt) {
        const localDate = new Date(expiresAt)
        expiresAtISO = localDate.toISOString()
      }
      
      const response = await fetch(`/api/links/${link.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalUrl,
          customPath: customPath || undefined,
          password: password || undefined,
          expiresAt: expiresAtISO,
          requireConfirm,
          enableIntermediate
        })
      })

      if (response.ok) {
        const updatedLink = await response.json()
        onSave(updatedLink)
        onClose()
      } else {
        const error = await response.json()
        onError(error.error || t('updateFailed'))
      }
    } catch (error) {
      console.error('更新短链失败:', error)
      onError(t('networkError'))
    } finally {
      setIsLoading(false)
    }
  }

  // 关闭对话框前确认
  const handleClose = async () => {
    if (isLoading) return

    // 检查是否有未保存的更改
    const hasChanges = link && (
      originalUrl !== link.originalUrl ||
      customPath !== link.path ||
      password.trim() !== '' ||
      requireConfirm !== link.requireConfirm ||
      enableIntermediate !== link.enableIntermediate ||
      expiresAt !== ''
    )

    if (hasChanges) {
      const confirmed = await confirmDialog.confirm({
        type: 'warning',
        title: t('confirmClose'),
        message: t('unsavedChanges'),
        confirmText: t('confirmClose'),
        cancelText: t('continueEditing')
      })
      
      if (!confirmed) return
    }

    onClose()
  }

  if (!link) return null

  return (
    <>
      <dialog 
        ref={dialogRef}
        className="backdrop:bg-black backdrop:bg-opacity-50 bg-transparent p-0 max-w-2xl w-full"
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <div className="bg-white rounded-lg shadow-xl p-6 max-h-[90vh] overflow-y-auto">
          {/* 对话框标题 */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Link2 size={24} className="text-blue-500" />
              {t('editShortLink')}
            </h3>
            <button 
              onClick={handleClose}
              disabled={isLoading}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* 表单内容 */}
          <div className="space-y-6">
            
            {/* 原始链接 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('originalUrlRequired')} <span className="text-red-500">*</span>
              </label>
              <div className={`cute-input-wrapper bg-white rounded-lg px-4 py-3 flex items-center gap-2 ${
                errors.originalUrl ? 'border-red-300 ring-1 ring-red-300' : ''
              }`}>
                <ExternalLink size={18} className="text-slate-400" />
                <input 
                  type="url" 
                  placeholder="https://example.com"
                  className="w-full bg-transparent outline-none text-slate-800"
                  value={originalUrl}
                  onChange={(e) => {
                    setOriginalUrl(e.target.value)
                    if (errors.originalUrl) {
                      setErrors(prev => ({ ...prev, originalUrl: '' }))
                    }
                  }}
                  disabled={isLoading}
                />
              </div>
              {errors.originalUrl && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.originalUrl}
                </p>
              )}
            </div>

            {/* 自定义路径 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {hostname && (
                  <span className="text-slate-400 text-sm" title={hostname}>
                    {truncateDomain(hostname, 25)}/
                  </span>
                )}
              </label>
              <div className={`cute-input-wrapper bg-white rounded-lg px-4 py-3 flex items-center gap-2 ${
                errors.customPath ? 'border-red-300 ring-1 ring-red-300' : ''
              }`}>
                <input 
                  type="text" 
                  placeholder={t('customPathPlaceholder')}
                  className="w-full bg-transparent outline-none text-slate-800"
                  value={customPath}
                  onChange={(e) => {
                    setCustomPath(e.target.value)
                    if (errors.customPath) {
                      setErrors(prev => ({ ...prev, customPath: '' }))
                    }
                  }}
                  disabled={isLoading}
                />
              </div>
              {errors.customPath && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.customPath}
                </p>
              )}
              <p className="text-xs text-slate-500 mt-1">
                {t('keepCurrentPath')}
              </p>
            </div>

            {/* 访问密码 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('accessPasswordOptional')}
              </label>
              <div className={`cute-input-wrapper bg-white rounded-lg px-4 py-3 flex items-center gap-2 ${
                errors.password ? 'border-red-300 ring-1 ring-red-300' : ''
              }`}>
                <Lock size={18} className="text-slate-400" />
                <input 
                  type="text" 
                  placeholder={t('setPassword')}
                  className="w-full bg-transparent outline-none text-slate-800"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) {
                      setErrors(prev => ({ ...prev, password: '' }))
                    }
                  }}
                  disabled={isLoading}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.password}
                </p>
              )}
              {link.hasPassword && !password.trim() && (
                <p className="text-xs text-amber-600 mt-1">
                  {t('keepCurrentPassword')}
                </p>
              )}
            </div>

            {/* 过期时间 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('expirationTimeOptional')}
              </label>
              <div className={`cute-input-wrapper bg-white rounded-lg px-4 py-3 flex items-center gap-2 ${
                errors.expiresAt ? 'border-red-300 ring-1 ring-red-300' : ''
              }`}>
                <Calendar size={18} className="text-slate-400" />
                <input 
                  type="datetime-local" 
                  className="w-full bg-transparent outline-none text-slate-800"
                  value={expiresAt}
                  onChange={(e) => {
                    setExpiresAt(e.target.value)
                    if (errors.expiresAt) {
                      setErrors(prev => ({ ...prev, expiresAt: '' }))
                    }
                  }}
                  disabled={isLoading}
                />
              </div>
              {errors.expiresAt && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.expiresAt}
                </p>
              )}
              <p className="text-xs text-slate-500 mt-1">
                {t('neverExpire')}
              </p>
            </div>

            {/* 开关选项 */}
            <div className="space-y-3">
              
              {/* 开启过渡页 */}
              <label className={`flex items-center justify-between p-3 rounded-lg border transition-colors group ${
                password.trim() ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-60' : 'border-slate-100 hover:bg-slate-50 cursor-pointer'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                    <Zap size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-700">{t('enableTransitionPageAuto')}</span>
                    <span className="text-xs text-slate-500">
                      {password.trim() ? t('autoEnabledWithPassword') : t('showTransitionPage')}
                    </span>
                  </div>
                </div>
                <div className="relative w-10 h-6">
                  <input 
                    type="checkbox" 
                    className="peer sr-only cute-switch-checkbox" 
                    checked={enableIntermediate} 
                    disabled={password.trim() !== '' || isLoading}
                    onChange={() => handleEnableIntermediateChange(!enableIntermediate)} 
                  />
                  <div className={`w-full h-full rounded-full transition-colors ${
                    password.trim() 
                      ? 'bg-slate-300 dark:bg-slate-600' 
                      : enableIntermediate 
                        ? 'bg-[var(--color-primary)]' 
                        : 'bg-slate-200 dark:bg-slate-600'
                  }`}></div>
                  <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
                    enableIntermediate ? 'translate-x-4' : 'translate-x-0'
                  }`}></div>
                </div>
              </label>

              {/* 强制二次确认 */}
              <label className={`flex items-center justify-between p-3 rounded-lg border transition-colors group ${
                password.trim() ? 'border-orange-200 bg-orange-50' : 'border-slate-100 hover:bg-slate-50'
              } cursor-pointer`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center">
                    <Shield size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-700">{t('forceConfirmManual')}</span>
                    <span className="text-xs text-slate-500">
                      {password.trim() ? t('autoEnabledWithPassword') : t('requireUserConfirm')}
                    </span>
                  </div>
                </div>
                <div className="relative w-10 h-6">
                  <input 
                    type="checkbox" 
                    className="peer sr-only cute-switch-checkbox" 
                    checked={requireConfirm} 
                    disabled={isLoading}
                    onChange={() => handleRequireConfirmChange(!requireConfirm)} 
                  />
                  <div className={`w-full h-full rounded-full transition-colors ${
                    requireConfirm 
                      ? 'bg-[var(--color-primary)]' 
                      : 'bg-slate-200 dark:bg-slate-600'
                  }`}></div>
                  <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
                    requireConfirm ? 'translate-x-4' : 'translate-x-0'
                  }`}></div>
                </div>
              </label>

            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3 mt-8">
            <button 
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {t('cancel')}
            </button>
            <button 
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {t('saving')}
                </>
              ) : (
                <>
                  <Save size={16} />
                  {t('saveChanges')}
                </>
              )}
            </button>
          </div>
        </div>
      </dialog>

      {/* 确认对话框 */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={confirmDialog.onClose}
        onConfirm={confirmDialog.onConfirm}
        type={confirmDialog.options.type}
        title={confirmDialog.options.title}
        message={confirmDialog.options.message}
        confirmText={confirmDialog.options.confirmText}
        cancelText={confirmDialog.options.cancelText}
      />
    </>
  )
}