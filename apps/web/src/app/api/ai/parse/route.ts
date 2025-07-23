import { NextRequest, NextResponse } from 'next/server'
import { getAIParsingService } from '@dadgic/shared/services/AIParsingService'
import { handleAPIError } from '@dadgic/shared/utils/errors/APIError'
import { validateAIParseRequest } from '@dadgic/shared/utils/validation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('🤖 AI Parse API Request:', {
      textLength: body.text?.length,
      hasContext: !!body.context
    })

    const validation = validateAIParseRequest(body)
    if (!validation.isValid) {
      console.warn('❌ Validation failed:', validation.errors)
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        field_errors: validation.errors,
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    console.log('🔄 Initializing real AI service...')
    const aiService = getAIParsingService()
    
    console.log('🤖 Calling real AI parsing service...')
    const result = await aiService.parseGameText({
      text: body.text,
      context: {
        source: 'web',
        user_id: body.context?.user_id,
        ...body.context
      }
    })

    console.log('✅ AI Parse API Response:', {
      success: result.success,
      confidence: result.data?.confidence,
      playersFound: result.data?.players?.length,
      processingTime: result.data?.processing_time_ms
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ AI Parse API Error:', error)
    
    const apiError = handleAPIError(error)
    return NextResponse.json(apiError.toJSON(), { 
      status: apiError.statusCode 
    })
  }
}

export async function GET() {
  try {
    console.log('🏥 AI API Health Check')
    const aiService = getAIParsingService()
    const healthResult = await aiService.healthCheck()
    
    return NextResponse.json({
      success: true,
      service: 'AI Parsing API',
      ...healthResult,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ AI Health Check Failed:', error)
    const apiError = handleAPIError(error)
    return NextResponse.json(apiError.toJSON(), { 
      status: apiError.statusCode 
    })
  }
}
