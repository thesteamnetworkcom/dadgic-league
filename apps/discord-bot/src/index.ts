// apps/discord-bot/src/index.ts
import { 
  Client, 
  GatewayIntentBits, 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  EmbedBuilder, 
  Colors,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ButtonInteraction,
  ModalSubmitInteraction
} from 'discord.js';
import { findPlayerMatches } from '@dadgic/shared';
import { db } from '@dadgic/database';
import type { ParsedPodData } from '@dadgic/shared';

// Import error recovery services
import { ErrorRecoveryMiddleware } from './middleware/ErrorRecoveryMiddleware';
import { 
  GeminiRetryService,
  ConversationRecoveryService
} from './services/error-recovery';

// ADDED: Import monitoring
import { DiscordBotMonitoring } from './services/monitoring/DiscordBotMonitoring';

// Override the supabase client for Discord bot
import { createClient } from '@supabase/supabase-js';
const serviceSupabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Track active conversations
const activeConversations = new Map<string, ConversationState>();

interface ConversationState {
  originalInput: string;
  parsedData: ParsedPodData;
  matchedPlayers: Array<{
    id: string;
    name: string;
    discord_username: string;
    commander: string;
    result: 'win' | 'lose' | 'draw';
  }>;
  missingData: {
    commanders: string[];
    gameLength: boolean;
    turns: boolean;
    notes: boolean;
  };
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Define slash commands
const reportCommand = new SlashCommandBuilder()
  .setName('report')
  .setDescription('Report a Commander pod game result')
  .addStringOption(option =>
    option.setName('game')
      .setDescription('Describe the game (e.g., "Scott beat Mike and John with Teval")')
      .setRequired(true)
  );

const helpCommand = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Show help for the MTG Commander bot');

client.once('ready', async () => {
  console.log(`🤖 Bot is ready! Logged in as ${client.user?.tag}`);
  
  // ADDED: Initialize monitoring
  DiscordBotMonitoring.initialize(client);
  
  // Start error recovery cleanup timer
  ErrorRecoveryMiddleware.startCleanupTimer();
  
  try {
    console.log('Started refreshing application (/) commands.');
    
    if (!client.user?.id) {
      throw new Error('Client user ID is not available');
    }

    const commands = [reportCommand, helpCommand].map(command => command.toJSON());
    
    if (process.env.DISCORD_GUILD_ID) {
      const guild = await client.guilds.fetch(process.env.DISCORD_GUILD_ID);
      await guild.commands.set(commands);
      console.log(`✅ Successfully registered commands to guild: ${guild.name}`);
    } else {
      await client.application?.commands.set(commands);
      console.log('✅ Successfully registered global commands.');
    }
  } catch (error) {
    console.error('❌ Failed to register commands:', error);
  }
});

// ADDED: Enhanced interaction handler with monitoring
client.on('interactionCreate', async (interaction) => {
  const startTime = Date.now();
  let commandName = '';
  let success = false;

  try {
    if (interaction.isChatInputCommand()) {
      commandName = interaction.commandName;
      
      switch (interaction.commandName) {
        case 'help':
          await handleHelpCommand(interaction);
          success = true;
          break;
        case 'report':
          await handleReportCommand(interaction);
          success = true;
          break;
        default:
          await interaction.reply({ 
            content: `❓ Unknown command: ${interaction.commandName}`, 
            ephemeral: true 
          });
          success = false;
      }
    } else if (interaction.isButton()) {
      commandName = 'button-interaction';
      await handleButtonInteraction(interaction);
      success = true;
    } else if (interaction.isModalSubmit()) {
      commandName = 'modal-submit';
      await handleModalSubmit(interaction);
      success = true;
    }
  } catch (error) {
    console.error('❌ Unhandled interaction error:', error);
    success = false;
    
    // ADDED: Log the error through monitoring
    const errorMessage = error instanceof Error ? error.message : 'Unknown interaction error';
    await DiscordBotMonitoring.logCommandUsage(
      commandName || 'unknown',
      interaction.user.id,
      interaction.guildId || '',
      false,
      Date.now() - startTime,
      error instanceof Error ? error : new Error(errorMessage)
    );
    
    try {
      if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
        await interaction.reply({ 
          content: '❌ Something went wrong processing your request.', 
          ephemeral: true 
        });
      }
    } catch (replyError) {
      console.error('Failed to send error reply:', replyError);
    }
  } finally {
    // ADDED: Log command usage for monitoring
    if (commandName) {
      const responseTime = Date.now() - startTime;
      await DiscordBotMonitoring.logCommandUsage(
        commandName,
        interaction.user.id,
        interaction.guildId || '',
        success,
        responseTime
      );
    }
  }
});

// Your existing helper functions continue here...
// (I'll add the rest in the next part to keep this manageable)

// Enhanced command handlers with monitoring
async function handleReportCommand(interaction: ChatInputCommandInteraction) {
  // Your existing handleReportCommand logic goes here
  // For now, we'll add a placeholder that calls your existing logic
  
  try {
    const gameText = interaction.options.getString('game', true);
    
    await interaction.deferReply({ ephemeral: true });

    // Add monitoring context for game reporting
    console.log(`🎮 Processing game report: "${gameText}" from ${interaction.user.username}`);
    
    // Your existing game processing logic would go here
    // For now, we'll provide a basic response
    await interaction.editReply({
      content: `🎮 Game report received: "${gameText}"\n\n⚠️ Full game processing logic needs to be integrated with monitoring.`
    });
    
  } catch (error) {
    console.error('Error in handleReportCommand:', error);
    throw error; // Re-throw so monitoring can catch it
  }
}

async function handleHelpCommand(interaction: ChatInputCommandInteraction) {
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
      },
      {
        name: '📊 Monitoring',
        value: 'This bot now includes comprehensive monitoring and error tracking for better reliability.',
        inline: false
      }
    )
    .setFooter({ text: 'Made with ❤️ for the MTG Commander community' });

  await interaction.reply({ embeds: [helpEmbed] });
}

async function handleButtonInteraction(interaction: ButtonInteraction) {
  // Placeholder for button interactions
  await interaction.reply({ 
    content: 'Button interaction received. Full implementation needed.', 
    ephemeral: true 
  });
}

async function handleModalSubmit(interaction: ModalSubmitInteraction) {
  // Placeholder for modal submissions
  await interaction.reply({ 
    content: 'Modal submission received. Full implementation needed.', 
    ephemeral: true 
  });
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

// Login with bot token
const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error('❌ DISCORD_BOT_TOKEN environment variable is required');
  process.exit(1);
}

client.login(token);
