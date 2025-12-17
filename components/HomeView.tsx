'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Link2, ArrowRight, Settings, ChevronDown, Lock, Shield, Zap, Eye, Copy, Trash2, X, Search, Filter, Calendar, SortAsc, SortDesc, MousePointer, ExternalLink, Edit } from 'lucide-react'
import { formatTimeAgo } from '@/lib/utils'
import { TranslationKey } from '@/lib/translations'
import { useConfirmDialog, useNotificationDialog } from '@/lib/useDialog'
import ConfirmDialog from './ConfirmDialog'
import NotificationDialog from './NotificationDialog'
import EditPanel from './EditPanel'
// 动态导入dialog-polyfill避免SSR问题

interface ShortLink {
  id: string // 改为UUID字符串类型
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

interface HomeViewProps {
  onSimulateVisit: (link: ShortLink) => void
  t: (key: TranslationKey) => string
}

export default function HomeView({ onSimulateVisit, t }: HomeViewProps) {
  const [url, setUrl] = useState('')
  const [links, setLinks] = useState<ShortLink[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copySuccess, setCopySuccess] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  
  // 搜索和筛选状态
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'password' | 'confirm' | 'auto' | 'direct'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'views' | 'title'>('newest')
  const [showFilters, setShowFilters] = useState(false)
  
  // 对话框 hooks
  const confirmDialog = useConfirmDialog()
  const notificationDialog = useNotificationDialog()
  
  // 密码弹窗状态
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [loadingPassword, setLoadingPassword] = useState(false)
  const [loadingPasswordId, setLoadingPasswordId] = useState<string | null>(null)
  
  // 管理员验证弹窗状态
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [currentLinkId, setCurrentLinkId] = useState<string | null>(null)
  const [adminError, setAdminError] = useState('')
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false)
  const adminDialogRef = useRef<HTMLDialogElement>(null)
  const passwordDialogRef = useRef<HTMLDialogElement>(null)
  
  // 编辑展开状态
  const [expandedEditId, setExpandedEditId] = useState<string | null>(null)
  
