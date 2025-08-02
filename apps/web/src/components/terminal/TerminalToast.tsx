// src/components/terminal/TerminalToast.tsx
import { useEffect, useState } from 'react'

interface TerminalToastProps {
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  duration?: number
  isVisible: boolean
  onClose: () => void
  className?: string
}

export function TerminalToast({ 
  message, 
  type = 'info',
  duration = 3000,
  isVisible,
  onClose,
  className = '' 
}: TerminalToastProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
      const timer = setTimeout(() => {
        setIsAnimating(false)
        setTimeout(onClose, 200) // Wait for fade out
      }, duration)
      
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  if (!isVisible && !isAnimating) return null

  const getTypeStyles = () => {
    switch (type) {
      case 'success': return 'border-status-win bg-status-win/10 text-status-win'
      case 'warning': return 'border-terminal-amber bg-terminal-amber/10 text-terminal-amber'
      case 'error': return 'border-terminal-red bg-terminal-red/10 text-terminal-red'
      default: return 'border-terminal-green bg-terminal-green/10 text-terminal-green'
    }
  }

  const getPrefix = () => {
    switch (type) {
      case 'success': return '[SUCCESS] '
      case 'warning': return '[WARNING] '
      case 'error': return '[ERROR] '
      default: return '[INFO] '
    }
  }

  return (
    <div className={`
      fixed top-4 right-4 z-50 transition-all duration-200
      ${isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
    `}>
      <div className={`
        border px-4 py-2 font-mono text-sm max-w-md
        ${getTypeStyles()} ${className}
      `}>
        <div className="flex items-center justify-between">
          <span>
            {getPrefix()}{message}
          </span>
          <button
            onClick={() => {
              setIsAnimating(false)
              setTimeout(onClose, 200)
            }}
            className="ml-3 text-gray-500 hover:text-gray-300"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}

// Toast Provider Hook
export function useTerminalToast() {
  const [toasts, setToasts] = useState<Array<{
    id: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
    duration?: number
  }>>([])

  const showToast = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { id, message, type, duration }])
  }

  const hideToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <TerminalToast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          isVisible={true}
          onClose={() => hideToast(toast.id)}
        />
      ))}
    </div>
  )

  return { showToast, ToastContainer }
}