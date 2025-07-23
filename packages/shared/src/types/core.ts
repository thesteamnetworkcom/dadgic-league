// ============================================================================
// CORE TYPES - Single Source of Truth
// ============================================================================

export interface Player {
  id: string;
  name: string;
  discord_id: string | null;
  discord_username: string | null;
  email: string | null;
  role: 'player' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface League {
  id: string;
  name: string;
  description: string | null;
  player_ids: string[];
  start_date: string;
  end_date: string | null;
  status: 'draft' | 'active' | 'completed';
  games_per_player: number;
  created_at: string;
  updated_at: string;
}

export interface Pod {
  id: string;
  league_id: string | null;
  date: string;
  game_length_minutes: number | null;
  turns: number | null;
  winning_commander: string | null;
  participant_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PodParticipant {
  id: string;
  pod_id: string;
  player_id: string;
  commander_deck: string;
  result: 'win' | 'lose' | 'draw';
  created_at: string;
}

// ============================================================================
// UNIFIED GAME TYPES (replaces CreatePodInput, PodSubmission, etc.)
// ============================================================================

export interface GameParticipantInput {
  discord_username: string;
  commander_deck: string;
  result: 'win' | 'lose' | 'draw';
}

export interface GameParticipantResolved {
  player_id: string;
  commander_deck: string;
  result: 'win' | 'lose' | 'draw';
}

export interface GameCreateInput {
  league_id?: string | null;
  date: string;
  game_length_minutes?: number | null;
  turns?: number | null;
  notes?: string | null;
  participants: GameParticipantInput[];
}

export interface GameCreateResolved {
  league_id?: string | null;
  date: string;
  game_length_minutes?: number | null;
  turns?: number | null;
  notes?: string | null;
  participants: GameParticipantResolved[];
}

// ============================================================================
// LEGACY COMPATIBILITY (deprecated)
// ============================================================================

/** @deprecated Use GameCreateInput instead */
export interface CreatePodInput extends GameCreateResolved {}

/** @deprecated Use GameCreateInput instead */
export interface PodSubmission extends GameCreateInput {}

/** @deprecated Use GameParticipantInput instead */
export interface PodPlayerForm extends GameParticipantInput {}

/** @deprecated Use GameParticipantInput instead */
export interface ParsedPlayer extends GameParticipantInput {
  name: string;
}

// ============================================================================
// API TYPES
// ============================================================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface GameParseResult {
  success: boolean;
  data?: {
    date?: string;
    game_length_minutes?: number;
    turns?: number;
    notes?: string;
    participants: GameParticipantInput[];
  };
  error?: string;
  confidence?: number;
  processing_time_ms?: number;
}
