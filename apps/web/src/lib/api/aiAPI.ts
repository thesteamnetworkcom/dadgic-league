// ============================================================================
// Client-Side AI API Utility
// ============================================================================

export interface AIParseRequest {
  text: string
  context?: {
    user_id?: string
    metadata?: Record<string, any>
  }
}

export interface AIParseResponse {
  success: boolean
  data?: {
    date: string
    game_length_minutes?: number
    turns?: number
    notes?: string
    players: {
      name: string
      commander: string
      result: 'win' | 'lose' | 'draw'
    }[]
    confidence: number
    processing_time_ms: number
  }
  error?: string
  timestamp: string
}

export class AIAPIClient {
  private baseURL: string = '/api'

  async parseGameText(request: AIParseRequest): Promise<AIParseResponse> {
    try {
      console.log('🤖 Calling AI Parse API:', {
        textLength: request.text.length
      })

      const response = await fetch(`${this.baseURL}/ai/parse`, {
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

      console.log('✅ AI Parse API Response:', {
        success: result.success,
        confidence: result.data?.confidence
      })

      return result

    } catch (error) {
      console.error('❌ AI Parse API Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      }
    }
  }
}

export const aiAPI = new AIAPIClient()
