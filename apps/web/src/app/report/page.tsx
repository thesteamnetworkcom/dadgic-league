// src/app/report/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { PlusIcon, TrashIcon, TrophyIcon } from '@/components/icons'
import { db } from '@dadgic/database'
import { parseWithAI } from '@/lib/gemini'
import type { CreatePodInput } from '@dadgic/database'

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
      loadPlayers()
    }
  }, [user, loading, router])

  const loadPlayers = async () => {
    try {
      const allPlayers = await db.players.getAll()
      setAvailablePlayers(allPlayers)
    } catch (error) {
      console.error('Error loading players:', error)
      setError('Failed to load players')
    }
  }

  const handleAIParse = async () => {
    if (!aiInput.trim()) {
      setAiError('Please enter a game description')
      return
    }

    setIsParsingAI(true)
    setAiError(null)

    try {
      const result = await parseWithAI(aiInput.trim())
      
      if (!result.success) {
        setAiError(result.error || 'Failed to parse game description')
        return
      }

      if (!result.data) {
        setAiError('No data returned from AI')
        return
      }

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
      
    } catch (error) {
      console.error('AI parsing error:', error)
      setAiError('Failed to parse game description')
    } finally {
      setIsParsingAI(false)
    }
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
      const submission: CreatePodInput = {
        date,
        game_length_minutes: gameLengthMinutes === '' ? undefined : Number(gameLengthMinutes),
        turns: turns === '' ? undefined : Number(turns),
        notes: notes.trim() || undefined,
        participants: []
      }

      for (const player of players) {
        const foundPlayer = availablePlayers.find(
          p => p.discord_username === player.discord_username || p.name === player.discord_username
        )
        
        if (!foundPlayer) {
          throw new Error(`Player "${player.discord_username}" not found in database`)
        }

        submission.participants.push({
          player_id: foundPlayer.id,
          commander_deck: player.commander_deck,
          result: player.result
        })
      }

      await db.pods.create(submission)
      router.push('/dashboard?success=pod-reported')
      
    } catch (error) {
      console.error('Error submitting pod:', error)
      setError(error instanceof Error ? error.message : 'Failed to submit pod report')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      {/* Header */}
      <header className="bg-neutral-800/50 backdrop-blur-sm border-b border-neutral-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <TrophyIcon className="h-8 w-8 text-accent-500" />
              <h1 className="text-2xl font-bold text-white">Report Pod</h1>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-neutral-400 hover:text-white transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mode Toggle */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className="bg-neutral-700 rounded-lg p-1 flex">
              <button
                type="button"
                onClick={() => setMode('ai')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  mode === 'ai' 
                    ? 'bg-primary-500 text-white' 
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                🤖 AI Parser
              </button>
              <button
                type="button"
                onClick={() => setMode('structured')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  mode === 'structured' 
                    ? 'bg-primary-500 text-white' 
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                📝 Manual Form
              </button>
            </div>
          </div>
        </div>

        {/* AI Mode */}
        {mode === 'ai' && (
          <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Describe Your Game</h2>
            <p className="text-neutral-400 mb-4">
              Tell me about your Commander game in natural language. For example:
            </p>
            <div className="bg-neutral-700/50 rounded-lg p-3 mb-4 text-sm text-neutral-300">
              "Scott beat Mike and John yesterday with Teval. Mike played Atraxa, John had Krenko. Game took about 90 minutes."
            </div>
            
            <textarea
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={4}
              placeholder="Describe your game..."
            />
            
            {aiError && (
              <div className="mt-4 bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                <p className="text-red-400">{aiError}</p>
              </div>
            )}
            
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleAIParse}
                disabled={isParsingAI || !aiInput.trim()}
                className="bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                {isParsingAI ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Parsing...</span>
                  </>
                ) : (
                  <span>Parse with AI</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Structured Form Mode */}
        {mode === 'structured' && (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Game Details */}
            <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Game Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Game Length (minutes)
                  </label>
                  <input
                    type="number"
                    value={gameLengthMinutes}
                    onChange={(e) => setGameLengthMinutes(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="120"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Turns
                  </label>
                  <input
                    type="number"
                    value={turns}
                    onChange={(e) => setTurns(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="12"
                    min="1"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                  placeholder="Any additional notes about the game..."
                />
              </div>
            </div>

            {/* Players */}
            <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Players</h2>
                <button
                  type="button"
                  onClick={addPlayer}
                  className="flex items-center space-x-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Add Player</span>
                </button>
              </div>

              <div className="space-y-4">
                {players.map((player, index) => (
                  <div key={index} className="bg-neutral-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-medium">Player {index + 1}</h3>
                      {players.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePlayer(index)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                          Player Name *
                        </label>
                        <input
                          type="text"
                          value={player.discord_username}
                          onChange={(e) => updatePlayer(index, 'discord_username', e.target.value)}
                          className="w-full bg-neutral-600 border border-neutral-500 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Scott, Mike, etc."
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                          Commander Deck *
                        </label>
                        <input
                          type="text"
                          value={player.commander_deck}
                          onChange={(e) => updatePlayer(index, 'commander_deck', e.target.value)}
                          className="w-full bg-neutral-600 border border-neutral-500 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Teval, Atraxa, etc."
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                          Result *
                        </label>
                        <select
                          value={player.result}
                          onChange={(e) => updatePlayer(index, 'result', e.target.value)}
                          className="w-full bg-neutral-600 border border-neutral-500 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          required
                        >
                          <option value="lose">Loss</option>
                          <option value="win">Win</option>
                          <option value="draw">Draw</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-accent-500 hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Report Pod'}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  )
}