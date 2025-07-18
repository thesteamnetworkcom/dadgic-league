// packages/database/src/queries/players.ts
import { supabase } from '../client';
import { Player, PlayerStats } from '../types';

export class PlayerQueries {
  static async linkAuthUserByDiscord(discordId: string, authUserId: string): Promise<void> {
    const { error } = await supabase
      .from('players')
      .update({ id: authUserId })
      .eq('discord_id', discordId);

    if (error) throw error;
  }

  static async getAll(): Promise<Player[]> {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  }

  static async getById(id: string): Promise<Player | null> {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  }

  static async getByDiscordId(discordId: string): Promise<Player | null> {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('discord_id', discordId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  }

  static async create(player: Omit<Player, 'id' | 'created_at' | 'updated_at'>): Promise<Player> {
    const { data, error } = await supabase
      .from('players')
      .insert(player)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async update(id: string, updates: Partial<Player>): Promise<Player> {
    const { data, error } = await supabase
      .from('players')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getStats(playerId: string): Promise<PlayerStats> {
    // Complex query to get player statistics
    const { data, error } = await supabase
      .from('pod_participants')
      .select(`
        result,
        commander_deck,
        player:players(name)
      `)
      .eq('player_id', playerId);
    
    if (error) throw error;
    
    const games_played = data.length;
    const wins = data.filter(p => p.result === 'win').length;
    const losses = data.filter(p => p.result === 'lose').length;
    const draws = data.filter(p => p.result === 'draw').length;
    const win_rate = games_played > 0 ? wins / games_played : 0;
    
    // Get favorite commanders (most played)
    const commanderCounts = data.reduce((acc, p) => {
      acc[p.commander_deck] = (acc[p.commander_deck] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const favorite_commanders = Object.entries(commanderCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([commander]) => commander);
    
    return {
      player_id: playerId,
      player_name: (data[0]?.player as any)?.name || '',
      games_played,
      wins,
      losses,
      draws,
      win_rate,
      favorite_commanders
    };
  }
}