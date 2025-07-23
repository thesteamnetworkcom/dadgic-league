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

// Extended types for Game operations
export interface CreateGameRequest {
  date: string
  game_length_minutes?: number
  turns?: number
  notes?: string
  players: GamePlayerInput[]
}

export interface GamePlayerInput {
  discord_username: string
  commander_deck: string
  result: 'win' | 'lose' | 'draw'
}

export interface CreateGameResponse extends APIResponse<CreatedGame> {}

export interface CreatedGame {
  id: string
  date: string
  players: GamePlayer[]
  created_at: string
  updated_at: string
}

export interface GamePlayer {
  id: string
  player_id: string
  player_name: string
  discord_username: string | null
  commander_deck: string
  result: 'win' | 'lose' | 'draw'
}

// Player types
export interface CreatePlayerRequest {
  name: string
  discord_id?: string
  discord_username?: string
}

export interface CreatePlayerResponse extends APIResponse<Player> {}

export interface Player {
  id: string
  name: string
  discord_id: string | null
  discord_username: string | null
  role: 'player' | 'admin'
  created_at: string
  updated_at: string
}
