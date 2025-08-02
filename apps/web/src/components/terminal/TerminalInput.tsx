// src/components/terminal/TerminalInput.tsx
import { InputHTMLAttributes, forwardRef } from 'react'

interface TerminalInputProps extends InputHTMLAttributes<HTMLInputElement> {
  showPrompt?: boolean
  promptText?: string
}

export const TerminalInput = forwardRef<HTMLInputElement, TerminalInputProps>(
  ({ showPrompt = false, promptText = '$', className = '', ...props }, ref) => {
    return (
      <div className="relative">
        {showPrompt && (
          <span className="text-terminal-green font-mono text-sm absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            {promptText}{' '}
          </span>
        )}
        <input
          ref={ref}
          className={`
            w-full bg-surface-primary border border-gray-600 
            text-terminal-green font-mono text-sm px-3 py-2
            ${showPrompt ? 'pl-8' : ''}
            placeholder-gray-500 outline-none
            focus:border-terminal-green focus:shadow-sm focus:shadow-terminal-green/20
            ${className}
          `}
          {...props}
        />
      </div>
    )
  }
)

TerminalInput.displayName = 'TerminalInput'