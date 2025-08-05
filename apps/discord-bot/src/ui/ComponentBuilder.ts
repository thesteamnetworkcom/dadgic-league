// apps/discord-bot/src/ui/ComponentBuilder.ts
import { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle 
} from 'discord.js'
import type { MissingDataInfo } from '../services/ConversationManager.js'

export class PodComponentBuilder {
  /**
   * Build confirmation buttons for parsed pod
   */
  static buildConfirmationButtons(conversationId: string, hasMissingData: boolean): ActionRowBuilder<ButtonBuilder> {
    console.log('🔧 Building buttons for conversation:', conversationId, 'hasMissingData:', hasMissingData)
  
    const buttons = new ActionRowBuilder<ButtonBuilder>()

    if (hasMissingData) {
        const fillMissingId = `fill-missing-${conversationId}`
    console.log('📝 Fill missing button ID:', fillMissingId)
      buttons.addComponents(
        new ButtonBuilder()
          .setCustomId(`fill-missing-${conversationId}`)
          .setLabel('Fill Missing Info')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('📝'),
        new ButtonBuilder()
          .setCustomId(`submit-anyway-${conversationId}`)
          .setLabel('Submit Anyway')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('✅'),
        new ButtonBuilder()
          .setCustomId(`cancel-${conversationId}`)
          .setLabel('Cancel')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('❌')
      )
    } else {
      buttons.addComponents(
        new ButtonBuilder()
          .setCustomId(`submit-${conversationId}`)
          .setLabel('Submit Pod')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('✅'),
        new ButtonBuilder()
          .setCustomId(`edit-${conversationId}`)
          .setLabel('Make Changes')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('✏️'),
        new ButtonBuilder()
          .setCustomId(`cancel-${conversationId}`)
          .setLabel('Cancel')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('❌')
      )
    }

    return buttons
  }

  /**
   * Build modal for filling missing data
   */
  // In apps/discord-bot/src/ui/ComponentBuilder.ts
// Replace the buildMissingDataModal function:
static buildMissingDataModal(conversationId: string, missingData: MissingDataInfo): ModalBuilder {
  const modal = new ModalBuilder()
    .setCustomId(`missing-data-${conversationId}`)
    .setTitle('Complete Pod Information')

  // Always add corrections field first - for AI re-parsing
  const correctionsInput = new TextInputBuilder()
    .setCustomId('corrections')
    .setLabel('Corrections for AI Parser')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('e.g., "Actually Mike won, not Scott" or "It was 4 players not 3"')
    .setRequired(false)
    .setMaxLength(500)

  const correctionsRow = new ActionRowBuilder<TextInputBuilder>().addComponents(correctionsInput)
  modal.addComponents(correctionsRow)

  // Always add commanders field (not just when missing)
  const commandersInput = new TextInputBuilder()
    .setCustomId('commanders')
    .setLabel('Commanders (one per player)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g., Atraxa, Krenko, Meren, Korvold')
    .setRequired(false)
    .setMaxLength(200)

  const commandersRow = new ActionRowBuilder<TextInputBuilder>().addComponents(commandersInput)
  modal.addComponents(commandersRow)

  // Always add game length field
  const gameLengthInput = new TextInputBuilder()
    .setCustomId('gameLength')
    .setLabel('Game Duration (minutes)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g., 90')
    .setRequired(false)
    .setMaxLength(10)

  const gameLengthRow = new ActionRowBuilder<TextInputBuilder>().addComponents(gameLengthInput)
  modal.addComponents(gameLengthRow)

  // Always add turns field
  const turnsInput = new TextInputBuilder()
    .setCustomId('turns')
    .setLabel('Number of Turns')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g., 12')
    .setRequired(false)
    .setMaxLength(10)

  const turnsRow = new ActionRowBuilder<TextInputBuilder>().addComponents(turnsInput)
  modal.addComponents(turnsRow)

  // Notes field (always last)
  const notesInput = new TextInputBuilder()
    .setCustomId('notes')
    .setLabel('Additional Notes')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Any other details...')
    .setRequired(false)
    .setMaxLength(500)

  const notesRow = new ActionRowBuilder<TextInputBuilder>().addComponents(notesInput)
  modal.addComponents(notesRow)

  return modal
}

  /**
   * Build general corrections modal
   */
  static buildCorrectionsModal(conversationId: string): ModalBuilder {
    const modal = new ModalBuilder()
      .setCustomId(`corrections-${conversationId}`)
      .setTitle('Make Corrections')

    const correctionsInput = new TextInputBuilder()
      .setCustomId('corrections')
      .setLabel('What needs to be corrected?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('e.g., "Actually Mike won, not Scott" or "It was Atraxa not Athreos"')
      .setRequired(true)
      .setMaxLength(500)

    const correctionsRow = new ActionRowBuilder<TextInputBuilder>().addComponents(correctionsInput)
    modal.addComponents(correctionsRow)

    return modal
  }

  /**
   * Parse custom ID to extract action and conversation ID
   */
static parseCustomId(customId: string): { action: string; conversationId: string } | null {
  console.log('🔍 Parsing custom ID:', customId)
  const match = customId.match(/^(.+)-(\d+-\d+)$/)
  console.log('🔍 Regex match result:', match)
  
  if (!match) return null

  const result = {
    action: match[1],
    conversationId: match[2]
  }
  console.log('🔍 Parsed result:', result)
  return result
}

  /**
   * Check if custom ID belongs to this bot
   */
  static isValidCustomId(customId: string): boolean {
    const validActions = [
      'fill-missing',
      'submit-anyway', 
      'submit',
      'edit',
      'cancel',
      'missing-data',
      'corrections'
    ]
    
    const parsed = this.parseCustomId(customId)
    return parsed ? validActions.includes(parsed.action) : false
  }
}