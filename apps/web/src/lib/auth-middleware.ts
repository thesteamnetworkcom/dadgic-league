import { NextRequest } from 'next/server'
import { getCurrentUser } from './auth'
import { AuthContext } from '@dadgic/database/src/types/api'


export async function extractAuthContext(request: NextRequest): Promise<AuthContext> {
	try {
		const user = await getCurrentUser()

		if (!user || !user.id) {
			throw new Error('Authentication required')
		}

		return {
			user_id: user.id,
			supabase_user_id: user.id,
			is_admin: user.role === 'admin',
			player_role: user.role === 'admin' ? 'admin' : 'player'
		}
	} catch (error) {
		throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

export async function requireAuth(request: NextRequest): Promise<AuthContext> {
	return extractAuthContext(request)
}

export async function requireAdmin(request: NextRequest): Promise<AuthContext> {
	const auth = await extractAuthContext(request)
	if (!auth.is_admin) {
		throw new Error('Admin access required')
	}
	return auth
}