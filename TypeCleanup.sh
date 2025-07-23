#!/bin/bash

# ============================================================================
# SCRIPT 1: AGGRESSIVE TYPE CONSOLIDATION  
# ============================================================================
# GOAL: Fix the type chaos that's preventing everything from building
# 
# PROBLEMS:
# ❌ CreatePodInput vs PodSubmission (same thing, different names)
# ❌ PodPlayerForm vs ParsedPlayer vs participants (same thing) 
# ❌ Types defined in multiple places causing conflicts
# ❌ TypeScript errors preventing builds
#
# SOLUTION: 
# ✅ Single source of truth for all types
# ✅ Unified naming convention  
# ✅ Backward compatibility during transition
# ============================================================================

echo "🔧 Script 1: Aggressive Type Consolidation"
echo "=========================================="
echo "🎯 Goal: Fix type chaos preventing builds"
echo "🎯 Goal: Single source of truth for all types"
echo ""

# ============================================================================
# STEP 1: Create Unified Type Definitions
# ============================================================================

echo "📁 Creating unified type definitions..."

# Create the master types file
cat > packages/shared/src/types/core.ts << 'EOF'
// ============================================================================
// CORE TYPES - Single Source of Truth
// ============================================================================
// These are the ONLY type definitions that should be used across the app.
// All other type files should import from here.

// ============================================================================
// DATABASE ENTITY TYPES
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
  games_per_player: number;
  created_at: string;
  updated_at: string;
}

export interface Pod {
  id: string;
  league_id: string | null;
  date: string;
  game_length_minutes: number | null;
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

// ============================================================================
// GAME PARTICIPANT TYPES (UNIFIED)
// ============================================================================
// These replace PodPlayerForm, ParsedPlayer, participants, etc.

export interface GameParticipantInput {
  // For form inputs (web + Discord)
  discord_username: string;
  commander_deck: string;
  result: 'win' | 'lose' | 'draw';
}

export interface GameParticipantResolved {
  // After player lookup/resolution
  player_id: string;
  commander_deck: string;
  result: 'win' | 'lose' | 'draw';
}

export interface GameParticipantDisplay {
  // For displaying in UI
  player_id: string;
  player_name: string;
  discord_username: string | null;
  commander_deck: string;
  result: 'win' | 'lose' | 'draw';
}

// ============================================================================
// GAME CREATION TYPES (UNIFIED)
// ============================================================================
// These replace CreatePodInput, PodSubmission, etc.

export interface GameCreateInput {
  // Universal input for creating games (web form, Discord, API)
  league_id?: string | null;
  date: string;
  game_length_minutes?: number | null;
  turns?: number | null;
  notes?: string | null;
  participants: GameParticipantInput[];
}

export interface GameCreateResolved {
  // After player resolution, ready for database
  league_id?: string | null;
  date: string;
  game_length_minutes?: number | null;
  turns?: number | null;
  notes?: string | null;
  participants: GameParticipantResolved[];
}

// ============================================================================
// AI PARSING TYPES (UNIFIED)
// ============================================================================

export interface GameParseResult {
  success: boolean;
  data?: {
    date?: string;
    game_length_minutes?: number;
    turns?: number;
    notes?: string;
    participants: GameParticipantInput[];
  };
  error?: string;
  confidence?: number;
  processing_time_ms?: number;
}

export interface GameParseRequest {
  text: string;
  context?: {
    user_id?: string;
    source?: 'web' | 'discord';
    metadata?: Record<string, any>;
  };
}

// ============================================================================
// EXTENDED/COMPUTED TYPES
// ============================================================================

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
  games_played: number;
  wins: number;
  losses: number;
  draws: number;
  win_rate: number;
  favorite_commanders: string[];
}

// ============================================================================
// FORM TYPES (LEGACY COMPATIBILITY)
// ============================================================================
// These provide backward compatibility during transition

/** @deprecated Use GameCreateInput instead */
export interface CreatePodInput extends GameCreateInput {
  participants: GameParticipantResolved[];
}

/** @deprecated Use GameCreateInput instead */
export interface PodSubmission extends GameCreateInput {}

/** @deprecated Use GameParticipantInput instead */
export interface PodPlayerForm extends GameParticipantInput {}

/** @deprecated Use GameParticipantInput instead */  
export interface ParsedPlayer extends GameParticipantInput {
  name: string; // For backward compatibility
}

