// src/app/dashboard/page.tsx - Updated with Navigation
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/auth'
import { TrophyIcon, StatsIcon, UsersIcon } from '@/components/icons'
import { db } from '@dadgic/database'
import AppLayout from '@/components/AppLayout'

interface PlayerStats {
  games_played: number
  wins: number
  win_rate: number
  favorite_commanders: string[]
}

interface RecentGame {
  id: string
  date: string
  commander_deck: string
  result: 'win' | 'lose' | 'draw'
  participant_count: number
}

export default function Dashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<PlayerStats | null>(null)
  const [recentGames, setRecentGames] = useState<RecentGame[]>([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [gamesLoading, setGamesLoading] = useState(true)

  useEffect(() => {
    console.log('Dashboard: useEffect triggered')
    console.log('Dashboard: loading =', loading)
    console.log('Dashboard: user =', user)
    
    if (!loading && !user) {
      console.log('Dashboard: Redirecting to home - no user found')
      router.push('/')
    } else if (user) {
      console.log('Dashboard: User found, loading stats...')
      loadPlayerStats()
    }
  }, [user, loading, router])

  const loadPlayerStats = async () => {
    if (!user?.discord_id) return
    
    try {
      setStatsLoading(true)
      console.log('Dashboard: Loading stats for discord_id:', user.discord_id)
      
      // Find the player in your database
      const player = await db.players.getByDiscordId(user.discord_id)
      console.log('Dashboard: Found player:', player)
      
      if (player) {
        const playerStats = await db.players.getStats(player.id)
        console.log('Dashboard: Player stats:', playerStats)
        setStats(playerStats)
        
        // Load recent games
        await loadRecentGames(player.id)
      }
    } catch (error) {
      console.error('Dashboard: Error loading stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  const loadRecentGames = async (playerId: string) => {
    try {
      setGamesLoading(true)
      console.log('Dashboard: Loading recent games for player:', playerId)
      
      // Get recent games using Supabase query
      const { data: recentGameData, error } = await supabase
        .from('pod_participants')
        .select(`
          commander_deck,
          result,
          pod:pods (
            id,
            date,
            participant_count
          )
        `)
        .eq('player_id', playerId)
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (error) throw error
      
      const formattedGames = recentGameData?.map((game: any) => ({
        id: game.pod.id,
        date: game.pod.date,
        commander_deck: game.commander_deck,
        result: game.result,
        participant_count: game.pod.participant_count
      })) || []
      
      console.log('Dashboard: Recent games:', formattedGames)
      setRecentGames(formattedGames)
    } catch (error) {
      console.error('Dashboard: Error loading recent games:', error)
    } finally {
      setGamesLoading(false)
    }
  }

  if (loading) {
    return (
      <AppLayout showNavigation={false}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    )
  }

  if (!user) {
    return null // Will redirect to home
  }

  return (
    <AppLayout>
      {/* Main Content - removed the old header since Navigation handles it */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user.name || user.discord_username}!
          </h2>
          <p className="text-neutral-400">
            Ready to track some Commander games? Here's what's happening in your leagues.
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-sm">Total Games</p>
                <p className="text-2xl font-bold text-white">
                  {statsLoading ? '...' : (stats?.games_played || 0)}
                </p>
              </div>
              <StatsIcon className="h-8 w-8 text-primary-400" />
            </div>
          </div>

          <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-sm">Win Rate</p>
                <p className="text-2xl font-bold text-white">
                  {statsLoading ? '...' : `${Math.round((stats?.win_rate || 0) * 100)}%`}
                </p>
              </div>
              <TrophyIcon className="h-8 w-8 text-accent-400" />
            </div>
          </div>

          <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-sm">Total Wins</p>
                <p className="text-2xl font-bold text-white">
                  {statsLoading ? '...' : (stats?.wins || 0)}
                </p>
              </div>
              <UsersIcon className="h-8 w-8 text-secondary-400" />
            </div>
          </div>
        </div>

        {/* Recent Games */}
        <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Recent Games</h3>
          
          {gamesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-neutral-400">Loading recent games...</span>
            </div>
          ) : recentGames.length === 0 ? (
            <div className="text-center py-8">
              <TrophyIcon className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
              <p className="text-neutral-400">No games recorded yet</p>
              <p className="text-neutral-500 text-sm">Start playing and reporting games to see your history!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentGames.map((game, index) => (
                <div key={game.id} className="flex items-center justify-between p-4 bg-neutral-700/50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full ${
                        game.result === 'win' ? 'bg-green-400' :
                        game.result === 'lose' ? 'bg-red-400' :
                        'bg-yellow-400'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          game.result === 'win' ? 
                            'bg-green-500/20 text-green-400' :
                          game.result === 'lose' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {game.result.toUpperCase()}
                        </span>
                        <span className="text-white font-medium">{game.commander_deck}</span>
                      </div>
                      <div className="text-neutral-400 text-sm mt-1">
                        {new Date(game.date).toLocaleDateString()} • {game.participant_count} players
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </AppLayout>
  )
}