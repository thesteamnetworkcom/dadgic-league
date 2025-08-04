// At the very top of index.ts, before any imports
console.log('🔍 Discord Bot Environment Debug:')
console.log('Working directory:', process.cwd())
console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL)
console.log('SUPABASE_ANON_KEY exists:', !!process.env.SUPABASE_ANON_KEY)
console.log('DISCORD_BOT_TOKEN exists:', !!process.env.DISCORD_BOT_TOKEN)
console.log('NODE_ENV:', process.env.NODE_ENV)

// apps/discord-bot/src/index.ts - Fresh Start
import { Client, GatewayIntentBits } from 'discord.js'
import { HelpCommand } from './commands/HelpCommand.js'
import { ReportCommand } from './commands/ReportCommand.js'

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

// In apps/discord-bot/src/index.ts
// Update the interactionCreate handler:

client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    try {
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
    } catch (error) {
      console.error('Command error:', error)
      const content = 'Sorry, something went wrong!'
      
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ content, ephemeral: true })
      } else {
        await interaction.reply({ content, ephemeral: true })  
      }
    }
  } else if (interaction.isButton()) {
    // Handle button interactions
    try {
      await ReportCommand.handleButtonInteraction(interaction)
    } catch (error) {
      console.error('Button interaction error:', error)
      await interaction.reply({ content: 'Something went wrong!', ephemeral: true })
    }
  }
})

client.login(process.env.DISCORD_BOT_TOKEN)