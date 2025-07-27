
// ============================================================================
// packages/shared/src/utils/validation/pod.ts - Pod Validation
// ============================================================================

// ✅ UPDATED: Import both request and resolved types
import type { CreatePodRequest, PodResolved } from '@dadgic/database'
import type { ValidationResult } from './index'

/**
 * Validates pod creation request data (with ParticipantInput - discord_username)
 * Used by API layer before resolution
 */
export function validatePodRequest(request: CreatePodRequest): ValidationResult {
  const errors: { field: string; message: string }[] = []

  // Validate date
  if (!request.date?.trim()) {
    errors.push({ field: 'date', message: 'Date is required' })
  }

  // ✅ UPDATED: players → participants
  if (!request.participants || !Array.isArray(request.participants)) {
    errors.push({ field: 'participants', message: 'Participants array is required' })
  } else if (request.participants.length < 2) {
    errors.push({ field: 'participants', message: 'At least 2 participants are required' })
  } else if (request.participants.length > 8) {
    errors.push({ field: 'participants', message: 'Maximum 8 participants allowed' })
  } else {
    // Validate each participant
    request.participants.forEach((participant, index) => {
      // ✅ UPDATED: Simple validation - just check player_identifier exists
      if (!participant.player_identifier?.trim()) {
        errors.push({ 
          field: `participants[${index}].player_identifier`, 
          message: `Participant ${index + 1} player identifier is required` 
        })
      }

      if (!participant.commander_deck?.trim()) {
        errors.push({ 
          field: `participants[${index}].commander_deck`, 
          message: `Participant ${index + 1} commander deck is required` 
        })
      }

      if (!['win', 'lose', 'draw'].includes(participant.result)) {
        errors.push({ 
          field: `participants[${index}].result`, 
          message: `Participant ${index + 1} result must be win, lose, or draw` 
        })
      }
    })

    // Check for duplicate participants (same player_identifier)
    const identifiers = request.participants
      .map(p => p.player_identifier?.trim().toLowerCase())
      .filter(Boolean)
    
    const uniqueIdentifiers = new Set(identifiers)
    if (identifiers.length !== uniqueIdentifiers.size) {
      errors.push({ field: 'participants', message: 'Each participant can only appear once' })
    }

    // Validate exactly one winner (unless all draws)
    const winners = request.participants.filter(p => p.result === 'win')
    const allDraws = request.participants.every(p => p.result === 'draw')
    
    if (!allDraws && winners.length !== 1) {
      errors.push({ field: 'participants', message: 'Exactly one participant must win (unless all draw)' })
    }
  }

  // Validate optional fields
  if (request.game_length_minutes !== undefined && request.game_length_minutes !== null) {
    if (request.game_length_minutes < 1 || request.game_length_minutes > 600) {
      errors.push({ field: 'game_length_minutes', message: 'Game length must be between 1 and 600 minutes' })
    }
  }

  if (request.turns !== undefined && request.turns !== null) {
    if (request.turns < 1 || request.turns > 50) {
      errors.push({ field: 'turns', message: 'Turns must be between 1 and 50' })
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validates resolved pod data (with ParticipantResolved - player_id)
 * Used by PodService after resolution
 */
export function validatePodResolved(podData: PodResolved): ValidationResult {
  const errors: { field: string; message: string }[] = []

  // Validate date
  if (!podData.date?.trim()) {
    errors.push({ field: 'date', message: 'Date is required' })
  }

  // Validate resolved participants
  if (!podData.participants || !Array.isArray(podData.participants)) {
    errors.push({ field: 'participants', message: 'Participants array is required' })
  } else if (podData.participants.length < 2) {
    errors.push({ field: 'participants', message: 'At least 2 participants are required' })
  } else if (podData.participants.length > 8) {
    errors.push({ field: 'participants', message: 'Maximum 8 participants allowed' })
  } else {
    // Validate each resolved participant
    podData.participants.forEach((participant, index) => {
      if (!participant.player_id?.trim()) {
        errors.push({ 
          field: `participants[${index}].player_id`, 
          message: `Participant ${index + 1} player_id is required` 
        })
      }

      if (!participant.commander_deck?.trim()) {
        errors.push({ 
          field: `participants[${index}].commander_deck`, 
          message: `Participant ${index + 1} commander deck is required` 
        })
      }

      if (!['win', 'lose', 'draw'].includes(participant.result)) {
        errors.push({ 
          field: `participants[${index}].result`, 
          message: `Participant ${index + 1} result must be win, lose, or draw` 
        })
      }
    })

    // Check for duplicate participants (same player_id)
    const playerIds = podData.participants.map(p => p.player_id?.trim()).filter(Boolean)
    const uniquePlayerIds = new Set(playerIds)
    if (playerIds.length !== uniquePlayerIds.size) {
      errors.push({ field: 'participants', message: 'Each participant can only appear once' })
    }

    // Validate exactly one winner (unless all draws)
    const winners = podData.participants.filter(p => p.result === 'win')
    const allDraws = podData.participants.every(p => p.result === 'draw')
    
    if (!allDraws && winners.length !== 1) {
      errors.push({ field: 'participants', message: 'Exactly one participant must win (unless all draw)' })
    }
  }

  // Validate optional fields (same as request validation)
  if (podData.game_length_minutes !== undefined && podData.game_length_minutes !== null) {
    if (podData.game_length_minutes < 1 || podData.game_length_minutes > 600) {
      errors.push({ field: 'game_length_minutes', message: 'Game length must be between 1 and 600 minutes' })
    }
  }

  if (podData.turns !== undefined && podData.turns !== null) {
    if (podData.turns < 1 || podData.turns > 50) {
      errors.push({ field: 'turns', message: 'Turns must be between 1 and 50' })
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

/** @deprecated Use validatePodRequest instead */
export function validateGameRequest(request: CreatePodRequest): ValidationResult {
  return validatePodRequest(request)
}