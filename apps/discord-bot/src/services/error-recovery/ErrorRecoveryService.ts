import { 
  ChatInputCommandInteraction, 
  ButtonInteraction, 
  ModalSubmitInteraction,
  InteractionType
} from 'discord.js'

export interface ErrorContext {
  userId: string
  guildId: string | null
  commandName?: string
  customId?: string
  timestamp: number
  userAgent?: string
}

export class ErrorRecoveryService {
  private static errorCounts = new Map<string, number>()
  private static lastErrorTime = new Map<string, number>()
  private static readonly MAX_ERRORS_PER_USER = 5
  private static readonly ERROR_RESET_TIME = 300000 // 5 minutes

  static async handleCommandError(
    interaction: ChatInputCommandInteraction,
    error: Error,
    context?: Partial<ErrorContext>
  ): Promise<void> {
    const errorContext = this.buildErrorContext(interaction, context)
    
    console.error('❌ Discord Command Error:', {
      error: error.message,
      stack: error.stack,
      context: errorContext
    })

    // Check if user is hitting too many errors
    if (this.isUserExceedingErrorLimit(errorContext.userId)) {
      await this.handleRateLimitedUser(interaction, errorContext)
      return
    }

    // Log the error
    this.logError(errorContext.userId, error)

    // Send appropriate error message based on error type
    if (error.message.includes('Gemini') || error.message.includes('AI')) {
      await this.handleAIError(interaction, error)
    } else if (error.message.includes('database') || error.message.includes('Supabase')) {
      await this.handleDatabaseError(interaction, error)
    } else if (error.message.includes('timeout') || error.message.includes('network')) {
      await this.handleNetworkError(interaction, error)
    } else {
      await this.handleGenericError(interaction, error)
    }
  }

