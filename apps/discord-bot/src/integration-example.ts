// Example integration for apps/discord-bot/src/index.ts
// Add these imports at the top:

/*
import { DiscordBotMonitoring } from './services/monitoring/DiscordBotMonitoring'
import { ErrorLogger } from '@dadgic/shared/monitoring'

// In your client.once('ready') handler, add:
client.once('ready', async () => {
  console.log(`🤖 Bot is ready! Logged in as ${client.user?.tag}`)
  
  // Initialize monitoring
  DiscordBotMonitoring.initialize(client)
  
  // Your existing ready logic...
})

// Wrap your command handlers with monitoring:
const handleReportCommandWithMonitoring = ErrorRecoveryMiddleware.wrapCommandHandler(
  async (interaction: ChatInputCommandInteraction) => {
    const startTime = Date.now()
    
    try {
      await handleReportCommand(interaction)
      
      // Log successful command
      await DiscordBotMonitoring.logCommandUsage(
        'report',
        interaction.user.id,
        interaction.guildId || '',
        true,
        Date.now() - startTime
      )
    } catch (error) {
      // Log failed command
      await DiscordBotMonitoring.logCommandUsage(
        'report',
        interaction.user.id,
        interaction.guildId || '',
        false,
        Date.now() - startTime,
        error instanceof Error ? error : new Error(String(error))
      )
      throw error
    }
  }
)
*/
