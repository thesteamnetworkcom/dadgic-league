import { NextRequest } from 'next/server'
import { getCurrentUser } from './auth'
import { AuthContext } from '@dadgic/database'

export async function extractAuthContext(headers: any, cookies: any): Promise<AuthContext> {
	try {
		const accessToken = extractAccessToken(headers, cookies)
		if (!accessToken) {
			throw new Error('Access token not found in request')
		}
		const user = await getCurrentUser(accessToken)

		if (!user || !user.auth_id) {
			throw new Error('Authentication required')
		}
		
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
function extractAccessToken(headers: any, cookies: any): string | null {
	// Try Authorization header first (Bearer token)
	const authHeader = headers.get('authorization')
	if (authHeader?.startsWith('Bearer ')) {
		return authHeader.replace('Bearer ', '')
	}

	// Try custom header
	const customHeader = headers.get('x-supabase-auth-token')
	if (customHeader) {
		return customHeader
	}

	// Try cookie (most common for web apps)
	const authCookie = cookies.get('sb-access-token')?.value
	if (authCookie) {
		return authCookie
	}

	// Try supabase session cookie format
	const sessionCookie = cookies.get('supabase-auth-token')?.value
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
export async function requireAuth(headers: any, cookies: any): Promise<AuthContext> {
	return extractAuthContext(headers, cookies)
}

export async function requireAdmin(headers: any, cookies: any): Promise<AuthContext> {
	const auth = await extractAuthContext(headers, cookies)
	if (!auth.is_admin) {
		throw new Error('Admin access required')
	}
	return auth
}