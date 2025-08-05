// src/app/dashboard/page.tsx
'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { TerminalDashboardLayout } from '@/components/terminal/TerminalDashboardLayout'
import { DashboardPage } from '@/components/dashboard/DashboardPage'
import { TerminalLoading } from '@/components/terminal/TerminalLoading'

export default function Dashboard() {
  const { user, loading } = useAuth()

  // Show loading while checking auth
  if (loading) {
    return <TerminalLoading message="Initializing terminal..." />
  }

  // Don't render dashboard if no user (will redirect)
  if (!user) {
    return null
  }

  return (
    <TerminalDashboardLayout>
      <DashboardPage />
    </TerminalDashboardLayout>
  )
}