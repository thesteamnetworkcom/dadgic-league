// src/lib/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai'

// Types for AI parsing
export interface ParsedPodData {
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

export interface AIParseResult {
  success: boolean
  data?: ParsedPodData
  error?: string
  confidence?: number
}

class GeminiService {
  private genAI: GoogleGenerativeAI
  private model: any

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required')
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey)
    // Updated model name - gemini-pro is deprecated
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  }

  async parsePodReport(text: string): Promise<AIParseResult> {
    try {
      const prompt = this.buildPrompt(text)
      console.log('Sending to Gemini:', prompt)
      
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const responseText = response.text()
      
      console.log('Gemini response:', responseText)
      
      // Parse the JSON response
      const parsedData = this.parseGeminiResponse(responseText)
      
      return {
        success: true,
        data: parsedData,
        confidence: this.calculateConfidence(parsedData)
      }
    } catch (error) {
      console.error('Gemini parsing error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private buildPrompt(text: string): string {
    const currentDate = new Date().toISOString().split('T')[0]
    
    return `You are a Magic: The Gathering Commander game parser. Parse the following text into a structured JSON format.

INPUT TEXT: "${text}"

RULES:
1. Extract game date (if not specified, use today: ${currentDate})
2. Identify all players and their commanders
3. Determine who won/lost (exactly one winner per game)
4. Extract optional: game length in minutes, turn count, notes
5. Player names can be casual (Scott, Mike) not just usernames
6. Commander names can be partial (Teval = Teysa, Orzhov Scion, Atraxa, etc.)

OUTPUT FORMAT (valid JSON only):
{
  "date": "YYYY-MM-DD",
  "game_length_minutes": number or null,
  "turns": number or null,
  "notes": "string or null",
  "players": [
    {
      "name": "player_name",
      "commander": "commander_name", 
      "result": "win" | "lose" | "draw"
    }
  ]
}

IMPORTANT: 
- Return ONLY valid JSON, no other text
- Ensure exactly one winner unless it's a draw
- Use full commander names when possible
- If information is missing, use null

JSON:`
  }

  private parseGeminiResponse(responseText: string): ParsedPodData {
    try {
      // Clean up the response (remove any markdown or extra text)
      let cleanedResponse = responseText.trim()
      
      // Remove markdown code blocks if present
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '')
      
      // Find JSON in the response
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      
      const parsed = JSON.parse(jsonMatch[0])
      
      // Validate the parsed data
      this.validateParsedData(parsed)
      
      return parsed
    } catch (error) {
      console.error('Failed to parse Gemini response:', responseText)
      throw new Error(`Invalid JSON response: ${error}`)
    }
  }

  private validateParsedData(data: any): void {
    if (!data.date || !data.players || !Array.isArray(data.players)) {
      throw new Error('Missing required fields: date, players')
    }
    
    if (data.players.length < 2) {
      throw new Error('At least 2 players required')
    }
    
    const winners = data.players.filter((p: any) => p.result === 'win')
    if (winners.length === 0) {
      throw new Error('No winner specified')
    }
    if (winners.length > 1) {
      throw new Error('Multiple winners not allowed')
    }
    
    // Validate each player
    for (const player of data.players) {
      if (!player.name ||  !player.result) {
        throw new Error(`Invalid player data: ${JSON.stringify(player)}`)
      }
      if (!['win', 'lose', 'draw'].includes(player.result)) {
        throw new Error(`Invalid result: ${player.result}`)
      }
    }
  }

  private calculateConfidence(data: ParsedPodData): number {
    let confidence = 0.5 // Base confidence
    
    // Higher confidence for more complete data
    if (data.game_length_minutes) confidence += 0.1
    if (data.turns) confidence += 0.1
    if (data.notes) confidence += 0.1
    
    // Higher confidence for reasonable data
    if (data.players.length >= 3 && data.players.length <= 6) confidence += 0.2
    
    return Math.min(confidence, 1.0)
  }
}

// Singleton instance
let geminiService: GeminiService | null = null

export function getGeminiService(): GeminiService {
  if (!geminiService) {
    geminiService = new GeminiService()
  }
  return geminiService
}

// Convenience function for easy use
export async function parseWithAI(text: string): Promise<AIParseResult> {
  const service = getGeminiService()
  return service.parsePodReport(text)
}