// src/app/report/page.tsx - Updated to use APIs instead of direct database
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { PlusIcon, TrashIcon, TrophyIcon } from '@/components/icons'
import AppLayout from '@/components/AppLayout'
import { aiAPI, gameAPI, playerAPI } from '@/lib/api'

// Form-specific types
interface PodPlayerForm {
  discord_username: string
  commander_deck: string
  result: 'win' | 'lose' | 'draw'
}

interface Player {
  id: string
  name: string
  discord_username: string | null
}

export default function ReportPod() {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  // Mode toggle
  const [mode, setMode] = useState<'structured' | 'ai'>('ai')
  
  // AI input
  const [aiInput, setAiInput] = useState('')
  const [isParsingAI, setIsParsingAI] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  
  // Form state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [gameLengthMinutes, setGameLengthMinutes] = useState<number | ''>('')
  const [turns, setTurns] = useState<number | ''>('')
  const [notes, setNotes] = useState('')
  const [players, setPlayers] = useState<PodPlayerForm[]>([
    { discord_username: '', commander_deck: '', result: 'lose' }
  ])
  
  // Data state
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    } else if (user) {
      loadAvailablePlayers()
    }
  }, [user, loading, router])

  const loadAvailablePlayers = async () => {
    try {
      console.log('📋 Loading players via API...')
      const result = await playerAPI.listPlayers()
      if (result.success && result.data) {
        setAvailablePlayers(result.data)
        console.log('✅ Loaded players:', result.data.length)
      } else {
        console.warn('⚠️  Failed to load players:', result.error)
      }
    } catch (error) {
      console.error('❌ Error loading players:', error)
    }
  }

  // ============================================================================
  // AI PARSING - Uses AI API
  // ============================================================================

  const handleAIParse = async () => {
    if (!aiInput.trim()) {
      setAiError('Please enter a game description')
      return
    }
    setIsParsingAI(true)
    setAiError(null)
    
    try {
      console.log('🤖 Starting AI parse via API...')
      
      const result = await aiAPI.parseGameText({
        text: aiInput.trim(),
        context: {
          user_id: user?.id
        }
      })

      if (!result.success) {
        setAiError(result.error || 'Failed to parse game description')
        return
      }

      if (!result.data) {
        setAiError('No data returned from AI')
        return
      }

      console.log('✅ AI parsing successful:', {
        confidence: result.data.confidence,
        playersFound: result.data.players.length
      })
      
      // Populate form with AI results
      setDate(result.data.date)
      setGameLengthMinutes(result.data.game_length_minutes || '')
      setTurns(result.data.turns || '')
      setNotes(result.data.notes || '')
      
      // Convert AI players to form format
      const formPlayers = result.data.players.map(p => ({
        discord_username: p.name,
        commander_deck: p.commander,
        result: p.result
      }))
      
      setPlayers(formPlayers)
      setMode('structured')
      setError(null)
      
    } catch (error) {
      console.error('❌ AI parsing error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to parse game description'
      setAiError(errorMessage)
    } finally {
      setIsParsingAI(false)
    }
  }

  // ============================================================================
  // GAME SUBMISSION - Uses Game API instead of direct database
  // ============================================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }
    
    setIsSubmitting(true)
    
    try {
      console.log('🎮 Submitting game via Game API...')

      const result = await gameAPI.createGame({
        date,
        game_length_minutes: gameLengthMinutes === '' ? undefined : Number(gameLengthMinutes),
        turns: turns === '' ? undefined : Number(turns),
        notes: notes.trim() || undefined,
        players: players.map(p => ({
          discord_username: p.discord_username,
          commander_deck: p.commander_deck,
          result: p.result
        }))
      })

      if (!result.success) {
        setError(result.error || 'Failed to create game')
        return
      }

      console.log('✅ Game created successfully via API:', result.data?.id)
      router.push('/dashboard?success=pod-reported')
      
    } catch (error) {
      console.error('❌ Game submission error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit game'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const validateForm = (): string | null => {
    if (!date) return 'Date is required'
    if (players.length < 2) return 'At least 2 players are required'
    
    for (let i = 0; i < players.length; i++) {
      const player = players[i]
      if (!player.discord_username) return `Player ${i + 1} username is required`
      if (!player.commander_deck) return `Player ${i + 1} commander deck is required`
    }
    
    const winners = players.filter(p => p.result === 'win')
    if (winners.length === 0) return 'At least one player must win'
    if (winners.length > 1) return 'Only one player can win per game'
    
    const usernames = players.map(p => p.discord_username)
    const uniqueUsernames = new Set(usernames)
    if (usernames.length !== uniqueUsernames.size) return 'Each player can only appear once'
    
    return null
  }

  const addPlayer = () => {
    setPlayers([...players, { discord_username: '', commander_deck: '', result: 'lose' }])
  }

  const removePlayer = (index: number) => {
    if (players.length > 1) {
      setPlayers(players.filter((_, i) => i !== index))
    }
  }

  const updatePlayer = (index: number, field: keyof PodPlayerForm, value: string) => {
    const updated = [...players]
    updated[index] = { ...updated[index], [field]: value }
    setPlayers(updated)
  }

  // Render - keeping existing UI
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
    return null
  }

  return (
    <AppLayout>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Report a Game</h1>
          <p className="text-neutral-400">
            Record the results of your Commander pod game
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="mb-6">
          <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-1 inline-flex">
            <button
              onClick={() => setMode('ai')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'ai' 
                  ? 'bg-primary-500 text-white' 
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              AI Description
            </button>
            <button
              onClick={() => setMode('structured')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'structured' 
                  ? 'bg-primary-500 text-white' 
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Structured Form
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Content based on mode */}
        <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6">
          {mode === 'ai' ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Describe your game
                </label>
                <textarea
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Tell me about the game... Who played, what commanders, who won, how long did it take, etc."
                  rows={6}
                  className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>
              
              {aiError && (
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-red-400">{aiError}</p>
                </div>
              )}
              
              <div className="flex justify-end">
                <button
                  onClick={handleAIParse}
                  disabled={!aiInput.trim() || isParsingAI}
                  className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  {isParsingAI ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Parsing...
                    </>
                  ) : (
                    <>
                      <TrophyIcon className="w-4 h-4" />
                      Parse Game
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Game Info Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Game Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Game Length (minutes)
                  </label>
                  <input
                    type="number"
                    value={gameLengthMinutes}
                    onChange={(e) => setGameLengthMinutes(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Optional"
                    className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Players Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-white">Players</h3>
                  <button
                    type="button"
                    onClick={addPlayer}
                    className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-3 py-2 rounded-lg transition-colors"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add Player
                  </button>
                </div>

                {players.map((player, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-neutral-700/50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-1">
                        Discord Username
                      </label>
                      <input
                        type="text"
                        value={player.discord_username}
                        onChange={(e) => updatePlayer(index, 'discord_username', e.target.value)}
                        placeholder="@username"
                        className="w-full bg-neutral-600 border border-neutral-500 rounded px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-1">
                        Commander Deck
                      </label>
                      <input
                        type="text"
                        value={player.commander_deck}
                        onChange={(e) => updatePlayer(index, 'commander_deck', e.target.value)}
                        placeholder="Deck name/commander"
                        className="w-full bg-neutral-600 border border-neutral-500 rounded px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-1">
                        Result
                      </label>
                      <select
                        value={player.result}
                        onChange={(e) => updatePlayer(index, 'result', e.target.value as 'win' | 'lose' | 'draw')}
                        className="w-full bg-neutral-600 border border-neutral-500 rounded px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="lose">Lose</option>
                        <option value="win">Win</option>
                        <option value="draw">Draw</option>
                      </select>
                    </div>
                    
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removePlayer(index)}
                        disabled={players.length <= 1}
                        className="flex items-center gap-1 text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed px-2 py-2"
                      >
                        <TrashIcon className="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes about the game..."
                  rows={3}
                  className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-lg transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <TrophyIcon className="w-4 h-4" />
                      Submit Pod Report
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </AppLayout>
  )
}
