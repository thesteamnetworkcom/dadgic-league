// ============================================================================
// Shared Services - Central Export Point
// ============================================================================

// AI Services
export { AIParsingService, getAIParsingService, parseWithAI } from './AIParsingService'

// Game Services
export { GameService, getGameService } from './GameService'

// Player Services  
export { PlayerService, getPlayerService } from './PlayerService'

// Utility exports
export { APIError, ValidationError, handleAPIError } from '../utils/errors/APIError'
export { validate, validateAIParseRequest } from '../utils/validation'

// Re-export types for convenience
export type { 
  AIParseRequest, 
  AIParseResponse, 
  ParsedGameData, 
  ParsedPlayer,
  CreateGameRequest,
  CreateGameResponse,
  CreatedGame,
  GamePlayer,
  CreatePlayerRequest,
  CreatePlayerResponse,
  Player
} from '../types/api'
