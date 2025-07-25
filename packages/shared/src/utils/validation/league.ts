// ============================================================================
// League Validation
// ============================================================================

import type { CreateLeagueInput } from '@dadgic/database'
import type { ValidationResult } from './index'

/**
 * Validates league creation request data
 */
export function validateLeagueInput(request: CreateLeagueInput): ValidationResult {
  const errors: { field: string; message: string }[] = []

  // Validate name
  if (!request.name?.trim()) {
    errors.push({ field: 'name', message: 'League name is required' })
  } else if (request.name.trim().length > 100) {
    errors.push({ field: 'name', message: 'League name must be less than 100 characters' })
  }

  // Validate player IDs
  if (!request.player_ids || !Array.isArray(request.player_ids)) {
    errors.push({ field: 'player_ids', message: 'Player IDs array is required' })
  } else if (request.player_ids.length < 4) {
    errors.push({ field: 'player_ids', message: 'Need at least 4 players for a league' })
  }

  // Validate games per player
  if (!request.games_per_player || request.games_per_player < 1) {
    errors.push({ field: 'games_per_player', message: 'Games per player must be at least 1' })
  }

  // Validate start date
  if (!request.start_date?.trim()) {
    errors.push({ field: 'start_date', message: 'Start date is required' })
  }

  // Validate math (only if we have valid inputs)
  if (request.player_ids?.length >= 4 && request.games_per_player >= 1) {
    const totalSlots = request.player_ids.length * request.games_per_player
    if (totalSlots % 4 !== 0) {
      errors.push({ 
        field: 'games_per_player', 
        message: `${request.player_ids.length} players × ${request.games_per_player} games = ${totalSlots} total slots. Need a multiple of 4. Try adjusting games per player.`
      })
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}