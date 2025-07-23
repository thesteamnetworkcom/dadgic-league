// ============================================================================
// API Types - Request/Response Contracts
// ============================================================================

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
}

// AI Parsing Types
export interface AIParseRequest {
  text: string
  context?: {
    user_id?: string
    source?: 'web' | 'discord'
    metadata?: Record<string, any>
  }
}

export interface AIParseResponse extends APIResponse<ParsedGameData> {
  data?: ParsedGameData & {
    confidence: number
    processing_time_ms: number
  }
}

export interface ParsedGameData {
  date: string
  game_length_minutes?: number
  turns?: number
  notes?: string
  players: ParsedPlayer[]
}

export interface ParsedPlayer {
  name: string
  commander: string
  result: 'win' | 'lose' | 'draw'
}
