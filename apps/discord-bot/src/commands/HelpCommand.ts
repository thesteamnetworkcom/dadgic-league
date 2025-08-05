// apps/discord-bot/src/commands/HelpCommand.ts - Using EmbedBuilder
import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js'
import { PodEmbedBuilder } from '../ui/EmbedBuilder.js'

export class HelpCommand {
  static data = new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show help for the MTG Commander bot')

  static async execute(interaction: ChatInputCommandInteraction) {
    const helpEmbed = PodEmbedBuilder.buildHelp()
    await interaction.reply({ embeds: [helpEmbed] })
  }
}