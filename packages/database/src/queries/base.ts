import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseClientFactory, ClientType } from '../client-factory';

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

  // ADD THIS NEW METHOD for admin check
    static async isCurrentUserAdmin(): Promise<boolean> {
    const { data: { user } } = await this.getClient().auth.getUser();
    console.log('Current user from auth:', user);
    if (!user) return false;
  
    const { data, error } = await this.getClient()
      .from('players')
      .select('role, id, name')
      .eq('discord_id', user.user_metadata?.provider_id) // ← Change this line
      .single();
  
    console.log('Player lookup result:', data, error);
    if (error) return false;
    return data?.role === 'admin';
  }
}


