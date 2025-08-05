// ============================================================================
// CORE TYPES - Single Source of Truth
// ============================================================================
export * from './api'
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
export interface CreatePlayerInput {
	name: string;
	discord_id?: string | null;
	discord_username?: string | null;
	email?: string | null;
	role?: 'player'
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
export interface CreateLeagueInput {
	name: string;
	description?: string | null;
	player_ids: string[];
	start_date: string;
	end_date?: string | null;
	games_per_player: number;
	status?: 'draft' | 'active' | 'completed';  // probably defaults to 'draft'
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
// RELATIONSHIP TYPES (The Missing Piece!)
// ============================================================================

export interface PodWithParticipants extends Pod {
	participants: (PodParticipant & { player: Player })[];
}

export interface LeagueWithProgress extends League {
	scheduled_pods: ScheduledPod[];
	completed_count: number;
	total_count: number;
	completion_percentage?: number;
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
export interface CreatePodInput extends GameCreateResolved { }

/** @deprecated Use GameCreateInput instead */
export interface PodSubmission extends GameCreateInput { }

/** @deprecated Use GameParticipantInput instead */
export interface PodPlayerForm extends GameParticipantInput { }

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