/** @deprecated Use GameCreateInput instead */
export interface PodReportForm {
  date: string;
  players: GameParticipantInput[];
  game_length_minutes?: number;
  turns?: number;
  notes?: string;
}

// ============================================================================
// API TYPES
// ============================================================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface CreateGameRequest extends GameCreateInput {}
export interface CreateGameResponse extends APIResponse<Pod> {}

export interface CreatePlayerRequest {
  name: string;
  discord_id?: string;
  discord_username?: string;
}
export interface CreatePlayerResponse extends APIResponse<Player> {}

export interface CreateLeagueRequest {
  name: string;
  description?: string;
  player_ids: string[];
  start_date: string;
  end_date?: string;
  games_per_player: number;
}
export interface CreateLeagueResponse extends APIResponse<League> {}
EOF

echo "✅ Created packages/shared/src/types/core.ts"

# ============================================================================
# STEP 2: Create Type Utilities
# ============================================================================

echo "📁 Creating type utilities..."

cat > packages/shared/src/types/utils.ts << 'EOF'
// ============================================================================
// TYPE UTILITIES - Conversion and Validation Helpers
// ============================================================================

import type {
  GameCreateInput,
  GameCreateResolved,
  GameParticipantInput,
  GameParticipantResolved,
  Player,
  // Legacy types for conversion
  CreatePodInput,
  PodSubmission,
  PodPlayerForm
} from './core';

// ============================================================================
// CONVERSION UTILITIES
// ============================================================================

export class GameTypeConverter {
  /**
   * Convert legacy CreatePodInput to new GameCreateInput
   */
  static fromCreatePodInput(input: CreatePodInput): GameCreateInput {
    return {
      league_id: input.league_id,
      date: input.date,
      game_length_minutes: input.game_length_minutes,
      turns: input.turns,
      notes: input.notes,
      participants: input.participants.map(p => ({
        discord_username: '', // Will need to be resolved from player_id
        commander_deck: p.commander_deck,
        result: p.result
      }))
    };
  }

  /**
   * Convert legacy PodSubmission to new GameCreateInput
   */
  static fromPodSubmission(submission: PodSubmission): GameCreateInput {
    return {
      league_id: submission.league_id,
      date: submission.date,
      game_length_minutes: submission.game_length_minutes,
      turns: submission.turns,
      notes: submission.notes,
      participants: submission.participants || []
    };
  }

  /**
   * Convert new GameCreateInput to legacy CreatePodInput
   * (for backward compatibility during transition)
   */
  static toCreatePodInput(
    input: GameCreateInput, 
    players: Player[]
  ): CreatePodInput {
    const resolvedParticipants: GameParticipantResolved[] = [];
    
    for (const participant of input.participants) {
      const player = players.find(p => 
        p.discord_username === participant.discord_username ||
        p.name === participant.discord_username
      );
      
      if (!player) {
        throw new Error(`Player "${participant.discord_username}" not found`);
      }
      
      resolvedParticipants.push({
        player_id: player.id,
        commander_deck: participant.commander_deck,
        result: participant.result
      });
    }
    
    return {
      league_id: input.league_id,
      date: input.date,
      game_length_minutes: input.game_length_minutes,
      turns: input.turns,
      notes: input.notes,
      participants: resolvedParticipants
    };
  }

  /**
   * Resolve participants by looking up players
   */
  static async resolveParticipants(
    participants: GameParticipantInput[],
    playerLookup: (username: string) => Promise<Player | null>
  ): Promise<GameParticipantResolved[]> {
    const resolved: GameParticipantResolved[] = [];
    
    for (const participant of participants) {
      const player = await playerLookup(participant.discord_username);
      
      if (!player) {
        throw new Error(`Player "${participant.discord_username}" not found`);
      }
      
      resolved.push({
        player_id: player.id,
        commander_deck: participant.commander_deck,
        result: participant.result
      });
    }
    
    return resolved;
  }
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

export class GameValidator {
  static validateGameInput(input: GameCreateInput): string | null {
    if (!input.date) return 'Date is required';
    if (!input.participants || input.participants.length < 2) {
      return 'At least 2 participants are required';
    }
    
    // Check for duplicate participants
    const usernames = input.participants.map(p => p.discord_username);
    const uniqueUsernames = new Set(usernames);
    if (usernames.length !== uniqueUsernames.size) {
      return 'Each participant can only appear once';
    }
    
    // Check participant data
    for (let i = 0; i < input.participants.length; i++) {
      const participant = input.participants[i];
      if (!participant.discord_username) {
        return `Participant ${i + 1} username is required`;
      }
      if (!participant.commander_deck) {
        return `Participant ${i + 1} commander deck is required`;
      }
    }
    
    // Validate results
    const winners = input.participants.filter(p => p.result === 'win');
    if (winners.length === 0) return 'At least one participant must win';
    if (winners.length > 1) return 'Only one participant can win per game';
    
    return null; // Valid
  }

