// ============================================================================
// CORE TYPES - Single Source of Truth
// ============================================================================
// These are the ONLY type definitions that should be used across the app.
// All other type files should import from here.

// ============================================================================
// DATABASE ENTITY TYPES
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

export interface ScheduledPod {
  id: string;
  league_id: string;
  player_ids: string[];
  completed_pod_id: string | null;
  created_at: string;
}

// ============================================================================
// GAME PARTICIPANT TYPES (UNIFIED)
// ============================================================================
// These replace PodPlayerForm, ParsedPlayer, participants, etc.

export interface GameParticipantInput {
  // For form inputs (web + Discord)
  discord_username: string;
  commander_deck: string;
  result: 'win' | 'lose' | 'draw';
}

export interface GameParticipantResolved {
  // After player lookup/resolution
  player_id: string;
  commander_deck: string;
  result: 'win' | 'lose' | 'draw';
}

export interface GameParticipantDisplay {
  // For displaying in UI
  player_id: string;
  player_name: string;
  discord_username: string | null;
  commander_deck: string;
  result: 'win' | 'lose' | 'draw';
}

// ============================================================================
// GAME CREATION TYPES (UNIFIED)
// ============================================================================
// These replace CreatePodInput, PodSubmission, etc.

export interface GameCreateInput {
  // Universal input for creating games (web form, Discord, API)
  league_id?: string | null;
  date: string;
  game_length_minutes?: number | null;
  turns?: number | null;
  notes?: string | null;
  participants: GameParticipantInput[];
}

export interface GameCreateResolved {
  // After player resolution, ready for database
  league_id?: string | null;
  date: string;
  game_length_minutes?: number | null;
  turns?: number | null;
  notes?: string | null;
  participants: GameParticipantResolved[];
}

// ============================================================================
// AI PARSING TYPES (UNIFIED)
// ============================================================================

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

export interface GameParseRequest {
  text: string;
  context?: {
    user_id?: string;
    source?: 'web' | 'discord';
    metadata?: Record<string, any>;
  };
}

// ============================================================================
// EXTENDED/COMPUTED TYPES
// ============================================================================

export interface PodWithParticipants extends Pod {
  participants: (PodParticipant & { player: Player })[];
}

export interface LeagueWithProgress extends League {
  scheduled_pods: ScheduledPod[];
  completed_count: number;
  total_count: number;
  completion_percentage: number;
}

export interface PlayerStats {
  player_id: string;
  player_name: string;
  games_played: number;
  wins: number;
  losses: number;
  draws: number;
  win_rate: number;
  favorite_commanders: string[];
}

// ============================================================================
// FORM TYPES (LEGACY COMPATIBILITY)
// ============================================================================
// These provide backward compatibility during transition

/** @deprecated Use GameCreateInput instead */
export interface CreatePodInput extends GameCreateInput {
  participants: GameParticipantResolved[];
}

/** @deprecated Use GameCreateInput instead */
export interface PodSubmission extends GameCreateInput {}

/** @deprecated Use GameParticipantInput instead */
export interface PodPlayerForm extends GameParticipantInput {}

/** @deprecated Use GameParticipantInput instead */  
export interface ParsedPlayer extends GameParticipantInput {
  name: string; // For backward compatibility
}

/** @deprecated Use GameCreateInput instead */
export interface PodReportForm {
  date: string;
  players: GameParticipantInput[];
  game_length_minutes?: number;
  turns?: number;
  notes?: string;
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

export interface CreateGameRequest extends GameCreateInput {}
export interface CreateGameResponse extends APIResponse<Pod> {}

export interface CreatePlayerRequest {
  name: string;
  discord_id?: string;
  discord_username?: string;
}
export interface CreatePlayerResponse extends APIResponse<Player> {}

export interface CreateLeagueRequest {
  name: string;
  description?: string;
  player_ids: string[];
  start_date: string;
  end_date?: string;
  games_per_player: number;
}
export interface CreateLeagueResponse extends APIResponse<League> {}
