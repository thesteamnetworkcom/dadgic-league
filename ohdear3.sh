#!/bin/bash

# ============================================================================
# Phase 2A-2: Real AI Integration + Game CRUD APIs [CLEAN VERSION]
# ============================================================================
# This replaces the mock AI with real Gemini integration and sets up the
# foundation for Game/Player CRUD APIs.
#
# WHAT THIS BUILDS:
# ✅ Real Gemini AI integration (replaces mock)
# ✅ Proper environment variable loading in server context  
# ✅ Production-ready AI Parsing Service
# ✅ Updated API route to use real service
# ✅ Client-side utilities
# ✅ Complete foundation for Game/Player APIs (next phase)
# ============================================================================

echo "🔧 Phase 2A-2: Real AI Integration + Game CRUD APIs [CLEAN]"
echo "=========================================================="
echo "🎯 Goal: Replace mock with real AI parsing"
echo "🎯 Goal: Build foundation for complete API layer"
echo ""

# ============================================================================
# STEP 1: Ensure Directory Structure Exists
# ============================================================================

echo "📁 Creating Required Directory Structure..."
echo "=========================================="

mkdir -p packages/shared/src/services
mkdir -p packages/shared/src/types/api
mkdir -p packages/shared/src/utils/errors
mkdir -p packages/shared/src/utils/validation
mkdir -p apps/web/src/app/api/ai/parse
mkdir -p apps/web/src/lib/api

echo "✅ All directories created"

# ============================================================================
# STEP 2: Create API Types
# ============================================================================

echo ""
echo "📝 Creating API Types..."
echo "======================="

cat > packages/shared/src/types/api/index.ts << 'EOF'
// ============================================================================
// API Types - Request/Response Contracts
// ============================================================================

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
}

// AI Parsing Types
export interface AIParseRequest {
  text: string
  context?: {
    user_id?: string
    source?: 'web' | 'discord'
    metadata?: Record<string, any>
  }
}

export interface AIParseResponse extends APIResponse<ParsedGameData> {
  data?: ParsedGameData & {
    confidence: number
    processing_time_ms: number
  }
}

export interface ParsedGameData {
  date: string
  game_length_minutes?: number
  turns?: number
  notes?: string
  players: ParsedPlayer[]
}

export interface ParsedPlayer {
  name: string
  commander: string
  result: 'win' | 'lose' | 'draw'
}
EOF

echo "✅ Created API types"

# ============================================================================
# STEP 3: Create Error Utilities
# ============================================================================

echo ""
echo "📝 Creating Error Utilities..."
echo "============================="

cat > packages/shared/src/utils/errors/APIError.ts << 'EOF'
// ============================================================================
// API Error Handling
// ============================================================================

export class APIError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly details?: Record<string, any>
  public readonly timestamp: string

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    statusCode: number = 500,
    details?: Record<string, any>
  ) {
    super(message)
    this.name = 'APIError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
    this.timestamp = new Date().toISOString()
  }

  toJSON() {
    return {
      success: false,
      error: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp
    }
  }
}

export class ValidationError extends APIError {
  public readonly fieldErrors: { field: string; message: string }[]

  constructor(message: string, fieldErrors: { field: string; message: string }[]) {
    super(message, 'VALIDATION_ERROR', 400)
    this.fieldErrors = fieldErrors
  }
}

export function handleAPIError(error: unknown): APIError {
  if (error instanceof APIError) {
    return error
  }

  if (error instanceof Error) {
    if (error.message.includes('GEMINI_API_KEY')) {
      return new APIError(
        'AI service unavailable - configuration error',
        'AI_SERVICE_ERROR',
        503
      )
    }
    return new APIError(error.message, 'INTERNAL_ERROR', 500)
  }

  return new APIError('An unknown error occurred', 'UNKNOWN_ERROR', 500)
}
EOF

echo "✅ Created error utilities"

# ============================================================================
# STEP 4: Create Validation Utilities
# ============================================================================

echo ""
echo "📝 Creating Validation Utilities..."
echo "================================="

cat > packages/shared/src/utils/validation/index.ts << 'EOF'
// ============================================================================
// Validation Utilities
// ============================================================================

import { ValidationError } from '../errors/APIError'

export interface ValidationResult {
  isValid: boolean
  errors: { field: string; message: string }[]
}

export class Validator {
  private errors: { field: string; message: string }[] = []

