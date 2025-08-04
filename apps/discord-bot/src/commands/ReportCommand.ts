// apps/discord-bot/src/commands/ReportCommand.ts
import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  Colors 
} from 'discord.js'
import { createPod, getAIParsingService, getPodService, PodService } from '@dadgic/shared'
import type { DatabaseAuthContext } from '@dadgic/database'

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
      console.log(`🎯 Processing game report: "${gameText}"`)

      // Parse game with AI
      const aiService = getAIParsingService()
      const parseResult = await aiService.parsePodText({
        text: gameText,
        domain: 'pod',
        context: {
          source: 'discord',
          user_id: interaction.user.id
        }
      })

      if (!parseResult.success) {
        await interaction.followUp({
          content: `❌ **Parsing Failed**\n\n${parseResult.error}\n\nPlease try rephrasing your game description.`,
          ephemeral: true
        })
        return
      }

      // Build confirmation embed
      const embed = new EmbedBuilder()
        .setColor(Colors.Green)
        .setTitle('🎮 Game Parsed Successfully!')
        .setDescription(`**Original:** ${gameText}`)
        .addFields(
          {
            name: '👥 Players',
            value: parseResult.data?.participants?.map(p => 
              `${p.result === 'win' ? '🏆' : '❌'} ${p.player_identifier}${p.commander_deck ? ` (${p.commander_deck})` : ''}`
            ).join('\n') || 'No players found',
            inline: false
          }
        )

      if (parseResult.data?.game_length_minutes) {
        embed.addFields({ name: '⏱️ Duration', value: `${parseResult.data.game_length_minutes} minutes`, inline: true })
      }
      if (parseResult.data?.turns) {
        embed.addFields({ name: '🔄 Turns', value: `${parseResult.data.turns}`, inline: true })
      }
      if (parseResult.data?.notes) {
        embed.addFields({ name: '📝 Notes', value: parseResult.data.notes, inline: false })
      }

      // Add buttons
      const buttons = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`submit-${interaction.user.id}`)
            .setLabel('Submit Game')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('✅'),
          new ButtonBuilder()
            .setCustomId(`cancel-${interaction.user.id}`)
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('❌')
        )

      await interaction.followUp({
        embeds: [embed],
        components: [buttons],
        ephemeral: true
      })

      // Store the parsed data for button handling
      // We'll use a simple Map for now
      ReportCommand.pendingReports.set(interaction.user.id, {
        originalText: gameText,
        parsedData: parseResult.data,
        timestamp: Date.now()
      })

    } catch (error) {
      console.error('❌ Report command error:', error)
      await interaction.followUp({
        content: '❌ Something went wrong while processing your game report. Please try again.',
        ephemeral: true
      })
    }
  }

  // Simple storage for pending reports (we'll improve this later)
  static pendingReports = new Map<string, {
    originalText: string
    parsedData: any
    timestamp: number
  }>()

  // Handle button interactions
  static async handleButtonInteraction(interaction: any) {
    const userId = interaction.customId.split('-')[1]
    
    if (interaction.user.id !== userId) {
      await interaction.reply({ content: 'This button is not for you!', ephemeral: true })
      return
    }

    const pendingReport = ReportCommand.pendingReports.get(userId)
    if (!pendingReport) {
      await interaction.reply({ content: 'This report has expired. Please submit a new one.', ephemeral: true })
      return
    }

    if (interaction.customId.startsWith('submit-')) {
      await ReportCommand.submitGame(interaction, pendingReport)
    } else if (interaction.customId.startsWith('cancel-')) {
      ReportCommand.pendingReports.delete(userId)
      await interaction.update({
        content: '❌ Game report cancelled.',
        embeds: [],
        components: []
      })
    }
  }

  static async submitGame(interaction: any, pendingReport: any) {
    try {
      await interaction.deferUpdate()

      // Create auth context for Discord bot (service role)
      const authContext: DatabaseAuthContext = {
        user_id: interaction.user.id,
        supabase_user_id: interaction.user.id,
        is_admin: true // Discord bot operates with admin privileges
      }

      // Create pod through PodService
      const podInput = {
        participants: pendingReport.parsedData.participants || [],
        duration_minutes: pendingReport.parsedData.duration_minutes,
        turns: pendingReport.parsedData.turns,
        notes: pendingReport.parsedData.notes,
        date: Date.now().toString()
      }

      const result = await createPod(podInput, authContext)

      if (result.success) {
        await interaction.editReply({
          content: `✅ **Game recorded successfully!**\n\nPod ID: ${result.data?.id}`,
          embeds: [],
          components: []
        })
      } else {
        await interaction.editReply({
          content: `❌ **Failed to record game**\n\n${result.error}`,
          embeds: [],
          components: []
        })
      }

      // Clean up
      ReportCommand.pendingReports.delete(interaction.user.id)

    } catch (error) {
      console.error('❌ Submit game error:', error)
      await interaction.editReply({
        content: '❌ Something went wrong while saving your game.',
        embeds: [],
        components: []
      })
    }
  }
}