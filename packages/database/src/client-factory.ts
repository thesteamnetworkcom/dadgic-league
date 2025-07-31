import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type ClientType = 'user' | 'service';

export class SupabaseClientFactory {
	private static clients: Map<ClientType, SupabaseClient> = new Map();

	static getClient(type: ClientType = 'user'): SupabaseClient {
		if (!this.clients.has(type)) {
			this.clients.set(type, this.createClient(type));
		}
		return this.clients.get(type)!;
	}

	private static createClient(type: ClientType): SupabaseClient {
		const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;

		if (!url) {
			throw new Error('Supabase URL not found in environment variables');
		}

		if (type === 'service') {
			const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
			if (!serviceKey) {
				throw new Error('Service role key required for service client');
			}

			return createClient(url, serviceKey, {
				auth: {
					autoRefreshToken: false,
					persistSession: false
				}
			});
		}

		// User client
		const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
		if (!anonKey) {
			throw new Error('Supabase anonymous key not found in environment variables');
		}

		return createClient(url, anonKey);
	}

	// Utility method to clear cached clients (useful for testing)
	static clearClients(): void {
		this.clients.clear();
	}

	// Health check method
	static async healthCheck(type: ClientType = 'user'): Promise<boolean> {
		try {
			const client = this.getClient(type);
			const { error } = await client.from('players').select('id').limit(1);
			return !error;
		} catch (error) {
			console.error(`Health check failed for ${type} client:`, error);
			return false;
		}
	}
}
