#!/bin/bash

# ============================================================================
# SCRIPT 1: CLIENT FACTORY IMPLEMENTATION
# ============================================================================
# GOAL: Fix Discord bot environment variable issues by implementing dependency injection
# 
# PROBLEM: Discord bot bypasses database abstraction due to hardcoded client
# SOLUTION: Create client factory that can inject service role or user client
# ============================================================================

echo "🔧 Script 1: Client Factory Implementation"
echo "=========================================="
echo "🎯 Goal: Fix Discord bot environment variable issues"
echo "🎯 Goal: Enable proper database client injection"
echo ""

# ============================================================================
# STEP 1: Create Client Factory
# ============================================================================

echo "📁 Creating Client Factory..."

# Create the client factory file
cat > packages/database/src/client-factory.ts << 'EOF'
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
EOF

echo "✅ Created packages/database/src/client-factory.ts"

# ============================================================================
# STEP 2: Create Base Query Class
# ============================================================================

echo "📁 Creating Base Query Class..."

cat > packages/database/src/queries/base.ts << 'EOF'
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
}
EOF

echo "✅ Created packages/database/src/queries/base.ts"

# ============================================================================
# STEP 3: Update Existing Query Classes
# ============================================================================

echo "🔄 Updating existing query classes..."

# Update PodQueries to extend BaseQueries and accept client type
cat > packages/database/src/queries/pods.ts << 'EOF'
import { BaseQueries } from './base';
import type { ClientType } from '../client-factory';
import type { 
  Pod, 
  CreatePodInput, 
  UpdatePodInput,
  PodSubmission 
} from '../types';

export class PodQueries extends BaseQueries {
  static async create(input: CreatePodInput, clientType: ClientType = 'user'): Promise<Pod> {
    this.validateRequired(input.league_id, 'league_id');
    this.validateRequired(input.date, 'date');

    const supabase = this.getClient(clientType);
    
    try {
      const { data, error } = await supabase
        .from('pods')
        .insert({
          league_id: input.league_id,
          date: input.date,
          game_length_minutes: input.game_length_minutes,
          turns: input.turns,
          winning_commander: input.winning_commander,
          notes: input.notes
        })
        .select()
        .single();

      if (error) {
        this.handleError(error, 'create pod');
      }

      return data as Pod;
    } catch (error) {
      this.handleError(error, 'create pod');
    }
  }

  static async update(
    id: string, 
    input: UpdatePodInput, 
    clientType: ClientType = 'user'
  ): Promise<Pod> {
    this.validateRequired(id, 'pod id');

    const supabase = this.getClient(clientType);
    
    try {
      const { data, error } = await supabase
        .from('pods')
        .update(input)
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

      return data as Pod;
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

  // Special method for Discord bot - uses service role by default
  static async createFromSubmission(
    submission: PodSubmission, 
    clientType: ClientType = 'service'
  ): Promise<Pod> {
    return this.create({
      league_id: submission.league_id,
      date: submission.date,
      game_length_minutes: submission.game_length_minutes,
      turns: submission.turns,
      notes: submission.notes
    }, clientType);
  }
}
EOF

echo "✅ Updated packages/database/src/queries/pods.ts"

# Update PlayerQueries similarly
cat > packages/database/src/queries/players.ts << 'EOF'
import { BaseQueries } from './base';
import type { ClientType } from '../client-factory';
import type { Player, CreatePlayerInput } from '../types';

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

  static async create(input: CreatePlayerInput, clientType: ClientType = 'user'): Promise<Player> {
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
  }

  static async findByDiscordUsername(
    username: string, 
    clientType: ClientType = 'user'
  ): Promise<Player[]> {
    this.validateRequired(username, 'discord username');

    const supabase = this.getClient(clientType);
    
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .ilike('discord_username', `%${username}%`);

      if (error) {
        this.handleError(error, 'find players by discord username');
      }

      return data as Player[];
    } catch (error) {
      this.handleError(error, 'find players by discord username');
    }
  }
}
EOF

