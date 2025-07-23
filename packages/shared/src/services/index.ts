// ============================================================================
// Shared Services - Central Export Point
// ============================================================================

// Real Services (Complete implementations)
export { AIParsingService, getAIParsingService, parseWithAI } from './AIParsingService'
export { GameService, getGameService } from './GameService'
export { PlayerService, getPlayerService } from './PlayerService'

// Utility exports
export { APIError, ValidationError, handleAPIError } from '../utils/errors/APIError'
export { validate, validateAIParseRequest } from '../utils/validation'

// Re-export database types (no duplicates!)
export type { 
  Player,
  Pod,
  PodWithParticipants,
  PodParticipant,
  League,
  LeagueWithProgress,
  CreatePodInput,
  CreateLeagueInput,
  UpdatePodInput,
  PlayerStats
} from '@dadgic/database'

// Re-export shared API types only for AI parsing
export type { 
  AIParseRequest, 
  AIParseResponse, 
  ParsedGameData, 
  ParsedPlayer
} from '../types/api'

// TODO: Create LeagueService to handle league generation logic
// TODO: Move remaining logic from league-generation.ts and player-matching.ts
