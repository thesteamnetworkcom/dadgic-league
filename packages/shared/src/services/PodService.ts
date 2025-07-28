// ============================================================================
// Pod Service - Complete CRUD Operations (RENAMED FROM GameService)
// ============================================================================

import { db } from '@dadgic/database'
import { APIError, ValidationError } from '../errors/APIError'

// ✅ UPDATED: Import resolved types AND validation
import type { 
  PodResolved,
  CreatePodResponse, 
  PodDisplay,
  PodWithParticipants,
  PodInput,
  PodParticipant,
  Player
} from '@dadgic/database'

import { validatePodResolved, validatePodRequest } from '../utils/validation/pod'
import { resolveParticipants } from './PlayerMatchingService'

// ============================================================================
// POD CRUD OPERATIONS (Game → Pod terminology)
// ============================================================================

/**
 * Create a new pod (now takes unresolved participants with player_identifiers)
 */
export async function createPod(podData: PodInput, userId?: string): Promise<CreatePodResponse> {
  try {
    console.log('🎮 Creating pod:', {
      date: podData.date,
      participantsCount: podData.participants.length,
      userId
    })

    // 1. VALIDATE UNRESOLVED POD DATA
    const initialValidation = validatePodRequest(podData)
    if (!initialValidation.isValid) {
      throw new ValidationError('Invalid pod request data', initialValidation.errors)
    }

    // 2. RESOLVE PARTICIPANTS (player_identifier → player_id)
    console.log('🔄 Resolving participants through PlayerMatchingService')
    const resolvedParticipants = await resolveParticipants(podData.participants)

    // Create resolved pod data
    const resolvedPodData: PodResolved = {
      date: podData.date,
      league_id: podData.league_id ?? null,
      game_length_minutes: podData.game_length_minutes ?? null,
      turns: podData.turns ?? null,
      notes: podData.notes ?? null,
      participants: resolvedParticipants
    }

    // 3. VALIDATE RESOLVED POD DATA  
    const resolvedValidation = validatePodResolved(resolvedPodData)
    if (!resolvedValidation.isValid) {
      throw new ValidationError('Invalid resolved pod data', resolvedValidation.errors)
    }

    // 4. CALL QUERY FUNCTION
    console.log('💾 Creating pod in database')
    const createdPod = await db.pods.create({
      date: resolvedPodData.date,
      league_id: resolvedPodData.league_id,
      game_length_minutes: resolvedPodData.game_length_minutes || null,
      turns: resolvedPodData.turns || null,
      notes: resolvedPodData.notes?.trim() || null,
      participants: resolvedPodData.participants
    })

    return {
      success: true,
      data: createdPod,
      timestamp: new Date().toISOString()
    }

  } catch (error) {
    console.error('❌ Pod creation error:', error)

    if (error instanceof APIError) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }

    return {
      success: false,
      error: 'Failed to create pod',
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Get pod by ID (renamed from getGameById)
 */
export async function getPodById(podId: string): Promise<PodDisplay> {
  try {
    const pod: PodWithParticipants | null = await db.pods.getById(podId)
    if (!pod) {
      throw new APIError('Pod not found', 'NOT_FOUND', 404)
    }

    // Get participants with player details
    const participants = pod.participants
    
    // ✅ UPDATED: Use new ParticipantDisplay type structure
    const participantsDisplay = participants.map(p => ({
      player_id: p.player_id,
      player_name: p.player?.name || 'Unknown Player',
      discord_username: p.player?.discord_username || null,
      commander_deck: p.commander_deck,
      result: p.result
    }))

    return {
      id: pod.id,
      league_id: pod.league_id,
      date: pod.date,
      game_length_minutes: pod.game_length_minutes,
      turns: pod.turns,
      notes: pod.notes,
      participants: participantsDisplay,
      created_at: pod.created_at,
      updated_at: pod.updated_at
    }

  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError(`Failed to get pod: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * List pods with filters (renamed from listGames)
 */
export async function listPods(filters: {
  playerId?: string
  leagueId?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
} = {}): Promise<PodDisplay[]> {
  try {
    console.log('📋 Listing pods with filters:', filters)

    const pods = await db.pods.list({
      playerId: filters.playerId,
      leagueId: filters.leagueId,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      limit: filters.limit || 50,
      offset: filters.offset || 0
    })

    // Get full pod data for each pod
    const podsWithDetails = await Promise.all(
      pods.map(pod => getPodById(pod.id))
    )

    return podsWithDetails

  } catch (error) {
    console.error('❌ List pods error:', error)
    throw new APIError(`Failed to list pods: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Delete pod (renamed from deleteGame)
 */
export async function deletePod(podId: string, userId?: string): Promise<void> {
  try {
    console.log('🗑️ Deleting pod:', { podId, userId })

    // Check if pod exists
    await getPodById(podId)

    // Delete the pod (participants will be deleted via cascade)
    await db.pods.delete(podId)

    console.log('✅ Pod deleted successfully:', { podId })

  } catch (error) {
    console.error('❌ Pod deletion error:', error)

    if (error instanceof APIError) {
      throw error
    }

    throw new APIError(`Failed to delete pod: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// ============================================================================
// SERVICE INSTANCE PATTERN (for compatibility)
// ============================================================================

export class PodService {
  async createPod(podData: PodInput, userId?: string) {
    return createPod(podData, userId)
  }

  async getPodById(podId: string) {
    return getPodById(podId)
  }

  async listPods(filters?: { playerId?: string; leagueId?: string; dateFrom?: string; dateTo?: string; limit?: number; offset?: number }) {
    return listPods(filters)
  }

  async deletePod(podId: string, userId?: string) {
    return deletePod(podId, userId)
  }
}

// Export singleton instance
let podService: PodService | null = null

export function getPodService(): PodService {
  if (!podService) {
    podService = new PodService()
  }
  return podService
}

// ============================================================================
// LEGACY COMPATIBILITY - For smooth transition
// ============================================================================

/** @deprecated Use createPod instead */
export async function createGame(podData: PodInput, userId?: string): Promise<CreatePodResponse> {
  return createPod(podData, userId)
}

/** @deprecated Use getPodById instead */
export async function getGameById(gameId: string): Promise<PodDisplay> {
  return getPodById(gameId)
}

/** @deprecated Use listPods instead */
export async function listGames(filters?: { playerId?: string; leagueId?: string; dateFrom?: string; dateTo?: string; limit?: number; offset?: number }): Promise<PodDisplay[]> {
  return listPods(filters)
}

/** @deprecated Use deletePod instead */
export async function deleteGame(gameId: string, userId?: string): Promise<void> {
  return deletePod(gameId, userId)
}

/** @deprecated Use getPodService instead */
export function getGameService(): PodService {
  return getPodService()
}