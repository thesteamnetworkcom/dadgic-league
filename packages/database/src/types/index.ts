// ============================================================================
// UNIFIED TYPE EXPORTS - Single Source of Truth (DATABASE PACKAGE)
// ============================================================================

// Core entities (most important)
export * from './entities';

// Base types for extensions
export * from './common/base';

// Type families organized by purpose
export * from './participants';
export * from './pods';
export * from './players';
export * from './leagues';

// API types
export * from './requests';
export * from './responses';
export * from './api';

// Service-specific types
export * from './matching';
export * from './parsing';

// Legacy compatibility (will be gradually removed)
//export * from './legacy';

// ============================================================================
// RE-EXPORT COMMON TYPES FOR CONVENIENCE
// ============================================================================

/* Most commonly used types available at top level
export type {
  // Entities
  Player,
  League,
  Pod,
  PodParticipant,
  PodWithParticipants,
  LeagueWithProgress,
  PlayerStats,
  
  // Main type families
  ParticipantInput,
  ParticipantResolved,
  ParticipantDisplay,
  PodInput,
  PodResolved,
  PodDisplay,
  PlayerInput,
  LeagueInput,
  
  // Responses
  ResponseBase,
  CreatePodResponse,
  CreatePlayerResponse,
  CreateLeagueResponse,
  
  // Matching
  PlayerIdentifier,
  PlayerMatchResult,
  PlayerMatchOption,
  
  // Parsing
  ParseRequest,
  ParseResponse,
  ParsedPodData
} from './';*/
