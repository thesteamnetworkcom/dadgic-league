// src/components/terminal/TerminalBackground.tsx
import { ReactNode } from 'react'
import { AtmosphericBackground } from '../atmosphere/AtmosphericBackground'

interface TerminalBackgroundProps {
  children: ReactNode
  variant?: 'landing' | 'terminal' | 'minimal'
  intensity?: 'low' | 'medium' | 'high'
  className?: string
}

export function TerminalBackground({ 
  children, 
  variant = 'terminal',
  intensity = 'medium',
  className = '' 
}: TerminalBackgroundProps) {
  return (
    <AtmosphericBackground 
      variant={variant}
      intensity={intensity}
      className={className}
    >
      {children}
    </AtmosphericBackground>
  )
}
