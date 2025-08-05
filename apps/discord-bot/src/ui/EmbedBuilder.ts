// apps/discord-bot/src/ui/EmbedBuilder.ts
import { EmbedBuilder, Colors } from 'discord.js'
import type { ParsedPodData } from '@dadgic/database'
import type { MissingDataInfo } from '../services/ConversationManager.js'
import { PodParsingService } from '../services/PodParsingService.js'

export class PodEmbedBuilder {
  /**
   * Build initial parsing confirmation embed
   */
  static buildParsingConfirmation(
    originalText: string,
    parsedData: ParsedPodData,
    missingData: MissingDataInfo,
    confidence: number
  ): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setColor(confidence > 0.8 ? Colors.Green : confidence > 0.6 ? Colors.Yellow : Colors.Orange)
      .setTitle('🎮 Pod Parsed Successfully!')
      .setDescription(`**Original:** ${originalText}`)

    // Add participants
    if (parsedData.participants && parsedData.participants.length > 0) {
      const participantText = parsedData.participants.map(p => {
        const resultEmoji = p.result === 'win' ? '🏆' : p.result === 'lose' ? '❌' : '🤝'
        const commanderText = p.commander_deck ? ` (${p.commander_deck})` : ''
        return `${resultEmoji} ${p.player_identifier}${commanderText}`
      }).join('\n')

      embed.addFields({ 
        name: '👥 Players', 
        value: participantText, 
        inline: false 
      })
    }

    // Add game details
    const gameDetails: string[] = []
    if (parsedData.game_length_minutes) {
      gameDetails.push(`⏱️ Duration: ${parsedData.game_length_minutes} minutes`)
    }
    if (parsedData.turns) {
      gameDetails.push(`🔄 Turns: ${parsedData.turns}`)
    }
    if (parsedData.date) {
      gameDetails.push(`📅 Date: ${parsedData.date}`)
    }

    if (gameDetails.length > 0) {
      embed.addFields({ 
        name: '📊 Game Details', 
        value: gameDetails.join('\n'), 
        inline: true 
      })
    }

    // Add notes if present
    if (parsedData.notes) {
      embed.addFields({ 
        name: '📝 Notes', 
        value: parsedData.notes, 
        inline: false 
      })
    }

    // Add missing data warning if any
    const missingSummary = PodParsingService.getMissingDataSummary(missingData)
    if (missingSummary.length > 0) {
      embed.addFields({
        name: '⚠️ Missing Information',
        value: missingSummary.join('\n'),
        inline: false
      })
    }

    // Add confidence indicator
    const confidenceText = confidence > 0.8 ? 'High' : confidence > 0.6 ? 'Medium' : 'Low'
    embed.setFooter({ 
      text: `Parsing confidence: ${confidenceText} (${Math.round(confidence * 100)}%)` 
    })

    return embed
  }

  /**
   * Build success embed after pod creation
   */
  static buildSubmissionSuccess(podId: string, originalText: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(Colors.Green)
      .setTitle('✅ Pod Recorded Successfully!')
      .setDescription(`Your game has been recorded in the system.`)
      .addFields({ 
        name: '🎮 Pod ID', 
        value: podId, 
        inline: true 
      })
      .addFields({ 
        name: '📝 Original Description', 
        value: originalText, 
        inline: false 
      })
      .setFooter({ 
        text: 'Thanks for tracking your Commander games!' 
      })
      .setTimestamp()
  }

  /**
   * Build error embed
   */
  static buildError(error: string, title: string = '❌ Something Went Wrong'): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(Colors.Red)
      .setTitle(title)
      .setDescription(error)
      .setFooter({ 
        text: 'Please try again or contact support if the issue persists.' 
      })
      .setTimestamp()
  }

  /**
   * Build help embed
   */
  static buildHelp(): EmbedBuilder {
    return new EmbedBuilder()
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
          value: '• Mention who won: "Scott beat everyone"\n• Include commanders: "with Teval"\n• Add details: "90 minute game, 12 turns"\n• Don\'t worry about missing info - I\'ll ask!',
          inline: false
        },
        {
          name: '🔧 What happens next?',
          value: '1. I\'ll parse your description\n2. Show you what I understood\n3. Ask for any missing details\n4. Let you confirm and submit',
          inline: false
        }
      )
      .setFooter({ 
        text: 'Made with ❤️ for the MTG Commander community' 
      })
  }

  /**
   * Build missing data prompt embed
   */
  static buildMissingDataPrompt(missingData: MissingDataInfo): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setColor(Colors.Blue)
      .setTitle('📝 Additional Information Needed')
      .setDescription('I could parse most of your game, but need a few more details:')

    const missingSummary = PodParsingService.getMissingDataSummary(missingData)
    if (missingSummary.length > 0) {
      embed.addFields({
        name: '❓ Missing Details',
        value: missingSummary.join('\n'),
        inline: false
      })
    }

    embed.addFields({
      name: '💡 What to do',
      value: 'Click "Fill Missing Info" to add the missing details, or "Submit Anyway" if you want to skip them.',
      inline: false
    })

    return embed
  }

  /**
   * Build conversation expired embed
   */
  static buildConversationExpired(): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(Colors.Orange)
      .setTitle('⏰ Session Expired')
      .setDescription('This conversation has expired. Please start a new `/report` to log your game.')
      .setFooter({ 
        text: 'Sessions expire after 15 minutes of inactivity for security.' 
      })
  }
}