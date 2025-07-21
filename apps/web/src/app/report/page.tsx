// src/app/report/page.tsx - Updated with Navigation
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { PlusIcon, TrashIcon, TrophyIcon } from '@/components/icons'
import { db } from '@dadgic/database'
import { parseWithAI } from '@/lib/gemini'
import type { CreatePodInput } from '@dadgic/database'
import AppLayout from '@/components/AppLayout'

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
      const players = await db.players.getAll()
      setAvailablePlayers(players)
    } catch (error) {
      console.error('Error loading players:', error)
    }
  }

  // ... rest of your existing logic (parseWithAI, handleSubmit, etc.)

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
                  onClick={() => {/* your parseWithAI logic */}}
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
            <div className="space-y-6">
              {/* Your existing structured form */}
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
                    onChange={(e) => setGameLengthMinutes(e.target.value ? parseInt(e.target.value) : '')}
                    className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="90"
                  />
                </div>
              </div>

              {/* Players section with your existing logic */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-neutral-300">
                    Players ({players.length})
                  </label>
                  <button
                    onClick={() => setPlayers([...players, { discord_username: '', commander_deck: '', result: 'lose' }])}
                    className="flex items-center gap-1 text-primary-400 hover:text-primary-300 text-sm"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add Player
                  </button>
                </div>
                
                {/* Player forms */}
                <div className="space-y-4">
                  {players.map((player, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-neutral-700/50 rounded-lg">
                      {/* Your existing player form fields */}
                      <div className="flex-1">
                        <input
                          type="text"
                          value={player.discord_username}
                          onChange={(e) => {
                            const newPlayers = [...players]
                            newPlayers[index].discord_username = e.target.value
                            setPlayers(newPlayers)
                          }}
                          placeholder="Discord username"
                          className="w-full bg-neutral-600 border border-neutral-500 rounded px-3 py-2 text-white text-sm"
                        />
                      </div>
                      
                      <div className="flex-1">
                        <input
                          type="text"
                          value={player.commander_deck}
                          onChange={(e) => {
                            const newPlayers = [...players]
                            newPlayers[index].commander_deck = e.target.value
                            setPlayers(newPlayers)
                          }}
                          placeholder="Commander"
                          className="w-full bg-neutral-600 border border-neutral-500 rounded px-3 py-2 text-white text-sm"
                        />
                      </div>
                      
                      <select
                        value={player.result}
                        onChange={(e) => {
                          const newPlayers = [...players]
                          newPlayers[index].result = e.target.value as 'win' | 'lose' | 'draw'
                          setPlayers(newPlayers)
                        }}
                        className="bg-neutral-600 border border-neutral-500 rounded px-3 py-2 text-white text-sm"
                      >
                        <option value="lose">Loss</option>
                        <option value="win">Win</option>
                        <option value="draw">Draw</option>
                      </select>
                      
                      {players.length > 1 && (
                        <button
                          onClick={() => setPlayers(players.filter((_, i) => i !== index))}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit button */}
              <div className="flex justify-end">
                <button
                  onClick={() => {/* your handleSubmit logic */}}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-accent-500 hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <TrophyIcon className="w-4 h-4" />
                      Report Game
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </AppLayout>
  )
}