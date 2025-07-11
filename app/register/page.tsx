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
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    setUser(user)

    if (!user) {
      setLoading(false)
      return
    }

    const user_id = user.id
    const username = user.user_metadata?.user_name || user.user_metadata?.full_name || 'Unknown'
    const email = user.email

    // Step 1: Check if player exists by user_id
    const { data: existingById, error: fetchError } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle()

    if (fetchError) {
      setError('Could not check player status')
      setLoading(false)
      return
    }

    if (existingById) {
      setPlayer(existingById)
      setLoading(false)
      return
    }

    // Step 2: Check if a historical player exists by display_name
    const { data: existingByName, error: nameCheckError } = await supabase
      .from('players')
      .select('*')
      .eq('display_name', username)
      .maybeSingle()

    if (nameCheckError) {
      setError('Could not check name-based player status')
      setLoading(false)
      return
    }

    if (existingByName) {
      // Step 2a: Patch in the user_id now that they've logged in
      const { error: updateError } = await supabase
        .from('players')
        .update({ user_id })
        .eq('id', existingByName.id)

      if (updateError) {
        setError('Failed to link existing player to user_id: ' + updateError.message)
        setLoading(false)
        return
      }

      setPlayer({ ...existingByName, user_id })
      router.push('/home')
      return
    }

    // Step 3: No match found, insert new record
    const { data: created, error: insertError } = await supabase
      .from('players')
      .insert([
        {
          user_id: user_id,
          display_name: username,
          email: email,
          active: true,
        },
      ])
      .select()
      .maybeSingle()

    if (insertError) {
      setError('Auto-registration failed: ' + insertError.message)
    } else {
      setPlayer(created)
      router.push('/home')
    }

    setLoading(false)
  }

  init()
}, [router])

  if (loading) return <p className="p-6 text-white">Loading...</p>
  if (error) return <p className="p-6 text-red-400">{error}</p>
  if (!user) return <p className="p-6 text-white">Please log in with Discord to register.</p>

  return (
    <main className="p-6 max-w-md mx-auto text-white">
      <h1 className="text-3xl font-bold mb-4">Welcome to the DMBL</h1>
      <p className="mb-2">{`You're registered as `}<strong>{player.display_name}</strong></p>
      <p className="text-sm text-gray-400">({player.email})</p>
    </main>
  )
}