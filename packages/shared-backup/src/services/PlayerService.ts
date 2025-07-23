// ============================================================================
// Player Service - Player Management Operations
// ============================================================================

import { db } from '@dadgic/database'
import { APIError, ValidationError } from '../utils/errors/APIError'

export interface CreatePlayerRequest {
  name: string
  discord_id?: string
  discord_username?: string
}

export interface Player {
  id: string
  name: string
  discord_id: string | null
  discord_username: string | null
  role: 'player' | 'admin'
  created_at: string
  updated_at: string
}

export class PlayerService {
  async createPlayer(request: CreatePlayerRequest, userId?: string): Promise<{ 
    success: boolean; 
    data?: Player; 
    error?: string; 
    timestamp: string 
  }> {
    try {
      console.log('👥 Creating player:', {
        name: request.name,
        discord_username: request.discord_username,
        userId
      })

      // Validate request
      const validation = this.validatePlayerRequest(request)
      if (!validation.isValid) {
        throw new ValidationError('Invalid player data', validation.errors)
      }

      // Check for duplicates
      if (request.discord_username) {
        const existing = await db.players.findByDiscordUsername(request.discord_username)
        if (existing) {
          throw new ValidationError('Player already exists', [
            { field: 'discord_username', message: `Player with Discord username "${request.discord_username}" already exists` }
          ])
        }
      }

      if (request.discord_id) {
        const existing = await db.players.findByDiscordId(request.discord_id)
        if (existing) {
          throw new ValidationError('Player already exists', [
            { field: 'discord_id', message: `Player with Discord ID "${request.discord_id}" already exists` }
          ])
        }
      }

      // Create player
      const playerData = {
        name: request.name.trim(),
        discord_username: request.discord_username?.trim() || null,
        discord_id: request.discord_id?.trim() || null,
        role: 'player' as const
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

  async getPlayerById(playerId: string): Promise<Player> {
    try {
      const player = await db.players.getById(playerId)
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

  async listPlayers(filters: {
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

  async updatePlayer(playerId: string, updates: Partial<CreatePlayerRequest>, userId?: string): Promise<Player> {
    try {
      console.log('✏️ Updating player:', { playerId, userId })

      // Check if player exists
      await this.getPlayerById(playerId)

      // Validate updates
      if (Object.keys(updates).length > 0) {
        const validation = this.validatePlayerRequest({ name: 'temp', ...updates })
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
      const updateData: any = {}
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

  async searchPlayers(query: string): Promise<Player[]> {
    try {
      if (!query || query.trim().length < 2) {
        return []
      }

      console.log('🔍 Searching players:', { query })

      const players = await db.players.search(query.trim())
      return players

    } catch (error) {
      console.error('❌ Search players error:', error)
      throw new APIError(`Failed to search players: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Discord integration helper
  async findOrCreatePlayerFromDiscord(discordId: string, discordUsername: string, displayName?: string): Promise<Player> {
    try {
      console.log('🤖 Discord player lookup:', { discordId, discordUsername, displayName })

      // Try to find existing player by Discord ID
      let player = await db.players.findByDiscordId(discordId)
      
      if (!player) {
        // Try to find by Discord username
        player = await db.players.findByDiscordUsername(discordUsername)
      }

      if (!player) {
        // Create new player
        const createRequest: CreatePlayerRequest = {
          name: displayName || discordUsername,
          discord_id: discordId,
          discord_username: discordUsername
        }

        const result = await this.createPlayer(createRequest, 'discord-bot')
        if (!result.success || !result.data) {
          throw new APIError('Failed to create Discord player')
        }
        
        player = result.data
        console.log('✅ Created new Discord player:', { playerId: player.id, name: player.name })
      } else if (!player.discord_id && player.discord_username === discordUsername) {
        // Update existing player with Discord ID if missing
        player = await this.updatePlayer(player.id, { discord_id: discordId }, 'discord-bot')
        console.log('✅ Updated existing player with Discord ID:', { playerId: player.id })
      } else {
        console.log('✅ Found existing Discord player:', { playerId: player.id, name: player.name })
      }

      return player

    } catch (error) {
      console.error('❌ Discord player lookup error:', error)
      throw new APIError(`Failed to find or create Discord player: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private validatePlayerRequest(request: CreatePlayerRequest): { isValid: boolean; errors: { field: string; message: string }[] } {
    const errors: { field: string; message: string }[] = []

    if (!request.name?.trim()) {
      errors.push({ field: 'name', message: 'Name is required' })
    } else if (request.name.trim().length > 100) {
      errors.push({ field: 'name', message: 'Name must be less than 100 characters' })
    }

    if (request.discord_username && request.discord_username.length > 100) {
      errors.push({ field: 'discord_username', message: 'Discord username must be less than 100 characters' })
    }

    if (request.discord_id && request.discord_id.length > 100) {
      errors.push({ field: 'discord_id', message: 'Discord ID must be less than 100 characters' })
    }

    return {
      isValid: errors.length === 0,
      errors
    }
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
