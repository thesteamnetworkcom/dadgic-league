// ============================================================================
// LEAGUE TYPE FAMILY
// ============================================================================

// Input variant - for creating leagues
export interface LeagueInput {
  name: string;
  description?: string | null;
  player_ids: string[];
  start_date: string;
  end_date?: string | null;
  games_per_player: number; // Note: keeping games_per_player for DB compatibility
  status?: 'draft' | 'active' | 'completed';
}

// Update variant - for updating leagues
export interface LeagueUpdate {
  name?: string;
  description?: string | null;
  end_date?: string | null;
  status?: 'draft' | 'active' | 'completed';
}

// ============================================================================
// LEGACY COMPATIBILITY - Will be removed gradually
// ============================================================================

/** @deprecated Use LeagueInput instead */
export interface CreateLeagueInput extends LeagueInput {}

/** @deprecated Use LeagueInput instead */
//export interface CreateLeagueRequest extends LeagueInput {}
