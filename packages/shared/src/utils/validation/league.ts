// ============================================================================
// League Validation
// ============================================================================

import type { CreateLeagueInput, CreateLeagueRequest, LeagueResolved } from '@dadgic/database'
import type { ValidationResult } from './'

/**
 * Validates league creation request data
 */
export function validateLeagueRequest(request: CreateLeagueRequest): ValidationResult {
	const errors: { field: string; message: string }[] = []

	// Validate name
	if (!request.name?.trim()) {
		errors.push({ field: 'name', message: 'League name is required' })
	} else if (request.name.trim().length > 100) {
		errors.push({ field: 'name', message: 'League name must be less than 100 characters' })
	}

	// Validate player IDs
	if (!request.participants || !Array.isArray(request.participants)) {
		errors.push({ field: 'participants', message: 'Player identifiers array is required' })
	} else if (request.participants.length < 4) {
		errors.push({ field: 'participants', message: 'Need at least 4 players for a league' })
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
	if (request.participants?.length >= 4 && request.games_per_player >= 1) {
		const totalSlots = request.participants.length * request.games_per_player
		if (totalSlots % 4 !== 0) {
			errors.push({
				field: 'games_per_player',
				message: `${request.participants.length} players × ${request.games_per_player} games = ${totalSlots} total slots. Need a multiple of 4. Try adjusting games per player.`
			})
		}
	}

	return {
		isValid: errors.length === 0,
		errors
	}
}

export function validateLeagueResolved(request: LeagueResolved): ValidationResult {
	const errors: { field: string; message: string }[] = []

	// Validate name
	if (!request.name?.trim()) {
		errors.push({ field: 'name', message: 'League name is required' })
	} else if (request.name.trim().length > 100) {
		errors.push({ field: 'name', message: 'League name must be less than 100 characters' })
	}

	// Validate player IDs
	if (!request.participants || !Array.isArray(request.participants)) {
		errors.push({ field: 'participants', message: 'Player identifiers array is required' })
	} else if (request.participants.length < 4) {
		errors.push({ field: 'participants', message: 'Need at least 4 players for a league' })
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
	if (request.participants?.length >= 4 && request.games_per_player >= 1) {
		const totalSlots = request.participants.length * request.games_per_player
		if (totalSlots % 4 !== 0) {
			errors.push({
				field: 'games_per_player',
				message: `${request.participants.length} players × ${request.games_per_player} games = ${totalSlots} total slots. Need a multiple of 4. Try adjusting games per player.`
			})
		}
	}

	return {
		isValid: errors.length === 0,
		errors
	}
}