// src/app/page.tsx - Updated with Navigation
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/auth'
import { DiscordIcon, TrophyIcon, StatsIcon, UsersIcon } from '@/components/icons'
import AppLayout from '@/components/AppLayout'

export default function Home() {
	const { user, loading } = useAuth()
	const router = useRouter()

	useEffect(() => {
		// If user is already authenticated, redirect to dashboard
		if (!loading && user) {
			router.push('/dashboard')
		}
	}, [user, loading, router])

	const handleDiscordSignIn = async () => {
		try {
			const { error } = await supabase.auth.signInWithOAuth({
				provider: 'discord',
				options: {
					redirectTo: `${window.location.origin}/auth/callback`
				}
			})
			if (error) throw error
		} catch (error) {
			console.error('Error signing in with Discord:', error)
		}
	}

	if (loading) {
		return (
			<AppLayout showNavigation={false}>
				<div className="flex items-center justify-center min-h-screen">
					<div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
				</div>
			</AppLayout>
		)
	}

	if (user) {
		return null // Will redirect to dashboard
	}

	return (
		<AppLayout showNavigation={false}>
			<main>
				{/* Hero Section */}
				<div className="relative overflow-hidden">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
						<div className="text-center">
							<div className="flex justify-center mb-8">
								<TrophyIcon className="h-20 w-20 text-accent-500" />
							</div>

							<h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
								Dadgic MTG Tracker
							</h1>

							<p className="text-xl md:text-2xl text-neutral-300 mb-8 max-w-3xl mx-auto">
								Track your Magic: The Gathering Commander games, compete with friends,
								and manage leagues with automated pod generation.
							</p>

							<button
								onClick={handleDiscordSignIn}
								className="inline-flex items-center gap-3 bg-discord-500 hover:bg-discord-600 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
							>
								<DiscordIcon className="h-6 w-6" />
								Sign in with Discord
							</button>
						</div>
					</div>
				</div>

				{/* Features Section */}
				<div className="py-24 bg-neutral-800/30">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="text-center mb-16">
							<h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
								Everything You Need for Commander
							</h2>
							<p className="text-xl text-neutral-400 max-w-2xl mx-auto">
								Comprehensive tools for tracking games, managing leagues, and analyzing your Commander performance.
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
							{/* Game Tracking */}
							<div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-8 text-center">
								<div className="flex justify-center mb-6">
									<StatsIcon className="h-12 w-12 text-primary-400" />
								</div>
								<h3 className="text-xl font-bold text-white mb-4">Game Tracking</h3>
								<p className="text-neutral-400 mb-6">
									Record your Commander games with detailed statistics. Track wins, losses,
									commanders used, and game performance over time.
								</p>
								<ul className="text-neutral-300 text-sm space-y-2">
									<li>• AI-powered game description parsing</li>
									<li>• Manual structured form entry</li>
									<li>• Discord bot integration</li>
									<li>• Comprehensive game statistics</li>
								</ul>
							</div>

							{/* League Management */}
							<div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-8 text-center">
								<div className="flex justify-center mb-6">
									<TrophyIcon className="h-12 w-12 text-accent-400" />
								</div>
								<h3 className="text-xl font-bold text-white mb-4">League Management</h3>
								<p className="text-neutral-400 mb-6">
									Create and manage Commander leagues with automated pod generation.
									Ensure balanced matchups and fair competition.
								</p>
								<ul className="text-neutral-300 text-sm space-y-2">
									<li>• Automated balanced pod creation</li>
									<li>• League progress tracking</li>
									<li>• Scheduled pod management</li>
									<li>• Admin controls and permissions</li>
								</ul>
							</div>

							{/* Community Features */}
							<div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-8 text-center">
								<div className="flex justify-center mb-6">
									<UsersIcon className="h-12 w-12 text-secondary-400" />
								</div>
								<h3 className="text-xl font-bold text-white mb-4">Community Integration</h3>
								<p className="text-neutral-400 mb-6">
									Connect with your Discord community. Report games through bot commands
									and compete with friends in organized leagues.
								</p>
								<ul className="text-neutral-300 text-sm space-y-2">
									<li>• Discord authentication</li>
									<li>• Discord bot game reporting</li>
									<li>• Player statistics and rankings</li>
									<li>• Community leaderboards</li>
								</ul>
							</div>
						</div>
					</div>
				</div>

				{/* How It Works Section */}
				<div className="py-24">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="text-center mb-16">
							<h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
								How It Works
							</h2>
							<p className="text-xl text-neutral-400">
								Get started in minutes and start tracking your Commander games today.
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
							<div className="text-center">
								<div className="bg-primary-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
									1
								</div>
								<h3 className="text-lg font-semibold text-white mb-2">Sign In</h3>
								<p className="text-neutral-400 text-sm">
									Connect your Discord account to get started and join your community.
								</p>
							</div>

							<div className="text-center">
								<div className="bg-primary-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
									2
								</div>
								<h3 className="text-lg font-semibold text-white mb-2">Play Games</h3>
								<p className="text-neutral-400 text-sm">
									Play your Commander games as usual with your favorite decks and friends.
								</p>
							</div>

							<div className="text-center">
								<div className="bg-primary-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
									3
								</div>
								<h3 className="text-lg font-semibold text-white mb-2">Report Results</h3>
								<p className="text-neutral-400 text-sm">
									Use the web interface or Discord bot to quickly report your game results.
								</p>
							</div>

							<div className="text-center">
								<div className="bg-primary-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
									4
								</div>
								<h3 className="text-lg font-semibold text-white mb-2">Track Progress</h3>
								<p className="text-neutral-400 text-sm">
									View your statistics, participate in leagues, and see how you improve over time.
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* CTA Section */}
				<div className="py-24 bg-gradient-to-r from-primary-600/20 to-accent-600/20">
					<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
						<h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
							Ready to Level Up Your Commander Games?
						</h2>
						<p className="text-xl text-neutral-300 mb-8">
							Join your friends and start tracking your Magic: The Gathering Commander journey today.
						</p>
						<button
							onClick={handleDiscordSignIn}
							className="inline-flex items-center gap-3 bg-discord-500 hover:bg-discord-600 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
						>
							<DiscordIcon className="h-6 w-6" />
							Get Started with Discord
						</button>
					</div>
				</div>
			</main>
		</AppLayout>
	)
}