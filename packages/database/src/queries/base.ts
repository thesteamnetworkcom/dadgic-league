import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseClientFactory, ClientType } from '../client-factory';
import { DatabaseAuthContext } from '../types/api';

export abstract class BaseQueries {
	protected static getClient(type: ClientType = 'user'): SupabaseClient {
		return SupabaseClientFactory.getClient(type);
	}

	// Helper method for error handling
	protected static handleError(error: any, operation: string): never {
		console.error(`Database error in ${operation}:`, error);
		throw new Error(`${operation} failed: ${error.message || 'Unknown error'}`);
	}

	// Helper method for null/undefined checks
	protected static validateRequired(value: any, fieldName: string): void {
		if (value === null || value === undefined || value === '') {
			throw new Error(`${fieldName} is required`);
		}
	}

	protected static async setUserContext(authContext?: DatabaseAuthContext): Promise<void> {
		if (!authContext) return

		// Set RLS context for current user
		const client = this.getClient('user')
		// Note: This depends on your RLS setup - may need specific implementation
	}

	// ADD THIS NEW METHOD for admin check
	static async isCurrentUserAdmin(authContext?: DatabaseAuthContext): Promise<boolean> {
		if (!authContext) return false
		return authContext.is_admin
	}
}


