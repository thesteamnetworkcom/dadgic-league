// ============================================================================
// PLAYER MATCHING TYPES - For PlayerMatchingService
// ============================================================================

import { Player } from '../entities/index.js';

export interface PlayerIdentifier {
	id?: string | null;
	discord_id?: string | null;
	discord_username?: string | null;
	name?: string | null;
	displayName?: string | null;
	unknown_identifier?: string | null;
}
export interface ResolvedPlayerIdentifier {

}

export interface PlayerMatchOption {
	player: Player;
	confidence: number;
	reason: string;
}

export interface PlayerMatchResult {
	player: Player | null;
	confidence: number;
	alternatives: PlayerMatchOption[];
	matchType: 'exact_id' | 'exact_discord_id' | 'exact_username' | 'exact_name' | 'fuzzy' | 'context' | 'none';
	contextInfo?: {
		recentPodsWithPlayer: string[];
		frequentPlaymates: Player[];
	};
}

export interface ContextOptions {
	recentDays?: number;
	includeFrequentPlaymates?: boolean;
}