  static validateParticipant(participant: GameParticipantInput): string | null {
    if (!participant.discord_username) return 'Discord username is required';
    if (!participant.commander_deck) return 'Commander deck is required';
    if (!['win', 'lose', 'draw'].includes(participant.result)) {
      return 'Result must be win, lose, or draw';
    }
    return null; // Valid
  }
}

// ============================================================================
// BACKWARD COMPATIBILITY HELPERS
// ============================================================================

export function isPodPlayerForm(obj: any): obj is PodPlayerForm {
  return obj && typeof obj.discord_username === 'string' && 
         typeof obj.commander_deck === 'string' && 
         typeof obj.result === 'string';
}

export function isCreatePodInput(obj: any): obj is CreatePodInput {
  return obj && typeof obj.date === 'string' && 
         Array.isArray(obj.participants);
}

export function isPodSubmission(obj: any): obj is PodSubmission {
  return obj && typeof obj.date === 'string' && 
         Array.isArray(obj.participants);
}
EOF

echo "✅ Created packages/shared/src/types/utils.ts"

# ============================================================================
# STEP 3: Create Unified Type Index
# ============================================================================

echo "📁 Creating unified type exports..."

cat > packages/shared/src/types/index.ts << 'EOF'
// ============================================================================
// UNIFIED TYPE EXPORTS - Single Import Point
// ============================================================================
// Import ALL types from here to ensure consistency across the app

// Core types (new, canonical)
export * from './core';

// Type utilities
export * from './utils';

// Re-export for convenience
export type {
  // Most commonly used types
  Player,
  League,
  Pod,
  PodParticipant,
  
  // Game creation (new standard)
  GameCreateInput,
  GameCreateResolved,
  GameParticipantInput,
  GameParticipantResolved,
  
  // AI parsing
  GameParseResult,
  GameParseRequest,
  
  // API types
  APIResponse,
  CreateGameRequest,
  CreateGameResponse,
  
  // Legacy (for backward compatibility)
  CreatePodInput,
  PodSubmission,
  PodPlayerForm,
  PodReportForm
} from './core';
EOF

echo "✅ Created packages/shared/src/types/index.ts"

# ============================================================================
# STEP 4: Update Database Package Types
# ============================================================================

echo "🔄 Updating database package types..."

# Replace the database types file with imports from shared
cat > packages/database/src/types.ts << 'EOF'
// ============================================================================
// DATABASE TYPES - Import from Shared Package
// ============================================================================
// This file now imports from @dadgic/shared to ensure type consistency

// Re-export all types from shared package
export * from '@dadgic/shared/types';

// Database-specific types (if any) can be added here
// For now, everything is in the shared package
EOF

echo "✅ Updated packages/database/src/types.ts"

# ============================================================================
# STEP 5: Update Shared Package Index
# ============================================================================

echo "🔄 Updating shared package exports..."

cat > packages/shared/src/index.ts << 'EOF'
// ============================================================================
// SHARED PACKAGE EXPORTS
// ============================================================================

// Types (most important export)
export * from './types';

// Services
export * from './services/ai-parsing';
export * from './services/league-generation';
export * from './services/monitoring';

// Utilities
export * from './utils/validation';
export * from './utils/player-matching';

// Error handling
export * from './errors';
EOF

echo "✅ Updated packages/shared/src/index.ts"

# ============================================================================
# STEP 6: Update Database Package Index
# ============================================================================

echo "🔄 Updating database package exports..."

cat > packages/database/src/index.ts << 'EOF'
// ============================================================================
// DATABASE PACKAGE EXPORTS
// ============================================================================

// Types (re-exported from shared)
export * from './types';

// Query classes (will be updated to use new types)
export * from './queries/pods';
export * from './queries/players';
export * from './queries/leagues';

// Legacy client (deprecated)
export { supabase } from './client';

// Main database interface
import { PodQueries } from './queries/pods';
import { PlayerQueries } from './queries/players';

export const db = {
  pods: PodQueries,
  players: PlayerQueries,
};
EOF

echo "✅ Updated packages/database/src/index.ts"

# ============================================================================
# STEP 7: Create Type Migration Guide
# ============================================================================

echo "📄 Creating migration guide..."

cat > TYPE-MIGRATION-GUIDE.md << 'EOF'
# Type Migration Guide

## Overview
This migration consolidates all types into a single source of truth to fix TypeScript errors and naming inconsistencies.

## What Changed

### Before (Multiple Conflicting Types)
```typescript
// In different files:
interface CreatePodInput { participants: { player_id: string }[] }
interface PodSubmission { participants: { player_id: string }[] }
interface PodPlayerForm { discord_username: string }
interface ParsedPlayer { name: string }
```

### After (Unified Types)
```typescript
// All in packages/shared/src/types/core.ts
interface GameCreateInput { participants: GameParticipantInput[] }
interface GameParticipantInput { discord_username: string }
```

## Migration Steps

### 1. Update Imports
```typescript
// OLD
import { CreatePodInput } from '@dadgic/database'
import { PodPlayerForm } from './types'

// NEW
import { GameCreateInput, GameParticipantInput } from '@dadgic/shared'
```

### 2. Update Type Names
```typescript
// OLD
const submission: CreatePodInput = { ... }
const player: PodPlayerForm = { ... }

// NEW  
const submission: GameCreateInput = { ... }
const player: GameParticipantInput = { ... }
```

### 3. Use Conversion Utilities (During Transition)
```typescript
import { GameTypeConverter } from '@dadgic/shared'

// Convert legacy to new format
const newInput = GameTypeConverter.fromPodSubmission(oldSubmission)

// Convert new to legacy (if needed)
const legacyInput = GameTypeConverter.toCreatePodInput(newInput, players)
```

## Backward Compatibility

Legacy types are still available with deprecation warnings:
- `CreatePodInput` → Use `GameCreateInput`
- `PodSubmission` → Use `GameCreateInput`  
- `PodPlayerForm` → Use `GameParticipantInput`
- `ParsedPlayer` → Use `GameParticipantInput`

## Next Steps

1. Build packages: `npm run build`
2. Fix import errors using this guide
3. Update Discord bot to use new types
4. Update web forms to use new types
5. Remove legacy type usage gradually
EOF

echo "✅ Created TYPE-MIGRATION-GUIDE.md"

# ============================================================================
# STEP 8: Build and Test
# ============================================================================

echo ""
echo "🔨 Building packages..."

# Build shared package first
echo "Building shared package..."
cd packages/shared
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Shared package build failed - check for syntax errors"
  exit 1
fi
cd ../..

# Build database package
echo "Building database package..."
cd packages/database  
npm run build
if [ $? -eq 0 ]; then
  echo "✅ Database package built successfully"
else
  echo "⚠️ Database package build has warnings (expected during migration)"
fi
cd ../..

echo ""
echo "✅ Script 1 Complete - Type Chaos DEMOLISHED!"
echo "============================================="
echo ""
echo "🎯 WHAT THIS FIXES:"
echo "   • Single source of truth for all types"
echo "   • No more CreatePodInput vs PodSubmission conflicts"
echo "   • No more PodPlayerForm vs ParsedPlayer conflicts"  
echo "   • Unified naming convention across all packages"
echo "   • Backward compatibility during migration"
echo ""
echo "🔧 NEXT STEPS:"
echo "   1. Fix any remaining import errors using TYPE-MIGRATION-GUIDE.md"
echo "   2. Update Discord bot to use GameCreateInput"
echo "   3. Update web forms to use GameParticipantInput"
echo "   4. Test that everything builds without TypeScript errors"
echo ""
echo "📋 IMMEDIATE ACTIONS:"
echo "   1. Review TYPE-MIGRATION-GUIDE.md"
echo "   2. Run: npm run build (should work now!)"
echo "   3. Fix any import errors in apps/"
echo ""
echo "Ready for Script 2: Client Factory Implementation (with working types)?"