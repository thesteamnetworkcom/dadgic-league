// apps/discord-bot/src/commands/HelpCommand.ts
import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, Colors } from 'discord.js'

export class HelpCommand {
  static data = new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show help for the MTG Commander bot')

  static async execute(interaction: ChatInputCommandInteraction) {
    const helpEmbed = new EmbedBuilder()
      .setColor(Colors.Gold)
      .setTitle('🎯 MTG Commander Bot Help')
      .setDescription('Track your Commander pod games with natural language!')
      .addFields(
        {
          name: '📝 `/report <game>`',
          value: 'Report a game using natural language. I\'ll parse it and ask for any missing details.\n**Example:** `/report Scott beat Mike and John with Teval`',
          inline: false
        },
        {
          name: '💡 Tips for Reporting Games',
          value: '• Mention who won: "Scott beat everyone"\n• Include commanders: "with Teval"\n• Add details: "90 minute game"\n• Don\'t worry about missing info - I\'ll ask!',
          inline: false
        }
      )
      .setFooter({ text: 'Made with ❤️ for the MTG Commander community' })

    await interaction.reply({ embeds: [helpEmbed] })
  }
}