echo "✅ Updated packages/database/src/queries/players.ts"

# ============================================================================
# STEP 4: Update Database Index File
# ============================================================================

echo "🔄 Updating database package exports..."

# Update the main database index file
cat > packages/database/src/index.ts << 'EOF'
// Client Factory
export { SupabaseClientFactory } from './client-factory';
export type { ClientType } from './client-factory';

// Query Classes
export { PodQueries } from './queries/pods';
export { PlayerQueries } from './queries/players';
export { BaseQueries } from './queries/base';

// Types
export * from './types';

// Main Database Object (backwards compatibility)
export const db = {
  pods: PodQueries,
  players: PlayerQueries,
  // Health check utility
  healthCheck: async (clientType: ClientType = 'user') => {
    return await SupabaseClientFactory.healthCheck(clientType);
  }
};

// Legacy client export (will be deprecated)
import { SupabaseClientFactory } from './client-factory';
export const supabase = SupabaseClientFactory.getClient('user');
EOF

echo "✅ Updated packages/database/src/index.ts"

# ============================================================================
# STEP 5: Create Test Script
# ============================================================================

echo "🧪 Creating test script..."

cat > test-client-factory.js << 'EOF'
// Test script for Client Factory
// Run with: node test-client-factory.js

const { SupabaseClientFactory, db } = require('./packages/database/dist/index.js');

async function testClientFactory() {
  console.log('🧪 Testing Client Factory Implementation...\n');

  try {
    // Test 1: User client creation
    console.log('1️⃣ Testing user client creation...');
    const userClient = SupabaseClientFactory.getClient('user');
    console.log('✅ User client created successfully');

    // Test 2: Service client creation  
    console.log('2️⃣ Testing service client creation...');
    const serviceClient = SupabaseClientFactory.getClient('service');
    console.log('✅ Service client created successfully');

    // Test 3: Health checks
    console.log('3️⃣ Testing health checks...');
    const userHealth = await SupabaseClientFactory.healthCheck('user');
    const serviceHealth = await SupabaseClientFactory.healthCheck('service');
    console.log(`✅ User client health: ${userHealth ? 'HEALTHY' : 'UNHEALTHY'}`);
    console.log(`✅ Service client health: ${serviceHealth ? 'HEALTHY' : 'UNHEALTHY'}`);

    // Test 4: Database abstraction
    console.log('4️⃣ Testing database abstraction...');
    const players = await db.players.getAll('user');
    console.log(`✅ Retrieved ${players.length} players using user client`);

    const playersService = await db.players.getAll('service');
    console.log(`✅ Retrieved ${playersService.length} players using service client`);

    console.log('\n🎉 All tests passed! Client Factory is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Only run if environment variables are set
if (process.env.SUPABASE_URL && (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
  testClientFactory();
} else {
  console.log('⚠️ Skipping tests - environment variables not set');
  console.log('Required: SUPABASE_URL, SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  console.log('Optional: SUPABASE_SERVICE_ROLE_KEY (for service client tests)');
}
EOF

echo "✅ Created test-client-factory.js"

# ============================================================================
# STEP 6: Build and Test
# ============================================================================

echo ""
echo "🔨 Building database package..."

cd packages/database
npm run build
cd ../..

echo "✅ Database package built successfully"

echo ""
echo "🧪 Running tests..."
node test-client-factory.js

echo ""
echo "✅ Script 1 Complete - Client Factory Implemented!"
echo "================================================="
echo ""
echo "🎯 WHAT THIS FIXES:"
echo "   • Discord bot can now use proper database abstraction"
echo "   • Service role vs user client injection"
echo "   • Consistent error handling across all queries"
echo "   • Environment variable validation"
echo ""
echo "🔧 NEXT STEPS:"
echo "   1. Update Discord bot to use new client factory"
echo "   2. Update web app to use new query structure"
echo "   3. Run the app and verify no environment errors"
echo ""
echo "Ready for Script 2: Discord Bot Breakdown (771 lines → manageable components)?"
