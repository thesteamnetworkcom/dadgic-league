// ============================================================================
// AI Parsing Service - Real Gemini Integration
// ============================================================================

import { GoogleGenerativeAI } from '@google/generative-ai'
import { APIError } from '../errors/APIError'
import type {
	ParseRequest,
	ParseResponse,
	ParsedPodData
} from '@dadgic/database'

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
	async parseText<T = any>(request: ParseRequest & { domain: string }): Promise<ParseResponse<T>> {
		const startTime = Date.now()

		try {
			console.log('🤖 AI Parse Request:', {
				textLength: request.text.length,
				domain: request.domain,
				source: request.context?.source || 'unknown'
			})

			this.validateInput(request)
			const context = request.context?.metadata?.conversationState ? {
				existingData: request.context.metadata.conversationState.parsedData,
				operation: 'update' as const,
				domain: request.domain as any
			} : { domain: request.domain as any }

			const parseResult = await this.parseWithRetry(request.text, context)
			const processingTime = Date.now() - startTime

			// Generic response - no pod-specific assumptions
			if (request.context?.metadata?.conversationState) {
				return {
					success: true,
					data: {
						...parseResult,
						confidence: parseResult.confidence,
						processing_time_ms: processingTime
					} as T & { confidence: number; processing_time_ms: number },
					conversationState: {
						...request.context.metadata.conversationState,
						parsedData: parseResult,
						timestamp: new Date().toISOString()
					},
					timestamp: new Date().toISOString()
				}
			} else {
				return {
					success: true,
					data: {
						...parseResult,
						confidence: parseResult.confidence,
						processing_time_ms: processingTime
					} as T & { confidence: number; processing_time_ms: number },
					conversationState: {
						conversationId: crypto.randomUUID(),
						originalText: request.text,
						parsedData: parseResult,
						timestamp: new Date().toISOString()
					},
					timestamp: new Date().toISOString()
				}
			}
		} catch (error) {
			// Same error handling as existing method
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
	async parsePodText(request: ParseRequest): Promise<ParseResponse<ParsedPodData>> {
		return this.parseText<ParsedPodData>({ ...request, domain: 'pod' })
	}

	private async parseWithRetry<T = any>(text: string, context?: any): Promise<T & { confidence: number }> {
		let lastError: Error | null = null

		for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
			try {
				console.log(`🔄 AI Parse Attempt ${attempt}/${this.maxRetries}`)

				const prompt = this.buildPrompt({ text, context })

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
				try {
                	this.validateParsedData(parsedData, context?.domain || 'pod')
                	// If validation passes, return the data
                	return { ...parsedData, confidence }
            	} catch (error) {
					lastError = error as Error
                	// ✅ VALIDATION FAILED - but AI succeeded in parsing
                	// Don't retry - return the data with validation errors
                	console.warn(`⚠️ AI parsing succeeded but validation failed:`, lastError.message)
                
                	// Return the parsed data with validation errors attached
                	return {
						...parsedData,
						confidence,
						validationErrors: lastError.message,
						requiresManualInput: true
                	}
            }

			} catch (error) {
				lastError = error as Error
				console.warn(`⚠️ AI Parse Attempt ${attempt} failed:`, lastError.message)

				// Only retry for actual AI/parsing failures, not validation failures
            	if (lastError.message.includes('Invalid AI response') ||
                lastError.message.includes('Empty response') ||
                lastError.message.includes('timeout')) {
                
					if (attempt < this.maxRetries) {
						const delay = 1000 * attempt
						console.log(`⏱️ Retrying in ${delay}ms...`)
						await new Promise(resolve => setTimeout(resolve, delay))
						continue
					}
            	}
            
            // For other errors, don't retry
           	 	break
			}
		}

		throw new APIError(
			`AI parsing failed after ${this.maxRetries} attempts: ${lastError?.message || 'Unknown error'}`,
			'AI_PARSE_FAILED',
			503
		)
	}
	private buildPrompt(options: {
		text: string
		context?: {
			existingData?: any
			operation?: 'parse' | 'update' | 'correct'
			domain?: 'pod' | 'player' | 'league'
		}
	}): string {
		// Handle domain - start with pod only
		const domain = options.context?.domain || 'pod'
		const operation = options.context?.operation || 'parse'
		switch (domain) {
			case 'pod':
				if (operation === 'parse') {
					return this.buildPodParsePrompt(options.text)
				} else {
					if (!options.context?.existingData) {
						throw new Error('Update operation requires existing data')
					}
					return this.buildPodUpdatePrompt(options.text, options.context.existingData)
				}
			case 'player':
				return this.buildPlayerParsePrompt(options.text)
			case 'league':
				return this.buildLeagueParsePrompt(options.text)
			default:
				throw new Error(`Domain ${domain} not implemented yet`)
		}
	}
	private buildPodUpdatePrompt(text: string, existingData: any): string {
		const currentData = JSON.stringify(existingData, null, 2)

		return `You are updating MTG Commander game data. Here's the current information:

            CURRENT DATA:
            ${currentData}

            UPDATE REQUEST:
            "${text}"

            INSTRUCTIONS:
            1. Update the existing data with the new information
            2. Keep the same JSON structure
            3. Return ONLY the updated JSON data
            4. Handle commander info intelligently (e.g., "Milan and Kevin both played Elminster")
            5. Preserve existing data unless specifically updated
            6. Maintain exactly one winner unless explicitly changed
            7. Player identifiers should remain consistent with existing data

            OUTPUT FORMAT: Valid JSON only, no explanation text.`
	}
	private buildPodParsePrompt(text: string): string {
		// Move the existing buildPrompt logic here
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
                "participants": [
                  { "player_identifier": "Scott", "commander_deck": "Atraxa, Praetors' Voice", "result": "win" },
                  { "player_identifier": "Mike", "commander_deck": "Krenko, Mob Boss", "result": "lose" },
                  { "player_identifier": "Sarah", "commander_deck": "Meren of Clan Nel Toth", "result": "lose" }
                ]
              }

              CRITICAL: Return ONLY valid JSON with no markdown formatting.`
	}
	private buildPlayerParsePrompt(text: string): string {
		return `Parse player information from this text: ${text}
  
Return JSON with:
{
  "name": "string",
  "discord_username": "string (optional)",
  "role": "player" | "admin"
}`
	}

	private buildLeagueParsePrompt(text: string): string {
		return `Parse league information from this text: ${text}
  
Return JSON with:
{
  "name": "string",
  "description": "string (optional)",
  "games_per_player": number,
  "player_identifiers": ["string"]
}`
	}

	private parseAIResponse<T = any>(responseText: string): T {
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

			return parsed as T

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
	private validateInput(request: ParseRequest & { domain?: string }): void {
		if (!request.text || typeof request.text !== 'string') {
			const domain = request.domain || 'pod'
			throw new APIError(`${domain} description text is required`, 'INVALID_INPUT', 400)
		}

		const text = request.text.trim()

		if (text.length < 10) {
			throw new APIError(
				`${request.domain || 'Pod'} description must be at least 10 characters long`,
				'INPUT_TOO_SHORT',
				400
			)
		}

		if (text.length > 5000) {
			throw new APIError(
				`${request.domain || 'Pod'} description must be less than 5000 characters`,
				'INPUT_TOO_LONG',
				400
			)
		}
	}
	private validatePodData(data: ParsedPodData): void {
		const errors: string[] = []

		if (!data.date || typeof data.date !== 'string') {
			errors.push('Missing or invalid date field')
		}

		if (!data.participants || !Array.isArray(data.participants)) {
			errors.push('Missing or invalid players array')
		} else if (data.participants.length < 2) {
			errors.push('Game must have at least 2 players')
		} else if (data.participants.length > 8) {
			errors.push('Game cannot have more than 8 players')
		} else {
			data.participants.forEach((player, index) => {
				if (!player.player_identifier || typeof player.player_identifier !== 'string' || player.player_identifier.trim().length === 0) {
					errors.push(`Player ${index + 1}: name is required`)
				}

				if (!player.commander_deck || typeof player.commander_deck !== 'string' || player.commander_deck.trim().length === 0) {
					errors.push(`Player ${index + 1}: commander is required`)
				}

				if (!player.result || !['win', 'lose', 'draw'].includes(player.result)) {
					errors.push(`Player ${index + 1}: result must be 'win', 'lose', or 'draw'`)
				}
			})

			const winners = data.participants.filter(p => p.result === 'win')
			const allDraws = data.participants.every(p => p.result === 'draw')

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
	private validatePlayerData(data: any): void {
		const errors: string[] = []

		if (!data.name || typeof data.name !== 'string') {
			errors.push('name is required')
		}

		if (errors.length > 0) {
			throw new APIError(
				`Player validation failed: ${errors.join(', ')}`,
				'VALIDATION_FAILED',
				422
			)
		}
	}
	private validateLeagueData(data: any): void {
		const errors: string[] = []

		if (!data.name || typeof data.name !== 'string') {
			errors.push('name is required')
		}

		if (errors.length > 0) {
			throw new APIError(
				`League validation failed: ${errors.join(', ')}`,
				'VALIDATION_FAILED',
				422
			)
		}
	}
	private validateParsedData(data: any, domain: string = 'pod'): void {
		switch (domain) {
			case 'pod':
				this.validatePodData(data)
				break
			case 'player':
				this.validatePlayerData(data)
				break
			case 'league':
				this.validateLeagueData(data)
				break
			default:
				throw new APIError(`Validation for domain ${domain} not implemented`, 'VALIDATION_ERROR', 422)
		}
	}
	private calculatePodConfidence(data: ParsedPodData, originalText: string): number {
		let confidence = 0.6
		if (data.game_length_minutes && data.game_length_minutes > 0) confidence += 0.1
		if (data.turns && data.turns > 0) confidence += 0.05
		if (data.notes && data.notes.trim().length > 5) confidence += 0.1
		if (data.participants.length >= 3 && data.participants.length <= 4) confidence += 0.1
		const avgCommanderLength = data.participants.reduce((sum, p) => sum + (p.commander_deck?.length ?? 0), 0) / data.participants.length
		if (avgCommanderLength > 8) confidence += 0.1
		const hasGenericNames = data.participants.some(p =>
			/^(player|user|person)\s*\d*$/i.test(p.player_identifier)||
			p.commander_deck ? /^(unknown|test|sample)$/i.test(p.commander_deck) : null
		)
		if (hasGenericNames) confidence -= 0.2
		return Math.max(0.1, Math.min(confidence, 1.0))
	}
	private calculatePlayerConfidence(data: any, originalText: string): number {
		let confidence = 0.7
		if (data.name && data.name.length > 2) confidence += 0.2
		if (data.discord_username) confidence += 0.1
		return Math.max(0.1, Math.min(confidence, 1.0))
	}

	private calculateLeagueConfidence(data: any, originalText: string): number {
		let confidence = 0.6
		if (data.name && data.name.length > 3) confidence += 0.2
		if (data.player_identifiers && data.player_identifiers.length >= 4) confidence += 0.2
		return Math.max(0.1, Math.min(confidence, 1.0))
	}
	private calculateConfidence(data: any, originalText: string, domain: string = 'pod'): number {
		switch (domain) {
			case 'pod':
				return this.calculatePodConfidence(data, originalText)
			case 'player':
				return this.calculatePlayerConfidence(data, originalText)
			case 'league':
				return this.calculateLeagueConfidence(data, originalText)
			default:
				return 0.5 // Default confidence
		}
	}
	async healthCheck() {
		try {
			// Just check if the service is configured properly
			if (!this.genAI || !this.model) {
				return {
					status: 'unhealthy',
					details: {
						error: 'AI service not properly initialized'
					}
				}
			}

			// Check if API key exists
			if (!process.env.GEMINI_API_KEY) {
				return {
					status: 'unhealthy',
					details: {
						error: 'GEMINI_API_KEY not configured'
					}
				}
			}

			return {
				status: 'healthy',
				details: {
					service_initialized: true,
					api_key_configured: true,
					model: 'gemini-1.5-flash'
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

export async function parseWithAI(request: ParseRequest): Promise<ParseResponse> {
	const service = getAIParsingService()
	return service.parsePodText(request)
}
