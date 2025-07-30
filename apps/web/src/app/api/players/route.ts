import { NextRequest, NextResponse } from 'next/server'
import { getPlayerService, handleAPIError } from '@dadgic/shared'
import { validatePlayerRequest } from '@dadgic/shared'
import { createPlayer } from '@dadgic/shared'
import { ValidationError } from '@dadgic/shared'
import type { PlayerInput } from '@dadgic/shared'

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
      discord_username: body.discord_username,
      discord_id: body.discord_id
    })

    // 1. VALIDATE REQUEST - Check that workable data was passed
    const validation = validatePlayerRequest(body)
    
    if (!validation.isValid) {
      throw new ValidationError('Invalid player request data', validation.errors)
    }

    // 2. EXTRACT CONTEXT (if needed)
    const userId = body.context?.user_id

    // 3. CONVERT TO SERVICE INPUT FORMAT
    const playerData: PlayerInput = {
      name: body.name,
      discord_username: body.discord_username || null,
      discord_id: body.discord_id || null,
      role: 'player' // Always set to player for API requests
    }

    // 4. CALL SERVICE
    const createdPlayer = await createPlayer(playerData, userId)

    // 5. RETURN CONSISTENT RESPONSE FORMAT
    return NextResponse.json({
      success: true,
      action: 'created',
      data: { player: createdPlayer },
      timestamp: new Date().toISOString()
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Players API - Create error:', error)
    const apiError = handleAPIError(error)
    return NextResponse.json(apiError.toJSON(), { 
      status: apiError.statusCode 
    })
  }
}