// ============================================================================
// Pod Service - Complete CRUD Operations (RENAMED FROM GameService)
// ============================================================================

import { db } from '@dadgic/database'
import { APIError, ValidationError } from '../errors/APIError.js'

// ✅ UPDATED: Import resolved types AND validation
import type {
	PodResolved,
	CreatePodResponse,
	PodDisplay,
	PodWithParticipants,
	PodInput,
	DatabaseAuthContext,
	ParticipantResolved,
	Pod
} from '@dadgic/database'

import { validatePodResolved, validatePodRequest } from '../utils/validation/pod.js'
import { resolveParticipants } from './PlayerMatchingService.js'

// ============================================================================
// POD CRUD OPERATIONS (Game → Pod terminology)
// ============================================================================

/**
 * Create a new pod (now takes unresolved participants with player_identifiers)
 */
export async function createPod(podData: PodInput, authContext?: DatabaseAuthContext): Promise<CreatePodResponse> {
	try {
		console.log('🎮 Creating pod:', {
			date: podData.date,
			participantsCount: podData.participants.length,
			authContext: authContext?.user_id
		})
		//await validateCurrentUserIsAdmin(authContext)
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
		const clientType = authContext?.is_admin ? 'service' : 'server-user'
		const createdPod = await db.pods.create({
			date: resolvedPodData.date,
			league_id: resolvedPodData.league_id,
			game_length_minutes: resolvedPodData.game_length_minutes || null,
			turns: resolvedPodData.turns || null,
			notes: resolvedPodData.notes?.trim() || null,
			participants: resolvedPodData.participants
		}, clientType)

		await checkScheduledPodCompletion(createdPod, resolvedPodData.participants)

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
export async function deletePod(podId: string, authContext?: DatabaseAuthContext): Promise<void> {
	try {
		console.log('🗑️ Deleting pod:', { podId, userID: authContext?.user_id })

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

/**
 * Check Scheduled Pod Completion (For League matching)
 */
export async function checkScheduledPodCompletion(pod: Pod, participants: ParticipantResolved[]): Promise<void> {
	try {
		console.log('🔍 Checking for scheduled pod match:', { podId: pod.id })

		// 1. Extract and sort player IDs
		const playerIds = participants.map(p => p.player_id).sort()
		console.log('👥 Player IDs for matching:', playerIds)

		// 2. Find matching scheduled pod
		const scheduledPod = await db.scheduledPods.findByPlayers(playerIds)

		if (!scheduledPod) {
			console.log('ℹ️ No matching scheduled pod found')
			return
		}

		console.log('✅ Found matching scheduled pod:', {
			scheduledPodId: scheduledPod.id,
			leagueId: scheduledPod.league_id
		})

		// 3. Update pod with league_id
		await db.pods.update(pod.id, { league_id: scheduledPod.league_id })
		console.log('📝 Updated pod with league_id:', scheduledPod.league_id)

		// 4. Mark scheduled pod as completed
		await db.scheduledPods.markCompleted(scheduledPod.id, pod.id)
		console.log('✅ Marked scheduled pod as completed')

		// 5. Check if league is now complete
		await checkLeagueCompletion(scheduledPod.league_id)

	} catch (error) {
		// Don't break pod creation if this fails
		console.error('⚠️ Scheduled pod completion failed:', error)
		// Consider: Should we throw here or just log? Current decision: just log
	}
}

export async function checkLeagueCompletion(leagueId: string): Promise<void> {
	try {
		const incompleteCount = await db.scheduledPods.countIncomplete(leagueId)
		console.log(`📊 League ${leagueId} has ${incompleteCount} incomplete scheduled pods`)

		if (incompleteCount === 0) {
			await db.leagues.updateStatus(leagueId, 'completed')
			console.log(`🏆 League ${leagueId} marked as completed!`)

			// TODO: Add notifications, stats calculations, etc.
		}
	} catch (error) {
		console.error('⚠️ League completion check failed:', error)
	}
}


// ============================================================================
// SERVICE INSTANCE PATTERN (for compatibility)
// ============================================================================

export class PodService {
	async createPod(podData: PodInput, authContext?: DatabaseAuthContext) {
		return createPod(podData, authContext)
	}

	async getPodById(podId: string) {
		return getPodById(podId)
	}

	async listPods(filters?: { playerId?: string; leagueId?: string; dateFrom?: string; dateTo?: string; limit?: number; offset?: number }) {
		return listPods(filters)
	}

	async deletePod(podId: string, authContext?: DatabaseAuthContext) {
		return deletePod(podId, authContext)
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

/** @deprecated Use getPodById instead */
export async function getGameById(gameId: string): Promise<PodDisplay> {
	return getPodById(gameId)
}

/** @deprecated Use listPods instead */
export async function listGames(filters?: { playerId?: string; leagueId?: string; dateFrom?: string; dateTo?: string; limit?: number; offset?: number }): Promise<PodDisplay[]> {
	return listPods(filters)
}

/** @deprecated Use getPodService instead */
export function getGameService(): PodService {
	return getPodService()
}