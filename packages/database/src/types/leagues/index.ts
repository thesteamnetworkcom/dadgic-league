// ============================================================================
// LEAGUE TYPE FAMILY
// ============================================================================

import { LeagueBase } from "../common/base";
import { Player } from "../core";
import { PlayerIdentifier } from "../matching";
import { ParticipantInput } from "../participants";

// Input variant - for creating leagues
export interface LeagueInput extends LeagueBase{
  participants: PlayerIdentifier[];
}
export interface LeagueResolved extends LeagueBase{
  participants: Player[];
}

export interface LeagueDisplay extends LeagueBase{
  id: string;
  participants: Player[];
  created_at: string;
  updated_at: string
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
