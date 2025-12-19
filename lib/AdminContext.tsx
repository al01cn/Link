'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { isAdminLoggedIn, adminLogout } from './adminAuth'
import { useLanguage } from './LanguageContext'
import ForcePasswordChangeDialog from '@/components/ForcePasswordChangeDialog'

interface AdminContextType {
  isAuthenticated: boolean
  username: string | null
  isDefaultAccount: boolean
  login: (token: string, username: string, isDefault?: boolean) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
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

  const checkAuth = async () => {
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('adminToken')
      const storedUsername = sessionStorage.getItem('adminUsername')
      
      if (token && isAdminLoggedIn()) {
        try {
          // 向服务器验证是否使用默认密码，而不是依赖客户端存储
          const response = await fetch('/api/admin/check-default', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            setIsAuthenticated(true)
            setUsername(data.username)
            setIsDefaultAccount(data.isDefault) // 使用服务器返回的真实状态
            
            // 更新客户端存储（但不依赖它来做安全决策）
            sessionStorage.setItem('adminUsername', data.username)
            sessionStorage.setItem('adminIsDefault', data.isDefault.toString())
          } else {
            // 服务器验证失败，清理认证状态
            setIsAuthenticated(false)
            setUsername(null)
            setIsDefaultAccount(false)
            sessionStorage.removeItem('adminToken')
            sessionStorage.removeItem('adminUsername')
            sessionStorage.removeItem('adminIsDefault')
          }
        } catch (error) {
          console.error('验证默认密码状态失败:', error)
          // 网络错误时，暂时使用存储的值，但这不是安全决策的依据
          const storedIsDefault = sessionStorage.getItem('adminIsDefault') === 'true'
          setIsAuthenticated(true)
          setUsername(storedUsername)
          setIsDefaultAccount(storedIsDefault)
        }
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

  const login = async (token: string, username: string, isDefault: boolean = false) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('adminToken', token)
      sessionStorage.setItem('adminUsername', username)
      sessionStorage.setItem('adminIsDefault', isDefault.toString())
    }
    
    // 立即向服务器验证真实的默认密码状态
    try {
      const response = await fetch('/api/admin/check-default', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setIsAuthenticated(true)
        setUsername(data.username)
        setIsDefaultAccount(data.isDefault) // 使用服务器验证的真实状态
        
        // 更新客户端存储
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('adminUsername', data.username)
          sessionStorage.setItem('adminIsDefault', data.isDefault.toString())
        }
      } else {
        // 如果服务器验证失败，使用登录时返回的值作为备用
        setIsAuthenticated(true)
        setUsername(username)
        setIsDefaultAccount(isDefault)
      }
    } catch (error) {
      console.error('登录后验证默认密码状态失败:', error)
      // 网络错误时使用登录时返回的值
      setIsAuthenticated(true)
      setUsername(username)
      setIsDefaultAccount(isDefault)
    }
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