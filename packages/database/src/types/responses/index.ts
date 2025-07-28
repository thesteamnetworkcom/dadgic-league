// ============================================================================
// API RESPONSE TYPES - Standardized Response Format
// ============================================================================

import { ResponseBase } from '../common/base';
import { Player, League, Pod } from '../entities';

// Standard CRUD responses
export interface CreatePodResponse extends ResponseBase<Pod> {}
export interface CreatePlayerResponse extends ResponseBase<Player> {}
export interface CreateLeagueResponse extends ResponseBase<League> {}

// List responses with pagination
export interface ListResponse<T> extends ResponseBase<T[]> {
  pagination?: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface ListPlayersResponse extends ListResponse<Player> {}
export interface ListPodsResponse extends ListResponse<Pod> {}
export interface ListLeaguesResponse extends ListResponse<League> {}

// ============================================================================
// LEGACY COMPATIBILITY - Will be removed gradually
// ============================================================================

/** @deprecated Use CreatePodResponse instead */
export interface CreateGameResponse extends CreatePodResponse {}

/** @deprecated Use ListPodsResponse instead */
export interface ListGamesResponse extends ListPodsResponse {}
