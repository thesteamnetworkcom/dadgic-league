// ============================================================================
// DATABASE PACKAGE EXPORTS
// ============================================================================

// Types (re-exported from shared)
export * from './types/index';

// Query classes (will be updated to use new types)
export * from './queries/pods';
export * from './queries/players';
export * from './queries/leagues';
export * from './queries/base';

// Legacy client (deprecated)
export { supabase } from './client';

// Main database interface
import { PodQueries } from './queries/pods';
import { PlayerQueries } from './queries/players';
import { LeagueQueries } from './queries/leagues';
import { BaseQueries } from './queries/base';
import { ScheduledPodQueries } from './queries/schedulePods';

export const db = {
	pods: PodQueries,
	players: PlayerQueries,
	leagues: LeagueQueries,
	base: BaseQueries,
	scheduledPods: ScheduledPodQueries
};
