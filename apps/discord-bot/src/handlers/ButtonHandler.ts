// apps/discord-bot/src/handlers/ButtonHandler.ts
import type { ButtonInteraction } from 'discord.js'
import { ConversationManager } from '../services/ConversationManager.js'
import { PodSubmissionService } from '../services/PodSubmissionService.js'
import { PodEmbedBuilder } from '../ui/EmbedBuilder.js'
import { PodComponentBuilder } from '../ui/ComponentBuilder.js'
import { PodParsingService } from '../services/PodParsingService.js'

export class ButtonHandler {
  /**
   * Handle all button interactions for pod reporting
   */
  static async handle(interaction: ButtonInteraction): Promise<void> {
    try {
        console.log('🔍 Button clicked with custom ID:', interaction.customId)
      // Parse custom ID
      const parsed = PodComponentBuilder.parseCustomId(interaction.customId)
      console.log('🔍 Parsed custom ID:', parsed)
      if (!parsed) {
        await interaction.reply({
          content: 'Invalid interaction. Please start a new `/report`.',
          ephemeral: true
        })
        return
      }

      const { action, conversationId } = parsed

      // Get conversation
      const conversation = ConversationManager.get(conversationId)
      if (!conversation) {
        await interaction.reply({
          embeds: [PodEmbedBuilder.buildConversationExpired()],
          ephemeral: true
        })
        return
      }

      // Verify user owns this conversation
      if (interaction.user.id !== conversation.userId) {
        await interaction.reply({
          content: 'This interaction is not for you!',
          ephemeral: true
        })
        return
      }

      // Route to appropriate handler
      switch (action) {
        case 'fill-missing':
          await this.handleFillMissing(interaction, conversationId, conversation)
          break
        
        case 'submit-anyway':
        case 'submit':
          await this.handleSubmit(interaction, conversationId, conversation)
          break
          
        case 'edit':
          await this.handleEdit(interaction, conversationId, conversation)
          break
          
        case 'cancel':
          await this.handleCancel(interaction, conversationId)
          break
          
        default:
          await interaction.reply({
            content: 'Unknown action. Please start a new `/report`.',
            ephemeral: true
          })
      }

    } catch (error) {
      console.error('❌ Button handler error:', error)
      
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          embeds: [PodEmbedBuilder.buildError('An error occurred processing your request.')],
          ephemeral: true
        })
      }
    }
  }

  /**
   * Handle "Fill Missing Info" button - show modal
   */
  private static async handleFillMissing(
    interaction: ButtonInteraction,
    conversationId: string,
    conversation: any
  ): Promise<void> {
    console.log('📝 Showing missing data modal for:', conversationId)

    const modal = PodComponentBuilder.buildMissingDataModal(
      conversationId,
      conversation.missingData
    )

    await interaction.showModal(modal)
  }

  /**
   * Handle "Submit" or "Submit Anyway" button - create pod
   */
  private static async handleSubmit(
    interaction: ButtonInteraction,
    conversationId: string,
    conversation: any
  ): Promise<void> {
    await interaction.deferUpdate()

    console.log('✅ Submitting pod for:', conversationId)

    // Check if pod data is ready
    const isReady = PodParsingService.isReadyForSubmission(
      conversation.parsedData,
      conversation.missingData
    )

    if (!isReady) {
      await interaction.editReply({
        embeds: [PodEmbedBuilder.buildError(
          'Cannot submit pod: Missing required information (players and winner).',
          '❌ Submission Failed'
        )],
        components: []
      })
      return
    }

    // Submit pod
    const result = await PodSubmissionService.submitPod(
      conversationId,
      interaction.user.id
    )

    if (result.success) {
      await interaction.editReply({
        embeds: [PodEmbedBuilder.buildSubmissionSuccess(
          result.data!.podId,
          conversation.originalInput
        )],
        components: []
      })
    } else {
      await interaction.editReply({
        embeds: [PodEmbedBuilder.buildError(result.error!, '❌ Submission Failed')],
        components: []
      })
    }
  }

  /**
   * Handle "Make Changes" button - show corrections modal
   */
  private static async handleEdit(
    interaction: ButtonInteraction,
    conversationId: string,
    conversation: any
  ): Promise<void> {
    console.log('✏️ Showing corrections modal for:', conversationId)

    const modal = PodComponentBuilder.buildCorrectionsModal(conversationId)
    await interaction.showModal(modal)
  }

  /**
   * Handle "Cancel" button - delete conversation
   */
  private static async handleCancel(
    interaction: ButtonInteraction,
    conversationId: string
  ): Promise<void> {
    console.log('❌ Cancelling conversation:', conversationId)

    ConversationManager.delete(conversationId)

    await interaction.update({
      content: '❌ Pod report cancelled.',
      embeds: [],
      components: []
    })
  }
}