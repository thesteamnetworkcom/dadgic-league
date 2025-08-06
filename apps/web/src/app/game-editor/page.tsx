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
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading])

  // Separate effect for sessionStorage - runs immediately on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // First, try to get immediate data (fresh from GameLogger)
      const immediateData = sessionStorage.getItem('parsedGameData_immediate')
      console.log(immediateData)
      if (immediateData) {
        try {
          const parsed = JSON.parse(immediateData)
          // Check if data is recent (within 30 seconds)
          if (Date.now() - parsed.timestamp < 30000) {
            setParsedData(parsed.data)
            // Clean up immediate data
            sessionStorage.removeItem('parsedGameData_immediate')
            return
          }
        } catch (error) {
          console.error('Failed to parse immediate game data:', error)
        }
      }

      // Fallback to regular stored data (for refreshes)
      const stored = sessionStorage.getItem('parsedGameData')
      console.log(stored)
      if (stored) {
        try {
          setParsedData(JSON.parse(stored))
        } catch (error) {
          console.error('Failed to parse stored game data:', error)
        }
      }
    }
  }, []) // Empty deps - runs once on mount immediately

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