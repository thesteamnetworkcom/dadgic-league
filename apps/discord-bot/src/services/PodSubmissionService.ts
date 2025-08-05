// apps/discord-bot/src/services/PodSubmissionService.ts
import { createPod } from '@dadgic/shared'
import type { PodInput, DatabaseAuthContext, ResponseBase } from '@dadgic/database'
import { ConversationManager } from './ConversationManager.js'

export class PodSubmissionService {
  /**
   * Submit parsed pod data to create a pod
   */
  static async submitPod(
    conversationId: string,
    discordUserId: string
  ): Promise<ResponseBase<{ podId: string }>> {
    try {
      const conversation = ConversationManager.get(conversationId)
      if (!conversation) {
        return {
          success: false,
          error: 'Conversation not found or expired',
          timestamp: new Date().toISOString()
        }
      }

      console.log('🎮 Submitting pod for conversation:', conversationId)

      // Build auth context for Discord bot (service role)
      const authContext: DatabaseAuthContext = {
        user_id: discordUserId,
        supabase_user_id: discordUserId,
        is_admin: true // Discord bot operates with admin privileges
      }

      // Convert parsed data to PodInput format
      const podInput: PodInput = {
        date: conversation.parsedData.date || Date.now().toString(),
        league_id: null, // Discord pods are not part of leagues
        game_length_minutes: conversation.parsedData.game_length_minutes || null,
        turns: conversation.parsedData.turns || null,
        notes: conversation.parsedData.notes || null,
        participants: conversation.parsedData.participants || []
      }

      console.log('📤 Calling createPod with:', {
        participantCount: podInput.participants.length,
        hasGameLength: !!podInput.game_length_minutes,
        hasTurns: !!podInput.turns
      })

      // Call shared PodService
      const result = await createPod(podInput, authContext)

      if (!result.success) {
        console.error('❌ Pod creation failed:', result.error)
        
        // Check for common player resolution errors
        if (result.error?.includes('player') || result.error?.includes('identifier')) {
          return {
            success: false,
            error: `Player resolution failed: ${result.error}\n\nTry using Discord usernames or check spelling.`,
            timestamp: new Date().toISOString()
          }
        }

        return {
          success: false,
          error: result.error || 'Failed to create pod',
          timestamp: new Date().toISOString()
        }
      }

      // Clean up conversation on successful submission
      ConversationManager.delete(conversationId)
      
      console.log('✅ Pod created successfully:', result.data?.id)

      return {
        success: true,
        data: { podId: result.data!.id },
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      console.error('❌ Pod submission error:', error)
      return {
        success: false,
        error: 'Failed to submit pod',
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Get pod creation stats for monitoring
   */
  static getStats(): {
    submitted: number
    failed: number
  } {
    // TODO: Implement stats tracking if needed
    return {
      submitted: 0,
      failed: 0
    }
  }
}