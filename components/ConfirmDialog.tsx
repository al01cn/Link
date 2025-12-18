'use client'

import { useState, useEffect } from 'react'
import { X, AlertTriangle, Info, CheckCircle } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'warning' | 'info' | 'success' | 'danger'
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  type = 'warning'
}: ConfirmDialogProps) {
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

  const handleConfirm = () => {
    onConfirm()
    handleClose()
  }

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />
      case 'danger':
        return <AlertTriangle className="w-6 h-6 text-red-500" />
      case 'info':
        return <Info className="w-6 h-6 text-blue-500" />
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />
      default:
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />
    }
  }

  const getButtonColor = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
      case 'success':
        return 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
      default:
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
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
                {title && (
                  <h3 className="text-lg font-medium text-gray-900 dark:text-slate-200 mb-2">
                    {title}
                  </h3>
                )}
                <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
                  {message}
                </p>
              </div>
            </div>

            {/* 按钮区域 */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                {cancelText || t('cancel')}
              </button>
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${getButtonColor()}`}
              >
                {confirmText || t('confirm')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}