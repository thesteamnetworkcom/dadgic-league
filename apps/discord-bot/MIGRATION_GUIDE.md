# Discord Bot Migration Guide - Phase 2A-3

## What Changed

### ❌ OLD WAY (Deprecated):
```typescript
import { parseWithAI } from '@dadgic/shared/ai-parser'
import { ParsedPodData } from '@dadgic/shared'

// Direct AI parsing
const result = await parseWithAI(gameText)
```

### ✅ NEW WAY:
```typescript
import { getGameReportingService } from './services/GameReportingService'

// Using shared services through wrapper
const gameService = getGameReportingService()
const result = await gameService.parseGameDescription(gameText, userId)
```

## Key Changes

1. **Naming**: `ParsedPodData` → `ParsedGameData`
2. **Import path**: `@dadgic/shared/ai-parser` → `@dadgic/shared/services`
3. **Service wrapper**: Use `GameReportingService` for Discord-specific logic
4. **Shared services**: Same business logic as web app

## Migration Steps

1. Replace old imports:
   ```typescript
   // Remove:
   import { parseWithAI } from '@dadgic/shared/ai-parser'
   
   // Add:
   import { getGameReportingService } from './services/GameReportingService'
   ```

2. Update function calls:
   ```typescript
   // Old:
   const result = await parseWithAI(text)
   
   // New:
   const service = getGameReportingService()
   const result = await service.parseGameDescription(text, userId)
   ```

3. Update type names:
   ```typescript
   // Old:
   ParsedPodData
   
   // New:
   ParsedGameData
   ```

## Benefits

- ✅ Consistent business logic between web and Discord bot
- ✅ Better error handling and logging
- ✅ Proper Discord context (source: 'discord')
- ✅ Game creation through shared services
