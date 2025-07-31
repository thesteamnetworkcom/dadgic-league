import { BaseQueries } from './base';
import type { ClientType } from '../client-factory';
import type {
	Pod,
	PodWithParticipants,
	PodResolved,
} from '../types';

export class PodQueries extends BaseQueries {
	static async create(input: PodResolved, clientType: ClientType = 'user'): Promise<Pod> {
		//this.validateRequired(input.league_id, 'league_id');
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
					notes: input.notes,
					participant_count: input.participants.length
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

			return pod;
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

	static async getById(id: string, clientType: ClientType = 'user'): Promise<Pod | null> {
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

	static async list(
		filters: {
			playerId?: string           // Single player (backward compatibility)
			playerIds?: string[]        // Multiple players 
			playerMatchType?: 'any' | 'all'  // How to match multiple players (default: 'any')
			leagueId?: string          // Single league (backward compatibility)
			leagueIds?: string[]       // Multiple leagues
			dateFrom?: string
			dateTo?: string
			limit?: number
			offset?: number
		} = {},
		clientType: ClientType = 'user'
	): Promise<PodWithParticipants[]> {
		const supabase = this.getClient(clientType);

		let query = supabase
			.from('pods')
			.select(`
      *,
      participants:pod_participants(
        *,
        player:players(*)
      )
    `);

		// League filtering (supports both single and multiple)
		const leagueIds = filters.leagueIds || (filters.leagueId ? [filters.leagueId] : null);
		if (leagueIds && leagueIds.length > 0) {
			if (leagueIds.length === 1) {
				query = query.eq('league_id', leagueIds[0]);
			} else {
				query = query.in('league_id', leagueIds);
			}
		}

		// Date filtering
		if (filters.dateFrom) {
			query = query.gte('date', filters.dateFrom);
		}

		if (filters.dateTo) {
			query = query.lte('date', filters.dateTo);
		}

		// Player filtering (supports both single and multiple)
		const playerIds = filters.playerIds || (filters.playerId ? [filters.playerId] : null);
		if (playerIds && playerIds.length > 0) {
			const matchType = filters.playerMatchType || 'any';

			if (matchType === 'any') {
				// Find pods where ANY of these players participated
				const { data: podParticipants, error: participantsError } = await supabase
					.from('pod_participants')
					.select('pod_id')
					.in('player_id', playerIds);

				if (participantsError) throw participantsError;

				const podIds = [...new Set(podParticipants.map(p => p.pod_id))]; // Remove duplicates

				if (podIds.length === 0) {
					// No pods found for these players - return empty result early
					return [];
				}

				query = query.in('id', podIds);
			} else if (matchType === 'all') {
				// Find pods where ALL of these players participated together
				const { data: podParticipants, error: participantsError } = await supabase
					.from('pod_participants')
					.select('pod_id, player_id')
					.in('player_id', playerIds);

				if (participantsError) throw participantsError;

				// Group by pod_id and count unique players per pod
				const podPlayerCounts = new Map<string, Set<string>>();

				podParticipants.forEach(participant => {
					if (!podPlayerCounts.has(participant.pod_id)) {
						podPlayerCounts.set(participant.pod_id, new Set());
					}
					podPlayerCounts.get(participant.pod_id)!.add(participant.player_id);
				});

				// Find pods that have ALL the specified players
				const podIds = Array.from(podPlayerCounts.entries())
					.filter(([podId, playerSet]) => playerSet.size === playerIds.length)
					.map(([podId]) => podId);

				if (podIds.length === 0) {
					return [];
				}

				query = query.in('id', podIds);
			}
		}

		// Apply ordering
		query = query.order('date', { ascending: false });

		// Apply pagination
		if (filters.limit) {
			query = query.limit(filters.limit);
		}

		if (filters.offset) {
			query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
		}

		const { data, error } = await query;

		if (error) throw error;

		let results = data as PodWithParticipants[];

		// Post-process for 'all' player matching if needed
		if (playerIds && playerIds.length > 1 && filters.playerMatchType === 'all') {
			results = results.filter(pod => {
				const podPlayerIds = pod.participants.map(p => p.player_id);
				return playerIds.every(playerId => podPlayerIds.includes(playerId));
			});
		}

		return results;
	}

	static async delete(id: string, clientType: ClientType = 'user'): Promise<void> {
		this.validateRequired(id, "Pod ID");
		const supabase = this.getClient(clientType);

		// Note: Supabase will handle cascading deletes for pod_participants
		// if you have foreign key constraints set up with CASCADE
		const { error } = await supabase
			.from('pods')
			.delete()
			.eq('id', id);

		if (error) throw error;
	}
}
