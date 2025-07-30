// ============================================================================
// Discord Bot Game Reporting Service
// ============================================================================
// This service wraps the shared services for Discord bot use

import { 
  getAIParsingService, 
  getGameService, 
  type ParsedGameData,
  type CreateGameRequest 
} from '@dadgic/shared'

export class GameReportingService {
  async parseGameDescription(text: string, userId?: string): Promise<{
    success: boolean
    data?: ParsedGameData & { confidence: number }
    error?: string
  }> {
    try {
      console.log('🤖 Discord bot parsing game:', { textLength: text.length, userId })
      
      const aiService = getAIParsingService()
      const result = await aiService.parseGameText({
        text,
        context: {
          source: 'discord',
          user_id: userId
        }
      })

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to parse game description'
        }
      }

      return {
        success: true,
        data: result.data
      }

    } catch (error) {
      console.error('❌ Discord AI parsing error:', error)
      return {
        success: false,
        error: 'AI parsing service temporarily unavailable'
      }
    }
  }

  async createGameFromParsedData(
    parsedData: ParsedGameData, 
    discordUserId: string
  ): Promise<{
    success: boolean
    gameId?: string
    error?: string
  }> {
    try {
      console.log('🎮 Discord bot creating game from parsed data')

      // Convert parsed data to game request format
      const gameRequest: CreateGameRequest = {
        date: parsedData.date,
        game_length_minutes: parsedData.game_length_minutes,
        turns: parsedData.turns,
        notes: parsedData.notes,
        players: parsedData.players.map(p => ({
          discord_username: p.name,
          commander_deck: p.commander,
          result: p.result
        }))
      }

      const gameService = getGameService()
      const result = await gameService.createGame(gameRequest, discordUserId)

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
  async findOrCreatePlayer(discordId: string, discordUsername: string, displayName?: string) {
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
