// =====================================================
// packages/shared/src/league-generation.ts
// =====================================================

import { generatePodPairings } from './pod-generation.js';
import { LeagueQueries, PlayerQueries } from '@dadgic/database';

export interface CreateLeagueRequest {
  name: string;
  description?: string;
  playerIds: string[]; // Changed from playerDiscordIds
  startDate: string;
  endDate?: string;
  gamesPerPlayer: number;
}

export interface LeagueGenerationResult {
  league: any; // Your League type
  scheduledPods: any[]; // Your ScheduledPod type
  stats: {
    totalPlayers: number;
    totalPods: number;
    gamesPerPlayer: number;
  };
}

export async function generateLeague(request: CreateLeagueRequest): Promise<LeagueGenerationResult> {
  console.log(`🎯 Generating league: ${request.name}`);
  
  // Check admin permissions
  const isAdmin = await LeagueQueries.isCurrentUserAdmin();
  if (!isAdmin) {
    throw new Error('Only administrators can create leagues');
  }

  // Validate inputs
  const validation = validateLeagueInputs(request.playerIds.length, request.gamesPerPlayer);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Generate pod pairings using player IDs directly
  const podPlayerGroups = generatePodPairings(request.playerIds, request.gamesPerPlayer);
  console.log(`🎲 Generated ${podPlayerGroups.length} pod pairings`);

  // Create the league record (no Discord ID conversion needed)
  const league = await LeagueQueries.create({
    name: request.name,
    description: request.description,
    player_ids: request.playerIds, // These are already player UUIDs
    start_date: request.startDate,
    end_date: request.endDate,
    games_per_player: request.gamesPerPlayer
  }, podPlayerGroups);

  console.log(`✅ Created league: ${league.id}`);

  // Get the created scheduled pods
  const scheduledPods = await LeagueQueries.getScheduledPods(league.id);
  console.log(`💾 Created ${scheduledPods.length} scheduled pods`);

  // Activate the league
  await LeagueQueries.updateStatus(league.id, 'active');
  console.log(`🚀 League "${league.name}" is now active!`);

  return {
    league,
    scheduledPods,
    stats: {
      totalPlayers: league.player_ids.length,
      totalPods: podPlayerGroups.length,
      gamesPerPlayer: request.gamesPerPlayer
    }
  };
}

export function validateLeagueInputs(playerCount: number, gamesPerPlayer: number): { isValid: boolean; error?: string } {
  if (playerCount < 4) {
    return { isValid: false, error: "Need at least 4 players for a league" };
  }

  if (gamesPerPlayer < 1) {
    return { isValid: false, error: "Games per player must be at least 1" };
  }

  const totalSlots = playerCount * gamesPerPlayer;
  if (totalSlots % 4 !== 0) {
    return { 
      isValid: false, 
      error: `${playerCount} players × ${gamesPerPlayer} games = ${totalSlots} total slots. Need a multiple of 4. Try adjusting games per player.`
    };
  }

  return { isValid: true };
}

export function getSuggestedGamesPerPlayer(playerCount: number): number[] {
  if (playerCount < 4) return [];
  
  const suggestions: number[] = [];
  for (let games = 1; games <= 20; games++) {
    const totalSlots = playerCount * games;
    if (totalSlots % 4 === 0) {
      suggestions.push(games);
    }
  }
  return suggestions.slice(0, 10);
}

export async function getPlayersForLeagueCreation() {
  const isAdmin = await LeagueQueries.isCurrentUserAdmin();
  if (!isAdmin) {
    throw new Error('Only administrators can access player lists for league creation');
  }
  return await PlayerQueries.getAll();
}