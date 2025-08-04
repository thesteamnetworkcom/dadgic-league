import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type ClientType = 'user' | 'service' | 'server-user';
interface ServerUserOptions {
  accessToken: string;
}
export class SupabaseClientFactory {
	private static clients: Map<ClientType, SupabaseClient> = new Map();

	static getClient(type: ClientType = 'user', options?: ServerUserOptions): SupabaseClient {
		if (!this.clients.has(type)) {
			this.clients.set(type, this.createClient(type, options));
		}
		return this.clients.get(type)!;
	}

	private static createClient(type: ClientType, options?: ServerUserOptions): SupabaseClient {
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
		if (type === 'server-user') {
			if (!options?.accessToken) {
				throw new Error('Access token required for server-user client');
			}

			const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
			if (!anonKey) {
				throw new Error('Supabase anonymous key not found for server-user client');
			}
			// Create client with user's access token for server-side use
			const client = createClient(url, anonKey, {
				auth: {
					autoRefreshToken: false,
					persistSession: false
				},
				global: {
					headers: {
						Authorization: `Bearer ${options.accessToken}`
					}
				}
			});

			return client;
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
	static getServerUserClient(accessToken: string): SupabaseClient {
		return this.getClient('server-user', { accessToken });
	}
}
