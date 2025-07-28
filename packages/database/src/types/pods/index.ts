// ============================================================================
// POD TYPE FAMILY - Clean Extension Pattern (Pod = Game)
// ============================================================================

import { PodBase } from '../common/base';
import { ParticipantInput, ParticipantResolved, ParticipantDisplay } from '../participants';

// Input variant - what we receive from forms/API
export interface PodInput extends PodBase {
  participants: ParticipantInput[];
}
// Resolved variant - after player lookup, ready for database
export interface PodPlayersResolved extends PodBase {
  participants: ParticipantResolved[];
}
export interface PodResolved extends PodBase {
  league_id: string | null;
  date: string;
  game_length_minutes: number | null;
  turns: number | null;
  notes: string | null;
  participants: ParticipantResolved[];
}
// Display variant - for UI with full player details
export interface PodDisplay extends PodBase {
  id: string;
  participants: ParticipantDisplay[];
  created_at: string;
  updated_at: string;
}

// ============================================================================
// LEGACY COMPATIBILITY - Will be removed gradually
// ============================================================================

/** @deprecated Use PodInput instead */
//export interface CreateGameRequest extends PodInput {}

/** @deprecated Use PodInput instead */
export interface GameCreateInput extends PodInput {}

/** @deprecated Use PodInput instead */
export interface GameInput extends PodInput {}

/** @deprecated Use PodResolved instead */
export interface GameCreateResolved extends PodResolved {}

/** @deprecated Use PodResolved instead */
export interface GameResolved extends PodResolved {}

/** @deprecated Use PodResolved instead */
export interface CreatePodInput extends PodResolved {}

/** @deprecated Use PodInput instead */
export interface PodSubmission extends PodInput {}

/** @deprecated Use PodDisplay instead */
export interface CreatedGame extends PodDisplay {}

/** @deprecated Use PodDisplay instead */
export interface GameDisplay extends PodDisplay {}
