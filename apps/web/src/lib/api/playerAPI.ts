// ============================================================================
// Client-Side Player API Utility
// ============================================================================

export interface CreatePlayerRequest {
  name: string
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

export class PlayerAPIClient {
  private baseURL: string = '/api'

  async createPlayer(request: CreatePlayerRequest): Promise<{
    success: boolean
    data?: Player
    error?: string
    timestamp: string
  }> {
    try {
      console.log('👥 Creating player via API:', request)

      const response = await fetch(`${this.baseURL}/players`, {
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

      return result

    } catch (error) {
      console.error('❌ Player creation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      }
    }
  }

  async listPlayers(filters: {
    search?: string
    limit?: number
    offset?: number
  } = {}): Promise<{
    success: boolean
    data?: Player[]
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

      const response = await fetch(`${this.baseURL}/players?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`)
      }

      return result

    } catch (error) {
      console.error('❌ List players error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      }
    }
  }

  async searchPlayers(query: string): Promise<{
    success: boolean
    data?: Player[]
    error?: string
    timestamp: string
  }> {
    try {
      if (!query || query.trim().length < 2) {
        return {
          success: true,
          data: [],
          timestamp: new Date().toISOString()
        }
      }

      const response = await fetch(`${this.baseURL}/players/search?q=${encodeURIComponent(query)}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`)
      }

      return result

    } catch (error) {
      console.error('❌ Search players error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      }
    }
  }
}

export const playerAPI = new PlayerAPIClient()
