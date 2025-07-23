import { NextRequest, NextResponse } from 'next/server'
import { getGameService } from '@dadgic/shared/services'
import { handleAPIError } from '@dadgic/shared/utils/errors/APIError'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🎮 Games API - Get game:', params.id)

    const gameService = getGameService()
    const game = await gameService.getGameById(params.id)

    return NextResponse.json({
      success: true,
      data: game,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Games API - Get error:', error)
    const apiError = handleAPIError(error)
    return NextResponse.json(apiError.toJSON(), { 
      status: apiError.statusCode 
    })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🗑️ Games API - Delete game:', params.id)

    const gameService = getGameService()
    await gameService.deleteGame(params.id)

    return NextResponse.json({
      success: true,
      message: 'Game deleted successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Games API - Delete error:', error)
    const apiError = handleAPIError(error)
    return NextResponse.json(apiError.toJSON(), { 
      status: apiError.statusCode 
    })
  }
}
