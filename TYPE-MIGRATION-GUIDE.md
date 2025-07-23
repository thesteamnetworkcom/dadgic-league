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
