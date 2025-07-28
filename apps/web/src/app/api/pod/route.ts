// apps/web/src/app/api/pod/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { handleAPIError } from '@dadgic/shared/errors/APIError'
import { validatePodRequest } from '@dadgic/shared/utils/validation/pod'
import { getAIParsingService } from '@dadgic/shared/services/AIParsingService'
import { createPod } from '@dadgic/shared/services/PodService'
import type { PodInput } from '@dadgic/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('🎮 Pod API - Create request:', {
      date: body.date,
      participantsCount: body.participants?.length,
      hasAIText: !!body.aiText
    })

    // 1. VALIDATE REQUEST - Check that workable data was passed
    const validation = validatePodRequest(body)
    
    // 2. DETERMINE IF IT NEEDS AI PARSING - validation failed AND we have AI text
    if (!validation.isValid && body.aiText) {
      console.log('🤖 Validation failed but AI text provided - attempting AI parsing for preview')
      
      try {
        const aiService = getAIParsingService()
        const parseResult = await aiService.parsePodText({
          text: body.aiText,
          context: {
            source: 'web',
            user_id: body.context?.user_id,
            ...body.context
          }
        })

        if (!parseResult.success || !parseResult.data) {
          return NextResponse.json({
            success: false,
            error: 'Failed to parse AI text',
            ai_error: parseResult.error,
            validation_errors: validation.errors,
            timestamp: new Date().toISOString()
          }, { status: 400 })
        }

        // Create parsed pod data for frontend review
        const parsedPodData = {
          date: parseResult.data.date || body.date,
          league_id: body.league_id || null,
          game_length_minutes: parseResult.data.game_length_minutes || body.game_length_minutes || null,
          turns: parseResult.data.turns || body.turns || null,
          notes: parseResult.data.notes || body.notes || null,
          participants: parseResult.data.participants || []
        }

        console.log('✅ AI parsing successful - returning for frontend review:', {
          participantsFound: parsedPodData.participants.length,
          confidence: parseResult.data.confidence
        })

        // Return parsed data for frontend review (NOT creating pod yet)
        return NextResponse.json({
          success: true,
          action: 'ai_parsed',
          data: {
            parsedPod: parsedPodData,
            confidence: parseResult.data.confidence,
            conversationState: parseResult.conversationState || null,
            processing_time_ms: parseResult.data.processing_time_ms
          },
          message: 'AI parsing completed - please review and submit',
          timestamp: new Date().toISOString()
        })

      } catch (error) {
        console.error('❌ AI parsing failed:', error)
        return NextResponse.json({
          success: false,
          error: 'AI parsing service unavailable',
          validation_errors: validation.errors,
          timestamp: new Date().toISOString()
        }, { status: 503 })
      }
    } else if (!validation.isValid) {
      // No AI text to fall back on, return validation errors
      return NextResponse.json({
        success: false,
        error: 'Invalid pod data',
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
    
    const result = await createPod(podInput, body.context?.user_id)

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