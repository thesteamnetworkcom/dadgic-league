// apps/web/src/app/auth/callback/page.tsx
// Simplified auth callback that trusts the auth state change event

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/auth'

export default function AuthCallback() {
	const router = useRouter()
	const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		console.log('🔒 Auth callback: Setting up listener')

		// ✅ SIMPLIFIED: Just listen for auth state changes, no manual checks
		const { data: { subscription } } = supabase.auth.onAuthStateChange(
			async (event, session) => {
				console.log('🔒 Auth callback - state change:', event, session?.user?.id)

				if (event === 'SIGNED_IN' && session?.user) {
					console.log('🔒 Sign in successful, redirecting to dashboard')
					setStatus('success')
					
					// Short delay for user feedback, then redirect
					setTimeout(() => {
						router.push('/dashboard')
					}, 1500)
					
				} else if (event === 'SIGNED_OUT') {
					console.log('🔒 Sign out detected in callback')
					setError('Authentication failed')
					setStatus('error')
					
				} else if (event === 'TOKEN_REFRESHED') {
					console.log('🔒 Token refreshed during callback')
					// This might happen during OAuth flow, continue waiting
					
				} else {
					console.log('🔒 Other auth event:', event)
					// For other events, just continue waiting
				}
			}
		)

		// ✅ REMOVED: Manual session checks, setTimeout fallbacks, redundant getSession calls
		// The auth state change listener is the single source of truth

		// Clean up on unmount
		return () => {
			console.log('🔒 Auth callback: Cleaning up listener')
			subscription.unsubscribe()
		}
	}, [router])

	const handleRetry = () => {
		console.log('🔒 Auth callback: Retrying authentication')
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
							<p className="text-neutral-400">
								Waiting for authentication to complete...
							</p>
						</>
					)}

					{status === 'success' && (
						<>
							<div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
								<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
								</svg>
							</div>
							<h2 className="text-2xl font-bold text-white mb-2">Welcome to Dadgic!</h2>
							<p className="text-neutral-400">
								Authentication successful. Redirecting to dashboard...
							</p>
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
							<p className="text-neutral-400 mb-4">
								{error || 'Unable to complete sign in. Please try again.'}
							</p>
							<button
								onClick={handleRetry}
								className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
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