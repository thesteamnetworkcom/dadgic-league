// src/lib/auth.ts
import { db } from '@dadgic/database'
import { SupabaseClientFactory } from '@dadgic/database'
import { clearSessionCache, getCachedUser, isSessionValid, setSessionCache } from './auth-session'

// Re-export the supabase client for use in other parts of the app
export const supabase = SupabaseClientFactory.getClient()

export type User = {
	id: string
	email?: string
	discord_id?: string
	discord_username?: string
	name?: string
	avatar_url?: string,
	role?: string,
	auth_id?: string
}

export type AuthState = {
	user: User | null
	loading: boolean
	error: string | null
}

export async function signInWithDiscord() {
	try {
		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: 'discord',
			options: {
				redirectTo: `${window.location.origin}/auth/callback`,
				scopes: 'identify email'
			}
		})

		if (error) {
			console.error('Discord OAuth error:', error)
			throw error
		}

		return data
	} catch (error) {
		console.error('Sign in error:', error)
		throw error
	}
}

export async function signOut() {
	try {
		clearSessionCache()
		const { error } = await supabase.auth.signOut()
		if (error) throw error
	} catch (error) {
		console.error('Sign out error:', error)
		throw error
	}
}

export async function getCurrentUser(accessToken?: string): Promise<User | null> {
	try {
		// ✅ STEP 1: Check session cache first (client-side only)
		if (!accessToken && isSessionValid()) {
			const cachedUser = getCachedUser()
			console.log('🔒 Using cached user:', cachedUser?.id)
			return cachedUser
		}

		console.log('🔒 Cache miss, checking Supabase auth:', { 
			hasAccessToken: !!accessToken,
			cacheValid: isSessionValid()
		})

		// ✅ STEP 2: Determine which Supabase client to use
		const client = accessToken 
			? SupabaseClientFactory.getClient('server-user', { accessToken })
			: supabase

		// ✅ STEP 3: Get Supabase auth user (network call)
		const { data: { user: authUser }, error } = await client.auth.getUser()

		if (error) throw error
		if (!authUser) {
			// No auth user - clear cache and return null
			clearSessionCache()
			console.log('🔒 No auth user found')
			return null
		}

		// ✅ STEP 4: Get additional user data from players table (database call)
		const playerData = await db.players.findByDiscordId(authUser.user_metadata?.provider_id)
		
		if (!playerData) {
			// Auth user exists but no player data - clear cache
			clearSessionCache()
			console.log('🔒 Auth user found but no player data')
			return null
		}

		// ✅ STEP 5: Build user object
		const userData: User = {
			id: playerData.id, // This is the player_id we need
			email: authUser.email,
			discord_id: authUser.user_metadata?.provider_id,
			discord_username: authUser.user_metadata?.full_name,
			name: playerData.name || authUser.user_metadata?.full_name,
			avatar_url: authUser.user_metadata?.avatar_url,
			role: playerData.role,
			auth_id: authUser.id
		}

		// ✅ STEP 6: Cache the result (client-side only)
		if (!accessToken) {
			setSessionCache(true, userData)
		}

		console.log('🔒 User authenticated and cached:', { 
			id: userData.id, 
			name: userData.name 
		})
		
		return userData

	} catch (error) {
		console.error('Error getting current user:', error)
		// Clear cache on any error
		clearSessionCache()
		return null
	}
}

export async function syncUserWithPlayer(user: User) {
	try {
		console.log('syncUserWithPlayer: Starting with user:', {
			discord_id: user.discord_id,
			discord_username: user.discord_username,
			name: user.name
		})

		if (!user.discord_id && !user.discord_username) {
			console.log('syncUserWithPlayer: No Discord ID or username, skipping')
			return
		}

		console.log('syncUserWithPlayer: Checking existing player...')

		// Try to find existing player by discord_id first
		let existingPlayer = null
		if (user.discord_id) {
			existingPlayer = await db.players.findByDiscordId(user.discord_id)
			console.log('syncUserWithPlayer: Found by discord_id:', existingPlayer)
		}

		// If not found by discord_id, try to find by discord_username
		if (!existingPlayer && user.discord_username) {
			try {
				// We need to add a method to find by discord_username, but for now let's query directly
				const { data: usernameMatches, error } = await supabase
					.from('players')
					.select('*')
					.eq('discord_username', user.discord_username)
					.limit(1)

				if (!error && usernameMatches && usernameMatches.length > 0) {
					existingPlayer = usernameMatches[0]
					console.log('syncUserWithPlayer: Found by discord_username:', existingPlayer)
				}
			} catch (usernameError) {
				console.log('syncUserWithPlayer: Error searching by username:', usernameError)
			}
		}

		if (existingPlayer) {
			console.log('syncUserWithPlayer: Updating existing player...')
			await db.players.update(existingPlayer.id, {
				discord_id: user.discord_id || existingPlayer.discord_id, // Fill in discord_id if missing
				discord_username: user.discord_username || existingPlayer.discord_username,
				email: user.email || existingPlayer.email,
				name: existingPlayer.name, // Keep existing name, don't overwrite with Discord display name
				auth_id: user.auth_id
			})
			console.log('syncUserWithPlayer: Update complete')
		} else {
			console.log('syncUserWithPlayer: Creating new player...')
			await db.players.create({
				name: user.discord_username || user.name || 'Unknown Player',
				discord_id: user.discord_id || null, // Explicitly handle undefined
				discord_username: user.discord_username || null,
				email: user.email || null,
				role: "player"
			})
			console.log('syncUserWithPlayer: Create complete')
		}
	} catch (error) {
		console.error('syncUserWithPlayer: Error:', error)
		throw error
	}
}