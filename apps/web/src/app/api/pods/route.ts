// apps/web/src/app/api/pod/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { handleAPIError } from '@dadgic/shared'
import { validatePodRequest } from '@dadgic/shared'
import { createPod } from '@dadgic/shared'
import type { PodInput } from '@dadgic/database'
import { requireAuth } from '@/lib/auth-middleware'
import { cookies, headers } from 'next/headers'

export async function POST(request: NextRequest) {
	const requestHeaders = headers();
	const requestCookies = cookies();
	try {
		const body = await request.json()

		console.log('🎮 Pod API - Create request:', {
			date: body.date,
			participantsCount: body.participants?.length
		})
		const authContext = await requireAuth(requestHeaders, requestCookies)
		// 1. VALIDATE REQUEST - Check that workable data was passed
		const validation = validatePodRequest(body)
		// 2. 
		if (!validation.isValid) {
			return NextResponse.json({
				success: false,
				error: 'Invalid pod data - use AI parsing endpoint first',
				field_errors: validation.errors,
				timestamp: new Date().toISOString()
			}, { status: 400 })
		}

		// 3. PASS UNRESOLVED POD OBJECT TO PODSERVICE
		// This path is for validated structured data (either initial submission or after AI review)
		console.log('🔄 Passing validated pod to PodService for resolution and creation')

		const podInput: PodInput = {
			date: body.date,
			league_id: body.league_id || null,
			game_length_minutes: body.game_length_minutes || null,
			turns: body.turns || null,
			notes: body.notes || null,
			participants: body.participants
		}

		const result = await createPod(podInput, authContext)

		if (!result.success) {
			return NextResponse.json(result, { status: 400 })
		}

		return NextResponse.json(result, { status: 201 })

	} catch (error) {
		console.error('❌ Pod API - Create error:', error)
		const apiError = handleAPIError(error)
		return NextResponse.json(apiError.toJSON(), {
			status: apiError.statusCode
		})
	}
}