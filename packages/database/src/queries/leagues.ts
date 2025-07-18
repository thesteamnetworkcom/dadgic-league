// packages/database/src/queries/leagues.ts
import { supabase } from '../client';
import { League, LeagueWithProgress, CreateLeagueInput, ScheduledPod } from '../types';

export class LeagueQueries {
  // Add to LeagueQueries class in packages/database/src/queries/leagues.ts
static async findMatchingScheduledPod(playerIds: string[]): Promise<ScheduledPod | null> {
  // Sort player IDs for consistent comparison
  const sortedPlayerIds = [...playerIds].sort();
  
  const { data, error } = await supabase
    .from('scheduled_pods')
    .select(`
      *,
      league:leagues!inner(status)
    `)
    .eq('leagues.status', 'active')
    .is('completed_pod_id', null);
  
  if (error) throw error;
  
  // Find matching pod by comparing sorted player arrays
  const match = data?.find(scheduledPod => {
    const scheduledPlayerIds = [...scheduledPod.player_ids].sort();
    return scheduledPlayerIds.length === sortedPlayerIds.length &&
           scheduledPlayerIds.every((id, index) => id === sortedPlayerIds[index]);
  });
  
  return match || null;
}

// Also add a helper to get league info for logging
static async getLeagueInfo(scheduledPodId: string): Promise<{leagueName: string, leagueId: string} | null> {
  const { data, error } = await supabase
    .from('scheduled_pods')
    .select(`
      league_id,
      league:leagues(name)
    `)
    .eq('id', scheduledPodId)
    .single();
  
  if (error) return null;
  const league = Array.isArray(data.league) ? data.league[0] : data.league;
  return {
    leagueId: data.league_id,
    leagueName: league?.name || 'Unknown League'
  };
}
  // ADD THIS NEW METHOD for admin check
  static async isCurrentUserAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  console.log('Current user from auth:', user);
  if (!user) return false;

  const { data, error } = await supabase
    .from('players')
    .select('role, id, name')
    .eq('discord_id', user.user_metadata?.provider_id) // ← Change this line
    .single();

  console.log('Player lookup result:', data, error);
  if (error) return false;
  return data?.role === 'admin';
}

  static async getAll(): Promise<LeagueWithProgress[]> {
    const { data, error } = await supabase
      .from('leagues')
      .select(`
        *,
        scheduled_pods(*)
      `)
      .order('start_date', { ascending: false });
    
    if (error) throw error;
    
    return data.map(league => ({
      ...league,
      total_count: league.scheduled_pods.length,
      completed_count: league.scheduled_pods.filter((sp: any) => sp.completed_pod_id).length
    })) as LeagueWithProgress[];
  }

  static async getById(id: string): Promise<LeagueWithProgress | null> {
    const { data, error } = await supabase
      .from('leagues')
      .select(`
        *,
        scheduled_pods(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    return {
      ...data,
      total_count: data.scheduled_pods.length,
      completed_count: data.scheduled_pods.filter((sp: any) => sp.completed_pod_id).length
    } as LeagueWithProgress;
  }

  // UPDATED CREATE METHOD - now takes podPlayerGroups instead of generating all combinations
  static async create(input: CreateLeagueInput, podPlayerGroups?: string[][]): Promise<League> {

    // Create the league
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .insert({
        name: input.name,
        description: input.description || null,
        player_ids: input.player_ids,
        start_date: input.start_date,
        end_date: input.end_date || null,
        games_per_player: input.games_per_player, // ADD this field
        status: 'draft' // ADD this field
      })
      .select()
      .single();
    
    if (leagueError) throw leagueError;
    
    // Insert scheduled pods using provided groups OR generate all combinations (backwards compatibility)
    let combinations: string[][];
    if (podPlayerGroups) {
      combinations = podPlayerGroups;
    } else {
      // Fallback to old behavior for backwards compatibility
      combinations = this.generateCombinations(input.player_ids, 4);
    }
    
    if (combinations.length > 0) {
      const { error: scheduledError } = await supabase
        .from('scheduled_pods')
        .insert(
          combinations.map(combo => ({
            league_id: league.id,
            player_ids: combo
          }))
        );
      
      if (scheduledError) throw scheduledError;
    }
    
    return league;
  }

  // ADD THIS NEW METHOD for updating status
  static async updateStatus(id: string, status: 'draft' | 'active' | 'completed'): Promise<void> {
    const { error } = await supabase
      .from('leagues')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
  }

  // Keep your existing private method
  private static generateCombinations(players: string[], size: number): string[][] {
    const combinations: string[][] = [];
    
    function combine(start: number, combo: string[]) {
      if (combo.length === size) {
        combinations.push([...combo]);
        return;
      }
      
      for (let i = start; i < players.length; i++) {
        combo.push(players[i]);
        combine(i + 1, combo);
        combo.pop();
      }
    }
    
    combine(0, []);
    return combinations;
  }

  // Keep all your existing methods...
  static async getScheduledPods(leagueId: string): Promise<ScheduledPod[]> {
    const { data, error } = await supabase
      .from('scheduled_pods')
      .select('*')
      .eq('league_id', leagueId)
      .order('created_at');
    
    if (error) throw error;
    return data;
  }

  static async getUncompletedPods(leagueId: string): Promise<ScheduledPod[]> {
    const { data, error } = await supabase
      .from('scheduled_pods')
      .select('*')
      .eq('league_id', leagueId)
      .is('completed_pod_id', null)
      .order('created_at');
    
    if (error) throw error;
    return data;
  }

  static async markPodComplete(scheduledPodId: string, completedPodId: string): Promise<void> {
    const { error } = await supabase
      .from('scheduled_pods')
      .update({ completed_pod_id: completedPodId })
      .eq('id', scheduledPodId);
    
    if (error) throw error;
  }

  static async getLeagueStandings(leagueId: string): Promise<any[]> {
    // Get all completed pods for this league
    const { data, error } = await supabase
      .from('pods')
      .select(`
        *,
        participants:pod_participants(
          *,
          player:players(name)
        )
      `)
      .eq('league_id', leagueId);
    
    if (error) throw error;
    
    // Calculate standings
    const playerStats: Record<string, any> = {};
    
    data.forEach(pod => {
      pod.participants.forEach((participant: any) => {
        const playerId = participant.player_id;
        const playerName = participant.player?.name || 'Unknown';
        
        if (!playerStats[playerId]) {
          playerStats[playerId] = {
            player_id: playerId,
            player_name: playerName,
            games_played: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            win_rate: 0
          };
        }
        
        playerStats[playerId].games_played++;
        
        if (participant.result === 'win') playerStats[playerId].wins++;
        else if (participant.result === 'lose') playerStats[playerId].losses++;
        else if (participant.result === 'draw') playerStats[playerId].draws++;
      });
    });
    
    // Calculate win rates and sort by wins, then win rate
    const standings = Object.values(playerStats).map((stats: any) => ({
      ...stats,
      win_rate: stats.games_played > 0 ? stats.wins / stats.games_played : 0
    }));
    
    standings.sort((a: any, b: any) => {
      if (a.wins !== b.wins) return b.wins - a.wins;
      return b.win_rate - a.win_rate;
    });
    
    return standings;
  }

  static async update(id: string, updates: Partial<CreateLeagueInput>): Promise<League> {
    const { data, error } = await supabase
      .from('leagues')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('leagues')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}