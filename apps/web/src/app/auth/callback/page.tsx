// src/app/auth/callback/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/auth'

export default function AuthCallback() {
	const router = useRouter()
	const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		console.log('Auth callback component mounted')

		// Listen for auth state changes instead of trying to get user immediately
		const { data: { subscription } } = supabase.auth.onAuthStateChange(
			async (event, session) => {
				console.log('Auth state change in callback:', event, session?.user?.id)

				if (event === 'SIGNED_IN' && session?.user) {
					console.log('User signed in successfully:', session.user.id)
					setStatus('success')

					// Redirect to dashboard
					setTimeout(() => {
						router.push('/dashboard')
					}, 2000)
				} else if (event === 'SIGNED_OUT') {
					console.log('User signed out')
					setError('Authentication failed')
					setStatus('error')
				}
			}
		)

		// Also try to get current session as fallback
		const checkSession = async () => {
			const { data: { session } } = await supabase.auth.getSession()
			console.log('Current session check:', session?.user?.id)

			if (session?.user) {
				console.log('Found existing session, redirecting...')
				setStatus('success')
				setTimeout(() => {
					router.push('/dashboard')
				}, 1000)
			}
		}

		// Check session after a brief delay to let auth settle
		setTimeout(checkSession, 1000)

		return () => subscription.unsubscribe()
	}, [router])

	const handleRetry = () => {
		router.push('/')
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center">
			<div className="max-w-md w-full mx-4">
				<div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-8 text-center">
					{status === 'loading' && (
						<>
							<div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
							<h2 className="text-2xl font-bold text-white mb-2">Completing Sign In</h2>
							<p className="text-neutral-400">Please wait while we process your authentication...</p>
						</>
					)}

					{status === 'success' && (
						<>
							<div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
								<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
								</svg>
							</div>
							<h2 className="text-2xl font-bold text-white mb-2">Welcome!</h2>
							<p className="text-neutral-400">Successfully signed in. Redirecting to dashboard...</p>
						</>
					)}

					{status === 'error' && (
						<>
							<div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
								<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</div>
							<h2 className="text-2xl font-bold text-white mb-2">Authentication Failed</h2>
							<p className="text-neutral-400 mb-4">{error || 'An error occurred during sign in'}</p>
							<button
								onClick={handleRetry}
								className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
							>
								Try Again
							</button>
						</>
					)}
				</div>
			</div>
		</div>
	)
}