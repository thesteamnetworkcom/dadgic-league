// ============================================================================
// PLAYER TYPE FAMILY - Input/Update Pattern
// ============================================================================

// Input variant - for creating players
export interface PlayerInput {
	name: string;
	discord_id?: string | null;
	discord_username?: string | null;
	email?: string | null;
	role?: 'player' | 'admin';
}

// Update variant - for updating players (all optional)
export interface PlayerUpdate {
	name?: string;
	discord_id?: string | null;
	discord_username?: string | null;
	email?: string | null;
	role?: 'player' | 'admin';
}

// ============================================================================
// LEGACY COMPATIBILITY - Will be removed gradually
// ============================================================================

/** @deprecated Use PlayerInput instead */
export interface CreatePlayerInput extends PlayerInput { }

/** @deprecated Use PlayerInput instead */
//export interface CreatePlayerRequest extends PlayerInput {}
