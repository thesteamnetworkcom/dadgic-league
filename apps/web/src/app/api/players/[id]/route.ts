import { NextRequest, NextResponse } from 'next/server'
import { getPlayerService } from '@dadgic/shared'
import { handleAPIError } from '@dadgic/shared'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('👥 Players API - Get player:', params.id)

    const playerService = getPlayerService()
    const player = await playerService.getPlayerById(params.id)

    return NextResponse.json({
      success: true,
      data: player,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Players API - Get error:', error)
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
    
    console.log('✏️ Players API - Update player:', {
      playerId: params.id,
      updates: Object.keys(body)
    })

    const playerService = getPlayerService()
    const player = await playerService.updatePlayer(params.id, body)

    return NextResponse.json({
      success: true,
      data: player,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Players API - Update error:', error)
    const apiError = handleAPIError(error)
    return NextResponse.json(apiError.toJSON(), { 
      status: apiError.statusCode 
    })
  }
}
