'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [player, setPlayer] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user

      if (!user) {
        router.replace('/') // not logged in
        return
      }

      setUser(user)

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
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Failed to load player:', error.message)
      } else {
        setPlayer(data)
      }

      setLoading(false)
    }

    loadProfile()
  }, [router])

  if (loading) return <p>Loading profile...</p>
  if (!player) return <p>No profile found.</p>

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-2">Profile</h1>
      <div className="mb-2"><strong>Display Name:</strong> {player.display_name}</div>
      <div className="mb-2"><strong>Email:</strong> {player.email}</div>
      <div className="mb-2"><strong>Matches Played:</strong> {player.matches?.length ?? 0}</div>
      {/* Optional future controls like "Edit", "Deactivate", etc. */}
    </div>
  )
}