'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function PlayersPage() {
  const [players, setPlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPlayers() {
      const { data, error } = await supabase
        .from('players')
        .select(`
          id,
          display_name,
          email,
          matches (
            id
          )
        `)
        .order('display_name', { ascending: true })

      if (error) {
        console.error('Failed to load players:', error.message)
      } else {
        setPlayers(data)
      }

      setLoading(false)
    }

    loadPlayers()
  }, [])

  if (loading) return <p>Loading players...</p>

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Players</h1>
      <ul className="space-y-2">
        {players.map((p) => (
          <li key={p.id} className="border rounded p-3 shadow-sm">
            <div className="font-semibold">{p.display_name}</div>
            <div className="text-sm text-gray-600">{p.email}</div>
            <div className="text-sm">
              Matches Played: {p.matches?.length ?? 0}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}