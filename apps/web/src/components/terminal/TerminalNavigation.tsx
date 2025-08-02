// src/components/terminal/TerminalNavigation.tsx
import { ReactNode } from 'react'

interface NavItem {
  id: string
  label: string
  icon?: ReactNode
  disabled?: boolean
}

interface TerminalNavigationProps {
  items: NavItem[]
  activeItem: string
  onItemChange: (itemId: string) => void
  className?: string
}

export function TerminalNavigation({ 
  items, 
  activeItem, 
  onItemChange,
  className = '' 
}: TerminalNavigationProps) {
  return (
    <nav className={`bg-gray-950 border-b border-gray-600 flex ${className}`}>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => !item.disabled && onItemChange(item.id)}
          disabled={item.disabled}
          className={`
            px-5 py-2.5 font-mono text-xs border-r border-gray-600
            transition-all duration-200 flex items-center gap-2
            ${activeItem === item.id 
              ? 'bg-surface-secondary text-terminal-green' 
              : 'text-gray-500 hover:bg-gray-900 hover:text-gray-400'
            }
            ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
          {item.label}
        </button>
      ))}
    </nav>
  )
}