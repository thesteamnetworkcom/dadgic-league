'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import SignInButton from './components/discordbutton'

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
       if (session.user) {
        router.replace('/home')
      } else {
        setLoading(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    
    return () => {
      listener.subscription.unsubscribe()
    }
  }, [router])

  const signOut = async () => {
    await supabase.auth.signOut()
    location.reload()
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-white p-6 bg-gradient-to-b from-black to-gray-900">
      <h1 className="text-5xl font-bold mb-4">Dadgic</h1>
      <h2 className="text-xl mb-8 text-gray-300">The Magic Gathering for Grown-Ass People™</h2>

      {!loading && !user && (
        <SignInButton />
      )}

      {!loading && user && (
        <div className="text-center space-y-4">
          <p>
            Welcome, <strong>{user.user_metadata?.full_name || user.email}</strong>!
          </p>
          <div className="flex gap-4 justify-center mt-4">
            <Link
              href="/register"
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-bold"
            >
              Go to DMBL
            </Link>
            <button
              onClick={signOut}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-bold"
            >
              Log out
            </button>
          </div>
        </div>
      )}

      <footer className="absolute bottom-4 text-sm text-gray-500">
        <p>© {new Date().getFullYear()} Dadgic, LLC</p>
      </footer>
    </main>
  )
}