import { BaseQueries } from './base';
import type { ClientType } from '../client-factory';
import type { 
  Pod, 
  PodWithParticipants,
  GameCreateResolved, 
} from '../types';

export class PodQueries extends BaseQueries {
  static async create(input: GameCreateResolved, clientType: ClientType = 'user'): Promise<PodWithParticipants> {
    this.validateRequired(input.league_id, 'league_id');
    this.validateRequired(input.date, 'date');

    const supabase = this.getClient(clientType);
    
    try {
      const { data: pod, error } = await supabase
        .from('pods')
        .insert({
          league_id: input.league_id,
          date: input.date,
          game_length_minutes: input.game_length_minutes,
          turns: input.turns,
          notes: input.notes
        })
        .select()
        .single();

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
        .select('*, player:players(*)'); 

      if (error) {
        this.handleError(error, 'create pod');
      }

      return pod as PodWithParticipants;
    } catch (error) {
      this.handleError(error, 'create pod');
    }
  }

  static async update(
    id: string, 
    updates: Partial<Pod>, 
    clientType: ClientType = 'user'
  ): Promise<Pod> {
    this.validateRequired(id, 'pod id');

    const supabase = this.getClient(clientType);
    
    try {
      const { data, error } = await supabase
        .from('pods')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        this.handleError(error, 'update pod');
      }

      return data as Pod;
    } catch (error) {
      this.handleError(error, 'update pod');
    }
  }

  static async getById(id: string, clientType: ClientType = 'user'): Promise<PodWithParticipants | null> {
    this.validateRequired(id, 'pod id');

    const supabase = this.getClient(clientType);
    
    try {
      const { data, error } = await supabase
        .from('pods')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        this.handleError(error, 'get pod by id');
      }

      return data as PodWithParticipants;
    } catch (error) {
      this.handleError(error, 'get pod by id');
    }
  }

  static async getByLeague(
    leagueId: string, 
    clientType: ClientType = 'user'
  ): Promise<Pod[]> {
    this.validateRequired(leagueId, 'league id');

    const supabase = this.getClient(clientType);
    
    try {
      const { data, error } = await supabase
        .from('pods')
        .select('*')
        .eq('league_id', leagueId)
        .order('date', { ascending: true });

      if (error) {
        this.handleError(error, 'get pods by league');
      }

      return data as Pod[];
    } catch (error) {
      this.handleError(error, 'get pods by league');
    }
  }
}
