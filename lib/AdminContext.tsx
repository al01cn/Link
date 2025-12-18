'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { isAdminLoggedIn, adminLogout } from './adminAuth'
import { useLanguage } from './LanguageContext'
import ForcePasswordChangeDialog from '@/components/ForcePasswordChangeDialog'

interface AdminContextType {
  isAuthenticated: boolean
  username: string | null
  isDefaultAccount: boolean
  login: (token: string, username: string, isDefault?: boolean) => void
  logout: () => void
  checkAuth: () => void
  onPasswordChanged: () => void
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const [isDefaultAccount, setIsDefaultAccount] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const { t } = useLanguage()

  const checkAuth = () => {
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('adminToken')
      const storedUsername = sessionStorage.getItem('adminUsername')
      const storedIsDefault = sessionStorage.getItem('adminIsDefault') === 'true'
      
      if (token && isAdminLoggedIn()) {
        setIsAuthenticated(true)
        setUsername(storedUsername)
        setIsDefaultAccount(storedIsDefault)
      } else {
        setIsAuthenticated(false)
        setUsername(null)
        setIsDefaultAccount(false)
        // 清理过期的token
        sessionStorage.removeItem('adminToken')
        sessionStorage.removeItem('adminUsername')
        sessionStorage.removeItem('adminIsDefault')
      }
    }
    setIsLoading(false)
  }

  const login = (token: string, username: string, isDefault: boolean = false) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('adminToken', token)
      sessionStorage.setItem('adminUsername', username)
      sessionStorage.setItem('adminIsDefault', isDefault.toString())
    }
    setIsAuthenticated(true)
    setUsername(username)
    setIsDefaultAccount(isDefault)
  }

  const logout = () => {
    adminLogout()
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('adminUsername')
      sessionStorage.removeItem('adminIsDefault')
    }
    setIsAuthenticated(false)
    setUsername(null)
    setIsDefaultAccount(false)
  }

  const onPasswordChanged = () => {
    // 密码修改成功后，清除所有状态，用户需要重新登录
    setIsAuthenticated(false)
    setUsername(null)
    setIsDefaultAccount(false)
    setIsLoading(false)
  }

  useEffect(() => {
    setIsClient(true)
    checkAuth()
  }, [])

  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen bg-[--color-bg-surface] preview-grid flex items-center justify-center">
        <div className="cute-card max-w-md w-full p-8 text-center">
          <div className="w-8 h-8 border-2 border-[--color-primary]/30 border-t-[--color-primary] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">{isClient ? t('verifyingIdentity') : '加载中...'}</p>
        </div>
      </div>
    )
  }

  return (
    <AdminContext.Provider value={{ 
      isAuthenticated, 
      username, 
      isDefaultAccount, 
      login, 
      logout, 
      checkAuth, 
      onPasswordChanged 
    }}>
      {children}
      
      {/* 强制修改密码对话框 */}
      {isAuthenticated && isDefaultAccount && username && (
        <ForcePasswordChangeDialog
          isOpen={true}
          username={username}
          t={t}
          onPasswordChanged={onPasswordChanged}
        />
      )}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  return context
}