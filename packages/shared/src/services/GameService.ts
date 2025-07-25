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
import { getPlayerIds } from './PlayerService'
import { validateGameRequest } from '../utils/validation/game'

export async function createGame(request: CreateGameRequest, userId?: string): Promise<CreateGameResponse> {
    try {
      console.log('🎮 Creating game:', {
        date: request.date,
        playersCount: request.players.length,
        userId
      })

      // Validate request
      const validation = validateGameRequest(request)
      if (!validation.isValid) {
        throw new ValidationError('Invalid game data', validation.errors)
      }

      // Find and validate all players exist
      const playerIds = await getPlayerIds(request.players)

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
      const gameWithPlayers = await getGameById(createdPod.id)

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

export async function getGameById(gameId: string): Promise<CreatedGame> {
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

 export async function listGames(filters: {
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
        pods.map(pod => getGameById(pod.id))
      )

      return games

    } catch (error) {
      console.error('❌ List games error:', error)
      throw new APIError(`Failed to list games: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

export async function deleteGame(gameId: string, userId?: string): Promise<void> {
    try {
      console.log('🗑️ Deleting game:', { gameId, userId })

      // Check if game exists
      await getGameById(gameId)

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

