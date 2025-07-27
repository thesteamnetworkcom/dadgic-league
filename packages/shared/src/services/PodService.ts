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
  PodParticipant,
  Player
} from '@dadgic/database'

import { validatePodResolved } from '../utils/validation/pod'

// ============================================================================
// POD CRUD OPERATIONS (Game → Pod terminology)
// ============================================================================

/**
 * Create a new pod (expects resolved participants with player_ids)
 */
export async function createPod(podData: PodResolved, userId?: string): Promise<CreatePodResponse> {
  try {
    console.log('🎮 Creating pod:', {
      date: podData.date,
      participantsCount: podData.participants.length,
      userId
    })

    // ✅ VALIDATE: PodService validates the resolved pod structure
    const validation = validatePodResolved(podData)
    if (!validation.isValid) {
      throw new ValidationError('Invalid resolved pod data', validation.errors)
    }

    // ✅ EXPECTS RESOLVED DATA: Participants already have player_ids
    // PlayerMatchingService should resolve participants before calling this service

    // Create the pod record directly with resolved data
    const createdPod = await db.pods.create({
      date: podData.date,
      league_id: podData.league_id,
      game_length_minutes: podData.game_length_minutes || null,
      turns: podData.turns || null,
      notes: podData.notes?.trim() || null,
      participants: podData.participants
    })

    // Get full pod data with participant details
    const podWithParticipants = await getPodById(createdPod.id)

    console.log('✅ Pod created successfully:', {
      podId: createdPod.id,
      participantsCount: podWithParticipants.participants.length
    })

    return {
      success: true,
      data: podWithParticipants,
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
  async createPod(podData: PodResolved, userId?: string) {
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
export async function createGame(podData: PodResolved, userId?: string): Promise<CreatePodResponse> {
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