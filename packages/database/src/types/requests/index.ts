// ============================================================================
// API REQUEST TYPES - Extend Base Types with Request Metadata
// ============================================================================

import { RequestBase } from '../common/base.js';
import { PodInput } from '../pods/index.js';
import { PlayerInput } from '../players/index.js';
import { LeagueInput } from '../leagues/index.js';

// API requests extend base types with request context
export interface CreatePodRequest extends PodInput, RequestBase { }
export interface CreatePlayerRequest extends PlayerInput, RequestBase { }
export interface CreateLeagueRequest extends LeagueInput, RequestBase { }

// List/query requests
export interface ListPlayersRequest extends RequestBase {
	search?: string;
	limit?: number;
	offset?: number;
}

export interface ListPodsRequest extends RequestBase {
	playerId?: string;
	leagueId?: string;
	dateFrom?: string;
	dateTo?: string;
	limit?: number;
	offset?: number;
}

// ============================================================================
// LEGACY COMPATIBILITY - Will be removed gradually
// ============================================================================

/** @deprecated Use CreatePodRequest instead */
export interface CreateGameRequest extends CreatePodRequest { }

/** @deprecated Use ListPodsRequest instead */
export interface ListGamesRequest extends ListPodsRequest { }
