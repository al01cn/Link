'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { isAdminLoggedIn, adminLogout } from './adminAuth'

interface AdminContextType {
  isAuthenticated: boolean
  username: string | null
  login: (token: string, username: string) => void
  logout: () => void
  checkAuth: () => void
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = () => {
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('adminToken')
      const storedUsername = sessionStorage.getItem('adminUsername')
      
      if (token && isAdminLoggedIn()) {
        setIsAuthenticated(true)
        setUsername(storedUsername)
      } else {
        setIsAuthenticated(false)
        setUsername(null)
        // 清理过期的token
        sessionStorage.removeItem('adminToken')
        sessionStorage.removeItem('adminUsername')
      }
    }
    setIsLoading(false)
  }

  const login = (token: string, username: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('adminToken', token)
      sessionStorage.setItem('adminUsername', username)
    }
    setIsAuthenticated(true)
    setUsername(username)
  }

  const logout = () => {
    adminLogout()
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('adminUsername')
    }
    setIsAuthenticated(false)
    setUsername(null)
  }

  useEffect(() => {
    checkAuth()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[--color-bg-surface] preview-grid flex items-center justify-center">
        <div className="cute-card max-w-md w-full p-8 text-center">
          <div className="w-8 h-8 border-2 border-[--color-primary]/30 border-t-[--color-primary] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">正在验证身份...</p>
        </div>
      </div>
    )
  }

  return (
    <AdminContext.Provider value={{ isAuthenticated, username, login, logout, checkAuth }}>
      {children}
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