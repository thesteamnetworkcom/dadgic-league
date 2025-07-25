// ============================================================================
// Player Service - Player Management Operations
// ============================================================================

import { db, Player, CreatePlayerInput } from '@dadgic/database'
import { APIError, ValidationError } from '../errors/APIError'
import { validatePlayerInput, validatePlayerExists } from '../utils/validation/player'

export async function createPlayer(request: CreatePlayerInput, userId?: string): Promise<{ 
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
      const validation = validatePlayerInput(request)
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
      const playerData: CreatePlayerInput = {
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

export async function updatePlayer(playerId: string, updates: Partial<CreatePlayerInput>, userId?: string): Promise<Player> {
    try {
      console.log('✏️ Updating player:', { playerId, userId })

      // Check if player exists
      await getPlayerById(playerId)

      // Validate updates
      if (Object.keys(updates).length > 0) {
        const validation = validatePlayerInput({ name: 'temp', ...updates })
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
      const updateData: Partial<CreatePlayerInput> = {}
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

  // Discord integration helper
export async function findOrCreatePlayer(
    externalIdentity: {
      id?: string | null
      username?: string | null  
      displayName?: string | null
      platform?: string // 'discord', 'google', 'twitch', etc.
    },
    source?: string
  ): Promise<Player> {
    try {
      const platform = externalIdentity.platform || 'unknown'
      console.log(`🔍 ${platform} player lookup:`, externalIdentity)

      let player: Player | null = null

      // Try to find existing player by external ID (most reliable)
      if (externalIdentity.id) {
        player = await db.players.findByDiscordId(externalIdentity.id)
      }
      
      // Fallback: try to find by username 
      if (!player && externalIdentity.username) {
        player = await db.players.findByDiscordUsername(externalIdentity.username)
      }

      if (!player) {
        // Create new player
        const createRequest: CreatePlayerInput = {
          name: externalIdentity.displayName || externalIdentity.username || `${platform}-user`,
          discord_id: externalIdentity.id || null,
          discord_username: externalIdentity.username || null
        }

        const result = await createPlayer(createRequest, source || `${platform}-integration`)
        if (!result.success || !result.data) {
          throw new APIError(`Failed to create ${platform} player`)
        }
        
        player = result.data
        console.log(`✅ Created new ${platform} player:`, { playerId: player.id, name: player.name })
        
      } else if (!player.discord_id && externalIdentity.id && player.discord_username === externalIdentity.username) {
        // Update existing player with external ID if missing  
        player = await updatePlayer(player.id, { discord_id: externalIdentity.id }, source || `${platform}-integration`)
        console.log(`✅ Updated existing player with ${platform} ID:`, { playerId: player.id })
        
      } else {
        console.log(`✅ Found existing ${platform} player:`, { playerId: player.id, name: player.name })
      }

      return player

    } catch (error) {
      console.error(`❌ ${externalIdentity.platform || 'External'} player lookup error:`, error)
      throw new APIError(`Failed to find or create player: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Convenience wrapper for Discord (backward compatibility)
export async function findOrCreatePlayerFromDiscord(discordId: string, discordUsername: string, displayName?: string): Promise<Player> {
    return findOrCreatePlayer({
      id: discordId,
      username: discordUsername,
      displayName: displayName,
      platform: 'discord'
    }, 'discord-bot')
  }

  // Static method used by GameService for player validation
export async function getPlayerIds(players: { discord_username: string }[]): Promise<string[]> {
    const playerIds: string[] = []

    for (let i = 0; i < players.length; i++) {
      const playerInput = players[i]
      
      // Try to find player by discord username
      const foundPlayer = await db.players.findByDiscordUsername(playerInput.discord_username)
      
      // Validate player exists
      validatePlayerExists(foundPlayer, playerInput.discord_username, `players[${i}].discord_username`)

      playerIds.push(foundPlayer!.id)
    }

    return playerIds
  }

