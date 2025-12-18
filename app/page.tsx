'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import HomeView from '@/components/HomeView'
import SafeRedirectView from '@/components/SafeRedirectView'
import SettingsView from '@/components/SettingsView'
import AdminLoginPage from '@/components/AdminLoginPage'
import DynamicMetadata from '@/components/DynamicMetadata'
import { AdminProvider, useAdmin } from '@/lib/AdminContext'
import { LanguageProvider, useLanguage } from '@/lib/LanguageContext'
import { ThemeProvider } from '@/lib/ThemeContext'
import { useNotificationDialog } from '@/lib/useDialog'
import { requestCache } from '@/lib/requestCache'
import NotificationDialog from '@/components/NotificationDialog'

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

function HomeContent() {
  const { isAuthenticated } = useAdmin()
  const { language, setLanguage, t } = useLanguage()
  const [currentView, setCurrentView] = useState('home')
  const [redirectTarget, setRedirectTarget] = useState<ShortLink | null>(null)
  const [settings, setSettings] = useState({
    mode: 'blacklist' as 'whitelist' | 'blacklist',
    waitTime: 3,
    captchaEnabled: false,
    preloadEnabled: true, // 默认启用预加载
    autoFillPasswordEnabled: true // 默认启用密码自动填充
  })
  const [isProcessing, setIsProcessing] = useState(false)
  
  // 通知对话框 hook
  const notificationDialog = useNotificationDialog()

  // 加载系统设置
  useEffect(() => {
    let isMounted = true // 防止组件卸载后设置状态
    
    const loadSettings = async () => {
      try {
        const token = typeof window !== 'undefined' ? sessionStorage.getItem('adminToken') : null
        if (!token) {
          console.error('未找到管理员token')
          return
        }

        const data = await requestCache.get('settings', async () => {
          const response = await fetch('/api/settings', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          if (response.ok) {
            return response.json()
          }
          if (response.status === 401) {
            console.error('管理员权限已过期')
            return null
          }
          throw new Error('加载设置失败')
        })
        
        if (isMounted && data) {
          setSettings({
            mode: data.securityMode || 'blacklist',
            waitTime: data.waitTime || 3,
            captchaEnabled: data.captchaEnabled || false,
            preloadEnabled: data.preloadEnabled !== false, // 默认启用
            autoFillPasswordEnabled: data.autoFillPasswordEnabled !== false // 默认启用
          })
        }
      } catch (error) {
        console.error('加载设置失败:', error)
      }
    }

    if (isAuthenticated) {
      loadSettings()
    }

    return () => {
      isMounted = false
    }
  }, [isAuthenticated])
  
  // 如果未认证，显示登录页面
  if (!isAuthenticated) {
    return <AdminLoginPage />
  }
  const toggleLang = () => setLanguage(language === 'zh' ? 'en' : 'zh')

  // 模拟访问短链
  const handleSimulateVisit = (link: ShortLink) => {
    // 检查是否过期
    if (link.expiresAt && new Date(link.expiresAt) <= new Date()) {
      // 过期链接仍然跳转到安全页面显示过期信息
      setRedirectTarget(link)
      setCurrentView('redirect')
      return
    }
    
    // 逻辑：
    // 1. 有密码 或 需要确认 或 启用过渡页 -> 跳转到安全页面
    // 2. 否则直接跳转
    
    if (link.hasPassword || link.requireConfirm || link.enableIntermediate) {
      setRedirectTarget(link)
      setCurrentView('redirect')
    } else {
      // 直接跳转
      window.open(link.originalUrl, '_blank')
    }
  }

  // 处理跳转确认
  const handleProceed = async (password?: string, captchaToken?: string) => {
    if (!redirectTarget) return

    // 防止重复处理
    if (isProcessing) return
    
    setIsProcessing(true)

    try {
      // 如果启用了人机验证，先验证 captcha token
      if (settings.captchaEnabled && captchaToken) {
        const captchaResponse = await fetch('/api/verify-turnstile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: captchaToken })
        })

        if (!captchaResponse.ok) {
          const captchaError = await captchaResponse.json()
          notificationDialog.notify({
            type: 'error',
            message: captchaError.error || t('captchaFailed')
          })
          return
        }
      }

      // 验证密码（如果需要）
      const response = await fetch(`/api/visit/${redirectTarget.path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          password,
          isAutoFill: false // 主页组件中的密码都是手动输入
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // 在跳转前记录访问统计
        try {
          await fetch(`/api/track-visit/${redirectTarget.path}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            }
          })
        } catch (trackError) {
          console.error('记录访问统计失败:', trackError)
          // 统计失败不影响跳转
        }
        
        // 在当前标签页跳转到目标URL
        window.location.href = data.originalUrl
      } else {
        const error = await response.json()
        notificationDialog.notify({
          type: 'error',
          message: error.error || t('accessFailed')
        })
      }
    } catch (error) {
      console.error('访问失败:', error)
      notificationDialog.notify({
        type: 'error',
        message: t('accessFailed')
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = () => {
    setCurrentView('home')
    setRedirectTarget(null)
  }

  return (
    <div className="min-h-screen bg-(--color-bg-surface) preview-grid">
      {/* 动态更新页面元数据 */}
      <DynamicMetadata />
      
      <Navbar 
        onViewChange={setCurrentView} 
        currentView={currentView} 
        lang={language}
        toggleLang={toggleLang}
        t={t}
      />

      <main className="pt-6 pb-12">
        {currentView === 'home' && (
          <HomeView onSimulateVisit={handleSimulateVisit} t={t} />
        )}
        
        <SettingsView 
          isOpen={currentView === 'settings'}
          onClose={() => setCurrentView('home')} 
          settings={settings}
          setSettings={setSettings}
          t={t}
        />

        {currentView === 'redirect' && redirectTarget && (
          <SafeRedirectView 
            targetUrl={redirectTarget.originalUrl} 
            title={redirectTarget.title}
            hasPassword={redirectTarget.hasPassword}
            requireConfirm={redirectTarget.requireConfirm}
            waitTime={settings.waitTime}
            captchaEnabled={settings.captchaEnabled}
            preloadEnabled={settings.preloadEnabled}
            autoFillPasswordEnabled={settings.autoFillPasswordEnabled}
            onProceed={handleProceed}
            onCancel={handleCancel}
            t={t}
            expiresAt={redirectTarget.expiresAt}
          />
        )}
      </main>

      {/* 页脚 */}
      <footer className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
        <p>{t('footer')}</p>
      </footer>

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

export default function Home() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AdminProvider>
          <HomeContent />
        </AdminProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
