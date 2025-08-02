// src/components/terminal/StatsGrid.tsx
import type { StatItem } from '@dadgic/database'

interface StatsGridProps {
  stats: StatItem[]
  className?: string
  columns?: number
}

export function StatsGrid({ 
  stats, 
  className = '',
  columns = 4 
}: StatsGridProps) {
  const getValueColor = (status?: string) => {
    switch (status) {
      case 'win': return 'text-status-win'
      case 'lose': return 'text-status-lose'
      case 'highlight': return 'text-terminal-amber'
      default: return 'text-terminal-amber'
    }
  }

  return (
    <div 
      className={`grid gap-px bg-gray-600 border border-gray-600 ${className}`}
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {stats.map((stat, index) => (
        <div key={index} className="bg-surface-primary p-3 text-center">
          <div className={`text-lg font-bold font-mono ${getValueColor(stat.status)}`}>
            {stat.value}
          </div>
          <div className="text-xs text-gray-500 uppercase mt-1 font-mono">
            {stat.label}
          </div>
          {stat.subtext && (
            <div className="text-xs text-gray-400 mt-1">
              {stat.subtext}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}