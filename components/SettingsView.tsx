'use client'

import { useState, useEffect, useRef } from 'react'
import { Settings, Shield, Clock, X, Check, Plus, Trash2, Zap, Download, Upload, FileText, Hash } from 'lucide-react'
import { TranslationKey } from '@/lib/translations'
import { useConfirmDialog, useNotificationDialog } from '@/lib/useDialog'
import { useGlobalMessage } from '@/lib/useGlobalMessage'
import ConfirmDialog from './ConfirmDialog'
import NotificationDialog from './NotificationDialog'

interface SettingsData {
  mode: 'whitelist' | 'blacklist'
  waitTime: number
  captchaEnabled: boolean
  preloadEnabled: boolean
  autoFillPasswordEnabled: boolean
  nanoidLength: number
}

interface DomainRule {
  id: string
  domain: string
  type: 'whitelist' | 'blacklist'
  active: boolean
  createdAt: string
}

interface SettingsViewProps {
  isOpen: boolean
  onClose: () => void
  settings: SettingsData
  setSettings: (settings: SettingsData) => void
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
}

export default function SettingsView({ isOpen, onClose, settings, setSettings, t }: SettingsViewProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [newDomain, setNewDomain] = useState('')
  const [domainRules, setDomainRules] = useState<DomainRule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingDomain, setIsAddingDomain] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 对话框 hooks
  const confirmDialog = useConfirmDialog()
  const notificationDialog = useNotificationDialog()
  const { showMessage } = useGlobalMessage()

  // 客户端水合完成后启用动画
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 初始化主题状态
  useEffect(() => {
    if (typeof document !== 'undefined') {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    }
  }, [])

  // 控制dialog的打开和关闭
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      dialog.showModal()
      setIsDarkMode(document.documentElement.classList.contains('dark'))
      // 清空文件输入，防止重复导入
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } else {
      dialog.close()
    }
  }, [isOpen])

  // 监听主题变化
  useEffect(() => {
    if (!isOpen) return

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
  }, [isOpen])

  // 加载设置和域名规则
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('adminToken') : null
      if (!token) {
        console.error('未找到管理员token')
        return
      }

      const response = await fetch('/api/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setSettings({
          mode: data.securityMode,
          waitTime: data.waitTime,
          captchaEnabled: data.captchaEnabled || false,
          preloadEnabled: data.preloadEnabled !== false, // 默认启用
          autoFillPasswordEnabled: data.autoFillPasswordEnabled !== false, // 默认启用
          nanoidLength: data.nanoidLength || 6 // 默认6个字符
        })
        setDomainRules(data.domainRules)
      } else if (response.status === 401) {
        notificationDialog.notify({
          type: 'error',
          message: '管理员权限已过期，请重新登录'
        })
      }
    } catch (error) {
      console.error('加载设置失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 防抖保存设置
  const saveSettings = async (newSettings: SettingsData) => {
    // 立即更新本地状态
    setSettings(newSettings)
    
    // 清除之前的定时器
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }
    
    // 设置新的防抖定时器
    const timeout = setTimeout(async () => {
      setIsSaving(true)
      try {
        const token = typeof window !== 'undefined' ? sessionStorage.getItem('adminToken') : null
        if (!token) {
          notificationDialog.notify({
            type: 'error',
            message: '未找到管理员权限，请重新登录'
          })
          return
        }

        const response = await fetch('/api/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            securityMode: newSettings.mode,
            waitTime: newSettings.waitTime,
            captchaEnabled: newSettings.captchaEnabled,
            preloadEnabled: newSettings.preloadEnabled,
            autoFillPasswordEnabled: newSettings.autoFillPasswordEnabled,
            nanoidLength: newSettings.nanoidLength
          })
        })
        
        if (!response.ok) {
          // 如果保存失败，显示错误提示
          if (response.status === 401) {
            notificationDialog.notify({
              type: 'error',
              message: '管理员权限已过期，请重新登录'
            })
          } else {
            notificationDialog.notify({
              type: 'error',
              message: '保存设置失败，请重试'
            })
          }
        }
      } catch (error) {
        console.error('保存设置失败:', error)
        notificationDialog.notify({
          type: 'error',
          message: '保存设置失败，请检查网络连接'
        })
      } finally {
        setIsSaving(false)
      }
    }, 500) // 500ms 防抖延迟
    
    setSaveTimeout(timeout)
  }

  // 清理定时器
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout)
      }
    }
  }, [saveTimeout])

  // 添加域名规则
  const addDomain = async () => {
    if (!newDomain.trim()) return
    
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('adminToken') : null
    if (!token) {
      notificationDialog.notify({
        type: 'error',
        message: '未找到管理员权限，请重新登录'
      })
      return
    }
    
    setIsAddingDomain(true)
    try {
      const response = await fetch('/api/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          domain: newDomain.trim(),
          type: settings.mode
        })
      })
      
      if (response.ok) {
        const newRule = await response.json()
        setDomainRules([newRule, ...domainRules])
        setNewDomain('')
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
            message: error.error || t('addDomainFailed')
          })
        }
      }
    } catch (error) {
      console.error('添加域名失败:', error)
      notificationDialog.notify({
        type: 'error',
        message: t('addDomainFailed')
      })
    } finally {
      setIsAddingDomain(false)
    }
  }

  // 删除域名规则
  const deleteDomain = async (id: string) => {
    const confirmed = await confirmDialog.confirm({
      type: 'danger',
      title: t('confirmDeleteTitle'),
      message: t('confirmDeleteDomain'),
      confirmText: t('delete'),
      cancelText: t('cancel')
    })
    
    if (!confirmed) return

    const token = typeof window !== 'undefined' ? sessionStorage.getItem('adminToken') : null
    if (!token) {
      notificationDialog.notify({
        type: 'error',
        message: '未找到管理员权限，请重新登录'
      })
      return
    }

    try {
      const response = await fetch(`/api/domains/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        // 成功删除，更新本地状态
        setDomainRules(domainRules.filter(rule => rule.id !== id))
        
        // 显示成功提示（可选）
        const result = await response.json()
        // console.log('删除成功:', result.message)
      } else {
        // 处理不同的错误状态码
        const errorData = await response.json()
        let errorMessage = t('deleteDomainFailed')
        
        switch (response.status) {
          case 400:
            errorMessage = `${t('requestError')}: ${errorData.error || t('invalidRequestParams')}`
            break
          case 401:
            errorMessage = '管理员权限已过期，请重新登录'
            break
          case 404:
            errorMessage = `${t('domainRuleNotExists')}: ${errorData.error || t('recordNotFound')}`
            // 即使是404，也从本地状态中移除（可能已被其他地方删除）
            setDomainRules(domainRules.filter(rule => rule.id !== id))
            break
          case 500:
            errorMessage = `${t('serverError')}: ${errorData.error || t('pleaseTryLater')}`
            break
          default:
            errorMessage = `${t('deleteFailedWithStatus', { status: response.status })}: ${errorData.error || t('unknownError')}`
        }
        
        notificationDialog.notify({
          type: 'error',
          message: errorMessage
        })
        console.error('删除域名失败:', errorData)
      }
    } catch (error) {
      console.error('删除域名网络错误:', error)
      notificationDialog.notify({
        type: 'error',
        message: t('networkErrorCheckConnection')
      })
    }
  }

  // 导出配置
  const handleExport = async (type: 'settings' | 'links' | 'all') => {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('adminToken') : null
    if (!token) {
      notificationDialog.notify({
        type: 'error',
        message: '未找到管理员权限，请重新登录'
      })
      return
    }

    setIsExporting(true)
    try {
      // 直接跳转到API端点触发下载
      const url = `/api/config/export?type=${type}&token=${encodeURIComponent(token)}`
      window.location.href = url

      // 关闭设置弹窗后显示导出成功消息
      setTimeout(() => {
        onClose() // 先关闭设置弹窗
        setTimeout(() => {
          showMessage({
            type: 'success',
            message: t('exportSuccess'),
            duration: 3000
          })
        }, 100) // 等待弹窗关闭动画完成
      }, 500)
    } catch (error) {
      console.error('导出失败:', error)
      notificationDialog.notify({
        type: 'error',
        message: t('exportFailed')
      })
    } finally {
      setTimeout(() => {
        setIsExporting(false)
      }, 1000)
    }
  }

  // 处理文件选择
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.json')) {
      notificationDialog.notify({
        type: 'error',
        message: t('invalidFileFormat')
      })
      return
    }

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      // 显示导入预览对话框
      const confirmed = await confirmDialog.confirm({
        type: 'warning',
        title: t('confirmImport'),
        message: t('importWarning'),
        confirmText: t('proceedImport'),
        cancelText: t('cancelImport')
      })

      if (confirmed) {
        await handleImport(data)
      }
    } catch (error) {
      console.error('文件读取失败:', error)
      notificationDialog.notify({
        type: 'error',
        message: t('fileReadError')
      })
    } finally {
      // 无论成功还是失败都清空文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // 导入配置
  const handleImport = async (data: any) => {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('adminToken') : null
    if (!token) {
      notificationDialog.notify({
        type: 'error',
        message: '未找到管理员权限，请重新登录'
      })
      return
    }

    setIsImporting(true)
    try {
      const response = await fetch('/api/config/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ data, type: 'all' })
      })

      if (response.ok) {
        const result = await response.json()
        
        // 重新加载设置
        await loadSettings()
        
        // 立即关闭设置弹窗
        onClose()
        
        // 使用全局消息提示导入成功
        showMessage({
          type: 'success',
          message: `${t('importSuccess')} (${result.importedCount} 项)`,
          duration: 4000
        })
      } else {
        const error = await response.json()
        notificationDialog.notify({
          type: 'error',
          message: error.error || t('importFailed')
        })
      }
    } catch (error) {
      console.error('导入失败:', error)
      notificationDialog.notify({
        type: 'error',
        message: t('importFailed')
      })
    } finally {
      setIsImporting(false)
      // 确保导入完成后清空文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // 获取当前模式的域名列表
  const currentDomains = (domainRules || []).filter(rule => rule.type === settings.mode)

  return (
    <dialog 
      ref={dialogRef}
      className="backdrop:bg-black/50 backdrop:backdrop-blur-sm bg-transparent p-0 max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-2xl"
      onClose={onClose}
    >
      <div className={`max-w-2xl mx-auto mt-10 pb-20 ${isClient ? 'animate__animated animate__fadeInUp' : ''}`}>
      <div className="cute-card p-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <h2 className={`text-2xl font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              <Settings className="text-[var(--color-primary)]" />
              {t('systemSettings')}
            </h2>
            {isSaving && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                保存中...
              </div>
            )}
          </div>
          <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-400'}`}>
            <X size={24} />
          </button>
        </div>

        <div className="space-y-10">
          
          {/* 安全模式选择 */}
          <div className={isClient ? 'animate__animated animate__fadeIn' : ''}>
            <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <Shield size={16} />
              {t('securityMode')}
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div 
                className={`option-card p-4 rounded-xl cursor-pointer bg-slate-50 relative ${
                  settings.mode === 'whitelist' ? 'active ring-2 ring-[var(--color-primary)]' : 'hover:bg-slate-100'
                }`}
                onClick={() => {
                  const newSettings = {...settings, mode: 'whitelist' as 'whitelist' | 'blacklist'}
                  saveSettings(newSettings)
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    settings.mode === 'whitelist' ? 'border-[var(--color-primary)] bg-[var(--color-primary)]' : 'border-slate-300'
                  }`}>
                    {settings.mode === 'whitelist' && <Check size={12} className="text-white" />}
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{t('whitelist')}</span>
                </div>
                <p className="text-xs text-slate-500 pl-8">{t('whitelistDesc')}</p>
              </div>

              <div 
                className={`option-card p-4 rounded-xl cursor-pointer bg-slate-50 relative ${
                  settings.mode === 'blacklist' ? 'active ring-2 ring-[var(--color-primary)]' : 'hover:bg-slate-100'
                }`}
                onClick={() => {
                  const newSettings = {...settings, mode: 'blacklist' as 'whitelist' | 'blacklist'}
                  saveSettings(newSettings)
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    settings.mode === 'blacklist' ? 'border-[var(--color-primary)] bg-[var(--color-primary)]' : 'border-slate-300'
                  }`}>
                    {settings.mode === 'blacklist' && <Check size={12} className="text-white" />}
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{t('blacklist')}</span>
                </div>
                <p className="text-xs text-slate-500 pl-8">{t('blacklistDesc')}</p>
              </div>
            </div>
          </div>

          {/* 跳转等待时间 */}
          <div className={isClient ? 'animate__animated animate__fadeIn' : ''}>
            <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <Clock size={16} />
              {t('redirectWait')}
            </h3>
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <p className="text-sm text-slate-500 flex-1">{t('redirectWaitDesc')}</p>
              <div className="cute-input-wrapper bg-white rounded-lg px-4 py-2 flex items-center gap-2 w-32">
                <input 
                  type="number" 
                  min="0"
                  max="60"
                  className="w-full bg-transparent outline-none text-slate-800 font-bold text-center"
                  value={settings.waitTime}
                  onChange={(e) => {
                    const newSettings = {...settings, waitTime: parseInt(e.target.value) || 0}
                    saveSettings(newSettings)
                  }}
                />
                <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t('seconds')}</span>
              </div>
            </div>
          </div>

          {/* 人机验证设置 */}
          <div className={isClient ? 'animate__animated animate__fadeIn' : ''}>
            <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <Shield size={16} />
              {t('captchaSettings')}
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div 
                className={`option-card p-4 rounded-xl cursor-pointer bg-slate-50 relative ${
                  settings.captchaEnabled ? 'active ring-2 ring-[var(--color-primary)]' : 'hover:bg-slate-100'
                }`}
                onClick={() => {
                  const newSettings = {...settings, captchaEnabled: true}
                  saveSettings(newSettings)
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    settings.captchaEnabled ? 'border-[var(--color-primary)] bg-[var(--color-primary)]' : 'border-slate-300'
                  }`}>
                    {settings.captchaEnabled && <Check size={12} className="text-white" />}
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{t('enableCaptcha')}</span>
                </div>
                <p className="text-xs text-slate-500 pl-8">{t('captchaDesc')}</p>
              </div>

              <div 
                className={`option-card p-4 rounded-xl cursor-pointer bg-slate-50 relative ${
                  !settings.captchaEnabled ? 'active ring-2 ring-[var(--color-primary)]' : 'hover:bg-slate-100'
                }`}
                onClick={() => {
                  const newSettings = {...settings, captchaEnabled: false}
                  saveSettings(newSettings)
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    !settings.captchaEnabled ? 'border-[var(--color-primary)] bg-[var(--color-primary)]' : 'border-slate-300'
                  }`}>
                    {!settings.captchaEnabled && <Check size={12} className="text-white" />}
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{t('disableCaptcha')}</span>
                </div>
                <p className="text-xs text-slate-500 pl-8">{t('captchaOffDesc')}</p>
              </div>
            </div>
          </div>

          {/* 预加载设置 */}
          <div className={isClient ? 'animate__animated animate__fadeIn' : ''}>
            <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <Zap size={16} />
              {t('preloadSettings')}
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div 
                className={`option-card p-4 rounded-xl cursor-pointer bg-slate-50 relative ${
                  settings.preloadEnabled ? 'active ring-2 ring-[var(--color-primary)]' : 'hover:bg-slate-100'
                }`}
                onClick={() => {
                  const newSettings = {...settings, preloadEnabled: true}
                  saveSettings(newSettings)
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    settings.preloadEnabled ? 'border-[var(--color-primary)] bg-[var(--color-primary)]' : 'border-slate-300'
                  }`}>
                    {settings.preloadEnabled && <Check size={12} className="text-white" />}
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{t('enablePreload')}</span>
                </div>
                <p className="text-xs text-slate-500 pl-8">{t('preloadDesc')}</p>
              </div>

              <div 
                className={`option-card p-4 rounded-xl cursor-pointer bg-slate-50 relative ${
                  !settings.preloadEnabled ? 'active ring-2 ring-[var(--color-primary)]' : 'hover:bg-slate-100'
                }`}
                onClick={() => {
                  const newSettings = {...settings, preloadEnabled: false}
                  saveSettings(newSettings)
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    !settings.preloadEnabled ? 'border-[var(--color-primary)] bg-[var(--color-primary)]' : 'border-slate-300'
                  }`}>
                    {!settings.preloadEnabled && <Check size={12} className="text-white" />}
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{t('disablePreload')}</span>
                </div>
                <p className="text-xs text-slate-500 pl-8">{t('preloadOffDesc')}</p>
              </div>
            </div>
          </div>

          {/* 密码自动填充设置 */}
          <div className={isClient ? 'animate__animated animate__fadeIn' : ''}>
            <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <Shield size={16} />
              {t('autoFillPasswordSettings')}
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div 
                className={`option-card p-4 rounded-xl cursor-pointer bg-slate-50 relative ${
                  settings.autoFillPasswordEnabled ? 'active ring-2 ring-[var(--color-primary)]' : 'hover:bg-slate-100'
                }`}
                onClick={() => {
                  const newSettings = {...settings, autoFillPasswordEnabled: true}
                  saveSettings(newSettings)
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    settings.autoFillPasswordEnabled ? 'border-[var(--color-primary)] bg-[var(--color-primary)]' : 'border-slate-300'
                  }`}>
                    {settings.autoFillPasswordEnabled && <Check size={12} className="text-white" />}
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{t('enableAutoFillPassword')}</span>
                </div>
                <p className="text-xs text-slate-500 pl-8">{t('autoFillPasswordDesc')}</p>
              </div>

              <div 
                className={`option-card p-4 rounded-xl cursor-pointer bg-slate-50 relative ${
                  !settings.autoFillPasswordEnabled ? 'active ring-2 ring-[var(--color-primary)]' : 'hover:bg-slate-100'
                }`}
                onClick={() => {
                  const newSettings = {...settings, autoFillPasswordEnabled: false}
                  saveSettings(newSettings)
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    !settings.autoFillPasswordEnabled ? 'border-[var(--color-primary)] bg-[var(--color-primary)]' : 'border-slate-300'
                  }`}>
                    {!settings.autoFillPasswordEnabled && <Check size={12} className="text-white" />}
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{t('disableAutoFillPassword')}</span>
                </div>
                <p className="text-xs text-slate-500 pl-8">{t('autoFillPasswordOffDesc')}</p>
              </div>
            </div>
          </div>

          {/* NanoID长度设置 */}
          <div className={isClient ? 'animate__animated animate__fadeIn' : ''}>
            <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <Hash size={16} />
              {t('nanoidLengthSettings')}
            </h3>
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
              <p className="text-sm text-slate-500 mb-4">{t('nanoidLengthDesc')}</p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1 w-full sm:w-auto">
                  <input
                    type="range"
                    min="5"
                    max="20"
                    value={settings.nanoidLength || 6}
                    onChange={(e) => {
                      const newSettings = {...settings, nanoidLength: parseInt(e.target.value)}
                      saveSettings(newSettings)
                    }}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[var(--color-primary)]"
                    style={{
                      background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${(((settings.nanoidLength || 6) - 5) / 15) * 100}%, rgb(226 232 240) ${(((settings.nanoidLength || 6) - 5) / 15) * 100}%, rgb(226 232 240) 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-2">
                    <span>5</span>
                    <span>10</span>
                    <span>15</span>
                    <span>20</span>
                  </div>
                </div>
                <div className="cute-input-wrapper bg-white rounded-lg px-4 py-2 flex items-center gap-2 min-w-[140px] flex-shrink-0">
                  <input
                    type="number"
                    min="5"
                    max="20"
                    className="w-full bg-transparent outline-none text-slate-800 font-bold text-center"
                    value={settings.nanoidLength || 6}
                    onChange={(e) => {
                      const value = Math.max(5, Math.min(20, parseInt(e.target.value) || 5))
                      const newSettings = {...settings, nanoidLength: value}
                      saveSettings(newSettings)
                    }}
                  />
                  <span className={`text-sm font-medium whitespace-nowrap ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t('characters')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 域名列表 */}
          <div className={isClient ? 'animate__animated animate__fadeIn' : ''}>
            <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {settings.mode === 'whitelist' ? t('whitelistDomains') : t('blacklistDomains')}
            </h3>
            
            {/* 域名规范说明 */}
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-2">{t('domainInputRules')}</h4>
              <div className="text-xs text-blue-700 space-y-1">
                <div><code className="bg-blue-100 px-1 rounded">*.example.com</code> - {t('wildcardDomainRule')}</div>
                <div><code className="bg-blue-100 px-1 rounded">example.com</code> - {t('mainDomainRule')}</div>
                <div><code className="bg-blue-100 px-1 rounded">sub.example.com</code> - {t('subDomainRule')}</div>
              </div>
            </div>

            {/* 添加域名输入框 */}
            <div className="mb-4">
              <div className="flex gap-2">
                <div className="cute-input-wrapper flex-1 bg-white rounded-lg px-3 py-2 flex items-center gap-2 text-sm">
                  <input 
                    type="text" 
                    placeholder={t('domainInputPlaceholder')}
                    className="w-full outline-none text-slate-700 dark:text-slate-200"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isAddingDomain && addDomain()}
                    disabled={isAddingDomain}
                  />
                </div>
                <button 
                  onClick={addDomain}
                  disabled={isAddingDomain || !newDomain.trim()}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    isAddingDomain || !newDomain.trim() 
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                      : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]'
                  }`}
                >
                  {isAddingDomain ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Plus size={16} />
                  )}
                  {t('add')}
                </button>
              </div>
            </div>
            
            {/* 域名列表 */}
            <div className={`rounded-xl p-4 border ${
              settings.mode === 'whitelist' ? 'bg-slate-50 border-slate-100' : 'bg-red-50 border-red-100'
            }`}>
              {isLoading ? (
                <div className={`text-center py-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  <div className={`w-6 h-6 border-2 rounded-full animate-spin mx-auto mb-2 ${isDarkMode ? 'border-slate-600 border-t-slate-300' : 'border-slate-300 border-t-slate-600'}`} />
                  {t('loading')}
                </div>
              ) : currentDomains.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {currentDomains.map(rule => {
                    // 判断域名规则类型
                    const isWildcard = rule.domain.startsWith('*.')
                    const isSubdomain = !isWildcard && rule.domain.includes('.') && rule.domain.split('.').length > 2
                    
                    return (
                      <span 
                        key={rule.id} 
                        className={`bg-white px-3 py-1 rounded-full text-sm text-slate-600 border shadow-sm flex items-center gap-2 group hover:bg-slate-50 ${
                          settings.mode === 'whitelist' ? 'border-slate-200' : 'border-red-100'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${
                          settings.mode === 'whitelist' ? 'bg-[var(--color-success)]' : 'bg-[var(--color-error)]'
                        }`}></span>
                        <span className="font-mono">{rule.domain}</span>
                        {isWildcard && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-1 rounded" title={t('wildcardDomainRule')}>
                            {t('wildcardLabel')}
                          </span>
                        )}
                        {isSubdomain && !isWildcard && (
                          <span className="text-xs bg-green-100 text-green-600 px-1 rounded" title={t('subDomainRule')}>
                            {t('subdomainLabel')}
                          </span>
                        )}
                        {!isWildcard && !isSubdomain && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-1 rounded" title={t('mainDomainRule')}>
                            {t('mainDomainLabel')}
                          </span>
                        )}
                        <button
                          onClick={() => deleteDomain(rule.id)}
                          className="ml-1 p-1 rounded-full hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          title={t('delete')}
                        >
                          <Trash2 size={12} />
                        </button>
                      </span>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400">
                  <Shield size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {settings.mode === 'whitelist' ? t('whitelistEmpty') : t('blacklistEmpty')}
                  </p>
                  <p className="text-xs mt-1">{t('addDomainRules')}</p>
                </div>
              )}
            </div>
          </div>

          {/* 配置导入导出 */}
          <div className={isClient ? 'animate__animated animate__fadeIn' : ''}>
            <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <FileText size={16} />
              {t('configImportExport')}
            </h3>
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
              <div className="grid md:grid-cols-2 gap-4">
                {/* 导出配置 */}
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <Download size={16} />
                    {t('exportConfig')}
                  </h4>
                  <p className="text-xs text-slate-500 mb-3">{t('exportConfigDesc')}</p>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleExport('settings')}
                      disabled={isExporting}
                      className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                        isExporting 
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      {isExporting ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Download size={14} />
                      )}
                      {t('exportSettings')}
                    </button>
                    <button
                      onClick={() => handleExport('links')}
                      disabled={isExporting}
                      className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                        isExporting 
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                    >
                      {isExporting ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Download size={14} />
                      )}
                      {t('exportLinks')}
                    </button>
                    <button
                      onClick={() => handleExport('all')}
                      disabled={isExporting}
                      className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                        isExporting 
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                          : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]'
                      }`}
                    >
                      {isExporting ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Download size={14} />
                      )}
                      {t('exportAll')}
                    </button>
                  </div>
                </div>

                {/* 导入配置 */}
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <Upload size={16} />
                    {t('importConfig')}
                  </h4>
                  <p className="text-xs text-slate-500 mb-3">{t('importConfigDesc')}</p>
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isImporting}
                      className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 border-2 border-dashed ${
                        isImporting 
                          ? 'border-slate-200 text-slate-400 cursor-not-allowed' 
                          : 'border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-700'
                      }`}
                    >
                      {isImporting ? (
                        <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin" />
                      ) : (
                        <Upload size={14} />
                      )}
                      {t('selectFile')}
                    </button>
                    <div className="text-xs text-slate-400 text-center">
                      {t('supportJsonFormat')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

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
    </dialog>
  )
}