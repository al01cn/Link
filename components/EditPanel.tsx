'use client'

import { useState, useEffect } from 'react'
import { Link2, Lock, Shield, Zap, X, ExternalLink, Calendar, Save, AlertCircle } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'

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

interface EditPanelProps {
  link: ShortLink
  isExpanded: boolean
  onSave: (linkId: string, updateData: any) => Promise<void>
  onCancel: () => void
}

export default function EditPanel({ link, isExpanded, onSave, onCancel }: EditPanelProps) {
  const { t } = useLanguage()
  // 表单状态
  const [originalUrl, setOriginalUrl] = useState('')
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
      setCustomPath(link.path)
      setPassword('') // 密码不显示，需要用户重新输入
      setRequireConfirm(link.requireConfirm)
      setEnableIntermediate(link.enableIntermediate)
      setExpiresAt('')
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
      } else if (customPath.length < 3) {
        newErrors.customPath = t('pathMinLength')
      } else if (customPath.length > 50) {
        newErrors.customPath = t('pathMaxLength')
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
    if (!validateForm()) return

    setIsLoading(true)
    
    try {
      await onSave(link.id, {
        originalUrl,
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
        <div className="border-t border-slate-100 p-4 bg-slate-50/50">
          {/* 编辑表单 */}
          <div className="space-y-4">
            
            {/* 原始链接 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('originalUrl')} <span className="text-red-500">*</span>
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

            <div className="grid md:grid-cols-2 gap-4">
              {/* 自定义路径 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('customPath')}
                </label>
                <div className={`cute-input-wrapper bg-white rounded-lg px-4 py-3 flex items-center gap-2 ${
                  errors.customPath ? 'border-red-300 ring-1 ring-red-300' : ''
                }`}>
                  <span className="text-slate-400 text-sm">
                    {process.env.NEXT_PUBLIC_BASE_URL?.replace(/^https?:\/\//, '') || 'localhost:3000'}/
                  </span>
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
              </div>

              {/* 访问密码 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('accessPassword')}
                </label>
                <div className={`cute-input-wrapper bg-white rounded-lg px-4 py-3 flex items-center gap-2 ${
                  errors.password ? 'border-red-300 ring-1 ring-red-300' : ''
                }`}>
                  <Lock size={18} className="text-slate-400" />
                  <input 
                    type="text" 
                    placeholder={t('setAccessPassword')}
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
                    {t('currentPasswordSet')}
                  </p>
                )}
              </div>
            </div>

            {/* 过期时间 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('editPanelExpirationTime')}
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
                {t('leaveEmptyForNeverExpire')}
              </p>
            </div>

            {/* 开关选项 */}
            <div className="grid md:grid-cols-2 gap-3">
              
              {/* 开启过渡页 */}
              <label className={`flex items-center justify-between p-3 rounded-lg border transition-colors group ${
                password.trim() ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-60' : 'border-slate-100 hover:bg-slate-50 cursor-pointer'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                    <Zap size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-700">{t('enableTransitionPage')}</span>
                    <span className="text-xs text-slate-500">
                      {password.trim() ? '设置密码时自动启用' : '显示跳转确认页面'}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="peer sr-only cute-switch-checkbox" 
                    checked={enableIntermediate} 
                    disabled={password.trim() !== '' || isLoading}
                    onChange={() => handleEnableIntermediateChange(!enableIntermediate)} 
                  />
                  <div className={`w-10 h-6 rounded-full transition-colors ${
                    password.trim() ? 'bg-slate-300' : 'bg-slate-200 peer-checked:bg-blue-500'
                  }`}>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm"></div>
                  </div>
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
                    <span className="text-sm font-medium text-slate-700">强制二次确认</span>
                    <span className="text-xs text-slate-500">
                      {password.trim() ? '设置密码时自动启用' : '需要用户确认'}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="peer sr-only cute-switch-checkbox" 
                    checked={requireConfirm} 
                    disabled={isLoading}
                    onChange={() => handleRequireConfirmChange(!requireConfirm)} 
                  />
                  <div className="w-10 h-6 bg-slate-200 rounded-full transition-colors peer-checked:bg-blue-500">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm"></div>
                  </div>
                </div>
              </label>

            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3 pt-2">
              <button 
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button 
                onClick={handleSave}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    保存中...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    保存更改
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