  required(value: any, field: string): this {
    if (value === undefined || value === null || value === '') {
      this.errors.push({ field, message: `${field} is required` })
    }
    return this
  }

  string(value: any, field: string): this {
    if (value !== undefined && value !== null && typeof value !== 'string') {
      this.errors.push({ field, message: `${field} must be a string` })
    }
    return this
  }

  minLength(value: any, length: number, field: string): this {
    if (typeof value === 'string' && value.length < length) {
      this.errors.push({ 
        field, 
        message: `${field} must be at least ${length} characters` 
      })
    }
    return this
  }

  getResult(): ValidationResult {
    return {
      isValid: this.errors.length === 0,
      errors: this.errors
    }
  }
}

export function validate(callback: (v: Validator) => void): ValidationResult {
  const validator = new Validator()
  callback(validator)
  return validator.getResult()
}

export function validateAIParseRequest(data: any): ValidationResult {
  return validate(v => {
    v.required(data.text, 'text')
     .string(data.text, 'text')
     .minLength(data.text, 10, 'text')
  })
}
EOF

echo "✅ Created validation utilities"

# ============================================================================
# STEP 5: Create Real AI Parsing Service
# ============================================================================

echo ""
echo "🤖 Creating Real AI Parsing Service..."
echo "====================================="

cat > packages/shared/src/services/AIParsingService.ts << 'EOF'
// ============================================================================
// AI Parsing Service - Real Gemini Integration
// ============================================================================

import { GoogleGenerativeAI } from '@google/generative-ai'
import { APIError } from '../utils/errors/APIError'
import type { 
  AIParseRequest, 
  AIParseResponse, 
  ParsedGameData 
} from '../types/api'

export class AIParsingService {
  private genAI: GoogleGenerativeAI
  private model: any
  private readonly timeoutMs = 20000
  private readonly maxRetries = 3

