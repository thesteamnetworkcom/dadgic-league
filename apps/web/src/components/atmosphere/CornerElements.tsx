// src/components/atmosphere/CornerElements.tsx
import { useEffect, useState } from 'react'

interface CornerElementsProps {
  showStatus?: boolean
  className?: string
}

export function CornerElements({ 
  showStatus = true,
  className = '' 
}: CornerElementsProps) {
  const [time, setTime] = useState(new Date())
  const [status] = useState('ONLINE')

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className={`absolute inset-0 pointer-events-none font-mono text-xs ${className}`}>
      {/* Top Left - System Info */}
      <div className="absolute top-4 left-4 text-gray-600 space-y-1">
        <div>┌─ DADGIC_TERMINAL_v2.1</div>
        <div>│ STATUS: <span className="text-terminal-green">{status}</span></div>
        <div>│ TIME: <span className="text-terminal-amber">{formatTime(time)}</span></div>
        <div>└─ READY</div>
      </div>

      {/* Top Right - Connection Status */}
      <div className="absolute top-4 right-4 text-gray-600 text-right space-y-1">
        <div>CONN: <span className="text-terminal-green">●</span> STABLE</div>
        <div>LAT: <span className="text-terminal-amber">12ms</span></div>
        <div>USR: <span className="text-terminal-green">AUTH</span></div>
      </div>

      {/* Bottom Left - Memory/Process */}
      <div className="absolute bottom-4 left-4 text-gray-600 space-y-1">
        <div>┌─ SYSTEM_STATS</div>
        <div>│ MEM: <span className="text-terminal-amber">847MB</span></div>
        <div>│ CPU: <span className="text-terminal-green">23%</span></div>
        <div>└─ PROC: <span className="text-terminal-green">IDLE</span></div>
      </div>

      {/* Bottom Right - ASCII Art */}
      <div className="absolute bottom-4 right-4 text-gray-600 text-right space-y-0 leading-none">
        <div>╭─────╮</div>
        <div>│ MTG │</div>
        <div>│ CMD │</div>
        <div>╰─────╯</div>
      </div>

      {/* Geometric Corner Accents */}
      <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-terminal-green opacity-20" />
      <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-terminal-green opacity-20" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-terminal-green opacity-20" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-terminal-green opacity-20" />
    </div>
  )
}