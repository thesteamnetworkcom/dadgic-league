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
    static async isCurrentUserAdmin(userId?: string): Promise<boolean> {
    console.log('Current user from auth:', userId);
    if (!userId) return false;
  
    const { data, error } = await this.getClient()
      .from('players')
      .select('role, id, name')
      .eq('id', userId) // ← Change this line
      .single();
  
    console.log('Player lookup result:', data, error);
    if (error) return false;
    return data?.role === 'admin';
  }
}


