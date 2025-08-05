// apps/discord-bot/src/commands/ReportCommand.ts - Fully modular
import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js'
import { ConversationManager } from '../services/ConversationManager.js'
import { PodParsingService } from '../services/PodParsingService.js'
import { PodEmbedBuilder } from '../ui/EmbedBuilder.js'
import { PodComponentBuilder } from '../ui/ComponentBuilder.js'

export class ReportCommand {
  static data = new SlashCommandBuilder()
    .setName('report')
    .setDescription('Report a Commander pod game result')
    .addStringOption(option =>
      option.setName('game')
        .setDescription('Describe the game (e.g., "Scott beat Mike and John with Teval")')
        .setRequired(true)
    )

  static async execute(interaction: ChatInputCommandInteraction) {
    const gameText = interaction.options.getString('game', true)
    
    await interaction.deferReply({ ephemeral: true })

    try {
      console.log(`🎯 Processing pod report from ${interaction.user.username}: "${gameText}"`)

      // Create conversation
      const conversationId = ConversationManager.create(interaction.user.id, gameText)

      // Parse game description
      const parseResult = await PodParsingService.parseGameDescription(
        gameText,
        interaction.user.id
      )

      if (!parseResult.success) {
        // Clean up conversation on failure
        ConversationManager.delete(conversationId)
        
        await interaction.followUp({
          embeds: [PodEmbedBuilder.buildError(
            parseResult.error!,
            '❌ Parsing Failed'
          )],
          ephemeral: true
        })
        return
      }

      const { parsedData, missingData, confidence } = parseResult.data!

      // Update conversation with parsed data
      ConversationManager.update(conversationId, {
        parsedData,
        missingData
      })

      // Check if we have missing critical data
      const hasMissingData = PodParsingService.getMissingDataSummary(missingData).length > 0

      // Build confirmation embed and buttons
      const embed = PodEmbedBuilder.buildParsingConfirmation(
        gameText,
        parsedData,
        missingData,
        confidence
      )

      const buttons = PodComponentBuilder.buildConfirmationButtons(
        conversationId,
        hasMissingData
      )

      await interaction.followUp({
        embeds: [embed],
        components: [buttons],
        ephemeral: true
      })

      console.log(`✅ Pod parsing completed for conversation: ${conversationId}`)

    } catch (error) {
      console.error('❌ Report command error:', error)
      
      await interaction.followUp({
        embeds: [PodEmbedBuilder.buildError(
          'An unexpected error occurred while processing your game report.',
          '❌ Processing Failed'
        )],
        ephemeral: true
      })
    }
  }
}