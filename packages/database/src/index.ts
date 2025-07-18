// packages/database/src/index.ts

// Export all types
export * from './types';

// Export the client (in case you need direct access)
export * from './client';

// Export all query classes
export * from './queries/players';
export * from './queries/pods';
export * from './queries/leagues';

// Main database object for easy importing
import { PlayerQueries } from './queries/players';
import { PodQueries } from './queries/pods';
import { LeagueQueries } from './queries/leagues';

export const db = {
  players: PlayerQueries,
  pods: PodQueries,
  leagues: LeagueQueries
};