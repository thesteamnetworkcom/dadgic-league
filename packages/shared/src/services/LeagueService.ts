// ============================================================================
// League Service - League Generation & Management Operations
// ============================================================================

import { db } from '@dadgic/database'
import type { CreateLeagueInput, LeagueWithProgress } from '@dadgic/database'
import { APIError, ValidationError } from '../errors/APIError'
import { validateLeagueInput } from '../utils/validation/league'
import { validateCurrentUserIsAdmin } from '../utils/validation/auth'
import { generatePodPairings } from './PodGenerationService'

// Temporarily duplicate until we sort out type organization
// TODO: Fix type organization and remove these duplicates
export interface CreateLeagueRequest {
  name: string
  description?: string
  playerIds: string[]
  startDate: string
  endDate?: string
  gamesPerPlayer: number
}

export interface LeagueGenerationResult {
  league: LeagueWithProgress
  scheduledPods: any[] // TODO: Define proper ScheduledPod type
  stats: {
    totalPlayers: number
    totalPods: number
    gamesPerPlayer: number
  }
}

/**
 * Generate a complete league with scheduled pods
 */
export async function generateLeague(request: CreateLeagueRequest): Promise<LeagueGenerationResult> {
  try {
    console.log('🎯 Generating league:', { name: request.name, playerCount: request.playerIds.length })

    // Check admin permissions
    await validateCurrentUserIsAdmin()

    // Validate league input
    const leagueInput: CreateLeagueInput = {
      name: request.name,
      description: request.description || null,
      player_ids: request.playerIds,
      start_date: request.startDate,
      end_date: request.endDate || null,
      games_per_player: request.gamesPerPlayer
    }

    const validation = validateLeagueInput(leagueInput)
    if (!validation.isValid) {
      throw new ValidationError('Invalid league data', validation.errors)
    }

    // Generate pod pairings (TODO: needs PodGenerationService)
    const podPlayerGroups = generatePodPairings(request.playerIds, request.gamesPerPlayer)
    console.log(`🎲 Generated ${podPlayerGroups.length} pod pairings`)

    // Create the league record
    const league = await db.leagues.create(leagueInput, podPlayerGroups)
    console.log(`✅ Created league: ${league.id}`)

    // Get the created scheduled pods
    const scheduledPods = await db.leagues.getScheduledPods(league.id)
    console.log(`💾 Created ${scheduledPods.length} scheduled pods`)

    // Activate the league
    await db.leagues.updateStatus(league.id, 'active')
    console.log(`🚀 League "${league.name}" is now active!`)

    return {
      league,
      scheduledPods,
      stats: {
        totalPlayers: league.player_ids.length,
        totalPods: podPlayerGroups.length,
        gamesPerPlayer: request.gamesPerPlayer
      }
    }

  } catch (error) {
    console.error('❌ League generation error:', error)

    if (error instanceof APIError) {
      throw error
    }

    throw new APIError(`Failed to generate league: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Validate league creation request (legacy helper)
 * 
 * @deprecated Use validateLeagueInput from utils/validation/league instead
 */
export function validateLeagueCreation(playerCount: number, gamesPerPlayer: number): { isValid: boolean; error?: string } {
  // For backward compatibility, create a minimal request object
  const fakeRequest = {
    name: 'temp',
    player_ids: new Array(playerCount).fill('temp'),
    games_per_player: gamesPerPlayer,
    start_date: '2024-01-01'
  }
  
  const validation = validateLeagueInput(fakeRequest)
  
  if (!validation.isValid) {
    return { 
      isValid: false, 
      error: validation.errors[0]?.message || 'League validation failed'
    }
  }
  
  return { isValid: true }
}

/**
 * Get suggested games per player for a given player count
 */
export function getSuggestedGamesPerPlayer(playerCount: number): number[] {
  if (playerCount < 4) return []
  
  const suggestions: number[] = []
  for (let games = 1; games <= 20; games++) {
    const totalSlots = playerCount * games
    if (totalSlots % 4 === 0) {
      suggestions.push(games)
    }
  }
  return suggestions.slice(0, 10)
}

/**
 * Get all players for league creation (admin only)
 */
export async function getPlayersForLeagueCreation() {
  try {
    console.log('👥 Getting players for league creation')

    // TODO: Check admin permissions
    // TODO: Get players from database
    throw new Error('getPlayersForLeagueCreation not implemented yet')

  } catch (error) {
    console.error('❌ Get players for league creation error:', error)

    if (error instanceof APIError) {
      throw error
    }

    throw new APIError(`Failed to get players for league creation: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Calculate league standings from completed pods
 */
export async function getLeagueStandings(leagueId: string) {
  try {
    console.log('📊 Calculating league standings for:', leagueId)

    // Get the raw pod data from database (existing query, just renamed)
    const podsData = await db.leagues.getPodsWithParticipants(leagueId)

    // Business logic: Calculate standings
    const playerStats: Record<string, any> = {}
    
    podsData.forEach(pod => {
      pod.participants.forEach((participant: any) => {
        const playerId = participant.player_id
        const playerName = participant.player?.name || 'Unknown'
        
        if (!playerStats[playerId]) {
          playerStats[playerId] = {
            player_id: playerId,
            player_name: playerName,
            games_played: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            win_rate: 0
          }
        }
        
        playerStats[playerId].games_played++
        
        if (participant.result === 'win') playerStats[playerId].wins++
        else if (participant.result === 'lose') playerStats[playerId].losses++
        else if (participant.result === 'draw') playerStats[playerId].draws++
      })
    })
    
    // Business logic: Calculate win rates and sort
    const standings = Object.values(playerStats).map((stats: any) => ({
      ...stats,
      win_rate: stats.games_played > 0 ? stats.wins / stats.games_played : 0
    }))
    
    standings.sort((a: any, b: any) => {
      if (a.wins !== b.wins) return b.wins - a.wins
      return b.win_rate - a.win_rate
    })
    
    console.log('✅ Calculated standings for', standings.length, 'players')
    return standings

  } catch (error) {
    console.error('❌ League standings calculation error:', error)
    
    if (error instanceof APIError) {
      throw error
    }

    throw new APIError(`Failed to calculate league standings: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}