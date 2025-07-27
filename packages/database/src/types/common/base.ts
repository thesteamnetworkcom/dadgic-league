// ============================================================================
// BASE TYPES - Foundation for Extension Pattern
// ============================================================================

// Base structures that get extended
export interface PodBase {
  league_id?: string | null;
  date: string;
  game_length_minutes?: number | null;
  turns?: number | null;
  notes?: string | null;
}

export interface ParticipantBase {
  commander_deck: string;
  result: 'win' | 'lose' | 'draw';
}

export interface RequestBase {
  context?: {
    user_id?: string;
    source?: 'web' | 'discord' | 'api';
    metadata?: Record<string, any>;
  };
}

export interface ResponseBase<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// Re-export for convenience
export type APIResponse<T = any> = ResponseBase<T>;
