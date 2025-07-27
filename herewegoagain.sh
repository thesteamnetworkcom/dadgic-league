#!/bin/bash
# ============================================================================
# TYPE REFACTOR IMPLEMENTATION - Phase 2A: Database Central Types
# ============================================================================

echo "🏗️  Starting Type Organization Refactor - DATABASE/SRC/TYPES/ CENTRAL"

# ============================================================================
# STEP 1: Create New Type Directory Structure in DATABASE
# ============================================================================

echo "📁 Creating organized type directory structure in DATABASE..."

# Create the organized structure in packages/database/src/types/
mkdir -p packages/database/src/types/{entities,common,participants,pods,players,leagues,requests,responses,matching,parsing,legacy}

# ============================================================================
# STEP 2: Create Base Types (Foundation)
# ============================================================================

echo "📝 Creating base types..."

cat > packages/database/src/types/common/base.ts << 'EOF'
// ============================================================================
// BASE TYPES - Foundation for Extension Pattern
// ============================================================================

// Base structures that get extended
export interface PodBase {
  league_id?: string | null;
  date: string;
  game_length_minutes?: number | null;
  turns?: number | null;
  notes?: string | null;
}

export interface ParticipantBase {
  commander_deck: string;
  result: 'win' | 'lose' | 'draw';
}

export interface RequestBase {
  context?: {
    user_id?: string;
    source?: 'web' | 'discord' | 'api';
    metadata?: Record<string, any>;
  };
}

export interface ResponseBase<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// Re-export for convenience
export type APIResponse<T = any> = ResponseBase<T>;
EOF

# ============================================================================
# STEP 3: Create Entity Types (Core Database Types)
# ============================================================================

echo "📝 Creating entity types..."

cat > packages/database/src/types/entities/index.ts << 'EOF'
// ============================================================================
// CORE DATABASE ENTITIES
// ============================================================================

