// src/components/terminal/TerminalBackground.tsx
import { ReactNode } from 'react'

interface TerminalBackgroundProps {
  children: ReactNode
  variant?: 'landing' | 'terminal'
  className?: string
}

export function TerminalBackground({ 
  children, 
  variant = 'landing',
  className = '' 
}: TerminalBackgroundProps) {
  const baseStyles = 'min-h-screen overflow-x-hidden'
  
  const backgroundStyles = {
    landing: `
      background: var(--atmospheric-bg);
      background-image: 
        linear-gradient(90deg, transparent 98%, rgba(139, 130, 211, 0.03) 99%, transparent 100%),
        linear-gradient(0deg, transparent 98%, rgba(255, 120, 73, 0.03) 99%, transparent 100%);
      background-size: 120px 120px, 80px 80px;
    `,
    terminal: `
      background: var(--terminal-atmospheric-bg);
    `
  }

  return (
    <div 
      className={`${baseStyles} ${className}`}
      style={{
        background: variant === 'landing' 
          ? 'radial-gradient(circle at 20% 30%, rgba(255, 120, 73, 0.06) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(139, 130, 211, 0.06) 0%, transparent 50%), radial-gradient(circle at 50% 90%, rgba(100, 100, 100, 0.02) 0%, transparent 60%), linear-gradient(135deg, #0f0f0f 0%, #121212 50%, #0f0f0f 100%)'
          : 'radial-gradient(circle at 20% 20%, rgba(0, 255, 65, 0.03) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(255, 183, 77, 0.03) 0%, transparent 40%), #0a0a0a',
        backgroundImage: variant === 'landing' 
          ? 'linear-gradient(90deg, transparent 98%, rgba(139, 130, 211, 0.03) 99%, transparent 100%), linear-gradient(0deg, transparent 98%, rgba(255, 120, 73, 0.03) 99%, transparent 100%)'
          : undefined,
        backgroundSize: variant === 'landing' ? '120px 120px, 80px 80px' : undefined
      }}
    >
      {children}
    </div>
  )
}