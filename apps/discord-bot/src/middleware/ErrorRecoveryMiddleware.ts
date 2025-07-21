import { 
  ChatInputCommandInteraction, 
  ButtonInteraction, 
  ModalSubmitInteraction 
} from 'discord.js'
import { 
  ErrorRecoveryService, 
  ConversationRecoveryService,
  GeminiRetryService
} from '../services/error-recovery'

type InteractionHandler<T> = (interaction: T) => Promise<void>

export class ErrorRecoveryMiddleware {
  static wrapCommandHandler(
    handler: InteractionHandler<ChatInputCommandInteraction>
  ): InteractionHandler<ChatInputCommandInteraction> {
    return async (interaction: ChatInputCommandInteraction) => {
      try {
        await handler(interaction)
      } catch (error) {
        await ErrorRecoveryService.handleCommandError(
          interaction, 
          error as Error,
          { commandName: interaction.commandName }
        )
      }
    }
  }

  static wrapButtonHandler(
    handler: InteractionHandler<ButtonInteraction>
  ): InteractionHandler<ButtonInteraction> {
    return async (interaction: ButtonInteraction) => {
      try {
        // Check if conversation is healthy before processing
        if (!ConversationRecoveryService.isConversationHealthy(interaction.user.id)) {
          await ConversationRecoveryService.handleBrokenConversation(
            interaction,
            new Error('Conversation exceeded maximum attempts or timeout')
          )
          return
        }

        await handler(interaction)
      } catch (error) {
        await ErrorRecoveryService.handleButtonError(
          interaction, 
          error as Error,
          { customId: interaction.customId }
        )

        // Handle conversation-specific errors
        if (error.message.includes('conversation') || error.message.includes('state')) {
          await ConversationRecoveryService.handleBrokenConversation(interaction, error as Error)
        }
      }
    }
  }

  static wrapModalHandler(
    handler: InteractionHandler<ModalSubmitInteraction>
  ): InteractionHandler<ModalSubmitInteraction> {
    return async (interaction: ModalSubmitInteraction) => {
      try {
        await handler(interaction)
      } catch (error) {
        await ErrorRecoveryService.handleModalError(
          interaction, 
          error as Error,
          { customId: interaction.customId }
        )

        // Handle conversation-specific errors
        if (error.message.includes('conversation') || error.message.includes('state')) {
          await ConversationRecoveryService.handleBrokenConversation(interaction, error as Error)
        }
      }
    }
  }

  static async withGeminiRetry<T>(
    operation: () => Promise<T>,
    fallback?: (error: string) => Promise<T>
  ): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      console.error('Operation failed, checking if it was Gemini-related:', error)
      
      if (error.message.includes('Gemini') || error.message.includes('AI')) {
        console.log('Detected Gemini error, using fallback if available')
        if (fallback) {
          return await fallback(error.message)
        }
      }
      
      throw error
    }
  }

  // Health check utilities
  static async performHealthChecks(): Promise<{
    gemini: boolean
    conversations: number
    errors: { total: number, recent: number }
  }> {
    const [geminiHealthy] = await Promise.allSettled([
      GeminiRetryService.isGeminiHealthy()
    ])

    const conversationStats = ConversationRecoveryService.getConversationStats()

    return {
      gemini: geminiHealthy.status === 'fulfilled' ? geminiHealthy.value : false,
      conversations: conversationStats.active,
      errors: {
        total: 0, // Would track from ErrorRecoveryService if we added a counter
        recent: 0
      }
    }
  }

  // Cleanup old data periodically
  static startCleanupTimer(): void {
    const CLEANUP_INTERVAL = 900000 // 15 minutes
    
    setInterval(() => {
      console.log('🧹 Running error recovery cleanup...')
      ConversationRecoveryService.cleanupOldConversations()
      ErrorRecoveryService.cleanupOldErrors()
    }, CLEANUP_INTERVAL)

    console.log('✅ Error recovery cleanup timer started')
  }
}
