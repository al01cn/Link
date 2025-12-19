'use client'

import { useState, useEffect } from 'react'
import { Lock, Shield, Zap, ExternalLink, Calendar, Save, AlertCircle } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'
import { useHostname } from '@/lib/useHostname'
import { truncateDomain } from '@/lib/utils'

interface ShortLink {
  id: string
  path: string
  shortUrl: string
  originalUrl: string
  title?: string
  description?: string
  views: number
  createdAt: string
  expiresAt?: string
  hasPassword: boolean
  requireConfirm: boolean
  enableIntermediate: boolean
}

interface EditPanelProps {
  link: ShortLink
  isExpanded: boolean
  onSave: (linkId: string, updateData: any) => Promise<void>
  onCancel: () => void
}

export default function EditPanel({ link, isExpanded, onSave, onCancel }: EditPanelProps) {
  const { t } = useLanguage()
  
  // 获取当前主机名（客户端专用）
  const hostname = useHostname()
  
  // 表单状态
  const [originalUrl, setOriginalUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [customPath, setCustomPath] = useState('')
  const [password, setPassword] = useState('')
  const [requireConfirm, setRequireConfirm] = useState(false)
  const [enableIntermediate, setEnableIntermediate] = useState(true)
  const [expiresAt, setExpiresAt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // 表单验证状态
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 初始化表单数据
  useEffect(() => {
    if (link && isExpanded) {
      setOriginalUrl(link.originalUrl)
      setTitle(link.title || '')
      setDescription(link.description || '')
      setCustomPath(link.path)
      setPassword('') // 密码不显示，需要用户重新输入
      setRequireConfirm(link.requireConfirm)
      setEnableIntermediate(link.enableIntermediate)
      // 设置现有的过期时间
      if (link.expiresAt) {
        const expireDate = new Date(link.expiresAt)
        // 转换为本地时间格式 (YYYY-MM-DDTHH:mm)
        const localDateTime = new Date(expireDate.getTime() - expireDate.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16)
        setExpiresAt(localDateTime)
      } else {
        setExpiresAt('')
      }
      setErrors({})
    }
  }, [link, isExpanded])

  // 处理密码变化，有密码时自动开启二次确认和中间页
  useEffect(() => {
    if (password.trim()) {
      setRequireConfirm(true)
      setEnableIntermediate(true)
    }
  }, [password])

  // 检查是否有密码保护（现有密码或新输入的密码）
  const hasPasswordProtection = link.hasPassword || password.trim() !== ''

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

    // 标题验证
    if (title.trim() && title.length > 100) {
      newErrors.title = t('titleLengthError')
    }

    // 简介验证
    if (description.trim() && description.length > 200) {
      newErrors.description = t('descriptionLengthError')
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
    // 如果有密码保护，不允许禁用中间页
    if (!enabled && hasPasswordProtection) {
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
    if (!validateForm()) return

    setIsLoading(true)
    
    try {
      await onSave(link.id, {
        originalUrl,
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        customPath: customPath || undefined,
        password: password || undefined,
        expiresAt: expiresAt || undefined,
        requireConfirm,
        enableIntermediate
      })
    } catch (error) {
      console.error('保存失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`grid overflow-hidden transition-all duration-300 ease-out ${
      isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
    }`}>
      <div className="min-h-0">
        <div className="border-t border-slate-100 dark:border-slate-700 p-4">
          {/* 编辑表单 */}
          <div className="space-y-4">
            
            {/* 原始链接 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('originalUrl')} <span className="text-red-500">*</span>
              </label>
              <div className={`cute-input-wrapper bg-white dark:bg-slate-800 rounded-lg px-4 py-3 flex items-center gap-2 ${
                errors.originalUrl ? 'border-red-300 dark:border-red-400' : ''
              }`}>
                <ExternalLink size={18} className="text-slate-400 dark:text-slate-500" />
                <input 
                  type="url" 
                  placeholder="https://example.com"
                  className="w-full bg-transparent outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
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

            <div className="grid md:grid-cols-2 gap-4">
              {/* 自定义标题 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('customTitle')}
                </label>
                <div className={`cute-input-wrapper bg-white dark:bg-slate-800 rounded-lg px-4 py-3 flex items-center gap-2 ${
                  errors.title ? 'border-red-300 dark:border-red-400' : ''
                }`}>
                  <input 
                    type="text" 
                    placeholder={t('customTitlePlaceholder')}
                    className="w-full bg-transparent outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value)
                      if (errors.title) {
                        setErrors(prev => ({ ...prev, title: '' }))
                      }
                    }}
                    disabled={isLoading}
                  />
                </div>
                {errors.title && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.title}
                  </p>
                )}
              </div>

              {/* 简介描述 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('customDescription')}
                </label>
                <div className={`cute-input-wrapper bg-white dark:bg-slate-800 rounded-lg px-4 py-3 flex items-center gap-2 ${
                  errors.description ? 'border-red-300 dark:border-red-400' : ''
                }`}>
                  <input 
                    type="text" 
                    placeholder={t('customDescriptionPlaceholder')}
                    className="w-full bg-transparent outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value)
                      if (errors.description) {
                        setErrors(prev => ({ ...prev, description: '' }))
                      }
                    }}
                    disabled={isLoading}
                  />
                </div>
                {errors.description && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.description}
                  </p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* 自定义路径 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {hostname && (
                    <span className="text-slate-400 dark:text-slate-500 text-sm" title={hostname}>
                      {truncateDomain(hostname, 25)}/
                    </span>
                  )}
                </label>
                <div className={`cute-input-wrapper bg-white dark:bg-slate-800 rounded-lg px-4 py-3 flex items-center gap-2 ${
                  errors.customPath ? 'border-red-300 dark:border-red-400' : ''
                }`}>
                  <input 
                    type="text" 
                    placeholder={t('customPathPlaceholder')}
                    className="w-full bg-transparent outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
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
              </div>

              {/* 访问密码 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('accessPassword')}
                </label>
                <div className={`cute-input-wrapper bg-white dark:bg-slate-800 rounded-lg px-4 py-3 flex items-center gap-2 ${
                  errors.password ? 'border-red-300 dark:border-red-400' : ''
                }`}>
                  <Lock size={18} className="text-slate-400 dark:text-slate-500" />
                  <input 
                    type="text" 
                    placeholder={t('setAccessPassword')}
                    className="w-full bg-transparent outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
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
                    {t('currentPasswordSet')}
                  </p>
                )}
              </div>
            </div>

            {/* 过期时间 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('editPanelExpirationTime')}
              </label>
              <div className={`cute-input-wrapper bg-white dark:bg-slate-800 rounded-lg px-4 py-3 flex items-center gap-2 ${
                errors.expiresAt ? 'border-red-300 dark:border-red-400' : ''
              }`}>
                <Calendar size={18} className="text-slate-400 dark:text-slate-500" />
                <input 
                  type="datetime-local" 
                  className="w-full bg-transparent outline-none text-slate-800 dark:text-slate-200"
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
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t('leaveEmptyForNeverExpire')}
              </p>
            </div>

            {/* 开关选项 */}
            <div className="grid md:grid-cols-2 gap-3">
              
              {/* 开启过渡页 */}
              <label className={`flex items-center justify-between p-3 rounded-lg border transition-colors group ${
                hasPasswordProtection ? 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 cursor-not-allowed opacity-60' : 'border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/50 text-blue-500 dark:text-blue-400 flex items-center justify-center">
                    <Zap size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('enableTransitionPage')}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {hasPasswordProtection ? t('autoEnabledWithPassword') : t('showTransitionPage')}
                    </span>
                  </div>
                </div>
                <div className="relative w-10 h-6">
                  <input 
                    type="checkbox" 
                    className="peer sr-only cute-switch-checkbox" 
                    checked={enableIntermediate} 
                    disabled={hasPasswordProtection || isLoading}
                    onChange={() => handleEnableIntermediateChange(!enableIntermediate)} 
                  />
                  <div className={`w-full h-full rounded-full transition-colors ${
                    hasPasswordProtection 
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
                hasPasswordProtection ? 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 cursor-not-allowed opacity-60' : 'border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-900/50 text-orange-500 dark:text-orange-400 flex items-center justify-center">
                    <Shield size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('forceConfirmManual')}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {hasPasswordProtection ? t('autoEnabledWithPassword') : t('requireUserConfirm')}
                    </span>
                  </div>
                </div>
                <div className="relative w-10 h-6">
                  <input 
                    type="checkbox" 
                    className="peer sr-only cute-switch-checkbox" 
                    checked={requireConfirm} 
                    disabled={hasPasswordProtection || isLoading}
                    onChange={() => handleRequireConfirmChange(!requireConfirm)} 
                  />
                  <div className={`w-full h-full rounded-full transition-colors ${
                    hasPasswordProtection 
                      ? 'bg-slate-300 dark:bg-slate-600' 
                      : requireConfirm 
                        ? 'bg-[var(--color-primary)]' 
                        : 'bg-slate-200 dark:bg-slate-600'
                  }`}></div>
                  <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
                    requireConfirm ? 'translate-x-4' : 'translate-x-0'
                  }`}></div>
                </div>
              </label>

            </div>

            {/* 重置按钮 - 仅在数据库中已设置密码时显示 */}
            {link.hasPassword && (
              <div className="pt-2">
                <button
                  onClick={async () => {
                    setIsLoading(true)
                    try {
                      // 直接保存重置后的状态到数据库
                      await onSave(link.id, {
                        originalUrl,
                        title: title.trim() || undefined,
                        description: description.trim() || undefined,
                        customPath: customPath || undefined,
                        password: '', // 清空密码
                        expiresAt: expiresAt || undefined,
                        requireConfirm: false, // 关闭二次确认
                        enableIntermediate: true // 启用自动跳转
                      })
                      // 重置成功后更新前端状态
                      setPassword('')
                      setRequireConfirm(false)
                      setEnableIntermediate(true)
                    } catch (error) {
                      console.error('重置失败:', error)
                    } finally {
                      setIsLoading(false)
                    }
                  }}
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {t('resetPasswordMode')}
                </button>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 text-center">
                  {t('resetPasswordModeDesc')}
                </p>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-3 pt-2">
              <button 
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {t('cancel')}
              </button>
              <button 
                onClick={handleSave}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
        </div>
      </div>
    </div>
  )
}