import { Client, GatewayIntentBits } from 'discord.js'
import { HelpCommand } from './commands/HelpCommand.js'
import { ReportCommand } from './commands/ReportCommand.js'
import { ButtonHandler } from './handlers/ButtonHandler.js'
import { ModalHandler } from './handlers/ModalHandler.js'
import { PodComponentBuilder } from './ui/ComponentBuilder.js'
import { ConversationManager } from './services/ConversationManager.js'

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
})

client.once('ready', async () => {
  console.log(`🤖 Fresh Discord bot ready! Logged in as ${client.user?.tag}`)
  
  // Register commands
  const commands = [HelpCommand.data, ReportCommand.data]
  
  if (process.env.DISCORD_GUILD_ID) {
    const guild = await client.guilds.fetch(process.env.DISCORD_GUILD_ID)
    await guild.commands.set(commands)
    console.log(`✅ Commands registered to guild`)
  } else {
    await client.application?.commands.set(commands)
    console.log(`✅ Global commands registered`)
  }
})

client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      // Handle slash commands
      switch (interaction.commandName) {
        case 'help':
          await HelpCommand.execute(interaction)
          break
        case 'report':
          await ReportCommand.execute(interaction)
          break
        default:
          await interaction.reply({ content: 'Unknown command!', ephemeral: true })
      }
    } else if (interaction.isButton()) {
      // Handle button interactions
      if (PodComponentBuilder.isValidCustomId(interaction.customId)) {
        await ButtonHandler.handle(interaction)
      } else {
        await interaction.reply({ 
          content: 'This button is not recognized.', 
          ephemeral: true 
        })
      }
    } else if (interaction.isModalSubmit()) {
      // Handle modal submissions
      if (PodComponentBuilder.isValidCustomId(interaction.customId)) {
        await ModalHandler.handle(interaction)
      } else {
        await interaction.reply({ 
          content: 'This modal is not recognized.', 
          ephemeral: true 
        })
      }
    }
	} catch (error) {
		console.error('❌ Interaction error:', error)

		const content = 'Sorry, something went wrong!'

		try {
			// Check if interaction is repliable
			if ('reply' in interaction && 'deferred' in interaction && 'replied' in interaction) {
				if (interaction.deferred || interaction.replied) {
					await interaction.followUp({ content, ephemeral: true })
				} else {
					await interaction.reply({ content, ephemeral: true })
				}
			}
		} catch (replyError) {
			console.error('❌ Failed to send error reply:', replyError)
		}
	}
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🔄 Shutting down gracefully...')
  ConversationManager.stopCleanup()
  client.destroy()
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('🔄 Shutting down gracefully...')
  ConversationManager.stopCleanup()
  client.destroy()
  process.exit(0)
})

client.login(process.env.DISCORD_BOT_TOKEN)