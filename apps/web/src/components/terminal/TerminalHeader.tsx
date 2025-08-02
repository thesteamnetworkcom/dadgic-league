// src/components/terminal/TerminalHeader.tsx
import { useAuth } from '@/contexts/AuthContext'

interface TerminalHeaderProps {
  className?: string
}

export function TerminalHeader({ className = '' }: TerminalHeaderProps) {
  const { user, signOut } = useAuth()

  return (
    <header className={`bg-surface-secondary border-b-2 border-terminal-green px-5 py-3 flex justify-between items-center ${className}`}>
      <div className="flex items-center">
        <h1 className="text-terminal-amber font-semibold font-mono">
          <span className="text-terminal-green mr-2">&gt;</span>
          dadgic_terminal
        </h1>
      </div>
      
      <div className="flex items-center space-x-4 text-sm font-mono">
        <span className="text-gray-500">
          <span className="text-terminal-green">user@dadgic:~$</span>
          <span className="ml-2 text-gray-400">
            {user?.discord_username || user?.name || 'commander'}
          </span>
        </span>
        
        <button
          onClick={signOut}
          className="text-gray-500 hover:text-terminal-red transition-colors text-xs"
        >
          [logout]
        </button>
      </div>
    </header>
  )
}