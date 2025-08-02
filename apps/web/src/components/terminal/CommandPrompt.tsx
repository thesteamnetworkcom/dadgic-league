// src/components/terminal/CommandPrompt.tsx
import { ReactNode } from 'react'

interface CommandPromptProps {
  command: string
  children?: ReactNode
  prompt?: string
  className?: string
}

export function CommandPrompt({ 
  command, 
  children,
  prompt = '$',
  className = '' 
}: CommandPromptProps) {
  return (
    <div className={`font-mono text-sm ${className}`}>
      <div className="text-terminal-green mb-2">
        <span className="text-terminal-green mr-1">{prompt}</span>
        <span>{command}</span>
      </div>
      {children && (
        <div className="pl-4 text-terminal-green">
          {children}
        </div>
      )}
    </div>
  )
}