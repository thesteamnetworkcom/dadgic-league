// ============================================================================
// SHARED PACKAGE EXPORTS - Clean Structure
// ============================================================================

// Types (most important)
export * from './types';

// Services  
export * from './services';

// Utilities
export * from './utils';

// Errors
export * from './errors';

// Monitoring (existing - keep as-is for now)
export { ErrorLogger } from './monitoring/error-logger/ErrorLogger.js';
export { HealthChecker } from './monitoring/health-checks/HealthChecker.js';
export type { ErrorContext, LoggedError } from './monitoring/error-logger/ErrorLogger.js';
export type { HealthCheck, SystemHealth } from './monitoring/health-checks/HealthChecker.js';

// Legacy exports (for backward compatibility)
// These will be gradually removed as we update imports
//export * from './player-matching.js';
//export * from './pod-generation.js';
//export * from './league-generation.js';
