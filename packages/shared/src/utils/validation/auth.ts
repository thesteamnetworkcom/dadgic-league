// ============================================================================
// Auth Validation Utilities
// ============================================================================

import { db } from '@dadgic/database'
import { ValidationError } from '../../errors/APIError.js'
import type { DatabaseAuthContext } from '@dadgic/database'

/**
 * Check if the current user is an admin
 * Uses existing database method until proper auth is implemented
 */
export async function validateCurrentUserIsAdmin(authContext?: DatabaseAuthContext): Promise<void> {
	const isAdmin = await db.base.isCurrentUserAdmin(authContext)

	if (!isAdmin) {
		throw new ValidationError('Admin access required', [
			{ field: 'user', message: 'Only administrators can create leagues' }
		])
	}
}

/**
 * Check if a specific user is an admin
 */
export async function validateUserIsAdmin(authContext: DatabaseAuthContext): Promise<void> {
	if (!authContext.is_admin) {
		throw new ValidationError('Admin access required', [
			{ field: 'user', message: 'Only administrators can perform this action' }
		])
	}
}

/**
 * TODO: Implement proper user context/session management
 * For now, keeping the working database method until auth is refactored
 */