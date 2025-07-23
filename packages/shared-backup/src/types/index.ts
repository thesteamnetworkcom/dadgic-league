// ============================================================================
// UNIFIED TYPE EXPORTS - Single Import Point
// ============================================================================
// Import ALL types from here to ensure consistency across the app

// Core types (new, canonical)
export * from './core';

// Type utilities
export * from './utils';

// Re-export for convenience
export type {
  // Most commonly used types
  Player,
  League,
  Pod,
  PodParticipant,
  
  // Game creation (new standard)
  GameCreateInput,
  GameCreateResolved,
  GameParticipantInput,
  GameParticipantResolved,
  
  // AI parsing
  GameParseResult,
  GameParseRequest,
  
  // API types
  APIResponse,
  CreateGameRequest,
  CreateGameResponse,
  
  // Legacy (for backward compatibility)
  CreatePodInput,
  PodSubmission,
  PodPlayerForm,
  PodReportForm
} from './core';
