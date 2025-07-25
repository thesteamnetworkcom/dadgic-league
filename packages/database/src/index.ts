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
export { supabase } from './client.js';

// Main database interface
import { PodQueries } from './queries/pods';
import { PlayerQueries } from './queries/players';
import { LeagueQueries } from './queries/leagues';
import { BaseQueries } from './queries/base';

export const db = {
  pods: PodQueries,
  players: PlayerQueries,
  leagues: LeagueQueries,
  base: BaseQueries
};
