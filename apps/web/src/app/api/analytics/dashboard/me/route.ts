// apps/web/src/app/api/analytics/dashboard/me/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { handleAPIError } from '@dadgic/shared'
import { getDashboardData } from '@dadgic/shared'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
	try {
		console.log('📊 Dashboard API - Get request for current user')

		// 1. EXTRACT AUTH CONTEXT (follows pod pattern)
		const authContext = await requireAuth(request)

		// 2. CALL SERVICE (no validation needed for GET endpoint)
		console.log('🔄 Calling getDashboardData service')
		const result = await getDashboardData(authContext.user_id, authContext) // undefined = current user

		// 3. RETURN SERVICE RESPONSE (follows pod pattern)
		if (!result.success) {
			return NextResponse.json(result, { status: 400 })
		}

		return NextResponse.json(result, { status: 200 })

	} catch (error) {
		console.error('❌ Dashboard API - Error:', error)
		const apiError = handleAPIError(error)
		return NextResponse.json(apiError.toJSON(), {
			status: apiError.statusCode
		})
	}
}