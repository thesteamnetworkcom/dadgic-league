import { NextRequest, NextResponse } from 'next/server'
import { getPlayerService } from '@dadgic/shared/services'
import { handleAPIError } from '@dadgic/shared/utils/errors/APIError'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters = {
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined
    }

    console.log('👥 Players API - List request:', filters)

    const playerService = getPlayerService()
    const players = await playerService.listPlayers(filters)

    return NextResponse.json({
      success: true,
      data: players,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Players API - List error:', error)
    const apiError = handleAPIError(error)
    return NextResponse.json(apiError.toJSON(), { 
      status: apiError.statusCode 
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('👥 Players API - Create request:', {
      name: body.name,
      discord_username: body.discord_username
    })

    const playerService = getPlayerService()
    const result = await playerService.createPlayer(body)

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result, { status: 201 })

  } catch (error) {
    console.error('❌ Players API - Create error:', error)
    const apiError = handleAPIError(error)
    return NextResponse.json(apiError.toJSON(), { 
      status: apiError.statusCode 
    })
  }
}
