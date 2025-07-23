// ============================================================================
// DATABASE PACKAGE EXPORTS
// ============================================================================

// Types (re-exported from shared)
export * from './types';

// Query classes (will be updated to use new types)
export * from './queries/pods';
export * from './queries/players';
export * from './queries/leagues';

// Legacy client (deprecated)
export { supabase } from './client';

// Main database interface
import { PodQueries } from './queries/pods';
import { PlayerQueries } from './queries/players';

export const db = {
  pods: PodQueries,
  players: PlayerQueries,
};
