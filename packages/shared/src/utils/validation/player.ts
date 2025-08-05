// ============================================================================
// Player Validation
// ============================================================================

import type { Player, CreatePlayerRequest, CreatePlayerInput } from '@dadgic/database'
import type { ValidationResult } from '.'
import { ValidationError } from '../../errors/APIError'

/**
 * Validates player input data (field lengths, required fields, etc.)
 */
export function validatePlayerRequest(request: CreatePlayerRequest): ValidationResult {
	const errors: { field: string; message: string }[] = []

	// Name validation
	if (!request.name?.trim()) {
		errors.push({ field: 'name', message: 'Name is required' })
	} else if (request.name.trim().length > 100) {
		errors.push({ field: 'name', message: 'Name must be less than 100 characters' })
	}

	// Discord username validation  
	if (request.discord_username && request.discord_username.length > 100) {
		errors.push({ field: 'discord_username', message: 'Discord username must be less than 100 characters' })
	}

	// Discord ID validation
	if (request.discord_id && request.discord_id.length > 100) {
		errors.push({ field: 'discord_id', message: 'Discord ID must be less than 100 characters' })
	}

	return {
		isValid: errors.length === 0,
		errors
	}
}

/**
 * Validates that a player was found (not null)
 * Throws ValidationError if player is null/undefined
 */
export function validatePlayerExists(player: Player | null, discord_username: string, fieldName?: string): void {
	if (!player) {
		throw new ValidationError(`Player not found: ${discord_username}`, [
			{
				field: fieldName || 'discord_username',
				message: `Player "${discord_username}" not found in database. Please add them first.`
			}
		])
	}
}