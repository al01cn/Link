'use client'

import { useState, useRef, useEffect } from 'react'
import { User, Settings, LogOut, ChevronDown } from 'lucide-react'
import { useAdmin } from '@/lib/AdminContext'
import { useLanguage } from '@/lib/LanguageContext'
import AdminSettings from './AdminSettings'

export default function AdminDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { username, logout } = useAdmin()
  const { t } = useLanguage()

  // 点击外部关闭下拉菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = () => {
    logout()
    setIsOpen(false)
  }

  const handleSettings = () => {
    setShowSettings(true)
    setIsOpen(false)
  }

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
        >
          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
            <User size={14} className="text-white" />
          </div>
          <span className="text-sm font-medium">{username}</span>
          <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 animate__animated animate__fadeIn animate__faster" style={{ zIndex: 99998 }}>
            <button
              onClick={handleSettings}
              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
            >
              <Settings size={16} className="text-slate-400" />
              {t('adminSettings')}
            </button>
            <hr className="my-1 border-slate-100" />
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
            >
              <LogOut size={16} className="text-red-400" />
              {t('logout')}
            </button>
          </div>
        )}
      </div>

      {/* 管理员设置弹窗 */}
      {showSettings && (
        <AdminSettings onClose={() => setShowSettings(false)} />
      )}
    </>
  )
}