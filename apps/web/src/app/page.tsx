// src/app/page.tsx
'use client'

import { useState } from 'react'
import { DiscordIcon, StatsIcon, TrophyIcon, UsersIcon } from '@/components/icons'
import { signInWithDiscord } from '@/lib/auth'
import { useAuth } from '@/contexts/AuthContext'

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()

  const handleDiscordLogin = async () => {
    try {
      setIsLoading(true)
      await signInWithDiscord()
    } catch (error) {
      console.error('Login failed:', error)
      // TODO: Show error toast/message
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 to-secondary-600/20 blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center animate-fade-in">
            {/* Logo/Brand */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full blur opacity-75" />
                <div className="relative bg-neutral-900 rounded-full p-4">
                  <TrophyIcon className="h-12 w-12 text-accent-500" />
                </div>
              </div>
            </div>

            <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
                Dadgic MTG
              </span>
              <br />
              Commander Tracker
            </h1>

            <p className="text-xl text-neutral-300 mb-8 max-w-2xl mx-auto">
              Track your Magic: The Gathering Commander games, analyze your performance, 
              and compete with friends in organized leagues.
            </p>

            {/* CTA Button */}
            <div className="flex justify-center">
              <button
                onClick={handleDiscordLogin}
                disabled={isLoading}
                className="group relative overflow-hidden bg-discord-500 hover:bg-discord-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-discord-600 to-discord-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center space-x-3">
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <DiscordIcon className="h-5 w-5" />
                  )}
                  <span>{isLoading ? 'Connecting...' : 'Sign in with Discord'}</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6 hover:bg-neutral-800/70 transition-all duration-300 group">
            <div className="flex items-center justify-center w-12 h-12 bg-primary-500/20 rounded-lg mb-4 group-hover:bg-primary-500/30 transition-colors">
              <StatsIcon className="h-6 w-6 text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Performance Analytics</h3>
            <p className="text-neutral-400">
              Track your win rates, favorite commanders, and game statistics with detailed analytics.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6 hover:bg-neutral-800/70 transition-all duration-300 group">
            <div className="flex items-center justify-center w-12 h-12 bg-secondary-500/20 rounded-lg mb-4 group-hover:bg-secondary-500/30 transition-colors">
              <UsersIcon className="h-6 w-6 text-secondary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">League Management</h3>
            <p className="text-neutral-400">
              Organize tournaments, manage player rosters, and schedule pods with ease.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6 hover:bg-neutral-800/70 transition-all duration-300 group">
            <div className="flex items-center justify-center w-12 h-12 bg-accent-500/20 rounded-lg mb-4 group-hover:bg-accent-500/30 transition-colors">
              <TrophyIcon className="h-6 w-6 text-accent-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Discord Integration</h3>
            <p className="text-neutral-400">
              Seamlessly connect with your Discord server for notifications and community features.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-neutral-700 bg-neutral-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-neutral-400">
            <p>&copy; 2025 Dadgic MTG Commander Tracker. Built for the Commander community.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}