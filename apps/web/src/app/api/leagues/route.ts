// File: apps/web/src/app/api/leagues/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { handleAPIError } from '@dadgic/shared'
import { validateLeagueRequest } from '@dadgic/shared'
import { createLeague, listLeagues } from '@dadgic/shared'
import { requireAdmin } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url)

		// Basic filtering (can expand later)
		const filters = {
			status: searchParams.get('status') || undefined,
			limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
			offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined
		}

		console.log('🎯 Leagues API - List request:', filters)

		// Use getAll for now (no filtering implemented)
		const leagues = await listLeagues(filters) // TODO: Add filtering

		return NextResponse.json({
			success: true,
			data: leagues,
			timestamp: new Date().toISOString()
		})

	} catch (error) {
		console.error('❌ Leagues API - List error:', error)
		const apiError = handleAPIError(error)
		return NextResponse.json(apiError.toJSON(), {
			status: apiError.statusCode
		})
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()

		console.log('🎯 Leagues API - Create request:', {
			name: body.name,
			playerCount: body.player_identifiers?.length,
			gamesPerPlayer: body.games_per_player
		})

		// 1. VALIDATE REQUEST (follow pod pattern)
		const validation = validateLeagueRequest(body)
		if (!validation.isValid) {
			// Return validation errors in consistent format
			return NextResponse.json({
				success: false,
				error: 'Invalid league request data',
				details: validation.errors,
				timestamp: new Date().toISOString()
			}, { status: 400 })
		}

		// 2. EXTRACT USER CONTEXT (league-specific requirement)
		const authContext = await requireAdmin(request)

		// 3. CALL SERVICE (follow pod pattern)
		const result = await createLeague(body, authContext)

		// 4. RETURN SERVICE RESPONSE DIRECTLY (follow pod pattern)
		if (!result.success) {
			return NextResponse.json(result, { status: 400 })
		}

		return NextResponse.json(result, { status: 201 })

	} catch (error) {
		console.error('❌ Leagues API - Create error:', error)
		const apiError = handleAPIError(error)
		return NextResponse.json(apiError.toJSON(), {
			status: apiError.statusCode
		})
	}
}