// ============================================================================
// Client-Side Game API Utility
// ============================================================================

export interface CreateGameRequest {
  date: string
  game_length_minutes?: number
  turns?: number
  notes?: string
  players: {
    discord_username: string
    commander_deck: string
    result: 'win' | 'lose' | 'draw'
  }[]
}

export interface Game {
  id: string
  date: string
  players: {
    id: string
    player_id: string
    player_name: string
    discord_username: string | null
    commander_deck: string
    result: 'win' | 'lose' | 'draw'
  }[]
  created_at: string
  updated_at: string
}

export class GameAPIClient {
  private baseURL: string = '/api'

  async createGame(request: CreateGameRequest): Promise<{
    success: boolean
    data?: Game  
    error?: string
    timestamp: string
  }> {
    try {
      console.log('🎮 Creating game via API:', {
        date: request.date,
        playersCount: request.players.length
      })

      const response = await fetch(`${this.baseURL}/games`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`)
      }

      console.log('✅ Game created successfully:', {
        gameId: result.data?.id,
        playersCount: result.data?.players?.length
      })

      return result

    } catch (error) {
      console.error('❌ Game creation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      }
    }
  }

  async listGames(filters: {
    playerId?: string
    dateFrom?: string
    dateTo?: string
    limit?: number
    offset?: number
  } = {}): Promise<{
    success: boolean
    data?: Game[]
    error?: string
    timestamp: string
  }> {
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString())
        }
      })

      const response = await fetch(`${this.baseURL}/games?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`)
      }

      return result

    } catch (error) {
      console.error('❌ List games error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      }
    }
  }

  async getGame(gameId: string): Promise<{
    success: boolean
    data?: Game
    error?: string
    timestamp: string
  }> {
    try {
      const response = await fetch(`${this.baseURL}/games/${gameId}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`)
      }

      return result

    } catch (error) {
      console.error('❌ Get game error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      }
    }
  }

  async deleteGame(gameId: string): Promise<{
    success: boolean
    message?: string
    error?: string
    timestamp: string
  }> {
    try {
      const response = await fetch(`${this.baseURL}/games/${gameId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`)
      }

      return result

    } catch (error) {
      console.error('❌ Delete game error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      }
    }
  }
}

export const gameAPI = new GameAPIClient()
