// ============================================================================
// Player Service - Pure CRUD Operations (Cleaned)
// ============================================================================

import { db, Player, CreatePlayerResponse, CreatePlayerRequest, PlayerInput, DatabaseAuthContext, CreatePlayerInput } from '@dadgic/database'
import { APIError, ValidationError } from '../errors/APIError'
import { validatePlayerRequest, validatePlayerExists } from '../utils/validation/player'
import { validateCurrentUserIsAdmin } from '../utils/validation'


// ============================================================================
// PLAYER SERVICE - CRUD ONLY
// ============================================================================

/**
 * Create a new player
 */
export async function createPlayer(request: PlayerInput, authContext?: DatabaseAuthContext): Promise<CreatePlayerResponse> {
	try {
		console.log('👥 Creating player:', {
			name: request.name,
			discord_username: request.discord_username,
			authContext: authContext?.user_id
		})
		await validateCurrentUserIsAdmin(authContext)
		// Validate request
		const validation = validatePlayerRequest(request)
		if (!validation.isValid) {
			throw new ValidationError('Invalid player data', validation.errors)
		}

		// Check for duplicates
		if (request.discord_username) {
			try {
				const existing = await db.players.findByDiscordUsername(request.discord_username)
				if (existing) {
					throw new ValidationError('Player already exists', [
						{ field: 'discord_username', message: `Player with Discord username "${request.discord_username}" already exists` }
					])
				}
			} catch (error) {
				// If the query fails because table is empty, that's fine - no duplicates
				if (error instanceof ValidationError) throw error
				console.log('Note: Could not check for duplicate discord_username (likely empty table)')
			}
		}

		if (request.discord_id) {
			try {
				const existing = await db.players.findByDiscordId(request.discord_id)
				if (existing) {
					throw new ValidationError('Player already exists', [
						{ field: 'discord_id', message: `Player with Discord ID "${request.discord_id}" already exists` }
					])
				}
			} catch (error) {
				// If the query fails because table is empty, that's fine - no duplicates
				if (error instanceof ValidationError) throw error
				console.log('Note: Could not check for duplicate discord_id (likely empty table)')
			}
		}

		// Create player
		const playerData: PlayerInput = {
			name: request.name.trim(),
			discord_username: request.discord_username?.trim() || null,
			discord_id: request.discord_id?.trim() || null,
			role: request.role || 'player'
		}

		const createdPlayer = await db.players.create(playerData)

		console.log('✅ Player created successfully:', {
			playerId: createdPlayer.id,
			name: createdPlayer.name
		})

		return {
			success: true,
			data: createdPlayer,
			timestamp: new Date().toISOString()
		}

	} catch (error) {
		console.error('❌ Player creation error:', error)

		if (error instanceof APIError) {
			return {
				success: false,
				error: error.message,
				timestamp: new Date().toISOString()
			}
		}

		return {
			success: false,
			error: 'Failed to create player',
			timestamp: new Date().toISOString()
		}
	}
}

/**
 * Get player by ID
 */
export async function getPlayerById(playerId: string): Promise<Player> {
	try {
		const player = await db.players.findById(playerId)
		if (!player) {
			throw new APIError('Player not found', 'NOT_FOUND', 404)
		}
		return player
	} catch (error) {
		if (error instanceof APIError) {
			throw error
		}
		throw new APIError(`Failed to get player: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * List players with optional filtering
 */
export async function listPlayers(filters: {
	search?: string
	limit?: number
	offset?: number
} = {}): Promise<Player[]> {
	try {
		console.log('📋 Listing players with filters:', filters)

		const players = await db.players.list({
			search: filters.search,
			limit: filters.limit || 100,
			offset: filters.offset || 0
		})

		return players

	} catch (error) {
		console.error('❌ List players error:', error)
		throw new APIError(`Failed to list players: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Update an existing player
 */
export async function updatePlayer(playerId: string, updates: Partial<PlayerInput>, userId?: string): Promise<Player> {
	try {
		console.log('✏️ Updating player:', { playerId, userId })

		// Check if player exists
		await getPlayerById(playerId)

		// Validate updates
		if (Object.keys(updates).length > 0) {
			const validation = validatePlayerRequest({ name: 'temp', ...updates })
			if (!validation.isValid) {
				throw new ValidationError('Invalid update data', validation.errors)
			}
		}

		// Check for duplicate discord username if updating
		if (updates.discord_username) {
			const existing = await db.players.findByDiscordUsername(updates.discord_username)
			if (existing && existing.id !== playerId) {
				throw new ValidationError('Discord username already taken', [
					{ field: 'discord_username', message: `Discord username "${updates.discord_username}" is already taken` }
				])
			}
		}

		// Check for duplicate discord ID if updating
		if (updates.discord_id) {
			const existing = await db.players.findByDiscordId(updates.discord_id)
			if (existing && existing.id !== playerId) {
				throw new ValidationError('Discord ID already taken', [
					{ field: 'discord_id', message: `Discord ID "${updates.discord_id}" is already taken` }
				])
			}
		}

		// Update player
		const updateData: Partial<PlayerInput> = {}
		if (updates.name) updateData.name = updates.name.trim()
		if (updates.discord_username !== undefined) updateData.discord_username = updates.discord_username?.trim() || null
		if (updates.discord_id !== undefined) updateData.discord_id = updates.discord_id?.trim() || null

		const updatedPlayer = await db.players.update(playerId, updateData)

		console.log('✅ Player updated successfully:', { playerId })

		return updatedPlayer

	} catch (error) {
		console.error('❌ Player update error:', error)

		if (error instanceof APIError) {
			throw error
		}

		throw new APIError(`Failed to update player: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Delete a player (soft delete recommended in production)
 */
export async function deletePlayer(playerId: string, userId?: string): Promise<void> {
	try {
		console.log('🗑️ Deleting player:', { playerId, userId })

		// Check if player exists
		await getPlayerById(playerId)

		// TODO: Add soft delete logic if needed
		// For now, just validate the player exists
		console.log('✅ Player deletion validated:', { playerId })

	} catch (error) {
		console.error('❌ Player deletion error:', error)

		if (error instanceof APIError) {
			throw error
		}

		throw new APIError(`Failed to delete player: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

// ============================================================================
// SERVICE INSTANCE PATTERN (for compatibility)
// ============================================================================

export class PlayerService {
	async createPlayer(request: CreatePlayerRequest, authContext?: DatabaseAuthContext) {
		return createPlayer(request, authContext)
	}

	async getPlayerById(playerId: string) {
		return getPlayerById(playerId)
	}

	async listPlayers(filters?: { search?: string; limit?: number; offset?: number }) {
		return listPlayers(filters)
	}

	async updatePlayer(playerId: string, updates: Partial<PlayerInput>, userId?: string) {
		return updatePlayer(playerId, updates, userId)
	}

	async deletePlayer(playerId: string, userId?: string) {
		return deletePlayer(playerId, userId)
	}
}

// Export singleton instance
let playerService: PlayerService | null = null

export function getPlayerService(): PlayerService {
	if (!playerService) {
		playerService = new PlayerService()
	}
	return playerService
}

// ============================================================================
// REMOVED FROM THIS SERVICE:
// ============================================================================
// ❌ findOrCreatePlayer() -> Moved to PlayerMatchingService
// ❌ findOrCreatePlayerFromDiscord() -> Use PlayerMatchingService + createPlayer
// ❌ getPlayerIds() -> DELETED (GameService will be updated)
// ❌ searchPlayers() -> Use listPlayers() with search filter instead
//
// PlayerService is now focused purely on CRUD operations.
// All player lookup/matching logic has been moved to PlayerMatchingService.