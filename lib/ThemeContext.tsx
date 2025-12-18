'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system' | 'time'

interface ThemeContextType {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  resolvedTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme 必须在 ThemeProvider 内使用')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  // 获取系统主题偏好
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  }

  // 根据时间判断主题（6:00-18:00 为亮色，其他时间为暗色）
  const getTimeBasedTheme = (): 'light' | 'dark' => {
    const hour = new Date().getHours()
    return hour >= 6 && hour < 18 ? 'light' : 'dark'
  }

  // 解析最终主题
  const resolveTheme = (currentTheme: ThemeMode): 'light' | 'dark' => {
    switch (currentTheme) {
      case 'light':
        return 'light'
      case 'dark':
        return 'dark'
      case 'system':
        return getSystemTheme()
      case 'time':
        return getTimeBasedTheme()
      default:
        return 'light'
    }
  }

  // 设置主题
  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  // 应用主题到 DOM
  const applyTheme = (resolvedTheme: 'light' | 'dark') => {
    const root = document.documentElement
    if (resolvedTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  // 初始化主题
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeMode
    if (savedTheme && ['light', 'dark', 'system', 'time'].includes(savedTheme)) {
      setThemeState(savedTheme)
    }
  }, [])

  // 监听主题变化并应用
  useEffect(() => {
    const newResolvedTheme = resolveTheme(theme)
    setResolvedTheme(newResolvedTheme)
    applyTheme(newResolvedTheme)
  }, [theme])

  // 监听系统主题变化
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => {
        const newResolvedTheme = resolveTheme(theme)
        setResolvedTheme(newResolvedTheme)
        applyTheme(newResolvedTheme)
      }
      
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme])

  // 监听时间变化（每分钟检查一次）
  useEffect(() => {
    if (theme === 'time') {
      const interval = setInterval(() => {
        const newResolvedTheme = resolveTheme(theme)
        if (newResolvedTheme !== resolvedTheme) {
          setResolvedTheme(newResolvedTheme)
          applyTheme(newResolvedTheme)
        }
      }, 60000) // 每分钟检查一次

      return () => clearInterval(interval)
    }
  }, [theme, resolvedTheme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}