import { ResponseBase } from "../common/base"
import { PodWithParticipants } from "../entities"

// Player statistics aggregation
export interface PlayerStats {
  total_games: number
  wins: number  
  losses: number
  draws: number
  win_rate: number
  avg_game_length: number
  favorite_commander: string
  last_game_date: string | null
}

// Individual insights
export interface PodInsight {
  type: 'matchup' | 'performance' | 'meta' | 'warning'
  title: string
  description: string
  confidence: number
  data?: Record<string, any>
}

// Combined dashboard response
export interface DashboardData {
  stats: PlayerStats
  recent_games: PodWithParticipants[]  // Using existing type
  insights: PodInsight[]
}

// API response wrapper
export interface GetDashboardResponse extends ResponseBase<DashboardData> {}