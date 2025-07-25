// ============================================================================
// Game Validation
// ============================================================================

import type { CreateGameRequest } from '@dadgic/database'
import type { ValidationResult } from './index'

/**
 * Validates game creation request data
 */
export function validateGameRequest(request: CreateGameRequest): ValidationResult {
  const errors: { field: string; message: string }[] = []

  // Validate date
  if (!request.date?.trim()) {
    errors.push({ field: 'date', message: 'Date is required' })
  }

  // Validate players array
  if (!request.players || !Array.isArray(request.players)) {
    errors.push({ field: 'players', message: 'Players array is required' })
  } else if (request.players.length < 2) {
    errors.push({ field: 'players', message: 'At least 2 players are required' })
  } else {
    // Validate each player
    request.players.forEach((player, index) => {
      if (!player.discord_username?.trim()) {
        errors.push({ field: `players[${index}].discord_username`, message: `Player ${index + 1} discord username is required` })
      }

      if (!player.commander_deck?.trim()) {
        errors.push({ field: `players[${index}].commander_deck`, message: `Player ${index + 1} commander deck is required` })
      }

      if (!['win', 'lose', 'draw'].includes(player.result)) {
        errors.push({ field: `players[${index}].result`, message: `Player ${index + 1} result must be win, lose, or draw` })
      }
    })

    // Validate exactly one winner (unless all draws)
    const winners = request.players.filter(p => p.result === 'win')
    const allDraws = request.players.every(p => p.result === 'draw')
    
    if (!allDraws && winners.length !== 1) {
      errors.push({ field: 'players', message: 'Exactly one player must win (unless all draw)' })
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}