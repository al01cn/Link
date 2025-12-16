import { useState, useCallback } from 'react'

interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'warning' | 'info' | 'success' | 'danger'
}

interface NotificationOptions {
  title?: string
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  confirmText?: string
}

export function useConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions>({ message: '' })
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(opts)
      setResolvePromise(() => resolve)
      setIsOpen(true)
    })
  }, [])

  const handleConfirm = useCallback(() => {
    if (resolvePromise) {
      resolvePromise(true)
      setResolvePromise(null)
    }
    setIsOpen(false)
  }, [resolvePromise])

  const handleCancel = useCallback(() => {
    if (resolvePromise) {
      resolvePromise(false)
      setResolvePromise(null)
    }
    setIsOpen(false)
  }, [resolvePromise])

  return {
    confirm,
    isOpen,
    options,
    onConfirm: handleConfirm,
    onClose: handleCancel
  }
}

export function useNotificationDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<NotificationOptions>({ message: '' })

  const notify = useCallback((opts: NotificationOptions) => {
    setOptions(opts)
    setIsOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setIsOpen(false)
  }, [])

  return {
    notify,
    isOpen,
    options,
    onClose: handleClose
  }
}