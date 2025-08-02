// src/components/terminal/TerminalSection.tsx
import { ReactNode } from 'react'

interface TerminalSectionProps {
  title: string
  children: ReactNode
  className?: string
  headerActions?: ReactNode
}

export function TerminalSection({ 
  title, 
  children, 
  className = '',
  headerActions 
}: TerminalSectionProps) {
  return (
    <div className={`mb-8 border border-gray-600 bg-surface-primary ${className}`}>
      <div className="bg-surface-secondary px-4 py-2 border-b border-gray-600 flex justify-between items-center">
        <h2 className="text-terminal-amber font-semibold text-xs font-mono flex items-center">
          <span className="text-gray-500 mr-2">┌─</span>
          {title}
        </h2>
        {headerActions && (
          <div className="flex items-center space-x-2">
            {headerActions}
          </div>
        )}
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  )
}