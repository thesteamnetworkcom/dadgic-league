// apps/web/src/contexts/AuthContext.tsx
// Updated AuthContext with lazy auth triggers and session cache

'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react'
import { supabase, getCurrentUser, syncUserWithPlayer, signOut as authSignOut } from '@/lib/auth'
import { isSessionValid, getCachedUser, clearSessionCache } from '@/lib/auth-session'
import type { User, AuthState } from '@/lib/auth'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

interface AuthContextType extends AuthState {
	signOut: () => Promise<void>
	refreshUser: (force?: boolean) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
	const context = useContext(AuthContext)
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider')
	}
	return context
}

interface AuthProviderProps {
	children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
	const [state, setState] = useState<AuthState>({
		user: null,
		loading: true,
		error: null
	})

	// ✅ STEP 1: Lazy auth refresh with session cache integration
	const refreshUser = useCallback(async (force: boolean = false) => {
		try {
			console.log('AuthContext: refreshUser called', { force, cacheValid: isSessionValid() })
			
			// ✅ STEP 2: Check if we can skip network calls
			if (!force && isSessionValid()) {
				const cachedUser = getCachedUser()
				console.log('🔒 AuthContext: Using cached user, skipping network calls')
				setState(prev => ({ 
					...prev, 
					user: cachedUser, 
					loading: false,
					error: null 
				}))
				return
			}

			// ✅ STEP 3: Need to check auth (cache miss or forced)
			console.log('🔒 AuthContext: Cache miss or forced refresh, checking auth...')
			setState(prev => ({ ...prev, loading: true, error: null }))
			
			const user = await getCurrentUser()
			console.log('AuthContext: Got user from getCurrentUser:', user?.id)

			// ✅ STEP 4: Handle successful auth
			if (user) {
  				console.log('AuthContext: User authenticated')
  				setState(prev => ({ ...prev, user, loading: false }))
			} else {
				console.log('AuthContext: No user found')
				setState(prev => ({ ...prev, user: null, loading: false }))
			}

		} catch (error) {
			console.error('AuthContext: Error refreshing user:', error)
			// Clear cache on any auth error
			clearSessionCache()
			setState(prev => ({
				...prev,
				user: null,
				error: error instanceof Error ? error.message : 'Unknown error',
				loading: false
			}))
		}
	}, []) // ✅ Empty deps - function should be stable

	// ✅ STEP 5: Memoized sign out function
	const signOut = useCallback(async () => {
		try {
			console.log('AuthContext: Signing out...')
			setState(prev => ({ ...prev, loading: true, error: null }))
			
			// This will clear the session cache internally
			await authSignOut()
			
			setState(prev => ({ ...prev, user: null, loading: false }))
			console.log('AuthContext: Sign out complete')
		} catch (error) {
			console.error('Error signing out:', error)
			// Clear cache even if sign out fails
			clearSessionCache()
			setState(prev => ({
				...prev,
				user: null,
				error: error instanceof Error ? error.message : 'Unknown error',
				loading: false
			}))
		}
	}, [])

	// ✅ STEP 6: Initial auth check and auth state listener
	useEffect(() => {
		console.log('AuthContext: Setting up auth...')
		
		// Initial auth check - not forced, will use cache if available
		refreshUser()

		// ✅ STEP 7: Optimized auth state change listener
		const { data: { subscription } } = supabase.auth.onAuthStateChange(
			(event: AuthChangeEvent, session: Session | null) => {
				console.log('🔒 Auth state changed:', event, session?.user?.id)

				if (event === 'SIGNED_IN' && session?.user) {
					// User just signed in - force refresh to get latest data
					console.log('🔒 Sign in detected, forcing refresh')
					refreshUser(true)
				} else if (event === 'SIGNED_OUT') {
					// User signed out - clear cache and state immediately
					console.log('🔒 Sign out detected, clearing state')
					clearSessionCache()
					setState(prev => ({ ...prev, user: null, loading: false }))
				}
				// ✅ Ignore other events - let session cache handle them
			}
		)

		return () => {
			console.log('AuthContext: Cleaning up auth subscription')
			subscription.unsubscribe()
		}
	}, [refreshUser]) // ✅ Depend on stable refreshUser function

	// ✅ STEP 8: Memoized context value to prevent unnecessary re-renders
	const value = useMemo((): AuthContextType => ({
		...state,
		signOut,
		refreshUser
	}), [state, signOut, refreshUser])

	return (
		<AuthContext.Provider value={value}>
			{children}
		</AuthContext.Provider>
	)
}