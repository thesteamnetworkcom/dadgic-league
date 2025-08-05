// ============================================================================
// PARTICIPANT TYPE FAMILY - Unified and Clean
// ============================================================================

import { ParticipantBase } from '../common/base.js';

// Input variant - what we receive from forms/API
export interface ParticipantInput extends ParticipantBase {
	player_identifier: string; // identifier we get from input
}

// Resolved variant - after player lookup
export interface ParticipantResolved extends ParticipantBase {
	player_id: string;
}

// Display variant - for UI with player details
export interface ParticipantDisplay extends ParticipantBase {
	player_id: string;
	player_name: string;
	discord_username: string | null;
}

// ============================================================================
// LEGACY COMPATIBILITY - Will be removed gradually
// ============================================================================

/** @deprecated Use ParticipantInput instead */
export interface GamePlayerInput extends ParticipantInput { }

/** @deprecated Use ParticipantInput instead */
export interface GameParticipantInput extends ParticipantInput { }

/** @deprecated Use ParticipantResolved instead */
export interface GameParticipantResolved extends ParticipantResolved { }

/** @deprecated Use ParticipantInput instead */
export interface PodPlayerForm extends ParticipantInput { }

/** @deprecated Use ParticipantInput instead - name field removed, use discord_username */
export interface ParsedPlayer extends ParticipantInput {
	name: string; // For backward compatibility only
}
