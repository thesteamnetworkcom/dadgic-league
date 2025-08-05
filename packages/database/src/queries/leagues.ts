// packages/database/src/queries/leagues.ts
import { ClientType, SupabaseClientFactory } from '../client-factory';
import { League, LeagueWithProgress, CreateLeagueInput, ScheduledPod, PodWithParticipants, ParticipantInput, PlayerIdentifier, LeagueResolved, Player } from '../types';
import { BaseQueries } from './base';

export class LeagueQueries extends BaseQueries {
	// Add to LeagueQueries class in packages/database/src/queries/leagues.ts
	static async findMatchingScheduledPod(playerIds: string[]): Promise<ScheduledPod | null> {
		// Sort player IDs for consistent comparison
		const sortedPlayerIds = [...playerIds].sort();

		const { data, error } = await this.getClient()
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
	static async getLeagueInfo(scheduledPodId: string): Promise<{ leagueName: string, leagueId: string } | null> {
		const { data, error } = await this.getClient()
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

	static async list(
		filters: {
			status?: string
			limit?: number
			offset?: number
		} = {},
		clientType: ClientType = 'user'
	): Promise<League[]> {
		const supabase = this.getClient(clientType);
		let query = supabase
			.from('leagues')
			.select(`*`);
		if (filters.status) {
			query = query.eq('status', filters.status)
		}
		if (filters.limit) {
			query = query.limit(filters.limit);
		}

		if (filters.offset) {
			query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
		}

		const { data, error } = await query;

		if (error) throw error;

		let results = data as League[];
		return results;
	}

	static async getAll(): Promise<LeagueWithProgress[]> {
		const { data, error } = await this.getClient()
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
		const { data, error } = await this.getClient()
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
	static async create(input: LeagueResolved, podPlayerGroups?: Player[][], clientType: ClientType = 'user'): Promise<League> {
		const supabase = this.getClient(clientType);
		// Create the league
		const { data: league, error: leagueError } = await supabase
			.from('leagues')
			.insert({
				name: input.name,
				description: input.description || null,
				player_ids: input.participants,
				start_date: input.start_date,
				end_date: input.end_date || null,
				games_per_player: input.games_per_player, // ADD this field
				status: 'draft' // ADD this field
			})
			.select()
			.single();

		if (leagueError) throw leagueError;

		// Insert scheduled pods using provided groups OR generate all combinations (backwards compatibility)
		let combinations: Player[][];
		if (podPlayerGroups) {
			combinations = podPlayerGroups;
		} else {
			// Fallback to old behavior for backwards compatibility
			combinations = this.generateCombinations(input.participants, 4);
		}

		if (combinations.length > 0) {
			const { error: scheduledError } = await supabase
				.from('scheduled_pods')
				.insert(
					combinations.map(combo => ({
						league_id: league.id,
						player_ids: combo.map(player => player.id)
					}))
				);

			if (scheduledError) throw scheduledError;
		}

		return league;
	}

	// ADD THIS NEW METHOD for updating status
	static async updateStatus(id: string, status: 'draft' | 'active' | 'completed'): Promise<void> {
		const { error } = await this.getClient()
			.from('leagues')
			.update({ status })
			.eq('id', id);

		if (error) throw error;
	}

	// Keep your existing private method
	private static generateCombinations(players: Player[], size: number): Player[][] {
		const combinations: Player[][] = [];

		function combine(start: number, combo: Player[]) {
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
		const { data, error } = await this.getClient()
			.from('scheduled_pods')
			.select('*')
			.eq('league_id', leagueId)
			.order('created_at');

		if (error) throw error;
		return data;
	}

	static async getUncompletedPods(leagueId: string): Promise<ScheduledPod[]> {
		const { data, error } = await this.getClient()
			.from('scheduled_pods')
			.select('*')
			.eq('league_id', leagueId)
			.is('completed_pod_id', null)
			.order('created_at');

		if (error) throw error;
		return data;
	}

	static async markPodComplete(scheduledPodId: string, completedPodId: string): Promise<void> {
		const { error } = await this.getClient()
			.from('scheduled_pods')
			.update({ completed_pod_id: completedPodId })
			.eq('id', scheduledPodId);

		if (error) throw error;
	}

	static async getPodsWithParticipants(leagueId: string): Promise<PodWithParticipants[]> {
		// Get all completed pods for this league
		const { data, error } = await this.getClient()
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

		return data;
	}

	static async update(id: string, updates: Partial<CreateLeagueInput>): Promise<League> {
		const { data, error } = await this.getClient()
			.from('leagues')
			.update(updates)
			.eq('id', id)
			.select()
			.single();

		if (error) throw error;
		return data;
	}

	static async delete(id: string): Promise<void> {
		const { error } = await this.getClient()
			.from('leagues')
			.delete()
			.eq('id', id);

		if (error) throw error;
	}
}