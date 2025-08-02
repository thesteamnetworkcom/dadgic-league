// src/components/terminal/TerminalSpinner.tsx
import { useEffect, useState } from 'react'

interface TerminalSpinnerProps {
  variant?: 'spinner' | 'dots' | 'bars' | 'ascii'
  message?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function TerminalSpinner({ 
  variant = 'spinner',
  message = 'Loading...',
  size = 'md',
  className = '' 
}: TerminalSpinnerProps) {
  const [frame, setFrame] = useState(0)

  const animations = {
    dots: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
    bars: ['▁', '▃', '▄', '▅', '▆', '▇', '█', '▇', '▆', '▅', '▄', '▃'],
    ascii: ['|', '/', '─', '\\']
  }

  useEffect(() => {
    if (variant !== 'spinner') {
      const interval = setInterval(() => {
        setFrame(prev => {
          const frames = animations[variant as keyof typeof animations]
          return (prev + 1) % frames.length
        })
      }, 150)
      return () => clearInterval(interval)
    }
  }, [variant])

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'w-4 h-4 text-sm'
      case 'md': return 'w-6 h-6 text-base'
      case 'lg': return 'w-8 h-8 text-lg'
      default: return 'w-6 h-6 text-base'
    }
  }

  const renderSpinner = () => {
    switch (variant) {
      case 'spinner':
        return (
          <div className={`border-2 border-terminal-green border-t-transparent rounded-full animate-spin ${getSizeClasses()}`} />
        )
      case 'dots':
      case 'bars':
      case 'ascii':
        const frames = animations[variant]
        return (
          <span className={`font-mono text-terminal-green ${getSizeClasses()}`}>
            {frames[frame]}
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {renderSpinner()}
      <span className="text-terminal-green font-mono text-sm">{message}</span>
    </div>
  )
}