  static async handleButtonError(
    interaction: ButtonInteraction,
    error: Error,
    context?: Partial<ErrorContext>
  ): Promise<void> {
    const errorContext = this.buildErrorContext(interaction, context)
    
    console.error('❌ Discord Button Error:', {
      error: error.message,
      customId: interaction.customId,
      context: errorContext
    })

    this.logError(errorContext.userId, error)

    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({
          content: '❌ Something went wrong with that button. Please try the command again.',
          ephemeral: true
        })
      } else {
        await interaction.reply({
          content: '❌ Something went wrong with that button. Please try the command again.',
          ephemeral: true
        })
      }
    } catch (followupError) {
      console.error('Failed to send button error message:', followupError)
    }
  }

  static async handleModalError(
    interaction: ModalSubmitInteraction,
    error: Error,
    context?: Partial<ErrorContext>
  ): Promise<void> {
    const errorContext = this.buildErrorContext(interaction, context)
    
    console.error('❌ Discord Modal Error:', {
      error: error.message,
      customId: interaction.customId,
      context: errorContext
    })

    this.logError(errorContext.userId, error)

    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({
          content: '❌ There was an error processing your submission. Please try again.',
          ephemeral: true
        })
      } else {
        await interaction.reply({
          content: '❌ There was an error processing your submission. Please try again.',
          ephemeral: true
        })
      }
    } catch (followupError) {
      console.error('Failed to send modal error message:', followupError)
    }
  }

  private static async handleAIError(
    interaction: ChatInputCommandInteraction,
    error: Error
  ): Promise<void> {
    const message = `🤖 **AI Service Temporarily Unavailable**

The game parsing AI is having trouble right now. You have a few options:

🔄 **Try again** - Sometimes it's just a temporary hiccup
📝 **Use manual reporting** - Type \`/report-manual\` for a form-based approach
⏰ **Try later** - The AI service might be back online soon

**Error:** ${error.message.substring(0, 100)}...`

    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ content: message, ephemeral: true })
      } else {
        await interaction.reply({ content: message, ephemeral: true })
      }
    } catch (replyError) {
      console.error('Failed to send AI error message:', replyError)
    }
  }

  private static async handleDatabaseError(
    interaction: ChatInputCommandInteraction,
    error: Error
  ): Promise<void> {
    const message = `💾 **Database Connection Issue**

There's a temporary problem saving your game data. Don't worry, this usually resolves quickly!

🔄 **Please try again in a moment**
📞 **Still having issues?** Let an admin know

**Error ID:** \`${Date.now()}\``

    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ content: message, ephemeral: true })
      } else {
        await interaction.reply({ content: message, ephemeral: true })
      }
    } catch (replyError) {
      console.error('Failed to send database error message:', replyError)
    }
  }

  private static async handleNetworkError(
    interaction: ChatInputCommandInteraction,
    error: Error
  ): Promise<void> {
    const message = `🌐 **Connection Timeout**

The request took too long to complete. This sometimes happens with complex operations.

🔄 **Please try again** - It might work on the second attempt
⏱️ **If it keeps happening** - The service might be under heavy load

Try breaking complex requests into smaller parts if possible.`

    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ content: message, ephemeral: true })
      } else {
        await interaction.reply({ content: message, ephemeral: true })
      }
    } catch (replyError) {
      console.error('Failed to send network error message:', replyError)
    }
  }

  private static async handleGenericError(
    interaction: ChatInputCommandInteraction,
    error: Error
  ): Promise<void> {
    const message = `❌ **Something Went Wrong**

An unexpected error occurred. The bot is still working, just this specific action failed.

🔄 **Try the command again**
📝 **Different approach?** Try a different command or simpler input
🆘 **Need help?** Contact an admin with this error ID

**Error ID:** \`${Date.now()}\`
**Command:** \`${interaction.commandName}\``

    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ content: message, ephemeral: true })
      } else {
        await interaction.reply({ content: message, ephemeral: true })
      }
    } catch (replyError) {
      console.error('Failed to send generic error message:', replyError)
    }
  }

  private static async handleRateLimitedUser(
    interaction: ChatInputCommandInteraction,
    context: ErrorContext
  ): Promise<void> {
    const message = `⚠️ **Too Many Errors**

You've encountered several errors in a short time. To prevent spam, please:

⏰ **Wait 5 minutes** before trying again
🔄 **Try simpler commands** to test if the bot is working
📞 **Contact an admin** if you keep having problems

This limit resets automatically after 5 minutes.`

    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ content: message, ephemeral: true })
      } else {
        await interaction.reply({ content: message, ephemeral: true })
      }
    } catch (replyError) {
      console.error('Failed to send rate limit error message:', replyError)
    }
  }

  private static buildErrorContext(
    interaction: ChatInputCommandInteraction | ButtonInteraction | ModalSubmitInteraction,
    additional?: Partial<ErrorContext>
  ): ErrorContext {
    return {
      userId: interaction.user.id,
      guildId: interaction.guildId,
      commandName: interaction.isChatInputCommand() ? interaction.commandName : undefined,
      customId: 'customId' in interaction ? interaction.customId : undefined,
      timestamp: Date.now(),
      ...additional
    }
  }

  private static logError(userId: string, error: Error): void {
    const now = Date.now()
    const currentCount = this.errorCounts.get(userId) || 0
    const lastError = this.lastErrorTime.get(userId) || 0

    // Reset count if enough time has passed
    if (now - lastError > this.ERROR_RESET_TIME) {
      this.errorCounts.set(userId, 1)
    } else {
      this.errorCounts.set(userId, currentCount + 1)
    }

    this.lastErrorTime.set(userId, now)

    // TODO: Send to external logging service in production
    console.error(`User ${userId} error count: ${this.errorCounts.get(userId)}`)
  }

  private static isUserExceedingErrorLimit(userId: string): boolean {
    const count = this.errorCounts.get(userId) || 0
    const lastError = this.lastErrorTime.get(userId) || 0
    const now = Date.now()

    // Reset if enough time has passed
    if (now - lastError > this.ERROR_RESET_TIME) {
      this.errorCounts.delete(userId)
      this.lastErrorTime.delete(userId)
      return false
    }

    return count >= this.MAX_ERRORS_PER_USER
  }

  static cleanupOldErrors(): void {
    const now = Date.now()
    
    for (const [userId, lastError] of this.lastErrorTime.entries()) {
      if (now - lastError > this.ERROR_RESET_TIME) {
        this.errorCounts.delete(userId)
        this.lastErrorTime.delete(userId)
      }
    }
  }
}
