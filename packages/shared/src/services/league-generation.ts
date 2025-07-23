// ============================================================================
// LEAGUE GENERATION SERVICE
// ============================================================================

import type { League, Player, GameCreateInput } from '../types';

export interface LeagueGenerationInput {
  name: string;
  description?: string;
  playerIds: string[];
  startDate: string;
  endDate?: string;
  gamesPerPlayer: number;
}

export interface LeagueGenerationResult {
  league: League;
  scheduledPods: any[]; // TODO: Define proper type
  stats: {
    totalPlayers: number;
    totalPods: number;
    gamesPerPlayer: number;
  };
}

export class LeagueGenerationService {
  static async generateLeague(input: LeagueGenerationInput): Promise<LeagueGenerationResult> {
    // Implementation will be moved from existing league-generation.js
    throw new Error('LeagueGenerationService.generateLeague not implemented yet');
  }

  static validateLeagueInputs(playerCount: number, gamesPerPlayer: number): { isValid: boolean; error?: string } {
    // Implementation will be moved from existing code
    const totalSlots = playerCount * gamesPerPlayer;
    if (totalSlots % 4 !== 0) {
      return { isValid: false, error: 'Total game slots must be divisible by 4' };
    }
    return { isValid: true };
  }

  static getSuggestedGamesPerPlayer(playerCount: number): number[] {
    // Implementation will be moved from existing code
    const suggestions = [];
    for (let games = 4; games <= 12; games += 2) {
      if ((playerCount * games) % 4 === 0) {
        suggestions.push(games);
      }
    }
    return suggestions;
  }
}