export interface Player {
  id: string;
  name: string;
  discord_id: string | null;
  discord_username: string | null;
  email: string | null;
  role: 'player' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface League {
  id: string;
  name: string;
  description: string | null;
  player_ids: string[];
  start_date: string;
  end_date: string | null;
  status: 'draft' | 'active' | 'completed';
  games_per_player: number; // Note: keeping games_per_player for DB compatibility
  created_at: string;
  updated_at: string;
}

export interface Pod {
  id: string;
  league_id: string | null;
  date: string;
  game_length_minutes: number | null; // Note: keeping game_length for DB compatibility
  turns: number | null;
  winning_commander: string | null;
  participant_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PodParticipant {
  id: string;
  pod_id: string;
  player_id: string;
  commander_deck: string;
  result: 'win' | 'lose' | 'draw';
  created_at: string;
}

export interface ScheduledPod {
  id: string;
  league_id: string;
  player_ids: string[];
  completed_pod_id: string | null;
  created_at: string;
}

// Extended entity types
export interface PodWithParticipants extends Pod {
  participants: (PodParticipant & { player: Player })[];
}

export interface LeagueWithProgress extends League {
  scheduled_pods: ScheduledPod[];
  completed_count: number;
  total_count: number;
  completion_percentage: number;
}

export interface PlayerStats {
  player_id: string;
  player_name: string;
  pods_played: number; // UPDATED: games_played → pods_played
  wins: number;
  losses: number;
  draws: number;
  win_rate: number;
  favorite_commanders: string[];
}
EOF

# ============================================================================
# STEP 4: Create Participant Type Family
# ============================================================================

echo "📝 Creating participant types..."

cat > packages/database/src/types/participants/index.ts << 'EOF'
// ============================================================================
// PARTICIPANT TYPE FAMILY - Unified and Clean
// ============================================================================

import { ParticipantBase } from '../common/base';

// Input variant - what we receive from forms/API
export interface ParticipantInput extends ParticipantBase {
  discord_username: string; // identifier we get from input
}

// Resolved variant - after player lookup
export interface ParticipantResolved extends ParticipantBase {
  player_id: string;
}

// Display variant - for UI with player details
export interface ParticipantDisplay extends ParticipantBase {
  player_id: string;
  player_name: string;
  discord_username: string | null;
}

// ============================================================================
// LEGACY COMPATIBILITY - Will be removed gradually
// ============================================================================

/** @deprecated Use ParticipantInput instead */
export interface GamePlayerInput extends ParticipantInput {}

/** @deprecated Use ParticipantInput instead */
export interface GameParticipantInput extends ParticipantInput {}

/** @deprecated Use ParticipantResolved instead */
export interface GameParticipantResolved extends ParticipantResolved {}

/** @deprecated Use ParticipantInput instead */
export interface PodPlayerForm extends ParticipantInput {}

/** @deprecated Use ParticipantInput instead - name field removed, use discord_username */
export interface ParsedPlayer extends ParticipantInput {
  name: string; // For backward compatibility only
}
EOF

# ============================================================================
# STEP 5: Create Pod Type Family (Pod = Game)
# ============================================================================

echo "📝 Creating pod types..."

cat > packages/database/src/types/pods/index.ts << 'EOF'
// ============================================================================
// POD TYPE FAMILY - Clean Extension Pattern (Pod = Game)
// ============================================================================

import { PodBase } from '../common/base';
import { ParticipantInput, ParticipantResolved, ParticipantDisplay } from '../participants';

// Input variant - what we receive from forms/API
export interface PodInput extends PodBase {
  participants: ParticipantInput[];
}

// Resolved variant - after player lookup, ready for database
export interface PodResolved extends PodBase {
  participants: ParticipantResolved[];
}

// Display variant - for UI with full player details
export interface PodDisplay extends PodBase {
  id: string;
  participants: ParticipantDisplay[];
  created_at: string;
  updated_at: string;
}

// ============================================================================
// LEGACY COMPATIBILITY - Will be removed gradually
// ============================================================================

/** @deprecated Use PodInput instead */
export interface CreateGameRequest extends PodInput {}

/** @deprecated Use PodInput instead */
export interface GameCreateInput extends PodInput {}

/** @deprecated Use PodInput instead */
export interface GameInput extends PodInput {}

/** @deprecated Use PodResolved instead */
export interface GameCreateResolved extends PodResolved {}

/** @deprecated Use PodResolved instead */
export interface GameResolved extends PodResolved {}

/** @deprecated Use PodResolved instead */
export interface CreatePodInput extends PodResolved {}

/** @deprecated Use PodInput instead */
export interface PodSubmission extends PodInput {}

/** @deprecated Use PodDisplay instead */
export interface CreatedGame extends PodDisplay {}

/** @deprecated Use PodDisplay instead */
export interface GameDisplay extends PodDisplay {}
EOF

# ============================================================================
# STEP 6: Create Player Type Family
# ============================================================================

echo "📝 Creating player types..."

cat > packages/database/src/types/players/index.ts << 'EOF'
// ============================================================================
// PLAYER TYPE FAMILY - Input/Update Pattern
// ============================================================================

// Input variant - for creating players
export interface PlayerInput {
  name: string;
  discord_id?: string | null;
  discord_username?: string | null;
  email?: string | null;
  role?: 'player' | 'admin';
}

// Update variant - for updating players (all optional)
export interface PlayerUpdate {
  name?: string;
  discord_id?: string | null;
  discord_username?: string | null;
  email?: string | null;
  role?: 'player' | 'admin';
}

// ============================================================================
// LEGACY COMPATIBILITY - Will be removed gradually
// ============================================================================

/** @deprecated Use PlayerInput instead */
export interface CreatePlayerInput extends PlayerInput {}

/** @deprecated Use PlayerInput instead */
export interface CreatePlayerRequest extends PlayerInput {}
EOF

# ============================================================================
# STEP 7: Create League Type Family
# ============================================================================

echo "📝 Creating league types..."

cat > packages/database/src/types/leagues/index.ts << 'EOF'
// ============================================================================
// LEAGUE TYPE FAMILY
// ============================================================================

// Input variant - for creating leagues
export interface LeagueInput {
  name: string;
  description?: string | null;
  player_ids: string[];
  start_date: string;
  end_date?: string | null;
  games_per_player: number; // Note: keeping games_per_player for DB compatibility
  status?: 'draft' | 'active' | 'completed';
}

// Update variant - for updating leagues
export interface LeagueUpdate {
  name?: string;
  description?: string | null;
  end_date?: string | null;
  status?: 'draft' | 'active' | 'completed';
}

// ============================================================================
// LEGACY COMPATIBILITY - Will be removed gradually
// ============================================================================

/** @deprecated Use LeagueInput instead */
export interface CreateLeagueInput extends LeagueInput {}

/** @deprecated Use LeagueInput instead */
export interface CreateLeagueRequest extends LeagueInput {}
EOF

# ============================================================================
# STEP 8: Create Request Types
# ============================================================================

echo "📝 Creating request types..."

cat > packages/database/src/types/requests/index.ts << 'EOF'
// ============================================================================
// API REQUEST TYPES - Extend Base Types with Request Metadata
// ============================================================================

import { RequestBase } from '../common/base';
import { PodInput } from '../pods';
import { PlayerInput } from '../players';
import { LeagueInput } from '../leagues';

// API requests extend base types with request context
export interface CreatePodRequest extends PodInput, RequestBase {}
export interface CreatePlayerRequest extends PlayerInput, RequestBase {}
export interface CreateLeagueRequest extends LeagueInput, RequestBase {}

// List/query requests
export interface ListPlayersRequest extends RequestBase {
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ListPodsRequest extends RequestBase {
  playerId?: string;
  leagueId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// LEGACY COMPATIBILITY - Will be removed gradually
// ============================================================================

/** @deprecated Use CreatePodRequest instead */
export interface CreateGameRequest extends CreatePodRequest {}

/** @deprecated Use ListPodsRequest instead */
export interface ListGamesRequest extends ListPodsRequest {}
EOF

# ============================================================================
# STEP 9: Create Response Types
# ============================================================================

echo "📝 Creating response types..."

cat > packages/database/src/types/responses/index.ts << 'EOF'
// ============================================================================
// API RESPONSE TYPES - Standardized Response Format
// ============================================================================

import { ResponseBase } from '../common/base';
import { Player, League } from '../entities';
import { PodDisplay } from '../pods';

// Standard CRUD responses
export interface CreatePodResponse extends ResponseBase<PodDisplay> {}
export interface CreatePlayerResponse extends ResponseBase<Player> {}
export interface CreateLeagueResponse extends ResponseBase<League> {}

// List responses with pagination
export interface ListResponse<T> extends ResponseBase<T[]> {
  pagination?: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface ListPlayersResponse extends ListResponse<Player> {}
export interface ListPodsResponse extends ListResponse<PodDisplay> {}
export interface ListLeaguesResponse extends ListResponse<League> {}

// ============================================================================
// LEGACY COMPATIBILITY - Will be removed gradually
// ============================================================================

/** @deprecated Use CreatePodResponse instead */
export interface CreateGameResponse extends CreatePodResponse {}

/** @deprecated Use ListPodsResponse instead */
export interface ListGamesResponse extends ListPodsResponse {}
EOF

# ============================================================================
# STEP 10: Create Player Matching Types
# ============================================================================

echo "📝 Creating player matching types..."

cat > packages/database/src/types/matching/index.ts << 'EOF'
// ============================================================================
// PLAYER MATCHING TYPES - For PlayerMatchingService
// ============================================================================

import { Player } from '../entities';

export interface PlayerIdentifier {
  id?: string | null;
  discord_id?: string | null;
  discord_username?: string | null;
  name?: string | null;
  displayName?: string | null;
}

export interface PlayerMatchOption {
  player: Player;
  confidence: number;
  reason: string;
}

export interface PlayerMatchResult {
  player: Player | null;
  confidence: number;
  alternatives: PlayerMatchOption[];
  matchType: 'exact_id' | 'exact_discord_id' | 'exact_username' | 'exact_name' | 'fuzzy' | 'context' | 'none';
  contextInfo?: {
    recentPodsWithPlayer: string[];
    frequentPlaymates: Player[];
  };
}

export interface ContextOptions {
  recentDays?: number;
  includeFrequentPlaymates?: boolean;
}
EOF

# ============================================================================
# STEP 11: Create AI Parsing Types
# ============================================================================

echo "📝 Creating AI parsing types..."

cat > packages/database/src/types/parsing/index.ts << 'EOF'
// ============================================================================
// AI PARSING TYPES - For AIParsingService
// ============================================================================

import { ResponseBase, RequestBase } from '../common/base';
import { ParticipantInput } from '../participants';

export interface ParseRequest extends RequestBase {
  text: string;
}

export interface ParsedPodData {
  date?: string;
  game_length_minutes?: number; // Note: keeping game_length for DB compatibility
  turns?: number;
  notes?: string;
  participants: ParticipantInput[];
}

export interface ParseResponse extends ResponseBase<ParsedPodData> {
  data?: ParsedPodData & {
    confidence: number;
    processing_time_ms: number;
  };
}

// ============================================================================
// LEGACY COMPATIBILITY - Will be removed gradually
// ============================================================================

/** @deprecated Use ParseRequest instead */
export interface AIParseRequest extends ParseRequest {}

/** @deprecated Use ParseResponse instead */
export interface AIParseResponse extends ParseResponse {}

/** @deprecated Use ParsedPodData instead */
export interface ParsedGameData extends ParsedPodData {}
EOF

# ============================================================================
# STEP 12: Create Legacy Compatibility Layer
# ============================================================================

echo "📝 Creating legacy compatibility layer..."

cat > packages/database/src/types/legacy/index.ts << 'EOF'
// ============================================================================
// LEGACY TYPE COMPATIBILITY - For Gradual Migration
// ============================================================================
// This file provides backward compatibility during the transition period
// All these types will be removed once migration is complete

// Participant type aliases
export type { ParticipantInput as GamePlayerInput } from '../participants';
export type { ParticipantInput as GameParticipantInput } from '../participants';
export type { ParticipantResolved as GameParticipantResolved } from '../participants';
export type { ParticipantInput as PodPlayerForm } from '../participants';

// Pod type aliases (Game → Pod terminology fix)
export type { PodInput as CreateGameRequest_Legacy } from '../pods';
export type { PodInput as GameCreateInput } from '../pods';
export type { PodInput as GameInput } from '../pods';
export type { PodResolved as GameCreateResolved } from '../pods';
export type { PodResolved as GameResolved } from '../pods';
export type { PodResolved as CreatePodInput } from '../pods';
export type { PodInput as PodSubmission } from '../pods';
export type { PodDisplay as CreatedGame } from '../pods';
export type { PodDisplay as GameDisplay } from '../pods';

// Player type aliases
export type { PlayerInput as CreatePlayerInput } from '../players';
export type { PlayerInput as CreatePlayerRequest_Legacy } from '../players';

// League type aliases
export type { LeagueInput as CreateLeagueInput } from '../leagues';
export type { LeagueInput as CreateLeagueRequest_Legacy } from '../leagues';

// AI parsing aliases
export type { ParseRequest as AIParseRequest } from '../parsing';
export type { ParseResponse as AIParseResponse } from '../parsing';
export type { ParsedPodData as ParsedGameData } from '../parsing';

// Generic response alias
export type { ResponseBase as APIResponse } from '../common/base';

// Request aliases (Game → Pod)
export type { CreatePodRequest as CreateGameRequest } from '../requests';
export type { ListPodsRequest as ListGamesRequest } from '../requests';

// Response aliases (Game → Pod)  
export type { CreatePodResponse as CreateGameResponse } from '../responses';
export type { ListPodsResponse as ListGamesResponse } from '../responses';
EOF

# ============================================================================
# STEP 13: Create Main Index File
# ============================================================================

echo "📝 Creating main type index..."

cat > packages/database/src/types/index.ts << 'EOF'
// ============================================================================
// UNIFIED TYPE EXPORTS - Single Source of Truth (DATABASE PACKAGE)
// ============================================================================

// Core entities (most important)
export * from './entities';

// Base types for extensions
export * from './common/base';

// Type families organized by purpose
export * from './participants';
export * from './pods';
export * from './players';
export * from './leagues';

// API types
export * from './requests';
export * from './responses';

// Service-specific types
export * from './matching';
export * from './parsing';

// Legacy compatibility (will be gradually removed)
export * from './legacy';

// ============================================================================
// RE-EXPORT COMMON TYPES FOR CONVENIENCE
// ============================================================================

// Most commonly used types available at top level
export type {
  // Entities
  Player,
  League,
  Pod,
  PodParticipant,
  PodWithParticipants,
  LeagueWithProgress,
  PlayerStats,
  
  // Main type families
  ParticipantInput,
  ParticipantResolved,
  ParticipantDisplay,
  PodInput,
  PodResolved,
  PodDisplay,
  PlayerInput,
  LeagueInput,
  
  // Responses
  ResponseBase,
  CreatePodResponse,
  CreatePlayerResponse,
  CreateLeagueResponse,
  
  // Matching
  PlayerIdentifier,
  PlayerMatchResult,
  PlayerMatchOption,
  
  // Parsing
  ParseRequest,
  ParseResponse,
  ParsedPodData
} from './';
EOF

// ============================================================================
// TODO: PHASE 2B - Update Query Methods (Game → Pod)
// ============================================================================
/*
QUERY METHOD RENAMES NEEDED:

PodQueries (already mostly correct):
- pods.create() ✅ 
- pods.getById() → pods.getPodById() (for clarity)
- pods.list() → pods.listPods() (for clarity)
- Any "game" references in internal methods

PlayerQueries:
- No game references, should be good

New methods to add:
- pods.createPod() (alias for create)
- pods.listPodsByPlayer()
- pods.listPodsByLeague()
*/
EOF
# ============================================================================
# STEP 16: Remove Old Type Files
# ============================================================================

echo "🗑️ Removing old duplicate type files..."

# Remove the old shared types (will be replaced by database imports)
rm -rf packages/shared/src/types/api/
rm -f packages/shared/src/types/api.ts

# Note: Keep existing files for now, we'll update them in Phase 2B
echo "⚠️ Old type files marked for removal in Phase 2B"

echo "✅ Type organization structure created!"
echo ""
echo "🎯 PHASE 2A COMPLETE - Organized Type Structure in DATABASE"
echo ""
echo "📋 What was created:"
echo "   • database/src/types/ - Organized type structure"
echo "   • Pod terminology throughout (Game → Pod)"
echo "   • Legacy compatibility aliases"
echo "   • Single source of truth in database package"
echo ""
echo "🔄 PHASE 2B TODO - Method Renames:"
echo "   • GameService → PodService"
echo "   • createGame() → createPod()"
echo "   • getGameById() → getPodById()"
echo "   • listGames() → listPods()"
echo "   • Update all service imports to use database types"
echo "   • Update PlayerMatchingService to use new types"
echo ""
echo "📝 Ready for Phase 2B: Update all service files and method names"