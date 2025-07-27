// ============================================================================
// Shared Services - Central Export Point
// ============================================================================

// Real Services (Complete implementations)
export { AIParsingService, getAIParsingService, parseWithAI } from './AIParsingService'
export * from './PodService'
export * from './PlayerService'

// Utility exports
export { validate, validateAIParseRequest } from '../utils/validation/index.js'

// Re-export ALL types from database package (single source of truth)
export type { 
  Player,
  Pod,
  PodWithParticipants,
  PodParticipant,
  League,
  LeagueWithProgress,
  CreatePodInput,
  CreateLeagueInput,
  PlayerStats,
  ScheduledPod,
  // AI Types (should be moved to database package)
  AIParseRequest,
  AIParseResponse,
  ParsedGameData,
  ParsedPlayer
} from '@dadgic/database'

// TODO: Move AI types (AIParseRequest, AIParseResponse, etc.) to database package
// TODO: Remove packages/shared/src/types/api folder entirely 
// TODO: Update AIParsingService to import types from database
// TODO: Create LeagueService to handle league generation logic
// TODO: Move remaining logic from league-generation.ts and player-matching.ts
