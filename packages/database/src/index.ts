// ============================================================================
// DATABASE PACKAGE EXPORTS
// ============================================================================

// Types (re-exported from shared)
export * from './types/index.js';

// Query classes (will be updated to use new types)
export * from './queries/pods.js';
export * from './queries/players.js';
export * from './queries/leagues.js';
export * from './queries/base.js';

// Legacy client (deprecated)

// Main database interface
import { PodQueries } from './queries/pods.js';
import { PlayerQueries } from './queries/players.js';
import { LeagueQueries } from './queries/leagues.js';
import { BaseQueries } from './queries/base.js';
import { ScheduledPodQueries } from './queries/schedulePods.js';

export const db = {
	pods: PodQueries,
	players: PlayerQueries,
	leagues: LeagueQueries,
	base: BaseQueries,
	scheduledPods: ScheduledPodQueries
};
