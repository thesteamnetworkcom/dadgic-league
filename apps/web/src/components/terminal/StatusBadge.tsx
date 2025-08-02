// src/components/terminal/StatusBadge.tsx
interface StatusBadgeProps {
  status: 'win' | 'lose' | 'draw' | 'active' | 'inactive' | 'pending' | 'error'
  text?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function StatusBadge({ 
  status, 
  text, 
  size = 'md',
  className = '' 
}: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'win': return { color: 'text-status-win', bg: 'bg-status-win/20', border: 'border-status-win', text: text || 'W' }
      case 'lose': return { color: 'text-status-lose', bg: 'bg-status-lose/20', border: 'border-status-lose', text: text || 'L' }
      case 'draw': return { color: 'text-status-fun', bg: 'bg-status-fun/20', border: 'border-status-fun', text: text || 'D' }
      case 'active': return { color: 'text-terminal-green', bg: 'bg-terminal-green/20', border: 'border-terminal-green', text: text || 'ACTIVE' }
      case 'inactive': return { color: 'text-gray-500', bg: 'bg-gray-500/20', border: 'border-gray-500', text: text || 'INACTIVE' }
      case 'pending': return { color: 'text-terminal-amber', bg: 'bg-terminal-amber/20', border: 'border-terminal-amber', text: text || 'PENDING' }
      case 'error': return { color: 'text-terminal-red', bg: 'bg-terminal-red/20', border: 'border-terminal-red', text: text || 'ERROR' }
      default: return { color: 'text-gray-500', bg: 'bg-gray-500/20', border: 'border-gray-500', text: text || status }
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'px-1.5 py-0.5 text-xs'
      case 'md': return 'px-2 py-1 text-xs'
      case 'lg': return 'px-3 py-1.5 text-sm'
      default: return 'px-2 py-1 text-xs'
    }
  }

  const config = getStatusConfig()

  return (
    <span className={`
      inline-flex items-center font-mono font-semibold
      border rounded ${config.color} ${config.bg} ${config.border}
      ${getSizeClasses()} ${className}
    `}>
      {config.text}
    </span>
  )
}