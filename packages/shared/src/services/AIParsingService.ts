// ============================================================================
// AI Parsing Service - Real Gemini Integration
// ============================================================================

import { GoogleGenerativeAI } from '@google/generative-ai'
import { APIError } from '../errors/APIError'
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
        context: { source: 'web' }
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
