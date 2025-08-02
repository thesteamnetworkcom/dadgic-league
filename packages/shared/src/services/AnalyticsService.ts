// packages/shared/src/services/AnalyticsService.ts
import { db } from '@dadgic/database'
import { APIError } from '../errors/APIError'
import type { 
  DatabaseAuthContext, 
  PodWithParticipants,
  PlayerStats,
  PodInsight,
  DashboardData,
  GetDashboardResponse,
  PodParticipant,
  Player
} from '@dadgic/database'

/**
 * Get comprehensive dashboard data for a player
 * Follows the same pattern as createPod
 */
export async function getDashboardData(playerId?: string, authContext?: DatabaseAuthContext): Promise<GetDashboardResponse> {
  try {
    console.log('📊 Getting dashboard data:', {
      playerId: playerId || 'current_user',
      authContext: authContext?.user_id
    })

    // 1. DETERMINE TARGET PLAYER
    const targetPlayerId = playerId || authContext?.user_id
    if (!targetPlayerId) {
      throw new APIError('No player ID provided and no auth context', 'INVALID_REQUEST', 400)
    }

    // 2. VERIFY PERMISSIONS (user can view own data, admins can view anyone's)
    if (playerId && playerId !== authContext?.user_id && !authContext?.is_admin) {
      throw new APIError('Permission denied - cannot view other player data', 'FORBIDDEN', 403)
    }

    // 3. FETCH DATA (parallel for performance)
    console.log('🔄 Fetching dashboard components in parallel')
    console.log(targetPlayerId)
    console.log(authContext?.user_id)
    console.log(authContext?.supabase_user_id)
    const [stats, recentGames, insights] = await Promise.all([
      calculatePlayerStats(targetPlayerId),
      getRecentGames(targetPlayerId, 10),
      generateInsights(targetPlayerId)
    ])

    // 4. RETURN STANDARDIZED RESPONSE
    return {
      success: true,
      data: {
        stats,
        recent_games: recentGames,
        insights,
      },
      timestamp: new Date().toISOString()
    }

  } catch (error) {
    console.error('❌ Dashboard data error:', error)

    if (error instanceof APIError) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }

    return {
      success: false,
      error: 'Failed to load dashboard data',
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Calculate player statistics from their pod history
 */
async function calculatePlayerStats(playerId: string): Promise<PlayerStats> {
  try {
    // Get all pods for this player (using existing listPods with filter)
    console.log("TESTTESTTEST")
    console.log(playerId)
    const pods = await db.pods.list({ playerId: playerId }, 'server-user')
    if (pods.length === 0) {
      return {
        total_games: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        win_rate: 0,
        avg_game_length: 0,
        favorite_commander: 'None',
        last_game_date: null
      }
    }

    // Calculate stats from pods
    let wins = 0
    let losses = 0
    let draws = 0
    let totalGameLength = 0
    let gamesWithLength = 0
    const commanderCounts: Record<string, number> = {}
    let lastGameDate: string | null = null

    for (const pod of pods) {
      // Find this player's participation
      const participation = pod.participants.find((p: PodParticipant & { player: Player })  => p.player_id === playerId)
      if (!participation) continue

      // Count results
      if (participation.result === 'win') wins++
      else if (participation.result === 'lose') losses++
      else if (participation.result === 'draw') draws++

      // Track commander usage
      const commander = participation.commander_deck
      commanderCounts[commander] = (commanderCounts[commander] || 0) + 1

      // Track game length
      if (pod.game_length_minutes) {
        totalGameLength += pod.game_length_minutes
        gamesWithLength++
      }

      // Track most recent game
      if (!lastGameDate || pod.date > lastGameDate) {
        lastGameDate = pod.date
      }
    }

    // Calculate derived stats
    const totalGames = wins + losses + draws
    const winRate = totalGames > 0 ? wins / totalGames : 0
    const avgGameLength = gamesWithLength > 0 ? totalGameLength / gamesWithLength : 0

    // Find favorite commander
    let favoriteCommander = 'None'
    let maxCount = 0
    for (const [commander, count] of Object.entries(commanderCounts)) {
      if (count > maxCount) {
        maxCount = count
        favoriteCommander = commander
      }
    }

    return {
      total_games: totalGames,
      wins,
      losses,
      draws,
      win_rate: winRate,
      avg_game_length: avgGameLength,
      favorite_commander: favoriteCommander,
      last_game_date: lastGameDate
    }

  } catch (error) {
    console.error('❌ Error calculating player stats:', error)
    throw new APIError(`Failed to calculate player stats: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get recent games for a player
 */
async function getRecentGames(playerId: string, limit: number): Promise<PodWithParticipants[]> {
  try {
    // Use existing listPods with filters
    const pods = await db.pods.list({ 
      playerId, 
      limit,
      // Assuming there's a way to order by date desc - if not, we'll sort in memory
    }, 'server-user')

    // Sort by date descending (most recent first) if not already sorted
    const sortedPods = pods.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    return sortedPods.slice(0, limit)

  } catch (error) {
    console.error('❌ Error getting recent games:', error)
    throw new APIError(`Failed to get recent games: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Generate insights for a player based on their game history
 */
async function generateInsights(playerId: string): Promise<PodInsight[]> {
  try {
    const stats = await calculatePlayerStats(playerId)
    const insights: PodInsight[] = []

    // Insight 1: Performance assessment
    if (stats.total_games > 0) {
      if (stats.win_rate > 0.6) {
        insights.push({
          type: 'performance',
          title: 'Strong Performance',
          description: `Excellent ${Math.round(stats.win_rate * 100)}% win rate across ${stats.total_games} games. Keep up the great work!`,
          confidence: 0.9
        })
      } else if (stats.win_rate < 0.4) {
        insights.push({
          type: 'warning',
          title: 'Room for Improvement',
          description: `Current win rate is ${Math.round(stats.win_rate * 100)}%. Consider analyzing your deck choices and play patterns.`,
          confidence: 0.8
        })
      } else {
        insights.push({
          type: 'meta',
          title: 'Balanced Performance', 
          description: `Solid ${Math.round(stats.win_rate * 100)}% win rate shows consistent gameplay across ${stats.total_games} games.`,
          confidence: 0.7
        })
      }
    }

    // Insight 2: Commander preference
    if (stats.favorite_commander !== 'None') {
      insights.push({
        type: 'meta',
        title: 'Commander Preference Detected',
        description: `${stats.favorite_commander} appears to be your go-to commander. Consider exploring similar strategies or archetypes.`,
        confidence: 0.8,
        data: { commander: stats.favorite_commander }
      })
    }

    // Insight 3: Game length analysis
    if (stats.avg_game_length > 0) {
      if (stats.avg_game_length > 90) {
        insights.push({
          type: 'warning',
          title: 'Long Game Duration',
          description: `Average game length of ${Math.round(stats.avg_game_length)} minutes suggests slower gameplay. Consider more aggressive strategies.`,
          confidence: 0.6
        })
      } else if (stats.avg_game_length < 30) {
        insights.push({
          type: 'performance',
          title: 'Efficient Games',
          description: `Quick ${Math.round(stats.avg_game_length)}-minute average games indicate decisive gameplay.`,
          confidence: 0.7
        })
      }
    }

    // Always return at least one insight for new users
    if (insights.length === 0) {
      insights.push({
        type: 'meta',
        title: 'Getting Started',
        description: 'Start logging games to unlock personalized insights and performance analysis!',
        confidence: 1.0
      })
    }

    return insights

  } catch (error) {
    console.error('❌ Error generating insights:', error)
    // Return empty insights rather than failing the whole request
    return [{
      type: 'warning',
      title: 'Insights Unavailable',
      description: 'Unable to generate insights at this time. Please try again later.',
      confidence: 0.5
    }]
  }
}