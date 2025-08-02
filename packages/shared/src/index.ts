// ============================================================================
// SHARED PACKAGE EXPORTS - Now imports types from DATABASE
// ============================================================================

// TYPES - Import from database (single source of truth)
//export * from '@dadgic/database';

// SERVICES (Updated to use database types)
export * from './services/PlayerService';
export * from './services/PodService'; // RENAMED: GameService → PodService
export * from './services/LeagueService';
export * from './services/AIParsingService';
export * from './services/PlayerMatchingService';
export * from './services/PodGenerationService';
export * from './services/AnalyticsService'

// UTILITIES
export * from './errors/APIError';
export * from './utils/validation';

// MONITORING (existing - keep as-is for now)
export { ErrorLogger } from './monitoring/error-logger/ErrorLogger.js';
export { HealthChecker } from './monitoring/health-checks/HealthChecker.js';
export type { ErrorContext, LoggedError } from './monitoring/error-logger/ErrorLogger.js';
export type { HealthCheck, SystemHealth } from './monitoring/health-checks/HealthChecker.js';

// ============================================================================
// NOTE: All types now come from @dadgic/database package
// Services have been updated to use Pod terminology instead of Game
// ============================================================================
