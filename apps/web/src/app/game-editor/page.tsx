// src/app/game-editor/page.tsx
'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { TerminalDashboardLayout } from '@/components/terminal/TerminalDashboardLayout'
import { GameEditorPage } from '@/components/forms/GameEditorPage'
import { TerminalLoading } from '@/components/terminal/TerminalLoading'

export default function GameEditor() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [parsedData, setParsedData] = useState(null)

  useEffect(() => {
    // Redirect to landing if not authenticated
    if (!loading && !user) {
      router.push('/')
      return
    }

    // Load parsed data from session storage
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('parsedGameData')
      if (stored) {
        try {
          setParsedData(JSON.parse(stored))
        } catch (error) {
          console.error('Failed to parse stored game data:', error)
        }
      }
    }
  }, [user, loading])

  // Show loading while checking auth
  if (loading) {
    return <TerminalLoading message="Loading game editor..." />
  }

  // Don't render if no user (will redirect)
  if (!user) {
    return null
  }

  return (
    <TerminalDashboardLayout>
      <GameEditorPage 
        initialData={parsedData}
        mode="create"
      />
    </TerminalDashboardLayout>
  )
}