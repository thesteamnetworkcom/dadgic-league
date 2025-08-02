// src/components/dashboard/DashboardPage.tsx
import { TerminalSection } from '../terminal/TerminalSection'
import { GameLogger } from '../terminal/GameLogger'
import { StatsGrid } from '../terminal/StatsGrid'
import { TerminalTable } from '../terminal/TerminalTable'
import { InsightTerminal } from '../terminal/InsightTerminal'
import { TerminalSpinner } from '../terminal/TerminalSpinner'
import { useDashboardData } from '@/lib/api/hooks'
import { StatItem } from '@dadgic/database'

interface DashboardPageProps {
  className?: string
}

export function DashboardPage({ className = '' }: DashboardPageProps) {
  const { data: dashboardData, loading, error, refetch } = useDashboardData()
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <TerminalSpinner 
          variant="dots" 
          message="Loading dashboard data..." 
          size="lg"
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <InsightTerminal title="ERROR: dashboard_load_failed" variant="warning">
          <div className="space-y-2">
            <div>Failed to load dashboard data: {error}</div>
            <button 
              onClick={refetch}
              className="text-terminal-amber hover:text-terminal-green cursor-pointer"
            >
              [retry_connection]
            </button>
          </div>
        </InsightTerminal>
      </div>
    )
  }

  // Transform data for components
  const quickStats  = dashboardData?.stats ? [
    { 
      label: 'total_games', 
      value: dashboardData.stats.total_games.toString(), 
      status: 'highlight' as const 
    },
    { 
      label: 'win_rate', 
      value: `${Math.round(dashboardData.stats.win_rate * 100)}%`, 
      status: dashboardData.stats.win_rate > 0.5 ? 'win' : 'neutral' as const
    },
    { 
      label: 'avg_length', 
      value: `${Math.round(dashboardData.stats.avg_game_length)}m`, 
      status: 'neutral' as const 
    },
    { 
      label: 'last_game', 
      value: dashboardData.stats.last_game_date 
        ? getTimeAgo(dashboardData.stats.last_game_date)
        : 'Never', 
      status: 'neutral' as const 
    }
  ] as StatItem[] : [] as StatItem[]

  const recentGames = dashboardData?.recent_games?.map(game => ({
    date: new Date(game.date).toLocaleDateString(),
    opponents: game.participants
      .filter(p => p.player_id !== 'win')
      .map(p => p.player?.name || 'Unknown')
      .join(', '),
    commander: game.participants
      .find(p => p.result === 'win')?.commander_deck || 'Unknown',
    result: game.participants.some(p => p.result === 'win') ? 'W' : 'L',
    length: game.game_length_minutes ? `${game.game_length_minutes}m` : 'Unknown'
  })) || []

  const gameColumns = [
    { key: 'date', header: 'Date', width: '100px' },
    { key: 'opponents', header: 'Opponents' },
    { key: 'commander', header: 'Commander', width: '120px' },
    { key: 'result', header: 'Result', width: '60px', align: 'center' as const },
    { key: 'length', header: 'Length', width: '80px', align: 'right' as const }
  ]

  const renderGameCell = (key: string, value: any) => {
    if (key === 'result') {
      return (
        <span className={value === 'W' ? 'text-status-win' : 'text-status-lose'}>
          {value}
        </span>
      )
    }
    return value
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Game Logger Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TerminalSection title="game_logger.exe">
            <GameLogger />
          </TerminalSection>
        </div>
        
        <div>
          <TerminalSection title="quick_stats.dat">
            <StatsGrid stats={quickStats} columns={2} />
          </TerminalSection>
        </div>
      </div>

      {/* Insights */}
      {dashboardData?.insights?.map((insight, index) => (
        <InsightTerminal 
          key={index}
          title={insight.title}
          variant={insight.type === 'warning' ? 'warning' : insight.type === 'performance' ? 'success' : 'info'}
        >
          {insight.description}
        </InsightTerminal>
      ))}

      {/* Recent Games */}
      <TerminalSection title="recent_games.log">
        <TerminalTable 
          columns={gameColumns}
          data={recentGames}
          renderCell={renderGameCell}
          emptyMessage="No games logged yet. Use the game logger above to get started."
        />
      </TerminalSection>

      {/* Fallback insights if none from API */}
      {!dashboardData?.insights?.length && dashboardData?.stats && (
        <div className="grid lg:grid-cols-2 gap-6">
          <InsightTerminal title="getting_started.txt">
            <div className="space-y-2">
              <div>Welcome to Dadgic! Start by logging your first game above.</div>
              <div>The more games you log, the better insights you'll get.</div>
              <div>Try describing a recent game in natural language.</div>
            </div>
          </InsightTerminal>
          
          {dashboardData.stats.total_games > 0 && (
            <InsightTerminal title="performance_summary.dat" variant="success">
              <div className="space-y-2">
                <div>Games played: <span className="text-terminal-amber font-bold">{dashboardData.stats.total_games}</span></div>
                <div>Win rate: <span className="text-terminal-amber font-bold">{Math.round(dashboardData.stats.win_rate * 100)}%</span></div>
                <div>Favorite commander: <span className="text-terminal-amber font-bold">{dashboardData.stats.favorite_commander}</span></div>
              </div>
            </InsightTerminal>
          )}
        </div>
      )}
    </div>
  )
}

// Utility function
function getTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  
  if (diffInHours < 24) {
    return `${diffInHours}h`
  } else {
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d`
  }
}