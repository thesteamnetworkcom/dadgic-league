// src/components/auth/AuthRedirectWrapper.tsx
'use client'

import { useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface AuthRedirectWrapperProps {
  children: ReactNode
  redirectTo?: string
}

export function AuthRedirectWrapper({ 
  children, 
  redirectTo = '/dashboard' 
}: AuthRedirectWrapperProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log('AuthRedirectWrapper: auth state', { user: !!user, loading })
    // If user is authenticated, redirect to dashboard
    if (!loading && user) {
      console.log('AuthRedirectWrapper: redirecting to dashboard')
      router.push(redirectTo)
    }
  }, [user, loading, router, redirectTo])

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // If user is authenticated, don't render children (will redirect)
  if (user) {
    return null
  }

  // Render landing page for unauthenticated users
  return <>{children}</>
}