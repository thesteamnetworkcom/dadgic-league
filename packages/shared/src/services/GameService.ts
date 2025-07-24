// ============================================================================
// Game Service - Complete CRUD Operations
// ============================================================================

import { db } from '@dadgic/database'
import { APIError, ValidationError } from '../errors/APIError'
import type { 
  CreateGameRequest, 
  CreateGameResponse, 
  CreatedGame,
  GamePlayer,
  PodWithParticipants,
  PodParticipant,
  Player
} from '@dadgic/database'


export class GameService {
  async createGame(request: CreateGameRequest, userId?: string): Promise<CreateGameResponse> {
    try {
      console.log('🎮 Creating game:', {
        date: request.date,
        playersCount: request.players.length,
        userId
      })

      // Validate request
      const validation = this.validateGameRequest(request)
      if (!validation.isValid) {
        throw new ValidationError('Invalid game data', validation.errors)
      }

      // Find and validate all players exist
      const playerIds = await this.validateAndGetPlayerIds(request.players)

      // Create the pod/game record
      const podData = {
        date: request.date,
        game_length_minutes: request.game_length_minutes || null,
        turns: request.turns || null,
        notes: request.notes?.trim() || null,
        participants: request.players.map((player, index) => ({
          player_id: playerIds[index],
          commander_deck: player.commander_deck,
          result: player.result
        }))
      }

      const createdPod = await db.pods.create(podData)

      // Get full game data with player details
      const gameWithPlayers = await this.getGameById(createdPod.id)

      console.log('✅ Game created successfully:', {
        gameId: createdPod.id,
        playersCount: gameWithPlayers.players.length
      })

      return {
        success: true,
        data: gameWithPlayers,
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      console.error('❌ Game creation error:', error)

      if (error instanceof APIError) {
        return {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      }

      return {
        success: false,
        error: 'Failed to create game',
        timestamp: new Date().toISOString()
      }
    }
  }

  async getGameById(gameId: string): Promise<CreatedGame> {
    try {
      const pod : PodWithParticipants | null = await db.pods.getById(gameId)
      if (!pod) {
        throw new APIError('Game not found', 'NOT_FOUND', 404)
      }

      // Get participants with player details
      const participants = pod.participants
      
      const players: GamePlayer[] = participants.map(p => ({
        id: p.id,
        player_id: p.player_id,
        player_name: p.player?.name || 'Unknown Player',
        discord_username: p.player?.discord_username || null,
        commander_deck: p.commander_deck,
        result: p.result
      }))

      return {
        id: pod.id,
        date: pod.date,
        players,
        created_at: pod.created_at,
        updated_at: pod.updated_at
      }

    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      throw new APIError(`Failed to get game: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async listGames(filters: {
    playerId?: string
    leagueId?: string
    dateFrom?: string
    dateTo?: string
    limit?: number
    offset?: number
  } = {}): Promise<CreatedGame[]> {
    try {
      console.log('📋 Listing games with filters:', filters)

      const pods = await db.pods.list({
        playerId: filters.playerId,
        leagueId: filters.leagueId,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        limit: filters.limit || 50,
        offset: filters.offset || 0
      })

      // Get full game data for each pod
      const games = await Promise.all(
        pods.map(pod => this.getGameById(pod.id))
      )

      return games

    } catch (error) {
      console.error('❌ List games error:', error)
      throw new APIError(`Failed to list games: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async deleteGame(gameId: string, userId?: string): Promise<void> {
    try {
      console.log('🗑️ Deleting game:', { gameId, userId })

      // Check if game exists
      await this.getGameById(gameId)

      // Delete the game (participants will be deleted via cascade)
      await db.pods.delete(gameId)

      console.log('✅ Game deleted successfully:', { gameId })

    } catch (error) {
      console.error('❌ Game deletion error:', error)

      if (error instanceof APIError) {
        throw error
      }

      throw new APIError(`Failed to delete game: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private validateGameRequest(request: CreateGameRequest): { isValid: boolean; errors: { field: string; message: string }[] } {
    const errors: { field: string; message: string }[] = []

    if (!request.date) {
      errors.push({ field: 'date', message: 'Date is required' })
    }

    if (!request.players || !Array.isArray(request.players)) {
      errors.push({ field: 'players', message: 'Players array is required' })
    } else if (request.players.length < 2) {
      errors.push({ field: 'players', message: 'At least 2 players are required' })
    } else if (request.players.length > 8) {
      errors.push({ field: 'players', message: 'Maximum 8 players allowed' })
    } else {
      // Validate each player
      request.players.forEach((player, index) => {
        if (!player.discord_username?.trim()) {
          errors.push({ field: `players[${index}].discord_username`, message: `Player ${index + 1} username is required` })
        }
        if (!player.commander_deck?.trim()) {
          errors.push({ field: `players[${index}].commander_deck`, message: `Player ${index + 1} commander is required` })
        }
        if (!['win', 'lose', 'draw'].includes(player.result)) {
          errors.push({ field: `players[${index}].result`, message: `Player ${index + 1} result must be win, lose, or draw` })
        }
      })

      // Validate exactly one winner (unless all draws)
      const winners = request.players.filter(p => p.result === 'win')
      const allDraws = request.players.every(p => p.result === 'draw')
      
      if (!allDraws && winners.length !== 1) {
        errors.push({ field: 'players', message: 'Exactly one player must win (unless all draw)' })
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  private async validateAndGetPlayerIds(players: { discord_username: string }[]): Promise<string[]> {
    const playerIds: string[] = []

    for (let i = 0; i < players.length; i++) {
      const playerInput = players[i]
      
      // Try to find player by discord username or name
      const foundPlayer = await db.players.findByDiscordUsername(playerInput.discord_username)

      if (!foundPlayer) {
        throw new ValidationError(`Player not found: ${playerInput.discord_username}`, [
          { 
            field: `players[${i}].discord_username`, 
            message: `Player "${playerInput.discord_username}" not found in database. Please add them first.`
          }
        ])
      }

      playerIds.push(foundPlayer.id)
    }

    return playerIds
  }
}

// Export singleton instance
let gameService: GameService | null = null

export function getGameService(): GameService {
  if (!gameService) {
    gameService = new GameService()
  }
  return gameService
}