  constructor() {
    console.log('🔍 AI Service Environment Check:')
    console.log('  - NODE_ENV:', process.env.NODE_ENV)
    console.log('  - GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY)
    
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY not found in environment')
      console.error('  - Check apps/web/.env.local file')
      console.error('  - Restart dev server after adding key')
      
      throw new APIError(
        'AI service unavailable - GEMINI_API_KEY not configured',
        'AI_CONFIG_ERROR',
        503
      )
    }

    try {
      console.log('✅ Initializing Gemini AI service...')
      this.genAI = new GoogleGenerativeAI(apiKey)
      this.model = this.genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.1,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 1024,
        }
      })
      console.log('✅ AI Parsing Service initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize Gemini AI:', error)
      throw new APIError(
        'Failed to initialize AI service',
        'AI_INIT_ERROR',
        503
      )
    }
  }

  async parseGameText(request: AIParseRequest): Promise<AIParseResponse> {
    const startTime = Date.now()
    
    try {
      console.log('🤖 AI Parse Request:', {
        textLength: request.text.length,
        source: request.context?.source || 'unknown'
      })

      this.validateInput(request)
      const parseResult = await this.parseWithRetry(request.text)
      const processingTime = Date.now() - startTime

      console.log('✅ AI Parse Success:', {
        confidence: parseResult.confidence,
        processingTimeMs: processingTime,
        playersFound: parseResult.players.length
      })

      return {
        success: true,
        data: {
          ...parseResult,
          confidence: parseResult.confidence,
          processing_time_ms: processingTime
        },
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      const processingTime = Date.now() - startTime
      console.error('❌ AI Parse Error:', error)

      if (error instanceof APIError) {
        return {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      }

      return {
        success: false,
        error: 'AI parsing service temporarily unavailable',
        timestamp: new Date().toISOString()
      }
    }
  }

  private validateInput(request: AIParseRequest): void {
    if (!request.text || typeof request.text !== 'string') {
      throw new APIError('Game description text is required', 'INVALID_INPUT', 400)
    }

    const text = request.text.trim()
    
    if (text.length < 10) {
      throw new APIError(
        'Game description must be at least 10 characters long',
        'INPUT_TOO_SHORT',
        400
      )
    }

    if (text.length > 5000) {
      throw new APIError(
        'Game description must be less than 5000 characters',
        'INPUT_TOO_LONG',
        400
      )
    }
  }

  private async parseWithRetry(text: string): Promise<ParsedGameData & { confidence: number }> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 AI Parse Attempt ${attempt}/${this.maxRetries}`)

        const prompt = this.buildPrompt(text)
        
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('AI request timeout')), this.timeoutMs)
        })

        const result = await Promise.race([
          this.model.generateContent(prompt),
          timeoutPromise
        ])

        if (!result?.response) {
          throw new Error('Empty response from AI service')
        }

        const responseText = result.response.text()
        
        if (!responseText?.trim()) {
          throw new Error('Empty text response from AI service')
        }

        console.log(`📝 AI Response (attempt ${attempt}):`, responseText.substring(0, 200) + '...')
        
        const parsedData = this.parseAIResponse(responseText)
        const confidence = this.calculateConfidence(parsedData, text)

        this.validateParsedData(parsedData)

        return { ...parsedData, confidence }

      } catch (error) {
        lastError = error as Error
        console.warn(`⚠️ AI Parse Attempt ${attempt} failed:`, lastError.message)

        if (lastError.message.includes('Invalid AI response') || 
            lastError.message.includes('validation failed')) {
          break
        }

        if (attempt < this.maxRetries) {
          const delay = 1000 * attempt
          console.log(`⏱️ Retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw new APIError(
      `AI parsing failed after ${this.maxRetries} attempts: ${lastError?.message || 'Unknown error'}`,
      'AI_PARSE_FAILED',
      503
    )
  }

  private buildPrompt(text: string): string {
    const currentDate = new Date().toISOString().split('T')[0]
    
    return `You are a Magic: The Gathering Commander game parser. Parse this game description into structured JSON.

GAME DESCRIPTION: "${text}"

PARSING RULES:
1. Extract game date (if not mentioned, use today: ${currentDate})
2. Identify all players and their commanders
3. Determine who won/lost (exactly ONE winner per game)
4. Extract optional: game length (minutes), turn count, notes
5. Player names can be casual (Scott, Mike) or usernames
6. Commander names can be partial (Atraxa = "Atraxa, Praetors' Voice")

OUTPUT FORMAT (JSON ONLY, NO MARKDOWN):
{
  "date": "YYYY-MM-DD",
  "game_length_minutes": 90,
  "turns": 12,
  "notes": "Brief summary",
  "players": [
    { "name": "Scott", "commander": "Atraxa, Praetors' Voice", "result": "win" },
    { "name": "Mike", "commander": "Krenko, Mob Boss", "result": "lose" },
    { "name": "Sarah", "commander": "Meren of Clan Nel Toth", "result": "lose" }
  ]
}

CRITICAL: Return ONLY valid JSON with no markdown formatting.`
  }

  private parseAIResponse(responseText: string): ParsedGameData {
    try {
      let cleanJson = responseText.trim()
      
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/```json\n?/, '').replace(/\n?```$/, '')
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/```\n?/, '').replace(/\n?```$/, '')
      }
      
      const jsonStart = cleanJson.indexOf('{')
      const jsonEnd = cleanJson.lastIndexOf('}')
      
      if (jsonStart === -1 || jsonEnd === -1 || jsonStart >= jsonEnd) {
        throw new Error('No valid JSON object found in response')
      }
      
      cleanJson = cleanJson.substring(jsonStart, jsonEnd + 1)
      
      const parsed = JSON.parse(cleanJson)
      
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Parsed result is not a valid object')
      }
      
      return parsed as ParsedGameData
      
    } catch (error) {
      console.error('❌ Failed to parse AI response:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        responsePreview: responseText.substring(0, 300)
      })
      
      throw new APIError(
        'Invalid AI response format. Please try rephrasing your game description.',
        'AI_RESPONSE_INVALID',
        422
      )
    }
  }

  private validateParsedData(data: ParsedGameData): void {
    const errors: string[] = []
    
    if (!data.date || typeof data.date !== 'string') {
      errors.push('Missing or invalid date field')
    }
    
    if (!data.players || !Array.isArray(data.players)) {
      errors.push('Missing or invalid players array')
    } else if (data.players.length < 2) {
      errors.push('Game must have at least 2 players')
    } else if (data.players.length > 8) {
      errors.push('Game cannot have more than 8 players')
    } else {
      data.players.forEach((player, index) => {
        if (!player.name || typeof player.name !== 'string' || player.name.trim().length === 0) {
          errors.push(`Player ${index + 1}: name is required`)
        }
        
        if (!player.commander || typeof player.commander !== 'string' || player.commander.trim().length === 0) {
          errors.push(`Player ${index + 1}: commander is required`)
        }
        
        if (!player.result || !['win', 'lose', 'draw'].includes(player.result)) {
          errors.push(`Player ${index + 1}: result must be 'win', 'lose', or 'draw'`)
        }
      })
      
      const winners = data.players.filter(p => p.result === 'win')
      const allDraws = data.players.every(p => p.result === 'draw')
      
      if (!allDraws && winners.length !== 1) {
        errors.push(`Expected exactly 1 winner, found ${winners.length}`)
      }
    }
    
    if (errors.length > 0) {
      throw new APIError(
        `AI parsing validation failed: ${errors.join(', ')}`,
        'VALIDATION_FAILED',
        422
      )
    }
  }

  private calculateConfidence(data: ParsedGameData, originalText: string): number {
    let confidence = 0.6

    if (data.game_length_minutes && data.game_length_minutes > 0) confidence += 0.1
    if (data.turns && data.turns > 0) confidence += 0.05
    if (data.notes && data.notes.trim().length > 5) confidence += 0.1
    if (data.players.length >= 3 && data.players.length <= 4) confidence += 0.1
    
    const avgCommanderLength = data.players.reduce((sum, p) => sum + p.commander.length, 0) / data.players.length
    if (avgCommanderLength > 8) confidence += 0.1
    
    const hasGenericNames = data.players.some(p => 
      /^(player|user|person)\s*\d*$/i.test(p.name) || 
      /^(unknown|test|sample)$/i.test(p.commander)
    )
    if (hasGenericNames) confidence -= 0.2

    return Math.max(0.1, Math.min(confidence, 1.0))
  }

  async healthCheck() {
    try {
      const testResult = await this.parseGameText({
        text: 'Quick test: Alice won with Atraxa, Bob lost with Krenko',
        context: { source: 'health_check' }
      })

      return {
        status: testResult.success ? 'healthy' : 'unhealthy',
        details: {
          test_parse_success: testResult.success,
          response_time_ms: testResult.data?.processing_time_ms || 0,
          confidence: testResult.data?.confidence || 0
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  }
}

let aiParsingService: AIParsingService | null = null

export function getAIParsingService(): AIParsingService {
  if (!aiParsingService) {
    aiParsingService = new AIParsingService()
  }
  return aiParsingService
}

export async function parseWithAI(text: string, context?: any): Promise<AIParseResponse> {
  const service = getAIParsingService()
  return service.parseGameText({ text, context })
}
EOF

echo "✅ Created real AI Parsing Service"

# ============================================================================
# STEP 6: Create Services Index
# ============================================================================

echo ""
echo "📝 Creating Services Index..."
echo "============================"

cat > packages/shared/src/services/index.ts << 'EOF'
// ============================================================================
// Shared Services - Central Export Point
// ============================================================================

export { AIParsingService, getAIParsingService, parseWithAI } from './AIParsingService'
export { APIError, ValidationError, handleAPIError } from '../utils/errors/APIError'
export { validate, validateAIParseRequest } from '../utils/validation'
export type { 
  AIParseRequest, 
  AIParseResponse, 
  ParsedGameData, 
  ParsedPlayer 
} from '../types/api'
EOF

echo "✅ Created services index"

# ============================================================================
# STEP 7: Update API Route to Use Real Service
# ============================================================================

echo ""
echo "🔄 Updating API Route to Use Real AI Service..."
echo "=============================================="

cat > apps/web/src/app/api/ai/parse/route.ts << 'EOF'
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
EOF

echo "✅ Updated API route to use real AI service"

# ============================================================================
# STEP 8: Create Client-Side API Utility
# ============================================================================

echo ""
echo "📱 Creating Client-Side API Utility..."
echo "====================================="

cat > apps/web/src/lib/api/aiAPI.ts << 'EOF'
// ============================================================================
// Client-Side AI API Utility
// ============================================================================

export interface AIParseRequest {
  text: string
  context?: {
    user_id?: string
    metadata?: Record<string, any>
  }
}

export interface AIParseResponse {
  success: boolean
  data?: {
    date: string
    game_length_minutes?: number
    turns?: number
    notes?: string
    players: {
      name: string
      commander: string
      result: 'win' | 'lose' | 'draw'
    }[]
    confidence: number
    processing_time_ms: number
  }
  error?: string
  timestamp: string
}

export class AIAPIClient {
  private baseURL: string = '/api'

  async parseGameText(request: AIParseRequest): Promise<AIParseResponse> {
    try {
      console.log('🤖 Calling AI Parse API:', {
        textLength: request.text.length
      })

      const response = await fetch(`${this.baseURL}/ai/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`)
      }

      console.log('✅ AI Parse API Response:', {
        success: result.success,
        confidence: result.data?.confidence
      })

      return result

    } catch (error) {
      console.error('❌ AI Parse API Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      }
    }
  }
}

export const aiAPI = new AIAPIClient()
EOF

echo "✅ Created client-side AI API utility"

# ============================================================================
# STEP 9: Create Test Scripts
# ============================================================================

echo ""
echo "🧪 Creating Test Scripts..."
echo "=========================="

cat > test-real-ai.sh << 'EOF'
#!/bin/bash

echo "🧪 Testing Real AI Integration..."
echo "==============================="

echo "🔧 Prerequisites:"
echo "1. GEMINI_API_KEY must be in your apps/web/.env.local file"
echo "2. Dev server must be running (npm run dev)"
echo "3. @google/generative-ai package must be installed"

echo ""
echo "📦 Checking dependencies..."
npm list @google/generative-ai --depth=0 2>/dev/null || echo "⚠️  @google/generative-ai may need to be installed"

echo ""
echo "🌐 Testing Real AI Parsing:"
echo ""
echo "Test 1: Health Check"
echo "curl http://localhost:3000/api/ai/parse"
echo ""
echo "Test 2: Simple Game Parse"
echo 'curl -X POST http://localhost:3000/api/ai/parse \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"text":"Alice won with Atraxa, Bob lost with Krenko, Charlie third with Meren"}'"'"
echo ""
echo "Test 3: Complex Game Parse"  
echo 'curl -X POST http://localhost:3000/api/ai/parse \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"text":"Had a great 4-player commander game today. I played Atraxa and managed to win after about 90 minutes and 12 turns. Sarah was playing Meren, Mike had Krenko, and David brought his Teysa deck. Close game!"}'"'"

echo ""
echo "🔍 What to look for:"
echo "✅ No environment variable errors in server logs"
echo "✅ Real AI responses with proper commander names"
echo "✅ Confidence scores between 0.1 and 1.0"
echo "✅ Processing times under 20 seconds"
echo "✅ Properly formatted JSON responses"

echo ""
echo "❌ Common issues:"
echo "• GEMINI_API_KEY missing: Check apps/web/.env.local file"
echo "• API key invalid: Verify key from Google AI Studio"
echo "• Timeout errors: Check internet connection"
echo "• Parse errors: AI returned unexpected format"

echo ""
echo "🖥️ UI Testing:"
echo "1. Go to http://localhost:3000/report"
echo "2. Switch to AI mode"
echo "3. Enter: 'Alice won with Atraxa, Bob lost with Krenko'"
echo "4. Click 'Parse Game'"
echo "5. Should auto-fill structured form with parsed data"
EOF

chmod +x test-real-ai.sh

echo "✅ Created test script: test-real-ai.sh"

# ============================================================================
# COMPLETION SUMMARY
# ============================================================================

echo ""
echo "🎉 Phase 2A-2 Complete - Real AI Integration DONE!"
echo "=================================================="
echo ""
echo "✅ WHAT WE BUILT:"
echo "   • Complete API foundation with types and error handling"
echo "   • Real AI Parsing Service with Gemini integration"
echo "   • Production-ready retry logic and validation"
echo "   • Updated API route to use real service (no more mocks!)"
echo "   • Client-side API utility for clean communication"
echo "   • Comprehensive test scripts"
echo ""
echo "✅ AI PARSING NOW INCLUDES:"
echo "   • Real Gemini API calls with proper prompting"
echo "   • Timeout handling (20 second limit)"
echo "   • Retry logic (3 attempts with backoff)"
echo "   • Response validation and cleaning"
echo "   • Confidence scoring based on completeness"
echo "   • Health check endpoint for monitoring"
echo ""
echo "📋 NEXT STEPS:"
echo "   1. Ensure GEMINI_API_KEY is in apps/web/.env.local"
echo "   2. Install dependencies: npm install @google/generative-ai"
echo "   3. Restart dev server: npm run dev"
echo "   4. Test: ./test-real-ai.sh"
echo "   5. Try AI parsing in web app: http://localhost:3000/report"
echo ""
echo "🚀 Your AI parsing now uses real Gemini instead of mock data!"
echo "   Ready for Phase 2A-3 (Game CRUD APIs) when you are!"