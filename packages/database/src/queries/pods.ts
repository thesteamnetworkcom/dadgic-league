// packages/database/src/queries/pods.ts
import { supabase } from '../client';
import { Pod, PodWithParticipants, CreatePodInput, UpdatePodInput } from '../types';
import { LeagueQueries } from './leagues';

export class PodQueries {
  static async getAll(): Promise<PodWithParticipants[]> {
    const { data, error } = await supabase
      .from('pods')
      .select(`
        *,
        participants:pod_participants(
          *,
          player:players(*)
        )
      `)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data as PodWithParticipants[];
  }

  static async getById(id: string): Promise<PodWithParticipants | null> {
    const { data, error } = await supabase
      .from('pods')
      .select(`
        *,
        participants:pod_participants(
          *,
          player:players(*)
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as PodWithParticipants;
  }

  static async getByLeague(leagueId: string): Promise<PodWithParticipants[]> {
    const { data, error } = await supabase
      .from('pods')
      .select(`
        *,
        participants:pod_participants(
          *,
          player:players(*)
        )
      `)
      .eq('league_id', leagueId)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data as PodWithParticipants[];
  }

  static async create(input: CreatePodInput): Promise<PodWithParticipants> {
    // Start by creating the pod
    const { data: pod, error: podError } = await supabase
      .from('pods')
      .insert({
        league_id: input.league_id || null,
        date: input.date,
        game_length_minutes: input.game_length_minutes || null,
        turns: input.turns || null,
        winning_commander: input.winning_commander || null,
        participant_count: input.participants.length,
        notes: input.notes || null
      })
      .select()
      .single();
    
    if (podError) throw podError;
    
    // Insert participants
    const { data: participants, error: participantsError } = await supabase
      .from('pod_participants')
      .insert(
        input.participants.map(p => ({
          pod_id: pod.id,
          player_id: p.player_id,
          commander_deck: p.commander_deck,
          result: p.result
        }))
      )
      .select(`
        *,
        player:players(*)
      `);
    
    if (participantsError) throw participantsError;
    try {
    const playerIds = input.participants.map(p => p.player_id);
    const matchingScheduledPod = await LeagueQueries.findMatchingScheduledPod(playerIds);
    
    if (matchingScheduledPod) {
      await LeagueQueries.markPodComplete(matchingScheduledPod.id, pod.id);
      console.log(`✅ Pod automatically linked to league: ${matchingScheduledPod.league_id}`);
    }
  } catch (matchError) {
    console.error('Error checking for league matches:', matchError);
    // Don't fail pod creation if matching fails
  }
    return {
      ...pod,
      participants: participants as any
    };
  }

  static async update(id: string, updates: UpdatePodInput): Promise<Pod> {
    const { data, error } = await supabase
      .from('pods')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('pods')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  static async getRecent(limit: number = 10): Promise<PodWithParticipants[]> {
    const { data, error } = await supabase
      .from('pods')
      .select(`
        *,
        participants:pod_participants(
          *,
          player:players(*)
        )
      `)
      .order('date', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data as PodWithParticipants[];
  }
}