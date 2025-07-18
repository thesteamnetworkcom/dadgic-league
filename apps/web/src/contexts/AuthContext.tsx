// src/contexts/AuthContext.tsx
'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase, getCurrentUser, syncUserWithPlayer, signOut as authSignOut } from '@/lib/auth'
import type { User, AuthState } from '@/lib/auth'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
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

  const refreshUser = async () => {
    try {
      console.log('AuthContext: Starting refreshUser...')
      setState(prev => ({ ...prev, loading: true, error: null }))
      const user = await getCurrentUser()
      console.log('AuthContext: Got user:', user?.id)
      
      if (user) {
        console.log('AuthContext: Syncing user with player...')
        await syncUserWithPlayer(user)
        console.log('AuthContext: Sync complete')
      }
      
      setState(prev => ({ ...prev, user, loading: false }))
      console.log('AuthContext: RefreshUser complete')
    } catch (error) {
      console.error('AuthContext: Error refreshing user:', error)
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false
      }))
    }
  }

  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      await authSignOut()
      setState(prev => ({ ...prev, user: null, loading: false }))
    } catch (error) {
      console.error('Error signing out:', error)
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false
      }))
    }
  }

  useEffect(() => {
    // Check current auth state
    refreshUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        console.log('Auth state changed:', event, session?.user?.id)
        
        if (event === 'SIGNED_IN' && session?.user) {
          // User just signed in, refresh user data
          refreshUser()
        } else if (event === 'SIGNED_OUT') {
          // User signed out
          setState(prev => ({ ...prev, user: null, loading: false }))
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const value: AuthContextType = {
    ...state,
    signOut,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}