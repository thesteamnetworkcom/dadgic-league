'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function HomePage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        router.push('/') // Not logged in? Back to landing
      } else {
        setUser(session.user)
        setLoading(false)
      }
    })
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return <p className="p-6 text-white">Loading...</p>

  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-white bg-gradient-to-b from-gray-900 to-black p-6">
      <h1 className="text-4xl font-bold mb-4">Welcome to the DMBL</h1>
      <p className="mb-6 text-gray-300">
        Let’s get weird. Matches, standings, league history — coming soon.
      </p>

      <nav className="space-x-4">
        <Link href="/matches" className="underline hover:text-blue-400">
          Matches
        </Link>
        <Link href="/players" className="underline hover:text-blue-400">
          Players
        </Link>
        <Link href="/profile" className="underline hover:text-blue-400">
          Profile
        </Link>
      </nav>

      <button
        onClick={handleSignOut}
        className="mt-8 bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-bold"
      >
        Log Out
      </button>
    </main>
  )
}