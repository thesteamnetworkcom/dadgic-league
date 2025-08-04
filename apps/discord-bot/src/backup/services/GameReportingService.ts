// ============================================================================
// Discord Bot Game Reporting Service
// ============================================================================
// This service wraps the shared services for Discord bot use

import {
	getAIParsingService,
	getPodService,
	PodService,
} from '@dadgic/shared'
import type { CreatePodRequest, CreatePodResponse, ParsedPodData, PodInput, ResponseBase } from '@dadgic/database'
export class PodReportingService {
	async parsePodDescription(text: string, userId?: string): Promise<ResponseBase<ParsedPodData & {confidence: number}>>{
		try {
			console.log('🤖 Discord bot parsing game:', { textLength: text.length, userId })

			const aiService = getAIParsingService()
			const result = await aiService.parsePodText({
				text,
				context: {
					source: 'discord',
					user_id: userId
				}
			})

			if (!result.success) {
				return {
					success: false,
					error: result.error || 'Failed to parse game description',
					timestamp: new Date().toISOString()
				}
			}

			return {
				success: true,
				data: result.data,
				timestamp: new Date().toISOString()
			}

		} catch (error) {
			console.error('❌ Discord AI parsing error:', error)
			return {
				success: false,
				error: 'AI parsing service temporarily unavailable',
				timestamp: new Date().toISOString()
			}
		}
	}

	async createPodFromParsedData(
		parsedData: ParsedPodData,
		discordUserId: string
	): Promise<CreatePodResponse> {
		try {
			console.log('🎮 Discord bot creating game from parsed data')

			// Convert parsed data to game request format
			const podRequest: CreatePodRequest = {
				date: parsedData.date || Date.now().toString(),
				game_length_minutes: parsedData.game_length_minutes,
				turns: parsedData.turns,
				notes: parsedData.notes,
				participants: parsedData.participants
			}
			const podService = getPodService()	
			const result = await podService.createPod(podRequest, discordUserId)

			if (!result.success) {
				return {
					success: false,
					error: result.error || 'Failed to create game'
				}
			}

			return {
				success: true,
				gameId: result.data?.id
			}

		} catch (error) {
			console.error('❌ Discord game creation error:', error)
			return {
				success: false,
				error: 'Failed to create game'
			}
		}
	}

	async getRecentGames(playerId?: string, limit: number = 10) {
		try {
			const gameService = getGameService()
			return await gameService.listGames({
				playerId,
				limit,
				offset: 0
			})
		} catch (error) {
			console.error('❌ Discord get recent games error:', error)
			throw error
		}
	}
}

// Export singleton instance
let gameReportingService: GameReportingService | null = null

export function getGameReportingService(): GameReportingService {
	if (!gameReportingService) {
		gameReportingService = new GameReportingService()
	}
	return gameReportingService
}

  // Player management methods
  async findOrCreatePlayer(discordId: string, discordUsername: string, displayName ?: string) {
	try {
		const { getPlayerService } = await import('@dadgic/shared/services')
		const playerService = getPlayerService()
		return await playerService.findOrCreatePlayerFromDiscord(discordId, discordUsername, displayName)
	} catch (error) {
		console.error('❌ Discord player lookup error:', error)
		throw error
	}
}

  async searchPlayers(query: string) {
	try {
		const { getPlayerService } = await import('@dadgic/shared/services')
		const playerService = getPlayerService()
		return await playerService.searchPlayers(query)
	} catch (error) {
		console.error('❌ Discord player search error:', error)
		throw error
	}
}

  async getPlayerStats(playerId: string) {
	try {
		const gameService = getGameService()
		const recentGames = await gameService.listGames({
			playerId,
			limit: 10
		})

		// Calculate basic stats
		const totalGames = recentGames.length
		const wins = recentGames.filter(game =>
			game.players.find(p => p.player_id === playerId && p.result === 'win')
		).length

		return {
			totalGames,
			wins,
			losses: totalGames - wins,
			winRate: totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0,
			recentGames: recentGames.slice(0, 5)
		}
	} catch (error) {
		console.error('❌ Discord player stats error:', error)
		throw error
	}
}
