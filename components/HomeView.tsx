'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Link2, ArrowRight, Settings, ChevronDown, Lock, Shield, Zap, Eye, Copy, Trash2, X, Search, Filter, Calendar, SortAsc, SortDesc, MousePointer, ExternalLink, Edit, Check } from 'lucide-react'
import { formatTimeAgo, formatTimeRemaining, getHostname } from '@/lib/utils'
import { TranslationKey } from '@/lib/translations'
import { useConfirmDialog, useNotificationDialog } from '@/lib/useDialog'
import { requestCache } from '@/lib/requestCache'
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
  expiresAt?: string // 添加过期时间字段
  hasPassword: boolean
  requireConfirm: boolean
  enableIntermediate: boolean
}

interface HomeViewProps {
  onSimulateVisit: (link: ShortLink) => void
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
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
  const [filterType, setFilterType] = useState<'all' | 'password' | 'confirm' | 'auto' | 'direct' | 'expired' | 'active'>('all')
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
  
  // 主题状态
  const [isDarkMode, setIsDarkMode] = useState(false)
  
  // 检查管理员登录状态
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('adminToken')
      setIsAdminLoggedIn(!!token)
    }
  }, [showAdminModal])

  // 初始化主题状态
  useEffect(() => {
    if (typeof document !== 'undefined') {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    }
  }, [])

  // 监听主题变化
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          setIsDarkMode(document.documentElement.classList.contains('dark'))
        }
      })
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [])

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
        // 确保弹窗继承暗色模式
        const isDark = document.documentElement.classList.contains('dark')
        if (isDark) {
          dialog.classList.add('dark')
        } else {
          dialog.classList.remove('dark')
        }
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
        // 确保弹窗继承暗色模式
        const isDark = document.documentElement.classList.contains('dark')
        if (isDark) {
          dialog.classList.add('dark')
        } else {
          dialog.classList.remove('dark')
        }
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
    let isMounted = true // 防止组件卸载后设置状态
    
    const loadLinks = async () => {
      try {
        const token = typeof window !== 'undefined' ? sessionStorage.getItem('adminToken') : null
        if (!token) {
          console.error('未找到管理员token')
          return
        }

        const data = await requestCache.get('links', async () => {
          const response = await fetch('/api/links', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          if (response.ok) {
            return response.json()
          }
          throw new Error('获取短链列表失败')
        })
        
        if (isMounted) {
          setLinks(data)
        }
      } catch (error) {
        console.error('获取短链列表失败:', error)
      }
    }

    loadLinks()

    return () => {
      isMounted = false
    }
  }, [])

  const fetchLinks = async () => {
    try {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('adminToken') : null
      if (!token) {
        console.error('未找到管理员token')
        return
      }

      // 刷新时清除缓存，确保获取最新数据
      requestCache.clear()
      const response = await fetch('/api/links', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setLinks(data)
      } else if (response.status === 401) {
        notificationDialog.notify({
          type: 'error',
          message: '管理员权限已过期，请重新登录'
        })
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
      errors.url = t('pleaseEnterUrl')
    } else {
      try {
        new URL(url)
      } catch {
        errors.url = t('pleaseEnterValidUrl')
      }
    }

    // 自定义路径验证
    if (customPath.trim()) {
      if (!/^[a-zA-Z0-9_-]+$/.test(customPath)) {
        errors.customPath = t('pathOnlyLettersNumbers')
      } else if (customPath.length < 3) {
        errors.customPath = t('pathMinLength')
      } else if (customPath.length > 50) {
        errors.customPath = t('pathMaxLength')
      }
    }

    // 密码验证
    if (password.trim() && password.length < 4) {
      errors.password = t('passwordMinLength')
    }

    // 过期时间验证
    if (expiresAt) {
      const expireDate = new Date(expiresAt)
      if (expireDate <= new Date()) {
        errors.expiresAt = t('expireTimeMustBeFuture')
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const generateLink = async () => {
    if (!url || !validateCreateForm()) return
    
    // 防止重复提交
    if (isGenerating) return
    
    setIsGenerating(true)
    
    try {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('adminToken') : null
      if (!token) {
        notificationDialog.notify({
          type: 'error',
          message: '未找到管理员权限，请重新登录'
        })
        return
      }

      const response = await fetch('/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
            title: t('linkExists'),
            message: t('linkExistsMessage', { shortUrl: error.existingLink.shortUrl }),
            confirmText: t('copyExistingLink'),
            cancelText: t('cancel')
          })
          
          if (confirmed) {
            copyToClipboard(error.existingLink.shortUrl, error.existingLink.id)
          }
        } else {
          if (response.status === 401) {
            notificationDialog.notify({
              type: 'error',
              message: '管理员权限已过期，请重新登录'
            })
          } else {
            notificationDialog.notify({
              type: 'error',
              message: error.error || t('generateFailed')
            })
          }
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
      title: t('confirmDeleteTitle'),
      message: t('confirmDelete'),
      confirmText: t('delete'),
      cancelText: t('cancel')
    })
    
    if (!confirmed) return
    
    // 防止重复删除
    const linkExists = links.find(link => link.id === id)
    if (!linkExists) return
    
    try {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('adminToken') : null
      if (!token) {
        notificationDialog.notify({
          type: 'error',
          message: '未找到管理员权限，请重新登录'
        })
        return
      }

      const response = await fetch(`/api/links/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        setLinks(links.filter(link => link.id !== id))
      } else {
        if (response.status === 401) {
          notificationDialog.notify({
            type: 'error',
            message: '管理员权限已过期，请重新登录'
          })
        } else {
          notificationDialog.notify({
            type: 'error',
            message: t('deleteFailed')
          })
        }
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
      setAdminError(t('pleaseLoginAdminFirst'))
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
          setAdminError(t('noPasswordSet'))
          return
        }
        
        setCurrentPassword(data.password)
        setShowAdminModal(false)
        setShowPasswordModal(true)
      } else {
        const errorData = await response.json()
        if (response.status === 401) {
          setAdminError(t('adminTokenExpired'))
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('adminToken')
          }
        } else {
          setAdminError(errorData.error || t('getPasswordFailed'))
        }
      }
    } catch (error) {
      console.error('获取密码失败:', error)
      setAdminError(t('networkErrorRetry'))
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
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('adminToken') : null
      if (!token) {
        notificationDialog.notify({
          type: 'error',
          message: '未找到管理员权限，请重新登录'
        })
        return
      }

      const response = await fetch(`/api/links/${linkId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
          message: t('updateSuccess')
        })
      } else {
        const error = await response.json()
        if (response.status === 401) {
          notificationDialog.notify({
            type: 'error',
            message: '管理员权限已过期，请重新登录'
          })
        } else {
          notificationDialog.notify({
            type: 'error',
            message: error.error || t('updateFailed')
          })
        }
      }
    } catch (error) {
      console.error('更新短链失败:', error)
      notificationDialog.notify({
        type: 'error',
        message: t('networkErrorRetry')
      })
    }
  }

  // 检查链接是否过期
  const isLinkExpired = (link: ShortLink) => {
    if (!link.expiresAt) return false
    return new Date(link.expiresAt) <= new Date()
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
          case 'expired':
            return isLinkExpired(link)
          case 'active':
            return !isLinkExpired(link)
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
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 dark:text-slate-200 mb-4 tracking-tight">
          {t('heroTitle')}<span className="text-[var(--color-primary)]">{t('heroTitleHighlight')}</span> Links
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg">{t('heroDesc')}</p>
      </div>

      {/* 输入区域 */}
      <div className={`cute-card p-2 md:p-3 mb-8 relative z-10 ${isClient ? 'animate__animated animate__fadeInUp' : ''}`}>
        <div className="flex flex-col md:flex-row gap-2">
          <div className={`cute-input-wrapper flex-1 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 flex items-center gap-3 ${
            formErrors.url ? 'border-2 border-red-300 dark:border-red-400' : ''
          }`}>
            <Link2 className="text-slate-400 dark:text-slate-500" />
            <input 
              type="text" 
              placeholder={t('inputPlaceholder')}
              className="flex-1 bg-transparent border-none outline-none text-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
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
            className={`cute-btn shine-effect bg-[var(--color-primary)] text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg shadow-blue-200 dark:shadow-slate-900/50 hover:bg-[var(--color-primary-hover)] flex items-center justify-center gap-2 min-w-[140px] ${
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
            className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-[var(--color-primary)] flex items-center gap-1 py-2 transition-colors"
          >
            <Settings size={14} />
            {showAdvanced ? t('collapseOptions') : t('advancedOptions')}
            <ChevronDown size={14} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {/* 可折叠面板 */}
          <div className={`grid gap-4 overflow-hidden transition-all duration-300 ease-out ${
            showAdvanced ? 'grid-rows-[1fr] opacity-100 pt-4 pb-2 border-t border-slate-100 dark:border-slate-700 mt-2' : 'grid-rows-[0fr] opacity-0 h-0'
          }`}>
            <div className="min-h-0 space-y-4">
              
              {/* 第一行：自定义地址和访问密码 */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* 自定义地址 */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 ml-1">{t('customAddress')}</label>
                  <div className={`cute-input-wrapper bg-white dark:bg-slate-800 rounded-lg px-3 py-2 flex items-center gap-2 text-sm ${
                    formErrors.customPath ? 'border border-red-300 dark:border-red-400' : ''
                  }`}>
                    <span className="text-slate-400 dark:text-slate-500">{getHostname()}/</span>
                    <input 
                      type="text" 
                      placeholder={t('customAddressPlaceholder')}
                      className="w-full outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
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
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 ml-1">{t('password')}</label>
                  <div className={`cute-input-wrapper bg-white dark:bg-slate-800 rounded-lg px-3 py-2 flex items-center gap-2 text-sm ${
                    formErrors.password ? 'border border-red-300 dark:border-red-400' : ''
                  }`}>
                    <Lock size={14} className="text-slate-400 dark:text-slate-500" />
                    <input 
                      type="text" 
                      placeholder={t('passwordPlaceholder')}
                      className="w-full outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
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
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 ml-1">{t('setExpirationTime')}</label>
                <div className={`cute-input-wrapper bg-white dark:bg-slate-800 rounded-lg px-3 py-2 flex items-center gap-2 text-sm ${
                  formErrors.expiresAt ? 'border border-red-300 dark:border-red-400' : ''
                }`}>
                  <Calendar size={14} className="text-slate-400 dark:text-slate-500" />
                  <input 
                    type="datetime-local" 
                    placeholder={t('setExpirationTime')}
                    className="w-full outline-none text-slate-700 dark:text-slate-200"
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
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('leaveEmptyNeverExpire')}</p>
              </div>

              {/* 第三行：开关选项 */}
              <div className="flex flex-col gap-3">
                
                {/* 开启过渡页 */}
                <label className={`flex items-center justify-between p-3 rounded-lg border transition-colors group ${
                  password.trim() ? 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 cursor-not-allowed opacity-60' : 'border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-[var(--color-primary)] flex items-center justify-center">
                      <Zap size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('enableIntermediate')}</span>
                      {password.trim() && (
                        <span className="text-xs text-slate-400">{t('autoDisabledWithPassword')}</span>
                      )}
                    </div>
                  </div>
                  <div className="relative w-10 h-6">
                    <input 
                      type="checkbox" 
                      className="peer sr-only cute-switch-checkbox" 
                      checked={enableIntermediate} 
                      disabled={password.trim() !== ''}
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
                  password.trim() ? 'border-orange-200 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/30' : 'border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                } cursor-pointer`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-50 text-[var(--color-warning)] flex items-center justify-center">
                      <Shield size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('enableConfirm')}</span>
                      {password.trim() && (
                        <span className="text-xs text-orange-500">{t('formAutoEnabledWithPassword')}</span>
                      )}
                    </div>
                  </div>
                  <div className="relative w-10 h-6">
                    <input 
                      type="checkbox" 
                      className="peer sr-only cute-switch-checkbox" 
                      checked={requireConfirm} 
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
          </div>
        </div>
      </div>

      {/* 搜索和筛选区域 */}
      {links.length > 0 && (
        <div className={`cute-card p-4 mb-6 ${isClient ? 'animate__animated animate__fadeInUp' : ''}`}>
          {/* 搜索框 */}
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="cute-input-wrapper flex-1 bg-slate-50 dark:bg-slate-800 rounded-lg px-4 py-3 flex items-center gap-3">
              <Search className="text-slate-400 dark:text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder={t('searchPlaceholder')}
                className="flex-1 bg-transparent border-none outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
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
              {t('filter')}
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
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">{t('linkType')}</label>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => setFilterType('all')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filterType === 'all' 
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                        : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                    }`}
                  >
                    {t('allFilter')}
                  </button>
                  <button 
                    onClick={() => setFilterType('active')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                      filterType === 'active' 
                        ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700' 
                        : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                    }`}
                  >
                    <Check size={14} />
                    {t('activeFilter')}
                  </button>
                  <button 
                    onClick={() => setFilterType('expired')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                      filterType === 'expired' 
                        ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700' 
                        : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                    }`}
                  >
                    <X size={14} />
                    {t('expiredFilter')}
                  </button>
                  <button 
                    onClick={() => setFilterType('password')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                      filterType === 'password' 
                        ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-700' 
                        : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                    }`}
                  >
                    <Lock size={14} />
                    {t('passwordFilter')}
                  </button>
                  <button 
                    onClick={() => setFilterType('confirm')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                      filterType === 'confirm' 
                        ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700' 
                        : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                    }`}
                  >
                    <Shield size={14} />
                    {t('confirmFilter')}
                  </button>
                  <button 
                    onClick={() => setFilterType('auto')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                      filterType === 'auto' 
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                        : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                    }`}
                  >
                    <Zap size={14} />
                    {t('autoRedirectType')}
                  </button>
                  <button 
                    onClick={() => setFilterType('direct')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                      filterType === 'direct' 
                        ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700' 
                        : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                    }`}
                  >
                    <ExternalLink size={14} />
                    {t('directRedirectType')}
                  </button>
                </div>
              </div>

              {/* 排序选项 */}
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">{t('sortBy')}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setSortBy('newest')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                      sortBy === 'newest' 
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                        : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                    }`}
                  >
                    <Calendar size={14} />
                    {t('newest')}
                  </button>
                  <button 
                    onClick={() => setSortBy('oldest')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                      sortBy === 'oldest' 
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                        : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                    }`}
                  >
                    <Calendar size={14} />
                    {t('oldest')}
                  </button>
                  <button 
                    onClick={() => setSortBy('views')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                      sortBy === 'views' 
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                        : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                    }`}
                  >
                    <Eye size={14} />
                    {t('viewsSort')}
                  </button>
                  <button 
                    onClick={() => setSortBy('title')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                      sortBy === 'title' 
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                        : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                    }`}
                  >
                    <SortAsc size={14} />
                    {t('titleSort')}
                  </button>
                </div>
              </div>
            </div>

            {/* 清空筛选 */}
            {(searchQuery || filterType !== 'all' || sortBy !== 'newest') && (
              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button 
                  onClick={clearSearch}
                  className="px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  {t('clearFilter')}
                </button>
              </div>
            )}
          </div>

          {/* 搜索结果统计 */}
          {(searchQuery || filterType !== 'all') && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
              {t('foundResults', { count: filteredAndSortedLinks.length })}
              {searchQuery && ` (${t('searchTerm')}: "${searchQuery}")`}
              {filterType !== 'all' && ` (${t('typeTerm')}: ${
                filterType === 'password' ? t('passwordProtectedType') :
                filterType === 'confirm' ? t('confirmType') :
                filterType === 'auto' ? t('autoRedirectType') :
                filterType === 'direct' ? t('directRedirectType') :
                filterType === 'expired' ? t('expiredFilter') :
                filterType === 'active' ? t('activeFilter') : ''
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
              <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 text-slate-400 dark:text-slate-500">
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
                    className={`font-bold text-lg cursor-pointer hover:underline truncate ${
                      isLinkExpired(link) 
                        ? 'text-red-500 dark:text-red-400 line-through' 
                        : 'text-[var(--color-primary)]'
                    }`}
                    onClick={() => onSimulateVisit(link)}
                  >
                    {link.shortUrl}
                  </h3>
                  <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-600 hidden md:inline-block">
                    {formatTimeAgo(new Date(link.createdAt))}
                  </span>
                  {/* 过期状态标签 */}
                  {isLinkExpired(link) && (
                    <span className="text-xs bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-md border border-red-200 dark:border-red-700">
                      {t('expiredFilter')}
                    </span>
                  )}
                  {/* 过期时间显示 */}
                  {link.expiresAt && !isLinkExpired(link) && (() => {
                    const remaining = formatTimeRemaining(new Date(link.expiresAt))
                    return (
                      <span className="text-xs bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-md border border-orange-200 dark:border-orange-700">
                        {remaining.isImminentExpiry ? t('imminentExpiry') : t('expiresIn', { time: remaining.time })}
                      </span>
                    )
                  })()}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-md mx-auto md:mx-0">
                  {link.title || link.originalUrl}
                </p>
                {/* 过期时间详细信息 */}
                {link.expiresAt && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    {t('expireTime')}: {new Date(link.expiresAt).toLocaleString('zh-CN')}
                  </p>
                )}
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
                      title={t('viewPassword')}
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
                    title={t('edit')}
                    onClick={() => toggleEditExpand(link)}
                  >
                    <Edit size={18} />
                  </button>
                  <button 
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-[var(--color-primary)] transition-colors active:scale-95"
                    title={copySuccess === link.id.toString() ? t('copied') : t('copy')}
                    onClick={() => copyToClipboard(link.shortUrl, link.id)}
                  >
                    {copySuccess === link.id.toString() ? (
                      <Check size={18} className="text-green-500" />
                    ) : (
                      <Copy size={18} />
                    )}
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
            <p>{t('noMatchingLinks')}</p>
            <p className="text-sm">{t('adjustSearchCriteria')}</p>
            <button 
              onClick={clearSearch}
              className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
            >
              {t('clearFilter')}
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
          <div className={`rounded-2xl shadow-2xl max-w-md w-full p-6 animate__animated animate__fadeIn animate__faster ${isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-white text-gray-900'}`}>
            {/* 弹窗标题 */}
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-bold flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                <Shield size={20} className="text-blue-500" />
                {t('adminVerification')}
              </h3>
              <button 
                onClick={closeAdminModal}
                className={`p-1 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-slate-500 hover:text-slate-300' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'}`}
              >
                <X size={20} />
              </button>
            </div>

            {/* 说明文字 */}
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {t('viewPasswordRequiresAdmin')}
            </p>

            {/* 登录状态检查 */}
            <div className="mb-6">
              <div className={`rounded-lg p-4 flex items-center gap-3 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-50'} ${
                adminError 
                  ? `border ${isDarkMode ? 'border-red-500' : 'border-red-300'}` 
                  : `border ${isDarkMode ? 'border-slate-600' : 'border-slate-200'}`
              }`}>
                <Shield size={20} className={isAdminLoggedIn ? 'text-green-500' : 'text-slate-400'} />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                    {isAdminLoggedIn ? t('adminLoggedIn') : t('needAdminLogin')}
                  </p>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {isAdminLoggedIn ? t('clickToViewPassword') : t('pleaseLoginAdminFirst')}
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
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                disabled={loadingPassword}
              >
                {t('cancel')}
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
                    {t('getting')}
                  </>
                ) : (
                  <>
                    <Shield size={16} />
                    {t('viewPasswordButton')}
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
          <div className={`rounded-2xl shadow-2xl max-w-md w-full p-6 animate__animated animate__fadeIn animate__faster ${isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-white text-gray-900'}`}>
            {/* 弹窗标题 */}
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-bold flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                <Lock size={20} className="text-orange-500" />
                {t('linkPassword')}
              </h3>
              <button 
                onClick={closePasswordModal}
                className={`p-1 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-slate-500 hover:text-slate-300' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'}`}
              >
                <X size={20} />
              </button>
            </div>

            {/* 密码显示区域 */}
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {t('accessPasswordLabel')}
              </label>
              <div className={`cute-input-wrapper rounded-lg px-4 py-3 flex items-center gap-3 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
                <Lock size={16} className={isDarkMode ? 'text-slate-500' : 'text-slate-400'} />
                <input 
                  type="text" 
                  value={currentPassword}
                  readOnly
                  className={`flex-1 bg-transparent border-none outline-none font-mono ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}
                  placeholder={currentPassword ? "" : t('gettingPassword')}
                />
                {currentPassword && (
                  <button 
                    onClick={() => copyToClipboard(currentPassword, 'password')}
                    className={`p-1 rounded transition-colors hover:text-[var(--color-primary)] ${
                      isDarkMode 
                        ? 'hover:bg-slate-600 text-slate-400' 
                        : 'hover:bg-slate-200 text-slate-500'
                    }`}
                    title={copySuccess === 'password' ? t('copied') : t('copy')}
                  >
                    {copySuccess === 'password' ? (
                      <Check size={16} className="text-green-500" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                )}
              </div>
              {currentPassword && (
                <p className={`text-xs mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {t('passwordLength', { length: currentPassword.length })}
                </p>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end">
              <button 
                onClick={closePasswordModal}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {t('close')}
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