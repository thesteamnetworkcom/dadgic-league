import { NextRequest, NextResponse } from 'next/server'
import { handleAPIError } from '@dadgic/shared'
import { db } from '@dadgic/database'

export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		console.log('🎯 Leagues API - Get league:', params.id)

		const league = await db.leagues.getById(params.id)

		if (!league) {
			return NextResponse.json({
				success: false,
				error: 'League not found',
				timestamp: new Date().toISOString()
			}, { status: 404 })
		}

		return NextResponse.json({
			success: true,
			data: league,
			timestamp: new Date().toISOString()
		})

	} catch (error) {
		console.error('❌ Leagues API - Get error:', error)
		const apiError = handleAPIError(error)
		return NextResponse.json(apiError.toJSON(), {
			status: apiError.statusCode
		})
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const body = await request.json()

		console.log('✏️ Leagues API - Update league:', {
			leagueId: params.id,
			updates: Object.keys(body)
		})

		// TODO: Add validation for updates
		const league = await db.leagues.update(params.id, body)

		return NextResponse.json({
			success: true,
			data: league,
			timestamp: new Date().toISOString()
		})

	} catch (error) {
		console.error('❌ Leagues API - Update error:', error)
		const apiError = handleAPIError(error)
		return NextResponse.json(apiError.toJSON(), {
			status: apiError.statusCode
		})
	}
}