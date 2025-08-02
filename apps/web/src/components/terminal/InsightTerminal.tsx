// src/components/terminal/InsightTerminal.tsx
import { ReactNode } from 'react'

interface InsightTerminalProps {
  title: string
  children: ReactNode
  variant?: 'info' | 'warning' | 'success'
  className?: string
}

export function InsightTerminal({ 
  title, 
  children, 
  variant = 'info',
  className = '' 
}: InsightTerminalProps) {
  const variantStyles = {
    info: {
      bg: 'bg-surface-primary',
      border: 'border-gray-600',
      accent: 'bg-gradient-to-r from-terminal-green to-terminal-amber',
      title: 'text-terminal-amber'
    },
    warning: {
      bg: 'bg-red-950/20',
      border: 'border-terminal-red',
      accent: 'bg-terminal-red',
      title: 'text-terminal-red'
    },
    success: {
      bg: 'bg-green-950/20',
      border: 'border-status-win',
      accent: 'bg-status-win',
      title: 'text-status-win'
    }
  }

  const styles = variantStyles[variant]

  return (
    <div className={`${styles.bg} border ${styles.border} p-4 relative ${className}`}>
      {/* Accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${styles.accent}`} />
      
      <div className={`${styles.title} font-semibold mb-3 text-sm font-mono`}>
        {variant === 'warning' && '[WARNING] '}
        {title}
      </div>
      
      <div className="text-terminal-green leading-relaxed font-mono text-sm">
        {children}
      </div>
    </div>
  )
}