// ============================================================================
// Auth Validation Utilities
// ============================================================================

import { db } from '@dadgic/database'
import { ValidationError } from '../../errors/APIError'

/**
 * Check if the current user is an admin
 * Uses existing database method until proper auth is implemented
 */
export async function validateCurrentUserIsAdmin(userId?: string): Promise<void> {
  // For now, use the existing database method that works
  const isAdmin = await db.base.isCurrentUserAdmin(userId)
  
  if (!isAdmin) {
    throw new ValidationError('Admin access required', [
      { field: 'user', message: 'Only administrators can create leagues' }
    ])
  }
}

/**
 * Check if a specific user is an admin
 */
export async function validateUserIsAdmin(userId: string): Promise<void> {
  const player = await db.players.findById(userId)
  if (!player || player.role !== 'admin') {
    throw new ValidationError('Admin access required', [
      { field: 'user', message: 'Only administrators can perform this action' }
    ])
  }
}

/**
 * TODO: Implement proper user context/session management
 * For now, keeping the working database method until auth is refactored
 */