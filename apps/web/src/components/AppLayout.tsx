// src/components/AppLayout.tsx
'use client'

import { ReactNode } from 'react'
import Navigation from './Navigation'
import { useAuth } from '@/contexts/AuthContext'

interface AppLayoutProps {
  children: ReactNode
  showNavigation?: boolean
}

export default function AppLayout({ children, showNavigation = true }: AppLayoutProps) {
  const { user, loading } = useAuth()

  // Don't show navigation on auth pages or when loading
  const shouldShowNav = showNavigation && !loading && user

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      {shouldShowNav && <Navigation />}
      {children}
    </div>
  )
}