  // 检查管理员登录状态
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('adminToken')
      setIsAdminLoggedIn(!!token)
    }
  }, [showAdminModal])

  // 管理员弹窗效果
  useEffect(() => {
    const initAdminDialog = async () => {
      const dialog = adminDialogRef.current
      if (showAdminModal && dialog) {
        if (!dialog.showModal) {
          const dialogPolyfill = await import('dialog-polyfill')
          dialogPolyfill.default.registerDialog(dialog)
        }
        dialog.showModal()
      } else if (!showAdminModal && dialog && dialog.open) {
        dialog.close()
      }
    }
    initAdminDialog()
  }, [showAdminModal])

  // 密码弹窗效果
  useEffect(() => {
    const initPasswordDialog = async () => {
      const dialog = passwordDialogRef.current
      if (showPasswordModal && dialog) {
        if (!dialog.showModal) {
          const dialogPolyfill = await import('dialog-polyfill')
          dialogPolyfill.default.registerDialog(dialog)
        }
        dialog.showModal()
      } else if (!showPasswordModal && dialog && dialog.open) {
        dialog.close()
      }
    }
    initPasswordDialog()
  }, [showPasswordModal])
  
  // 高级选项状态
  const [customPath, setCustomPath] = useState('')
  const [password, setPassword] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [requireConfirm, setRequireConfirm] = useState(false)
  const [enableIntermediate, setEnableIntermediate] = useState(true)
  
  // 表单验证状态
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // 处理密码变化，有密码时自动开启二次确认和中间页
  useEffect(() => {
    if (password.trim()) {
      setRequireConfirm(true)
      setEnableIntermediate(true) // 有密码时必须启用中间页来显示密码输入框
    }
  }, [password])

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

  // 客户端水合完成后启用动画
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 加载短链列表
  useEffect(() => {
    fetchLinks()
  }, [])

  const fetchLinks = async () => {
    try {
      const response = await fetch('/api/links')
      if (response.ok) {
        const data = await response.json()
        setLinks(data)
      }
    } catch (error) {
      console.error('获取短链列表失败:', error)
    }
  }

  // 表单验证函数
  const validateCreateForm = () => {
    const errors: Record<string, string> = {}

    // URL验证
    if (!url.trim()) {
      errors.url = '请输入链接地址'
    } else {
      try {
        new URL(url)
      } catch {
        errors.url = '请输入有效的URL格式'
      }
    }

    // 自定义路径验证
    if (customPath.trim()) {
      if (!/^[a-zA-Z0-9_-]+$/.test(customPath)) {
        errors.customPath = '路径只能包含字母、数字、下划线和连字符'
      } else if (customPath.length < 3) {
        errors.customPath = '路径长度至少3个字符'
      } else if (customPath.length > 50) {
        errors.customPath = '路径长度不能超过50个字符'
      }
    }

    // 密码验证
    if (password.trim() && password.length < 4) {
      errors.password = '密码长度至少4个字符'
    }

    // 过期时间验证
    if (expiresAt) {
      const expireDate = new Date(expiresAt)
      if (expireDate <= new Date()) {
        errors.expiresAt = '过期时间必须晚于当前时间'
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const generateLink = async () => {
    if (!url || !validateCreateForm()) return
    
    setIsGenerating(true)
    
    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalUrl: url,
          customPath: customPath || undefined,
          password: password || undefined,
          expiresAt: expiresAt || undefined,
          requireConfirm,
          enableIntermediate
        })
      })

      if (response.ok) {
        const newLink = await response.json()
        setLinks([newLink, ...links])
        
        // 重置表单
        setUrl('')
        setCustomPath('')
        setPassword('')
        setExpiresAt('')
        setRequireConfirm(false)
        setEnableIntermediate(true)
        setShowAdvanced(false)
        setFormErrors({})
      } else {
        const error = await response.json()
        
        // 处理重复链接的情况
        if (response.status === 409 && error.existingLink) {
          const confirmed = await confirmDialog.confirm({
            type: 'warning',
            title: '链接已存在',
            message: `该链接已存在短链：${error.existingLink.shortUrl}\n\n是否要复制现有短链？`,
            confirmText: '复制链接',
            cancelText: '取消'
          })
          
          if (confirmed) {
            copyToClipboard(error.existingLink.shortUrl, error.existingLink.id)
          }
        } else {
          notificationDialog.notify({
            type: 'error',
            message: error.error || t('generateFailed')
          })
        }
      }
    } catch (error) {
      console.error('生成短链失败:', error)
      notificationDialog.notify({
        type: 'error',
        message: t('generateFailed')
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess(id.toString())
      setTimeout(() => setCopySuccess(null), 2000)
    } catch (error) {
      console.error('复制失败:', error)
    }
  }

  const deleteLink = async (id: string) => {
    const confirmed = await confirmDialog.confirm({
      type: 'danger',
      title: '确认删除',
      message: t('confirmDelete'),
      confirmText: '删除',
      cancelText: '取消'
    })
    
    if (!confirmed) return
    
    try {
      const response = await fetch(`/api/links/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setLinks(links.filter(link => link.id !== id))
      } else {
        notificationDialog.notify({
          type: 'error',
          message: t('deleteFailed')
        })
      }
    } catch (error) {
      console.error('删除失败:', error)
      notificationDialog.notify({
        type: 'error',
        message: t('deleteFailed')
      })
    }
  }

  const showPassword = (id: string) => {
    setCurrentLinkId(id)
    setLoadingPasswordId(id)
    setAdminError('')
    setShowAdminModal(true)
  }

  const verifyAdminAndShowPassword = async () => {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('adminToken') : null
    if (!token) {
      setAdminError('请先登录管理员账户')
      return
    }

    if (!currentLinkId) return

    setLoadingPassword(true)
    setAdminError('')
    
    try {
      const response = await fetch(`/api/links/${currentLinkId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // 检查是否真的有密码
        if (!data.hasPassword || !data.password) {
          setAdminError('该链接没有设置密码')
          return
        }
        
        setCurrentPassword(data.password)
        setShowAdminModal(false)
        setShowPasswordModal(true)
      } else {
        const errorData = await response.json()
        if (response.status === 401) {
          setAdminError('管理员权限已过期，请重新登录')
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('adminToken')
          }
        } else {
          setAdminError(errorData.error || '获取密码失败')
        }
      }
    } catch (error) {
      console.error('获取密码失败:', error)
      setAdminError('网络错误，请重试')
    } finally {
      setLoadingPassword(false)
      setLoadingPasswordId(null)
    }
  }

  const closeAdminModal = () => {
    setShowAdminModal(false)
    setAdminError('')
    setCurrentLinkId(null)
    setLoadingPasswordId(null)
  }

  const closePasswordModal = () => {
    setShowPasswordModal(false)
    setCurrentPassword('')
  }

  // 切换编辑展开状态
  const toggleEditExpand = (link: ShortLink) => {
    if (expandedEditId === link.id) {
      setExpandedEditId(null)
    } else {
      setExpandedEditId(link.id)
    }
  }

  // 处理编辑保存
  const handleEditSave = async (linkId: string, updateData: any) => {
    try {
      const response = await fetch(`/api/links/${linkId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        const updatedLink = await response.json()
        setLinks(links.map(link => 
          link.id === updatedLink.id ? updatedLink : link
        ))
        setExpandedEditId(null)
        notificationDialog.notify({
          type: 'success',
          message: '短链更新成功'
        })
      } else {
        const error = await response.json()
        notificationDialog.notify({
          type: 'error',
          message: error.error || '更新失败'
        })
      }
    } catch (error) {
      console.error('更新短链失败:', error)
      notificationDialog.notify({
        type: 'error',
        message: '网络错误，请重试'
      })
    }
  }

  // 筛选和排序逻辑
  const filteredAndSortedLinks = useMemo(() => {
    let filtered = links

    // 搜索筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(link => 
        link.shortUrl.toLowerCase().includes(query) ||
        link.originalUrl.toLowerCase().includes(query) ||
        (link.title && link.title.toLowerCase().includes(query)) ||
        link.path.toLowerCase().includes(query)
      )
    }

    // 类型筛选
    if (filterType !== 'all') {
      filtered = filtered.filter(link => {
        switch (filterType) {
          case 'password':
            return link.hasPassword
          case 'confirm':
            return link.requireConfirm && !link.hasPassword
          case 'auto':
            return !link.hasPassword && !link.requireConfirm && link.enableIntermediate
          case 'direct':
            return !link.hasPassword && !link.requireConfirm && !link.enableIntermediate
          default:
            return true
        }
      })
    }

    // 排序
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'views':
          return b.views - a.views
        case 'title':
          const aTitle = (a.title || a.originalUrl).toLowerCase()
          const bTitle = (b.title || b.originalUrl).toLowerCase()
          return aTitle.localeCompare(bTitle)
        default:
          return 0
      }
    })

    return sorted
  }, [links, searchQuery, filterType, sortBy])

  // 清空搜索
  const clearSearch = () => {
    setSearchQuery('')
    setFilterType('all')
    setSortBy('newest')
  }

  return (
    <div className="max-w-3xl mx-auto w-full px-4 pb-20">
      
      {/* 标题区域 */}
      <div className={`text-center mt-12 mb-10 ${isClient ? 'animate__animated animate__fadeInDown' : ''}`}>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-4 tracking-tight">
          {t('heroTitle')}<span className="text-[var(--color-primary)]">{t('heroTitleHighlight')}</span> Links
        </h1>
        <p className="text-slate-500 text-lg">{t('heroDesc')}</p>
      </div>

      {/* 输入区域 */}
      <div className={`cute-card p-2 md:p-3 mb-8 shadow-xl shadow-blue-100/50 relative z-10 ${isClient ? 'animate__animated animate__fadeInUp' : ''}`}>
        <div className="flex flex-col md:flex-row gap-2">
          <div className={`cute-input-wrapper flex-1 bg-slate-50 rounded-xl px-4 py-3 flex items-center gap-3 ${
            formErrors.url ? 'border-2 border-red-300' : ''
          }`}>
            <Link2 className="text-slate-400" />
            <input 
              type="text" 
              placeholder={t('inputPlaceholder')}
              className="flex-1 bg-transparent border-none outline-none text-lg text-slate-800 placeholder-slate-400"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                if (formErrors.url) {
                  setFormErrors(prev => ({ ...prev, url: '' }))
                }
              }}
              onKeyDown={(e) => e.key === 'Enter' && generateLink()}
            />
          </div>
          {formErrors.url && (
            <p className="text-xs text-red-500 mt-1 ml-2">{formErrors.url}</p>
          )}
          <button 
            onClick={generateLink}
            disabled={isGenerating || !url}
            className={`cute-btn shine-effect bg-[var(--color-primary)] text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg shadow-blue-200 hover:bg-[var(--color-primary-hover)] flex items-center justify-center gap-2 min-w-[140px] ${
              isGenerating || !url ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isGenerating ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>{t('generate')} <ArrowRight size={20} /></>
            )}
          </button>
        </div>

        {/* 高级选项 */}
        <div className="mt-2 px-2">
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs font-semibold text-slate-500 hover:text-[var(--color-primary)] flex items-center gap-1 py-2 transition-colors"
          >
            <Settings size={14} />
            {showAdvanced ? t('collapseOptions') : t('advancedOptions')}
            <ChevronDown size={14} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {/* 可折叠面板 */}
          <div className={`grid gap-4 overflow-hidden transition-all duration-300 ease-out ${
            showAdvanced ? 'grid-rows-[1fr] opacity-100 pt-4 pb-2 border-t border-slate-100 mt-2' : 'grid-rows-[0fr] opacity-0 h-0'
          }`}>
            <div className="min-h-0 space-y-4">
              
              {/* 第一行：自定义地址和访问密码 */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* 自定义地址 */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1 ml-1">{t('customAddress')}</label>
                  <div className={`cute-input-wrapper bg-white rounded-lg px-3 py-2 flex items-center gap-2 text-sm ${
                    formErrors.customPath ? 'border border-red-300' : ''
                  }`}>
                    <span className="text-slate-400">{process.env.NEXT_PUBLIC_BASE_URL?.replace(/^https?:\/\//, '') || 'localhost:3000'}/</span>
                    <input 
                      type="text" 
                      placeholder={t('customAddressPlaceholder')}
                      className="w-full outline-none text-slate-700"
                      value={customPath}
                      onChange={(e) => {
                        setCustomPath(e.target.value)
                        if (formErrors.customPath) {
                          setFormErrors(prev => ({ ...prev, customPath: '' }))
                        }
                      }}
                    />
                  </div>
                  {formErrors.customPath && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.customPath}</p>
                  )}
                </div>

                {/* 访问密码 */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1 ml-1">{t('password')}</label>
                  <div className={`cute-input-wrapper bg-white rounded-lg px-3 py-2 flex items-center gap-2 text-sm ${
                    formErrors.password ? 'border border-red-300' : ''
                  }`}>
                    <Lock size={14} className="text-slate-400" />
                    <input 
                      type="text" 
                      placeholder={t('passwordPlaceholder')}
                      className="w-full outline-none text-slate-700"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (formErrors.password) {
                          setFormErrors(prev => ({ ...prev, password: '' }))
                        }
                      }}
                    />
                  </div>
                  {formErrors.password && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>
                  )}
                </div>
              </div>

              {/* 第二行：过期时间 */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 ml-1">过期时间</label>
                <div className={`cute-input-wrapper bg-white rounded-lg px-3 py-2 flex items-center gap-2 text-sm ${
                  formErrors.expiresAt ? 'border border-red-300' : ''
                }`}>
                  <Calendar size={14} className="text-slate-400" />
                  <input 
                    type="datetime-local" 
                    placeholder="设置过期时间"
                    className="w-full outline-none text-slate-700"
                    value={expiresAt}
                    onChange={(e) => {
                      setExpiresAt(e.target.value)
                      if (formErrors.expiresAt) {
                        setFormErrors(prev => ({ ...prev, expiresAt: '' }))
                      }
                    }}
                  />
                </div>
                {formErrors.expiresAt && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.expiresAt}</p>
                )}
                <p className="text-xs text-slate-500 mt-1">留空表示永不过期</p>
              </div>

              {/* 第三行：开关选项 */}
              <div className="flex flex-col gap-3">
                
                {/* 开启过渡页 */}
                <label className={`flex items-center justify-between p-3 rounded-lg border transition-colors group ${
                  password.trim() ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-60' : 'border-slate-100 hover:bg-slate-50 cursor-pointer'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-[var(--color-primary)] flex items-center justify-center">
                      <Zap size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-700">{t('enableIntermediate')}</span>
                      {password.trim() && (
                        <span className="text-xs text-slate-400">设置密码时自动禁用</span>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="peer sr-only cute-switch-checkbox" 
                      checked={enableIntermediate} 
                      disabled={password.trim() !== ''}
                      onChange={() => handleEnableIntermediateChange(!enableIntermediate)} 
                    />
                    <div className={`w-10 h-6 rounded-full transition-colors ${
                      password.trim() ? 'bg-slate-300' : 'bg-slate-200 peer-checked:bg-[var(--color-primary)]'
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
                    <div className="w-8 h-8 rounded-full bg-orange-50 text-[var(--color-warning)] flex items-center justify-center">
                      <Shield size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-700">{t('enableConfirm')}</span>
                      {password.trim() && (
                        <span className="text-xs text-orange-500">设置密码时自动启用</span>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="peer sr-only cute-switch-checkbox" 
                      checked={requireConfirm} 
                      onChange={() => handleRequireConfirmChange(!requireConfirm)} 
                    />
                    <div className="w-10 h-6 bg-slate-200 rounded-full transition-colors peer-checked:bg-[var(--color-primary)]">
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm"></div>
                    </div>
                  </div>
                </label>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 搜索和筛选区域 */}
      {links.length > 0 && (
        <div className={`cute-card p-4 mb-6 ${isClient ? 'animate__animated animate__fadeInUp' : ''}`}>
          {/* 搜索框 */}
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="cute-input-wrapper flex-1 bg-slate-50 rounded-lg px-4 py-3 flex items-center gap-3">
              <Search className="text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="搜索短链、原链接或标题..."
                className="flex-1 bg-transparent border-none outline-none text-slate-700 placeholder-slate-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            
            {/* 筛选按钮 */}
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                showFilters || filterType !== 'all' || sortBy !== 'newest'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Filter size={18} />
              筛选
              {(filterType !== 'all' || sortBy !== 'newest') && (
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              )}
            </button>
          </div>

          {/* 筛选选项面板 */}
          <div className={`grid gap-4 overflow-hidden transition-all duration-300 ease-out ${
            showFilters ? 'grid-rows-[1fr] opacity-100 pt-4 border-t border-slate-100' : 'grid-rows-[0fr] opacity-0 h-0'
          }`}>
            <div className="min-h-0 grid md:grid-cols-2 gap-4">
              
              {/* 类型筛选 */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">链接类型</label>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => setFilterType('all')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filterType === 'all' 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    全部
                  </button>
                  <button 
                    onClick={() => setFilterType('password')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                      filterType === 'password' 
                        ? 'bg-orange-100 text-orange-700 border border-orange-200' 
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Lock size={14} />
                    密码
                  </button>
                  <button 
                    onClick={() => setFilterType('confirm')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                      filterType === 'confirm' 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Shield size={14} />
                    确认
                  </button>
                  <button 
                    onClick={() => setFilterType('auto')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                      filterType === 'auto' 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Zap size={14} />
                    自动跳转
                  </button>
                  <button 
                    onClick={() => setFilterType('direct')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                      filterType === 'direct' 
                        ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <ExternalLink size={14} />
                    直接跳转
                  </button>
                </div>
              </div>

              {/* 排序选项 */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">排序方式</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setSortBy('newest')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                      sortBy === 'newest' 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Calendar size={14} />
                    最新
                  </button>
                  <button 
                    onClick={() => setSortBy('oldest')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                      sortBy === 'oldest' 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Calendar size={14} />
                    最早
                  </button>
                  <button 
                    onClick={() => setSortBy('views')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                      sortBy === 'views' 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Eye size={14} />
                    访问量
                  </button>
                  <button 
                    onClick={() => setSortBy('title')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                      sortBy === 'title' 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <SortAsc size={14} />
                    标题
                  </button>
                </div>
              </div>
            </div>

            {/* 清空筛选 */}
            {(searchQuery || filterType !== 'all' || sortBy !== 'newest') && (
              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button 
                  onClick={clearSearch}
                  className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  清空筛选
                </button>
              </div>
            )}
          </div>

          {/* 搜索结果统计 */}
          {(searchQuery || filterType !== 'all') && (
            <div className="mt-3 pt-3 border-t border-slate-100 text-sm text-slate-500">
              找到 {filteredAndSortedLinks.length} 个结果
              {searchQuery && ` (搜索: "${searchQuery}")`}
              {filterType !== 'all' && ` (类型: ${
                filterType === 'password' ? '密码保护' :
                filterType === 'confirm' ? '二次确认' :
                filterType === 'auto' ? '自动跳转' :
                filterType === 'direct' ? '直接跳转' : ''
              })`}
            </div>
          )}
        </div>
      )}

      {/* 短链列表 */}
      <div className="space-y-4">
        {filteredAndSortedLinks.map((link, idx) => (
          <div 
            key={link.id} 
            className={`cute-card ${isClient ? 'animate__animated animate__fadeInUp' : ''}`}
            style={isClient ? { animationDelay: `${idx * 0.1}s` } : {}}
          >
            {/* 短链信息行 */}
            <div className="p-4 flex flex-col md:flex-row items-center gap-4">
              {/* 图标 */}
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center flex-shrink-0 text-slate-400">
                {link.hasPassword ? (
                  <Lock size={20} className="text-orange-600" />
                ) : link.requireConfirm ? (
                  <Shield size={20} className="text-green-600" />
                ) : link.enableIntermediate ? (
                  <Zap size={20} className="text-blue-600" />
                ) : (
                  <ExternalLink size={20} className="text-purple-600" />
                )}
              </div>

              {/* 信息 */}
              <div className="flex-1 min-w-0 text-center md:text-left w-full">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                  <h3 
                    className="font-bold text-lg text-[var(--color-primary)] cursor-pointer hover:underline truncate"
                    onClick={() => onSimulateVisit(link)}
                  >
                    {link.shortUrl}
                  </h3>
                  <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md border border-slate-200 hidden md:inline-block">
                    {formatTimeAgo(new Date(link.createdAt))}
                  </span>
                </div>
                <p className="text-sm text-slate-500 truncate max-w-md mx-auto md:mx-0">
                  {link.title || link.originalUrl}
                </p>
              </div>

              {/* 统计和操作 */}
              <div className="flex items-center gap-6 text-slate-500 text-sm">
                <div className="flex items-center gap-1" title={t('views')}>
                  <Eye size={16} />
                  <span>{link.views}</span>
                </div>
                
                {/* 操作按钮 */}
                <div className="flex items-center gap-2 pl-4 border-l border-slate-100">
                  {/* 密码查看按钮 - 仅在有密码时显示 */}
                  {link.hasPassword && (
                    <button 
                      className="p-2 hover:bg-orange-50 rounded-lg text-slate-500 hover:text-orange-600 transition-colors active:scale-95"
                      title="查看密码"
                      onClick={() => showPassword(link.id)}
                      disabled={loadingPasswordId === link.id}
                    >
                      {loadingPasswordId === link.id ? (
                        <div className="w-4 h-4 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  )}
                  <button 
                    className={`p-2 rounded-lg transition-colors active:scale-95 ${
                      expandedEditId === link.id 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'hover:bg-blue-50 text-slate-500 hover:text-blue-600'
                    }`}
                    title="编辑"
                    onClick={() => toggleEditExpand(link)}
                  >
                    <Edit size={18} />
                  </button>
                  <button 
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-[var(--color-primary)] transition-colors active:scale-95"
                    title={copySuccess === link.id.toString() ? t('copied') : t('copy')}
                    onClick={() => copyToClipboard(link.shortUrl, link.id)}
                  >
                    <Copy size={18} />
                  </button>
                  <button 
                    className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-[var(--color-error)] transition-colors active:scale-95"
                    title={t('delete')}
                    onClick={() => deleteLink(link.id)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* 编辑面板 */}
            <EditPanel 
              link={link}
              isExpanded={expandedEditId === link.id}
              onSave={handleEditSave}
              onCancel={() => setExpandedEditId(null)}
            />
          </div>
        ))}
        
        {/* 空状态显示 */}
        {links.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Link2 size={48} className="mx-auto mb-4 opacity-50" />
            <p>{t('noLinks')}</p>
            <p className="text-sm">{t('noLinksDesc')}</p>
          </div>
        )}
        
        {/* 搜索无结果 */}
        {links.length > 0 && filteredAndSortedLinks.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Search size={48} className="mx-auto mb-4 opacity-50" />
            <p>没有找到匹配的短链</p>
            <p className="text-sm">尝试调整搜索条件或筛选选项</p>
            <button 
              onClick={clearSearch}
              className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
            >
              清空筛选
            </button>
          </div>
        )}
      </div>

      {/* 管理员验证弹窗 */}
      {showAdminModal && (
        <dialog 
          ref={adminDialogRef}
          className="backdrop:bg-black/50 bg-transparent p-4 rounded-2xl"
          onClick={(e) => e.target === adminDialogRef.current && closeAdminModal()}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate__animated animate__fadeIn animate__faster">
            {/* 弹窗标题 */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Shield size={20} className="text-blue-500" />
                管理员验证
              </h3>
              <button 
                onClick={closeAdminModal}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* 说明文字 */}
            <p className="text-sm text-slate-600 mb-4">
              查看密码需要管理员权限，请确认您已登录管理员账户：
            </p>

            {/* 登录状态检查 */}
            <div className="mb-6">
              <div className={`bg-slate-50 rounded-lg p-4 flex items-center gap-3 ${
                adminError ? 'border border-red-300' : 'border border-slate-200'
              }`}>
                <Shield size={20} className={isAdminLoggedIn ? 'text-green-500' : 'text-slate-400'} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">
                    {isAdminLoggedIn ? '管理员已登录' : '需要管理员登录'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {isAdminLoggedIn ? '点击下方按钮查看密码' : '请先在设置页面登录管理员账户'}
                  </p>
                </div>
              </div>
              {adminError && (
                <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                  <X size={12} />
                  {adminError}
                </p>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <button 
                onClick={closeAdminModal}
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                disabled={loadingPassword}
              >
                取消
              </button>
              <button 
                onClick={verifyAdminAndShowPassword}
                disabled={loadingPassword || !isAdminLoggedIn}
                className={`flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  loadingPassword || !isAdminLoggedIn ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loadingPassword ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    获取中...
                  </>
                ) : (
                  <>
                    <Shield size={16} />
                    查看密码
                  </>
                )}
              </button>
            </div>
          </div>
        </dialog>
      )}

      {/* 密码显示弹窗 */}
      {showPasswordModal && (
        <dialog 
          ref={passwordDialogRef}
          className="backdrop:bg-black/50 bg-transparent p-4 rounded-2xl"
          onClick={(e) => e.target === passwordDialogRef.current && setShowPasswordModal(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate__animated animate__fadeIn animate__faster">
            {/* 弹窗标题 */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Lock size={20} className="text-orange-500" />
                链接密码
              </h3>
              <button 
                onClick={closePasswordModal}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* 密码显示区域 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-600 mb-2">
                访问密码
              </label>
              <div className="cute-input-wrapper bg-slate-50 rounded-lg px-4 py-3 flex items-center gap-3">
                <Lock size={16} className="text-slate-400" />
                <input 
                  type="text" 
                  value={currentPassword}
                  readOnly
                  className="flex-1 bg-transparent border-none outline-none text-slate-800 font-mono"
                  placeholder={currentPassword ? "" : "密码获取中..."}
                />
                {currentPassword && (
                  <button 
                    onClick={() => copyToClipboard(currentPassword, 'password')}
                    className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-[var(--color-primary)] transition-colors"
                    title="复制密码"
                  >
                    <Copy size={16} />
                  </button>
                )}
              </div>
              {currentPassword && (
                <p className="text-xs text-slate-500 mt-2">
                  密码长度：{currentPassword.length} 个字符
                </p>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end">
              <button 
                onClick={closePasswordModal}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </dialog>
      )}

      {/* 确认对话框 */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={confirmDialog.onClose}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.options.title}
        message={confirmDialog.options.message}
        confirmText={confirmDialog.options.confirmText}
        cancelText={confirmDialog.options.cancelText}
        type={confirmDialog.options.type}
      />

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