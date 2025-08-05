// apps/discord-bot/src/handlers/ModalHandler.ts
import type { ModalSubmitInteraction } from 'discord.js'
import { ConversationManager } from '../services/ConversationManager.js'
import { PodParsingService } from '../services/PodParsingService.js'
import { PodEmbedBuilder } from '../ui/EmbedBuilder.js'
import { PodComponentBuilder } from '../ui/ComponentBuilder.js'

export class ModalHandler {
  /**
   * Handle all modal submissions for pod reporting
   */
  static async handle(interaction: ModalSubmitInteraction): Promise<void> {
    try {
      // Parse custom ID
      const parsed = PodComponentBuilder.parseCustomId(interaction.customId)
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
        case 'missing-data':
          await this.handleMissingDataSubmission(interaction, conversationId, conversation)
          break
          
        case 'corrections':
          await this.handleCorrectionsSubmission(interaction, conversationId, conversation)
          break
          
        default:
          await interaction.reply({
            content: 'Unknown modal action. Please start a new `/report`.',
            ephemeral: true
          })
      }

    } catch (error) {
      console.error('❌ Modal handler error:', error)
      
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          embeds: [PodEmbedBuilder.buildError('An error occurred processing your submission.')],
          ephemeral: true
        })
      }
    }
  }

  /**
   * Handle missing data modal submission
   */
  private static async handleMissingDataSubmission(
    interaction: ModalSubmitInteraction,
    conversationId: string,
    conversation: any
  ): Promise<void> {
    await interaction.deferUpdate()

    console.log('📝 Processing missing data submission for:', conversationId)

    // Extract submitted data
    const commanders = interaction.fields.fields.get('commanders')?.value?.trim() || undefined
  const gameLength = interaction.fields.fields.get('gameLength')?.value?.trim() || undefined
  const turns = interaction.fields.fields.get('turns')?.value?.trim() || undefined
  const notes = interaction.fields.fields.get('notes')?.value?.trim() || undefined
  const corrections = interaction.fields.fields.get('corrections')?.value?.trim() || undefined

    console.log('📋 Submitted data:', { commanders, gameLength, turns, notes, corrections })

    // Update parsed data with new information
    const updateResult = await PodParsingService.updateParsedData(conversationId, {
      commanders,
      gameLength,
      turns,
      notes,
      corrections
    })

    if (!updateResult.success || !updateResult.data) {
  await interaction.editReply({
    embeds: [PodEmbedBuilder.buildError(
      updateResult.error || 'Update failed - no data returned.', 
      '❌ Update Failed'
    )],
    components: []
  })
  return
}

const { parsedData, missingData } = updateResult.data
    const hasMissingData = PodParsingService.getMissingDataSummary(missingData).length > 0
    
    const embed = PodEmbedBuilder.buildParsingConfirmation(
      conversation.originalInput,
      parsedData,
      missingData,
      0.9 // Higher confidence after manual input
    )

    const buttons = PodComponentBuilder.buildConfirmationButtons(conversationId, hasMissingData)

    await interaction.editReply({
      embeds: [embed],
      components: [buttons]
    })
  }

  /**
   * Handle corrections modal submission
   */
  private static async handleCorrectionsSubmission(
    interaction: ModalSubmitInteraction,
    conversationId: string,
    conversation: any
  ): Promise<void> {
    await interaction.deferUpdate()

    console.log('✏️ Processing corrections submission for:', conversationId)

    // Extract corrections
    const corrections = interaction.fields.getTextInputValue('corrections')?.trim()
    
    if (!corrections) {
      await interaction.editReply({
        embeds: [PodEmbedBuilder.buildError('No corrections provided.')],
        components: []
      })
      return
    }

    console.log('🔧 Corrections submitted:', corrections)

    // Update parsed data with corrections
    const updateResult = await PodParsingService.updateParsedData(conversationId, {
      corrections
    })

    if (!updateResult.success || !updateResult.data) {
  await interaction.editReply({
    embeds: [PodEmbedBuilder.buildError(
      updateResult.error || 'Update failed - no data returned.', 
      '❌ Update Failed'
    )],
    components: []
  })
  return
}

const { parsedData, missingData } = updateResult.data
    const hasMissingData = PodParsingService.getMissingDataSummary(missingData).length > 0
    
    const embed = PodEmbedBuilder.buildParsingConfirmation(
      conversation.originalInput,
      parsedData,
      missingData,
      0.8 // Good confidence after corrections
    )

    const buttons = PodComponentBuilder.buildConfirmationButtons(conversationId, hasMissingData)

    await interaction.editReply({
      embeds: [embed],
      components: [buttons]
    })
  }
}