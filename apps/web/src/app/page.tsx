// src/app/page.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/auth'
import { useToast } from '@/contexts/ToastContext'

// Import components individually to avoid export issues
import { AuthRedirectWrapper } from '@/components/auth/AuthRedirectWrapper'
import { LandingLayout } from '@/components/landing/LandingLayout'
import { LandingHero } from '@/components/landing/LandingHero'
import { ComparisonSection } from '@/components/landing/ComparisonSection'
import { CTASection } from '@/components/landing/CTASection'

export default function LandingPage() {
  const [isAuthLoading, setIsAuthLoading] = useState(false)
  const { showToast } = useToast()

  const handleDiscordAuth = async () => {
    try {
      setIsAuthLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        console.error('Discord auth error:', error)
        showToast('Authentication failed. Please try again.', 'error')
        setIsAuthLoading(false)
      }
      // Note: Don't set loading to false on success - redirect will happen
    } catch (error) {
      console.error('Error during Discord authentication:', error)
      showToast('Authentication error. Please try again.', 'error')
      setIsAuthLoading(false)
    }
  }

  return (
    <AuthRedirectWrapper>
      <LandingLayout>
        <LandingHero />
        <ComparisonSection />
        <CTASection 
          onDiscordAuth={handleDiscordAuth}
          isLoading={isAuthLoading}
        />
      </LandingLayout>
    </AuthRedirectWrapper>
  )
}