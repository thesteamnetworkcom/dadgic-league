// src/components/terminal/TerminalModal.tsx
import { ReactNode, useEffect } from 'react'
import { TerminalButton } from './TerminalButton'

interface TerminalModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  variant?: 'info' | 'warning' | 'error' | 'success'
  className?: string
}

export function TerminalModal({ 
  isOpen, 
  onClose, 
  title, 
  children,
  confirmText,
  cancelText = 'Cancel',
  onConfirm,
  variant = 'info',
  className = '' 
}: TerminalModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const getVariantStyles = () => {
    switch (variant) {
      case 'warning': return 'border-terminal-red bg-red-950/20'
      case 'error': return 'border-terminal-red bg-red-950/30'
      case 'success': return 'border-status-win bg-green-950/20'
      default: return 'border-terminal-green bg-surface-primary'
    }
  }

  const getHeaderPrefix = () => {
    switch (variant) {
      case 'warning': return '[WARNING] '
      case 'error': return '[ERROR] '
      case 'success': return '[SUCCESS] '
      default: return '[INFO] '
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`
        relative w-full max-w-md mx-4 border-2 font-mono
        ${getVariantStyles()} ${className}
      `}>
        {/* Header */}
        <div className="border-b border-gray-600 px-4 py-3">
          <h3 className="text-terminal-amber font-semibold text-sm">
            {getHeaderPrefix()}{title}
          </h3>
        </div>
        
        {/* Content */}
        <div className="p-4 text-terminal-green text-sm">
          {children}
        </div>
        
        {/* Actions */}
        <div className="border-t border-gray-600 px-4 py-3 flex justify-end space-x-2">
          <TerminalButton
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            {cancelText}
          </TerminalButton>
          
          {confirmText && onConfirm && (
            <TerminalButton
              variant={variant === 'error' || variant === 'warning' ? 'terminal' : 'primary'}
              size="sm"
              onClick={() => {
                onConfirm()
                onClose()
              }}
            >
              {confirmText}
            </TerminalButton>
          )}
        </div>
      </div>
    </div>
  )
}