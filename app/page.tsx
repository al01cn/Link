'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import HomeView from '@/components/HomeView'
import SafeRedirectView from '@/components/SafeRedirectView'
import SettingsView from '@/components/SettingsView'
import AdminLoginPage from '@/components/AdminLoginPage'
import { AdminProvider, useAdmin } from '@/lib/AdminContext'
import { useTranslation, type Language } from '@/lib/translations'
import { useNotificationDialog } from '@/lib/useDialog'
import NotificationDialog from '@/components/NotificationDialog'

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

function HomeContent() {
  const { isAuthenticated } = useAdmin()
  const [currentView, setCurrentView] = useState('home')
  const [redirectTarget, setRedirectTarget] = useState<ShortLink | null>(null)
  const [lang, setLang] = useState<Language>('zh')
  const [settings, setSettings] = useState({
    mode: 'whitelist' as 'whitelist' | 'blacklist',
    waitTime: 5,
    captchaEnabled: false
  })

  const t = useTranslation(lang)
  
  // 通知对话框 hook
  const notificationDialog = useNotificationDialog()

  // 加载系统设置
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const data = await response.json()
          setSettings({
            mode: data.securityMode || 'whitelist',
            waitTime: data.waitTime || 5,
            captchaEnabled: data.captchaEnabled || false
          })
        }
      } catch (error) {
        console.error('加载设置失败:', error)
      }
    }

    if (isAuthenticated) {
      loadSettings()
    }
  }, [isAuthenticated])
  
  // 如果未认证，显示登录页面
  if (!isAuthenticated) {
    return <AdminLoginPage />
  }
  const toggleLang = () => setLang(prev => prev === 'zh' ? 'en' : 'zh')

  // 模拟访问短链
  const handleSimulateVisit = (link: ShortLink) => {
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

      const response = await fetch(`/api/visit/${redirectTarget.path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password })
      })

      if (response.ok) {
        const data = await response.json()
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
    }
  }

  const handleCancel = () => {
    setCurrentView('home')
    setRedirectTarget(null)
  }

  return (
    <div className="min-h-screen bg-[--color-bg-surface] preview-grid">
      <Navbar 
        onViewChange={setCurrentView} 
        currentView={currentView} 
        lang={lang}
        toggleLang={toggleLang}
        t={t}
      />

      <main className="pt-6 pb-12">
        {currentView === 'home' && (
          <HomeView onSimulateVisit={handleSimulateVisit} t={t} />
        )}
        
        {currentView === 'settings' && (
          <SettingsView 
            onClose={() => setCurrentView('home')} 
            settings={settings}
            setSettings={setSettings}
            t={t}
          />
        )}

        {currentView === 'redirect' && redirectTarget && (
          <SafeRedirectView 
            targetUrl={redirectTarget.originalUrl} 
            title={redirectTarget.title}
            hasPassword={redirectTarget.hasPassword}
            requireConfirm={redirectTarget.requireConfirm}
            waitTime={settings.waitTime}
            captchaEnabled={settings.captchaEnabled}
            onProceed={handleProceed}
            onCancel={handleCancel}
            t={t}
          />
        )}
      </main>

      {/* 页脚 */}
      <footer className="text-center py-8 text-slate-400 text-sm">
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
    <AdminProvider>
      <HomeContent />
    </AdminProvider>
  )
}
