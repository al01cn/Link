'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

export interface MessageOptions {
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number // 显示时长，毫秒
  closable?: boolean // 是否可手动关闭
}

interface GlobalMessageProps {
  message: MessageOptions | null
  onClose: () => void
}

export default function GlobalMessage({ message, onClose }: GlobalMessageProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (message) {
      setIsVisible(true)
      setIsAnimating(true)
      
      // 自动关闭
      const duration = message.duration || 3000
      const timer = setTimeout(() => {
        handleClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [message])

  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(() => {
      setIsVisible(false)
      onClose()
    }, 300) // 等待动画完成
  }

  if (!message || !isVisible) return null

  const getIcon = () => {
    switch (message.type) {
      case 'success':
        return <CheckCircle size={20} className="text-green-500" />
      case 'error':
        return <XCircle size={20} className="text-red-500" />
      case 'warning':
        return <AlertCircle size={20} className="text-yellow-500" />
      case 'info':
        return <Info size={20} className="text-blue-500" />
    }
  }

  const getBackgroundColor = () => {
    switch (message.type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
    }
  }

  const getTextColor = () => {
    switch (message.type) {
      case 'success':
        return 'text-green-800'
      case 'error':
        return 'text-red-800'
      case 'warning':
        return 'text-yellow-800'
      case 'info':
        return 'text-blue-800'
    }
  }

  return (
    <div className="fixed top-4 right-4" style={{ zIndex: 99999 }}>
      <div
        className={`
          flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg min-w-80 max-w-md
          ${getBackgroundColor()} ${getTextColor()}
          transition-all duration-300 ease-in-out
          ${isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        `}
      >
        {getIcon()}
        <span className="flex-1 text-sm font-medium">{message.message}</span>
        {(message.closable !== false) && (
          <button
            onClick={handleClose}
            className={`p-1 rounded-full hover:bg-black/10 transition-colors ${getTextColor()}`}
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  )
}