import { NextRequest, NextResponse } from 'next/server'
import { getGameService } from '@dadgic/shared'
import { handleAPIError } from '@dadgic/shared'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters = {
      playerId: searchParams.get('playerId') || undefined,
      leagueId: searchParams.get('leagueId') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined
    }

    console.log('📋 Games API - List request:', filters)

    const gameService = getGameService()
    const games = await gameService.listPods(filters)

    return NextResponse.json({
      success: true,
      data: games,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Games API - List error:', error)
    const apiError = handleAPIError(error)
    return NextResponse.json(apiError.toJSON(), { 
      status: apiError.statusCode 
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('🎮 Games API - Create request:', {
      date: body.date,
      playersCount: body.players?.length
    })

    const gameService = getGameService()
    const result = await gameService.createPod(body)

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result, { status: 201 })

  } catch (error) {
    console.error('❌ Games API - Create error:', error)
    const apiError = handleAPIError(error)
    return NextResponse.json(apiError.toJSON(), { 
      status: apiError.statusCode 
    })
  }
}
