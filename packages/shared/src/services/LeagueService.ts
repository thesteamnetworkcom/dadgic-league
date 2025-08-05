// ============================================================================
// League Service - League Generation & Management Operations
// ============================================================================

import { db } from '@dadgic/database'
import type { CreateLeagueResponse, League, LeagueDisplay, LeagueInput, LeagueResolved, DatabaseAuthContext } from '@dadgic/database'
import { APIError, ValidationError } from '../errors/APIError'
import { validateLeagueRequest, validateLeagueResolved } from '../utils/validation/league'
import { validateCurrentUserIsAdmin } from '../utils/validation/auth'
import { generatePodPairings } from './PodGenerationService'
import { resolvePlayerIdentifiers } from './PlayerMatchingService'

/**
 * Generate a complete league with scheduled pods
 */
export async function createLeague(leagueData: LeagueInput, authContext?: DatabaseAuthContext): Promise<CreateLeagueResponse> {
	try {
		console.log('🎯 Generating league:', {
			name: leagueData.name,
			playerCount: leagueData.participants.length,
			authContext: authContext?.user_id
		})

		// Check admin permissions
		await validateCurrentUserIsAdmin(authContext)

		// 1. VALIDATE REQUEST - Copy from pod pattern
		const validation = validateLeagueRequest(leagueData)
		if (!validation.isValid) {
			throw new ValidationError('Invalid league data', validation.errors)
		}

		// 2. RESOLVE PLAYER IDENTIFIERS - Copy from pod pattern
		console.log('🔄 Resolving player identifiers through PlayerMatchingService')
		const resolvedParticipants = await resolvePlayerIdentifiers(leagueData.participants)

		// 3. CREATE RESOLVED LEAGUE DATA - Copy from pod pattern
		const resolvedLeagueData: LeagueResolved = {
			...leagueData,
			participants: resolvedParticipants
		}

		// 4. VALIDATE RESOLVED DATA - Copy from pod pattern
		const resolvedValidation = validateLeagueResolved(resolvedLeagueData)
		if (!resolvedValidation.isValid) {
			throw new ValidationError('Invalid resolved league data', resolvedValidation.errors)
		}

		// 6. Generate pod pairings (TODO: needs PodGenerationService)
		const podPlayerGroups = generatePodPairings(resolvedParticipants, resolvedLeagueData.games_per_player)
		console.log(`🎲 Generated ${podPlayerGroups.length} pod pairings`)
		let league: League | null = null
		try {
			// 7 Create the league record
			league = await db.leagues.create(resolvedLeagueData, podPlayerGroups)
			console.log(`✅ Created league: ${league!.id}`)

			// Get the created scheduled pods
			const scheduledPods = await db.leagues.getScheduledPods(league!.id)
			console.log(`💾 Created ${scheduledPods.length} scheduled pods`)

			// Activate the league
			await db.leagues.updateStatus(league!.id, 'active')
			console.log(`🚀 League "${league!.name}" is now active!`)

			return {
				success: true,
				data: league!,
				timestamp: new Date().toISOString()
			}
		} catch (dbError) {
			if (league?.id) {
				try {
					await db.leagues.delete(league.id)
				} catch (rollbackError) {
					console.error(' Rollback Failed:', rollbackError)
				}
			}
			throw dbError
		}
	} catch (error) {
		console.error('❌ League generation error:', error)

		if (error instanceof APIError) {
			return {
				success: false,
				error: error.message,
				timestamp: new Date().toISOString()
			}
		}

		return {
			success: false,
			error: 'Failed to create league',
			timestamp: new Date().toISOString()
		}
	}
}

export async function listLeagues(filters: {
	status?: string,
	limit?: number
	offset?: number
} = {}): Promise<League[]> {
	try {
		console.log('📋 Listing pods with filters:', filters)

		const leagues = await db.leagues.list({
			status: filters.status,
			limit: filters.limit || 50,
			offset: filters.offset || 0
		})


		return leagues

	} catch (error) {
		console.error('❌ List pods error:', error)
		throw new APIError(`Failed to list pods: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Get suggested games per player for a given player count
 */
export function getSuggestedGamesPerPlayer(playerCount: number): number[] {
	if (playerCount < 4) return []

	const suggestions: number[] = []
	for (let games = 1; games <= 20; games++) {
		const totalSlots = playerCount * games
		if (totalSlots % 4 === 0) {
			suggestions.push(games)
		}
	}
	return suggestions.slice(0, 10)
}

/**
 * Get all players for league creation (admin only)
 */
export async function getPlayersForLeagueCreation() {
	try {
		console.log('👥 Getting players for league creation')

		// TODO: Check admin permissions
		// TODO: Get players from database
		throw new Error('getPlayersForLeagueCreation not implemented yet')

	} catch (error) {
		console.error('❌ Get players for league creation error:', error)

		if (error instanceof APIError) {
			throw error
		}

		throw new APIError(`Failed to get players for league creation: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Calculate league standings from completed pods
 */
export async function getLeagueStandings(leagueId: string) {
	try {
		console.log('📊 Calculating league standings for:', leagueId)

		// Get the raw pod data from database (existing query, just renamed)
		const podsData = await db.leagues.getPodsWithParticipants(leagueId)

		// Business logic: Calculate standings
		const playerStats: Record<string, any> = {}

		podsData.forEach(pod => {
			pod.participants.forEach((participant: any) => {
				const playerId = participant.player_id
				const playerName = participant.player?.name || 'Unknown'

				if (!playerStats[playerId]) {
					playerStats[playerId] = {
						player_id: playerId,
						player_name: playerName,
						games_played: 0,
						wins: 0,
						losses: 0,
						draws: 0,
						win_rate: 0
					}
				}

				playerStats[playerId].games_played++

				if (participant.result === 'win') playerStats[playerId].wins++
				else if (participant.result === 'lose') playerStats[playerId].losses++
				else if (participant.result === 'draw') playerStats[playerId].draws++
			})
		})

		// Business logic: Calculate win rates and sort
		const standings = Object.values(playerStats).map((stats: any) => ({
			...stats,
			win_rate: stats.games_played > 0 ? stats.wins / stats.games_played : 0
		}))

		standings.sort((a: any, b: any) => {
			if (a.wins !== b.wins) return b.wins - a.wins
			return b.win_rate - a.win_rate
		})

		console.log('✅ Calculated standings for', standings.length, 'players')
		return standings

	} catch (error) {
		console.error('❌ League standings calculation error:', error)

		if (error instanceof APIError) {
			throw error
		}

		throw new APIError(`Failed to calculate league standings: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}