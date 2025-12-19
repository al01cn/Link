'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import GlobalMessage, { MessageOptions } from '@/components/GlobalMessage'

interface GlobalMessageContextType {
  showMessage: (options: MessageOptions) => void
}

const GlobalMessageContext = createContext<GlobalMessageContextType | undefined>(undefined)

export function GlobalMessageProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<MessageOptions | null>(null)

  const showMessage = (options: MessageOptions) => {
    setMessage(options)
  }

  const handleClose = () => {
    setMessage(null)
  }

  return (
    <GlobalMessageContext.Provider value={{ showMessage }}>
      {children}
      <GlobalMessage message={message} onClose={handleClose} />
    </GlobalMessageContext.Provider>
  )
}

export function useGlobalMessage() {
  const context = useContext(GlobalMessageContext)
  if (context === undefined) {
    throw new Error('useGlobalMessage must be used within a GlobalMessageProvider')
  }
  return context
}