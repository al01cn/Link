'use client'

import { useState, useEffect } from 'react'
import { X, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'

interface NotificationDialogProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  confirmText?: string
}

export default function NotificationDialog({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  confirmText
}: NotificationDialogProps) {
  const { t } = useLanguage()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 150)
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />
      case 'error':
        return <XCircle className="w-6 h-6 text-red-500" />
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />
      case 'info':
        return <Info className="w-6 h-6 text-blue-500" />
      default:
        return <Info className="w-6 h-6 text-blue-500" />
    }
  }

  const getButtonColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
      case 'error':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
      default:
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
    }
  }

  const getDefaultTitle = () => {
    switch (type) {
      case 'success':
        return t('success')
      case 'error':
        return t('error')
      case 'warning':
        return t('warning')
      case 'info':
        return t('info')
      default:
        return t('info')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 背景遮罩 */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-300 ${
          isVisible ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      
      {/* 对话框容器 */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className={`relative bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-auto transform transition-all duration-300 ${
            isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        >
          {/* 关闭按钮 */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* 内容区域 */}
          <div className="p-6">
            <div className="flex items-start space-x-4">
              {/* 图标 */}
              <div className="shrink-0">
                {getIcon()}
              </div>
              
              {/* 文本内容 */}
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 dark:text-slate-200 mb-2">
                  {title || getDefaultTitle()}
                </h3>
                <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
                  {message}
                </p>
              </div>
            </div>

            {/* 按钮区域 */}
            <div className="flex justify-end mt-6">
              <button
                onClick={handleClose}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${getButtonColor()}`}
              >
                {confirmText || t('ok')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}