'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const [user, setUser] = useState(null)
  const [player, setPlayer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const router = useRouter()
  
  useEffect(() => {
    async function init() {
      // Step 1: Get logged in user
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      setUser(user)

      if (!user) {
        setLoading(false)
        return
      }

      // Step 2: See if player already exists
      const { data: existing, error: fetchError } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (fetchError) {
        setError('Could not check player status')
        setLoading(false)
        return
      }

      if (existing) {
        setPlayer(existing)
        setLoading(false)
        return
      }

      // Step 3: Auto-register this user
      const username = user.user_metadata?.user_name || user.user_metadata?.full_name || 'Unknown'
      const email = user.email

      const { data: created, error: insertError } = await supabase.from('players').insert([
        {
          user_id: user.id,
          display_name: username,
          email: user.email,
          active: true,
        },
      ]).select().maybeSingle()

      if (insertError) {
        setError('Auto-registration failed: ' + insertError.message)
      } else {
        setPlayer(created)
        router.push('/home')
      }

      setLoading(false)
    }

    init()
  }, [])

  if (loading) return <p className="p-6 text-white">Loading...</p>
  if (error) return <p className="p-6 text-red-400">{error}</p>
  if (!user) return <p className="p-6 text-white">Please log in with Discord to register.</p>

  return (
    <main className="p-6 max-w-md mx-auto text-white">
      <h1 className="text-3xl font-bold mb-4">Welcome to the DMBL</h1>
      <p className="mb-2">You're registered as <strong>{player.display_name}</strong></p>
      <p className="text-sm text-gray-400">({player.email})</p>
    </main>
  )
}