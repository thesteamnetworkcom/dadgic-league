// ============================================================================
// PLAYER MATCHING SERVICE - Updated Imports & Types
// ============================================================================

import { db } from '@dadgic/database'

// ✅ UPDATED: Import from database organized types
import type {
	Player,
	PlayerIdentifier,
	PlayerMatchResult,
	PlayerMatchOption,
	ContextOptions,
	ParticipantInput,
	ParticipantResolved
} from '@dadgic/database'

import { APIError } from '../errors/APIError'

// ============================================================================
// PLAYER MATCHING SERVICE - FUNCTION PATTERN
// ============================================================================

/**
 * Core matching method - returns full match details
 */
export async function findPlayer(identifier: PlayerIdentifier): Promise<PlayerMatchResult> {
	try {
		console.log('🔍 Player matching lookup:', identifier)

		// 1. Try exact matches first (highest confidence)
		const exactMatch = await tryExactMatches(identifier)
		if (exactMatch.player) {
			return exactMatch
		}

		// 2. Try fuzzy matching
		const fuzzyMatch = await tryFuzzyMatching(identifier)
		if (fuzzyMatch.player) {
			return fuzzyMatch
		}

		// 3. Return no match with suggestions
		const suggestions = await generateSuggestions(identifier)
		return {
			player: null,
			confidence: 0,
			alternatives: suggestions,
			matchType: 'none'
		}

	} catch (error) {
		console.error('❌ Player matching error:', error)
		throw new APIError(`Player matching failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Convenience method - returns just the player (highest confidence)
 */
export async function findPlayerSingle(identifier: PlayerIdentifier): Promise<Player> {
	const result = await findPlayer(identifier)

	if (!result.player) {
		throw new APIError('Player not found', 'NOT_FOUND', 404)
	}

	return result.player
}

/**
 * Context-aware method - includes recent pod history for disambiguation
 */
export async function findPlayerWithContext(
	identifier: PlayerIdentifier,
	options: ContextOptions = {}
): Promise<PlayerMatchResult> {
	try {
		console.log('🔍 Player matching with context:', { identifier, options })

		// Get basic match first
		const baseResult = await findPlayer(identifier)

		// If no player found, try context-based matching
		if (!baseResult.player && identifier.name) {
			const contextMatch = await tryContextMatching(identifier, options)
			if (contextMatch.player) {
				return contextMatch
			}
		}

		// Add context info to existing result
		if (baseResult.player) {
			const contextInfo = await getPlayerContext(baseResult.player, options)
			return {
				...baseResult,
				contextInfo
			}
		}

		return baseResult

	} catch (error) {
		console.error('❌ Player context matching error:', error)
		throw new APIError(`Context matching failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

export async function resolvePlayerIdentifiers(
	identifiers: PlayerIdentifier[]
): Promise<Player[]> {
	try {
		console.log('🔄 Resolving participants:', { count: identifiers.length })

		const resolved: Player[] = []

		for (const identifier of identifiers) {
			const player = await findPlayerSingle(identifier)
			console.log(player)
			resolved.push(
				player
			)
		}

		console.log('✅ Participants resolved successfully:', { count: resolved.length })
		return resolved

	} catch (error) {
		console.error('❌ Participant resolution error:', error)
		throw new APIError(`Failed to resolve participants: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}
/**
 * ✅ NEW: Resolve participants from input to resolved format
 * This is what the API layer will call before PodService
 */
export async function resolveParticipants(
	participants: ParticipantInput[]
): Promise<ParticipantResolved[]> {
	try {
		console.log('🔄 Resolving participants:', { count: participants.length })

		// Extract identifiers and resolve them
		// Convert string identifiers to PlayerIdentifier objects
		const identifiers: PlayerIdentifier[] = participants.map(p => ({
			unknown_identifier: p.player_identifier // "I don't know what this is"
		}))
		const players = await resolvePlayerIdentifiers(identifiers) // ADD AWAIT HERE
		console.log(players)
		console.log(participants)
		// Map back to participant format
		const resolved = participants.map((participant, index) => ({
			player_id: players[index].id,
			commander_deck: participant.commander_deck,
			result: participant.result
		}))

		console.log('✅ Participants resolved successfully:', { count: resolved.length })
		return resolved

	} catch (error) {
		console.error('❌ Participant resolution error:', error)
		throw new APIError(`Failed to resolve participants: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

// ========================================================================
// PRIVATE MATCHING METHODS (unchanged implementation)
// ========================================================================

/**
 * Try exact matches in order of reliability
 */
async function tryExactMatches(identifier: PlayerIdentifier): Promise<PlayerMatchResult> {
	// 1. Exact ID match (most reliable)
	if (identifier.id || identifier.unknown_identifier) {
		const param = (identifier.id || identifier.unknown_identifier)!
		const player = await db.players.findById(param)
		if (player) {
			return {
				player,
				confidence: 100,
				alternatives: [],
				matchType: 'exact_id'
			}
		}
	}

	// 2. Exact Discord ID match
	if (identifier.discord_id || identifier.unknown_identifier) {
		const player = await db.players.findByDiscordId((identifier.discord_id || identifier.unknown_identifier)!)
		if (player) {
			return {
				player,
				confidence: 95,
				alternatives: [],
				matchType: 'exact_discord_id'
			}
		}
	}

	// 3. Exact Discord username match
	if (identifier.discord_username || identifier.unknown_identifier) {
		const player = await db.players.findByDiscordUsername((identifier.discord_username || identifier.unknown_identifier)!)
		if (player) {
			return {
				player,
				confidence: 90,
				alternatives: [],
				matchType: 'exact_username'
			}
		}
	}

	// 4. Exact name match
	if (identifier.name || identifier.displayName || identifier.unknown_identifier) {
		const searchName = (identifier.name || identifier.displayName || identifier.unknown_identifier)!.toLowerCase().trim()
		const allPlayers = await db.players.getAll()

		const exactNameMatch = allPlayers.find(p =>
			p.name?.toLowerCase().trim() === searchName
		)

		if (exactNameMatch) {
			return {
				player: exactNameMatch,
				confidence: 85,
				alternatives: [],
				matchType: 'exact_name'
			}
		}
	}

	return {
		player: null,
		confidence: 0,
		alternatives: [],
		matchType: 'none'
	}
}

/**
 * Try fuzzy matching with confidence scoring
 */
async function tryFuzzyMatching(identifier: PlayerIdentifier): Promise<PlayerMatchResult> {
	const searchName = (identifier.name || identifier.displayName || identifier.discord_username || identifier.unknown_identifier)
	if (!searchName) {
		return {
			player: null,
			confidence: 0,
			alternatives: [],
			matchType: 'none'
		}
	}

	const searchLower = searchName.toLowerCase().trim()
	const allPlayers = await db.players.getAll()
	const suggestions: PlayerMatchOption[] = []

	// Build suggestions for partial matches
	for (const player of allPlayers) {
		const dbName = player.name?.toLowerCase().trim() || ''
		const dbUsername = player.discord_username?.toLowerCase().trim() || ''

		let confidence = 0
		let reason = ''

		// Partial name matching
		if (dbName.includes(searchLower) || searchLower.includes(dbName)) {
			const similarity = calculateStringSimilarity(searchLower, dbName)
			confidence = Math.max(confidence, Math.floor(similarity * 80))
			reason = `Name similarity: "${player.name}"`
		}

		// Partial username matching  
		if (dbUsername.includes(searchLower) || searchLower.includes(dbUsername)) {
			const similarity = calculateStringSimilarity(searchLower, dbUsername)
			confidence = Math.max(confidence, Math.floor(similarity * 85))
			reason = `Username similarity: "${player.discord_username}"`
		}

		// Add to suggestions if confidence is decent
		if (confidence >= 60) {
			suggestions.push({
				player,
				confidence,
				reason
			})
		}
	}

	// Sort suggestions by confidence
	suggestions.sort((a, b) => b.confidence - a.confidence)

	// Auto-match if we have very high confidence
	const topSuggestion = suggestions[0]
	if (topSuggestion && topSuggestion.confidence >= 85) {
		return {
			player: topSuggestion.player,
			confidence: topSuggestion.confidence,
			alternatives: suggestions.slice(1, 3), // Include other top matches
			matchType: 'fuzzy'
		}
	}

	return {
		player: null,
		confidence: 0,
		alternatives: suggestions.slice(0, 3), // Top 3 suggestions
		matchType: 'fuzzy'
	}
}

/**
 * Context-based matching using recent pod history
 */
async function tryContextMatching(
	identifier: PlayerIdentifier,
	options: ContextOptions
): Promise<PlayerMatchResult> {
	const searchName = (identifier.name || identifier.displayName || identifier.unknown_identifier)
	if (!searchName) {
		return {
			player: null,
			confidence: 0,
			alternatives: [],
			matchType: 'none'
		}
	}

	try {
		// Get all potential candidates by name
		const candidates = await findCandidatesByName(searchName)
		if (candidates.length === 0) {
			return {
				player: null,
				confidence: 0,
				alternatives: [],
				matchType: 'none'
			}
		}

		// Get recent pods for each candidate
		const recentDays = options.recentDays || 30
		const contextResults: PlayerMatchOption[] = []

		for (const candidate of candidates) {
			const recentPods = await getRecentPodsForPlayer(candidate.player.id, recentDays)

			// Calculate context confidence based on recent activity
			let contextConfidence = candidate.confidence

			if (recentPods.length > 0) {
				// Boost confidence for recently active players
				contextConfidence += Math.min(recentPods.length * 5, 20)
			}

			contextResults.push({
				player: candidate.player,
				confidence: Math.min(contextConfidence, 95), // Cap at 95 for context matches
				reason: `${candidate.reason} + ${recentPods.length} recent pods`
			})
		}

		// Sort by context confidence
		contextResults.sort((a, b) => b.confidence - a.confidence)

		const topMatch = contextResults[0]
		if (topMatch && topMatch.confidence >= 70) {
			return {
				player: topMatch.player,
				confidence: topMatch.confidence,
				alternatives: contextResults.slice(1, 3),
				matchType: 'context'
			}
		}

		return {
			player: null,
			confidence: 0,
			alternatives: contextResults.slice(0, 3),
			matchType: 'context'
		}

	} catch (error) {
		console.error('❌ Context matching error:', error)
		return {
			player: null,
			confidence: 0,
			alternatives: [],
			matchType: 'none'
		}
	}
}

// ========================================================================
// HELPER METHODS (unchanged)
// ========================================================================

async function generateSuggestions(identifier: PlayerIdentifier): Promise<PlayerMatchOption[]> {
	const searchTerm = identifier.name || identifier.displayName || identifier.discord_username || identifier.unknown_identifier
	if (!searchTerm || searchTerm.length < 2) {
		return []
	}

	try {
		const searchResults = await db.players.list({ search: searchTerm, limit: 5 })

		return searchResults.map(player => ({
			player,
			confidence: 50,
			reason: `Search result for "${searchTerm}"`
		}))
	} catch (error) {
		console.warn('❌ Database search failed:', error)
		return []
	}
}

async function findCandidatesByName(searchName: string): Promise<PlayerMatchOption[]> {
	const searchLower = searchName.toLowerCase().trim()
	const allPlayers = await db.players.getAll()
	const candidates: PlayerMatchOption[] = []

	for (const player of allPlayers) {
		const dbName = player.name?.toLowerCase().trim() || ''

		if (dbName.includes(searchLower) || searchLower.includes(dbName)) {
			const similarity = calculateStringSimilarity(searchLower, dbName)
			const confidence = Math.floor(similarity * 75)

			if (confidence >= 50) {
				candidates.push({
					player,
					confidence,
					reason: `Name match: "${player.name}"`
				})
			}
		}
	}

	return candidates.sort((a, b) => b.confidence - a.confidence)
}

async function getRecentPodsForPlayer(playerId: string, recentDays: number): Promise<string[]> {
	try {
		const fromDate = new Date()
		fromDate.setDate(fromDate.getDate() - recentDays)

		const recentPods = await db.pods.list({
			playerId,
			dateFrom: fromDate.toISOString().split('T')[0],
			limit: 20
		})

		return recentPods.map(pod => pod.id)
	} catch (error) {
		console.warn('❌ Could not fetch recent pods:', error)
		return []
	}
}

async function getPlayerContext(
	player: Player,
	options: ContextOptions
): Promise<{ recentPodsWithPlayer: string[]; frequentPlaymates: Player[] }> {
	try {
		const recentDays = options.recentDays || 30
		const recentPods = await getRecentPodsForPlayer(player.id, recentDays)

		// TODO: Implement frequent playmates analysis in Phase 3
		const frequentPlaymates: Player[] = []

		return {
			recentPodsWithPlayer: recentPods,
			frequentPlaymates
		}
	} catch (error) {
		console.warn('❌ Could not get player context:', error)
		return {
			recentPodsWithPlayer: [],
			frequentPlaymates: []
		}
	}
}

function calculateStringSimilarity(str1: string, str2: string): number {
	if (str1 === str2) return 1.0
	if (str1.length === 0 || str2.length === 0) return 0.0

	const maxLength = Math.max(str1.length, str2.length)
	const distance = levenshteinDistance(str1, str2)

	return 1 - (distance / maxLength)
}

function levenshteinDistance(str1: string, str2: string): number {
	const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))

	for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
	for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

	for (let j = 1; j <= str2.length; j++) {
		for (let i = 1; i <= str1.length; i++) {
			const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
			matrix[j][i] = Math.min(
				matrix[j][i - 1] + 1,     // deletion
				matrix[j - 1][i] + 1,     // insertion
				matrix[j - 1][i - 1] + indicator // substitution
			)
		}
	}

	return matrix[str2.length][str1.length]
}

// ============================================================================
// LEGACY COMPATIBILITY (for smooth transition)
// ============================================================================

/** @deprecated Use findPlayerSingle() instead */
export async function findPlayerByUsername(username: string, availablePlayers: Player[]): Promise<Player | null> {
	try {
		const result = await findPlayer({ discord_username: username })
		return result.player
	} catch (error) {
		return null
	}
}