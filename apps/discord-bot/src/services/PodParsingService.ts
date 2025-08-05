// apps/discord-bot/src/services/GameParsingService.ts
import { getAIParsingService } from '@dadgic/shared'
import type { ParsedPodData, ResponseBase } from '@dadgic/database'
import { ConversationManager, type MissingDataInfo } from './ConversationManager.js'

export class PodParsingService {
  /**
   * Parse game description and detect missing data
   */
  static async parseGameDescription(
    text: string, 
    userId: string
  ): Promise<ResponseBase<{
    parsedData: ParsedPodData
    missingData: MissingDataInfo
    confidence: number
  }>> {
    try {
      console.log('🤖 Parsing pod description:', { 
        textLength: text.length, 
        userId 
      })

      // Use shared AI service for pod parsing
      const aiService = getAIParsingService()
      const parseResult = await aiService.parseText({
        text,
        domain: 'pod',
        context: {
          source: 'discord',
          user_id: userId
        }
      })

      if (!parseResult.success) {
        return {
          success: false,
          error: parseResult.error || 'Failed to parse game description',
          timestamp: new Date().toISOString()
        }
      }

      // Detect missing data
      const missingData = this.detectMissingData(parseResult.data)

      return {
        success: true,
        data: {
          parsedData: parseResult.data,
          missingData,
          confidence: parseResult.data.confidence || 0.7
        },
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      console.error('❌ Pod parsing error:', error)
      return {
        success: false,
        error: 'AI parsing service temporarily unavailable',
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Update existing parsed data with new information
   */
  static async updateParsedData(
    conversationId: string,
    updates: {
      corrections?: string
      commanders?: string
      gameLength?: string
      turns?: string
      notes?: string
    }
  ): Promise<ResponseBase<{
    parsedData: ParsedPodData
    missingData: MissingDataInfo
  }>> {
    try {
      const conversation = ConversationManager.get(conversationId)
      if (!conversation) {
        return {
          success: false,
          error: 'Conversation not found or expired',
          timestamp: new Date().toISOString()
        }
      }

      console.log('🔄 Updating parsed pod data for conversation:', conversationId)

      // Build update text
      let updateText = conversation.originalInput
      if (updates.corrections) {
        updateText += `\n\nCorrections: ${updates.corrections}`
      }
      if (updates.commanders) {
        updateText += `\n\nCommanders: ${updates.commanders}`
      }
      if (updates.gameLength) {
        updateText += `\n\nGame length: ${updates.gameLength} minutes`
      }
      if (updates.turns) {
        updateText += `\n\nTurns: ${updates.turns}`
      }
      if (updates.notes) {
        updateText += `\n\nNotes: ${updates.notes}`
      }

      // Re-parse with additional context
      const aiService = getAIParsingService()
      const parseResult = await aiService.parseText({
        text: updateText,
        domain: 'pod',
        context: {
          source: 'discord',
          user_id: conversation.userId,
          metadata: {
            conversationState: {
              parsedData: conversation.parsedData,
              originalText: conversation.originalInput
            }
          }
        }
      })

      if (!parseResult.success) {
        return {
          success: false,
          error: parseResult.error || 'Failed to update parsed data',
          timestamp: new Date().toISOString()
        }
      }

      // Detect missing data in updated result
      const missingData = this.detectMissingData(parseResult.data)

      // Update conversation
      ConversationManager.update(conversationId, {
        parsedData: parseResult.data,
        missingData
      })

      return {
        success: true,
        data: {
          parsedData: parseResult.data,
          missingData
        },
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      console.error('❌ Pod data update error:', error)
      return {
        success: false,
        error: 'Failed to update parsed data',
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Detect what data is missing from parsed pod
   */
  private static detectMissingData(parsedData: ParsedPodData): MissingDataInfo {
    const missing: MissingDataInfo = {
      commanders: [],
      gameLength: false,
      turns: false,
      notes: false,
      players: []
    }

    // Check for missing commanders
    if (parsedData.participants) {
      missing.commanders = parsedData.participants
        .filter(p => !p.commander_deck || p.commander_deck.trim() === '')
        .map(p => p.player_identifier)
    }

    // Check for missing game data
    missing.gameLength = !parsedData.game_length_minutes
    missing.turns = !parsedData.turns
    missing.notes = !parsedData.notes || parsedData.notes.trim() === ''

    return missing
  }

  /**
   * Check if pod data is complete enough to submit
   */
  static isReadyForSubmission(parsedData: ParsedPodData, missingData: MissingDataInfo): boolean {
    // Must have participants
    if (!parsedData.participants || parsedData.participants.length < 2) {
      return false
    }

    // Must have at least one winner
    const hasWinner = parsedData.participants.some(p => p.result === 'win')
    if (!hasWinner) {
      return false
    }

    // Missing commanders is OK - can submit without them
    // Missing game length/turns/notes is OK - optional data

    return true
  }

  /**
   * Get missing data summary for user display
   */
  static getMissingDataSummary(missingData: MissingDataInfo): string[] {
    const summary: string[] = []

    if (missingData.commanders.length > 0) {
      summary.push(`Commanders for: ${missingData.commanders.join(', ')}`)
    }
    if (missingData.gameLength) {
      summary.push('Game duration')
    }
    if (missingData.turns) {
      summary.push('Turn count')
    }
    if (missingData.notes) {
      summary.push('Additional notes')
    }
    if (missingData.players.length > 0) {
      summary.push(`Unresolved players: ${missingData.players.join(', ')}`)
    }

    return summary
  }
}