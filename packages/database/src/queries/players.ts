import { BaseQueries } from './base';
import type { ClientType } from '../client-factory';
import type { Player, PlayerInput } from '../types';

export class PlayerQueries extends BaseQueries {
	static async getAll(clientType: ClientType = 'user'): Promise<Player[]> {
		const supabase = this.getClient(clientType);

		try {
			const { data, error } = await supabase
				.from('players')
				.select('*')
				.order('name');

			if (error) {
				this.handleError(error, 'get all players');
			}

			return data as Player[];
		} catch (error) {
			this.handleError(error, 'get all players');
		}
	}

	static async create(input: PlayerInput, clientType: ClientType = 'user'): Promise<Player> {
		this.validateRequired(input.name, 'player name');

		const supabase = this.getClient(clientType);

		try {
			const { data, error } = await supabase
				.from('players')
				.insert({
					name: input.name,
					discord_id: input.discord_id,
					discord_username: input.discord_username
				})
				.select()
				.single();

			if (error) {
				this.handleError(error, 'create player');
			}

			return data as Player;
		} catch (error) {
			this.handleError(error, 'create player');
		}
	}

	static async findByDiscordId(
		discordId: string,
		clientType: ClientType = 'user'
	): Promise<Player | null> {
		try {
			this.validateRequired(discordId, 'discord id');

			const supabase = this.getClient(clientType);

			try {
				const { data, error } = await supabase
					.from('players')
					.select('*')
					.eq('discord_id', discordId)
					.single();

				if (error) {
					if (error.code === 'PGRST116') {
						return null; // Not found
					}
					this.handleError(error, 'find player by discord id');
				}

				return data as Player;
			} catch (error) {
				this.handleError(error, 'find player by discord id');
			}
		} catch (error) {
			if (error instanceof Error && error.message?.includes('discord id')) {
				console.log(`Note: "${discordId}" caused discord ID error, returning null`)
				return null;
			}
			this.handleError(error, 'find player by id');
		}
	}

	static async findByDiscordUsername(
		username: string,
		clientType: ClientType = 'user'
	): Promise<Player | null> {
		this.validateRequired(username, 'discord username');

		const supabase = this.getClient(clientType);

		try {
			const { data, error } = await supabase
				.from('players')
				.select('*')
				.eq('discord_username', username)
				.single();

			if (error) {
				if (error.code === 'PGRST116') {
					return null
				}
				this.handleError(error, 'find players by discord username');
				return null
			}

			return data as Player;
		} catch (error) {
			this.handleError(error, 'find players by discord username');
			return null
		}
	}

	static async findById(
		playerId: string,
		clientType: ClientType = 'user'
	): Promise<Player | null> {
		try {
			this.validateRequired(playerId, 'player id');

			const supabase = this.getClient(clientType);

			try {
				const { data, error } = await supabase
					.from('players')
					.select('*')
					.eq('id', playerId)
					.single();

				if (error) {
					if (error.code === 'PGRST116') {
						return null; // Not found
					}
					this.handleError(error, 'find player by id');
				}

				return data as Player;
			} catch (error) {
				this.handleError(error, 'find player by id');
			}
		} catch (error) {
			if (error instanceof Error && error.message?.includes('uuid')) {
				console.log(`Note: "${playerId}" caused UUID error, returning null`)
				return null;
			}
			this.handleError(error, 'find player by id');
		}
	}

	static async list(filters: {
		search?: string
		limit?: number
		offset?: number
	} = {}, clientType: ClientType = 'user'): Promise<Player[]> {
		const supabase = this.getClient(clientType);

		try {
			let query = supabase
				.from('players')
				.select('*');

			// Add search filter if provided
			if (filters.search && filters.search.trim().length > 0) {
				const searchTerm = filters.search.trim();
				query = query.or(`name.ilike.%${searchTerm}%,discord_username.ilike.%${searchTerm}%`);
			}

			// Add pagination
			if (filters.limit) {
				query = query.limit(filters.limit);
			}

			if (filters.offset) {
				query = query.range(filters.offset, (filters.offset + (filters.limit || 100)) - 1);
			}

			// Always order by name for consistent results
			query = query.order('name');

			const { data, error } = await query;

			if (error) {
				this.handleError(error, 'list players');
			}

			return data as Player[];
		} catch (error) {
			this.handleError(error, 'list players');
		}
	}

	static async update(
		playerId: string,
		updates: Partial<PlayerInput>,
		clientType: ClientType = 'user'
	): Promise<Player> {
		this.validateRequired(playerId, 'player id');

		const supabase = this.getClient(clientType);
		console.log(updates);
		try {
			const { data, error } = await supabase
				.from('players')
				.update(updates)
				.eq('id', playerId)
				.select()
				.single();

			if (error) {
				this.handleError(error, 'update player');
			}

			return data as Player;
		} catch (error) {
			this.handleError(error, 'update player');
		}
	}
}
