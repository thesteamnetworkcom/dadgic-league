import { NextRequest } from 'next/server'
import { getCurrentUser, getCurrentUserServer } from './auth'
import { AuthContext } from '@dadgic/database/src/types/api'


export async function extractAuthContext(request: NextRequest): Promise<AuthContext> {
	try {
		const accessToken = extractAccessToken(request)
		if (!accessToken) {
			throw new Error('Access token not found in request')
		}
		const user = await getCurrentUserServer(accessToken)

		if (!user || !user.auth_id) {
			throw new Error('Authentication required')
		}
		console.log("AUTHCONTEXT: ", user)
		return {
			user_id: user.id,
			supabase_user_id: user.auth_id,
			is_admin: user.role === 'admin',
			player_role: user.role === 'admin' ? 'admin' : 'player'
		}
	} catch (error) {
		throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}
/**
 * Extract access token from request headers or cookies
 */
function extractAccessToken(request: NextRequest): string | null {
	console.log(request.headers)
	// Try Authorization header first (Bearer token)
	const authHeader = request.headers.get('authorization')
	console.log(authHeader);
	if (authHeader?.startsWith('Bearer ')) {
		return authHeader.replace('Bearer ', '')
	}

	// Try custom header
	const customHeader = request.headers.get('x-supabase-auth-token')
	if (customHeader) {
		return customHeader
	}

	// Try cookie (most common for web apps)
	const authCookie = request.cookies.get('sb-access-token')?.value
	if (authCookie) {
		return authCookie
	}

	// Try supabase session cookie format
	const sessionCookie = request.cookies.get('supabase-auth-token')?.value
	if (sessionCookie) {
		try {
			const parsed = JSON.parse(sessionCookie)
			return parsed.access_token
		} catch {
			// Invalid JSON, ignore
		}
	}

	return null
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