// ============================================================================
// SHARED PACKAGE EXPORTS - Now imports types from DATABASE
// ============================================================================

// TYPES - Import from database (single source of truth)
//export * from '@dadgic/database';

// SERVICES (Updated to use database types)
export * from './services/PlayerService.js';
export * from './services/PodService.js'; // RENAMED: GameService → PodService
export * from './services/LeagueService.js';
export * from './services/AIParsingService.js';
export * from './services/PlayerMatchingService.js';
export * from './services/PodGenerationService.js';
export * from './services/AnalyticsService.js'

// UTILITIES
export * from './errors/APIError.js';
export * from './utils/validation/index.js';

// MONITORING (existing - keep as-is for now)
export { ErrorLogger } from './monitoring/error-logger/ErrorLogger.js';
export { HealthChecker } from './monitoring/health-checks/HealthChecker.js';
export type { ErrorContext, LoggedError } from './monitoring/error-logger/ErrorLogger.js';
export type { HealthCheck, SystemHealth } from './monitoring/health-checks/HealthChecker.js';

// ============================================================================
// NOTE: All types now come from @dadgic/database package
// Services have been updated to use Pod terminology instead of Game
// ============================================================================
