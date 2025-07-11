'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function MatchesPage() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
async function fetchAllMatches() {
  const allMatches = []
  let from = 0
  const chunkSize = 1000
  let done = false

  while (!done) {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        id,
        commander,
        win,
        win_con,
        player_id,
        player:players (
          id,
          display_name
        ),
        pods (
          id,
          date,
          location,
          format
        )
      `)
      .order('date', { foreignTable: 'pods', ascending: false })
      .range(from, from + chunkSize - 1)

    if (error) {
      console.error('Error fetching match chunk:', error.message)
      break
    }

    if (data.length < chunkSize) {
      done = true
    }

    allMatches.push(...data)
    from += chunkSize
  }

  return allMatches
}
useEffect(() => {
  async function load() {
    const results = await fetchAllMatches()
    console.log('Total matches:', results.length)
    setMatches(results)
    setLoading(false)
  }

  load()
}, [])

  if (loading) return <p>Loading matches...</p>

  // Group by pod_id
  const grouped = matches.reduce((acc, match) => {
    const podId = match.pods.id
    if (!acc[podId]) acc[podId] = {
      ...match.pods,
      matches: []
    }
    acc[podId].matches.push(match)
    return acc
  }, {})
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Matches</h1>
      {Object.values(grouped).map((pod: any) => (
        <div key={pod.id} className="mb-6 border rounded p-4">
          <div className="mb-2 text-sm text-gray-500">
            <span>{pod.date}</span> · <span>{pod.format}</span> · <span>{pod.location}</span>
          </div>
          <ul className="space-y-1">
            {pod.matches.map((m: any) => ( 
              <li key={m.id} className="flex justify-between">
                <span>{m.player.display_name} — {m.commander}</span>
                <span>{m.win ? '✅' : ''} {m.win_con && `(${m.win_con})`}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}