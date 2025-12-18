'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import HomeView from '@/components/HomeView'

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
  const [settings, setSettings] = useState({
    mode: 'blacklist' as 'whitelist' | 'blacklist',
    waitTime: 3,
    captchaEnabled: false,
    preloadEnabled: true, // 默认启用预加载
    autoFillPasswordEnabled: true // 默认启用密码自动填充
  })
  
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
    // 所有短链都在新标签页打开，避免缓存和状态管理问题
    window.open(link.shortUrl, '_blank')
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
