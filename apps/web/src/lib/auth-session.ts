// apps/web/src/lib/auth-session.ts
// Session-based auth cache to reduce Supabase calls

import type { User } from './auth'

interface SessionCache {
  isAuthenticated: boolean
  user: User | null
  lastCheck: number
  ttl: number // Time to live in milliseconds
}

// Private cache variable
let sessionCache: SessionCache | null = null

// 5 minutes TTL - reasonable for game tracking app
const DEFAULT_TTL = 5 * 60 * 1000

/**
 * Get current session cache if it exists
 */
export function getSessionCache(): SessionCache | null {
  return sessionCache
}

/**
 * Set session cache with auth data
 */
export function setSessionCache(isAuthenticated: boolean, user: User | null): void {
  sessionCache = {
    isAuthenticated,
    user,
    lastCheck: Date.now(),
    ttl: DEFAULT_TTL
  }
  
  console.log('🔒 Session cached:', { 
    authenticated: isAuthenticated, 
    userId: user?.id,
    expiresIn: `${DEFAULT_TTL / 1000 / 60}m`
  })
}

/**
 * Clear session cache (sign out, errors, etc.)
 */
export function clearSessionCache(): void {
  sessionCache = null
  console.log('🔒 Session cache cleared')
}

/**
 * Check if current session cache is still valid
 */
export function isSessionValid(): boolean {
  if (!sessionCache) {
    return false
  }
  
  const now = Date.now()
  const isExpired = (now - sessionCache.lastCheck) > sessionCache.ttl
  
  if (isExpired) {
    console.log('🔒 Session cache expired, clearing')
    clearSessionCache()
    return false
  }
  
  console.log('🔒 Session cache valid:', {
    timeRemaining: `${Math.round((sessionCache.ttl - (now - sessionCache.lastCheck)) / 1000 / 60)}m`
  })
  return true
}

/**
 * Get cached user if session is valid, null otherwise
 */
export function getCachedUser(): User | null {
  if (!isSessionValid()) {
    return null
  }
  
  return sessionCache?.user || null
}

/**
 * Check if user is authenticated according to cache
 */
export function isCachedAuthenticated(): boolean {
  if (!isSessionValid()) {
    return false
  }
  
  return sessionCache?.isAuthenticated || false
}

/**
 * Update cache TTL (useful for extending session on activity)
 */
export function extendSession(): void {
  if (sessionCache) {
    sessionCache.lastCheck = Date.now()
    console.log('🔒 Session extended')
  }
}

/**
 * Get cache status for debugging
 */
export function getCacheStatus() {
  if (!sessionCache) {
    return { status: 'no_cache' }
  }
  
  const now = Date.now()
  const age = now - sessionCache.lastCheck
  const remaining = sessionCache.ttl - age
  
  return {
    status: remaining > 0 ? 'valid' : 'expired',
    ageSeconds: Math.round(age / 1000),
    remainingSeconds: Math.round(remaining / 1000),
    isAuthenticated: sessionCache.isAuthenticated,
    hasUser: !!sessionCache.user
  }
}