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
import { DiscordBotMonitoring } from './services/monitoring/DiscordBotMonitoring'

// Import error recovery services
import { ErrorRecoveryMiddleware } from './middleware/ErrorRecoveryMiddleware';
import { 
  GeminiRetryService,
  ConversationRecoveryService
} from './services/error-recovery';

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
    name: string;
    discord_username: string;
    commander: string;
    id: string;
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
  DiscordBotMonitoring.initialize(client)
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
    console.error('❌ Error registering slash commands:', error);
  }
});

// Wrap the help command with error recovery
const handleHelpCommand = ErrorRecoveryMiddleware.wrapCommandHandler(
  async (interaction: ChatInputCommandInteraction) => {
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
      .setFooter({ text: 'Made with ❤️ for the MTG Commander community' });

    await interaction.reply({ embeds: [helpEmbed] });
  }
);

// Wrap the report command with error recovery
const handleReportCommand = ErrorRecoveryMiddleware.wrapCommandHandler(
  async (interaction: ChatInputCommandInteraction) => {
    const gameText = interaction.options.getString('game', true);
    
    await interaction.deferReply({ ephemeral: true });

    try {
      console.log(`🎯 Processing game report from ${interaction.user.username}: "${gameText}"`);
      
      // Use GeminiRetryService with fallback
      const parseResult = await GeminiRetryService.parseWithFallback(
        gameText,
        async (error) => {
          console.log('Gemini failed, providing manual fallback structure');
          return {
            success: false,
            error: 'AI parsing failed - manual entry required',
            requiresManualInput: true
          };
        }
      );

      if (!parseResult.success) {
        if (parseResult.requiresManualInput) {
          await interaction.followUp({
            content: `🤖 **AI Parser Unavailable**\n\nThe game parsing AI is temporarily unavailable. Please try again later or contact an admin for manual reporting.\n\n**Error:** ${parseResult.error}`,
            ephemeral: true
          });
          return;
        } else {
          throw new Error(`Gemini parsing failed: ${parseResult.error}`);
        }
      }

      // Continue with the full conversation flow
      const conversationId = `${interaction.user.id}-${Date.now()}`;
      console.log(`🗨️ Starting conversation: ${conversationId}`);
      
      const matchResult = await findPlayerMatches(parseResult.data.players);
      
      if (matchResult.unmatchedPlayers.length > 0) {
        await interaction.followUp({
          content: `⚠️ **Couldn't find these players:** ${matchResult.unmatchedPlayers.join(', ')}\n\nPlease make sure they're registered in the system first.`,
          ephemeral: true
        });
        return;
      }

      const missingData = analyzeMissingData(parseResult.data, matchResult.matchedPlayers);
      
      const conversationState: ConversationState = {
        originalInput: gameText,
        parsedData: parseResult.data,
        matchedPlayers: matchResult.matchedPlayers,
        missingData
      };
      
      activeConversations.set(conversationId, conversationState);
      
      // Also save to ConversationRecoveryService for error recovery
      ConversationRecoveryService.saveConversationState(interaction.user.id, {
        originalInput: gameText,
        parsedData: parseResult.data
      });
      
      await showReviewEmbed(interaction, conversationState, conversationId);

    } catch (error) {
      // Error is automatically handled by ErrorRecoveryMiddleware
      throw error;
    }
  }
);

// Your original helper functions with error recovery integration
function analyzeMissingData(parsedData: ParsedPodData, matchedPlayers: any[]): any {
  return {
    commanders: matchedPlayers.filter(p => !p.commander || p.commander.toLowerCase().includes('unknown')).map(p => p.name),
    gameLength: !parsedData.game_length_minutes,
    turns: !parsedData.turns,
    notes: !parsedData.notes
  };
}

async function showReviewEmbed(interaction: any, state: ConversationState, conversationId: string) {
  const missingCount = Object.values(state.missingData).filter(Boolean).length + state.missingData.commanders.length;
  
  const embed = new EmbedBuilder()
    .setColor(missingCount > 0 ? Colors.Yellow : Colors.Green)
    .setTitle('🎮 Game Report Review')
    .setDescription('Please review the parsed game information below:')
    .addFields(
      {
        name: '👥 Players & Results',
        value: state.matchedPlayers.map(p => {
          const resultEmoji = p.result === 'win' ? '🏆' : p.result === 'lose' ? '❌' : '🤝';
          return `${resultEmoji} ${p.name} (${p.commander})`;
        }).join('\n'),
        inline: false
      },
      {
        name: '📅 Date',
        value: state.parsedData.date || 'Not specified',
        inline: true
      },
      {
        name: '⏱️ Duration',
        value: state.parsedData.game_length_minutes ? `${state.parsedData.game_length_minutes} minutes` : 'Not specified',
        inline: true
      },
      {
        name: '🔄 Turns',
        value: state.parsedData.turns ? `${state.parsedData.turns} turns` : 'Not specified',
        inline: true
      }
    );

  if (state.parsedData.notes) {
    embed.addFields({ name: '📝 Notes', value: state.parsedData.notes, inline: false });
  }

  if (missingCount > 0) {
    const missingItems = [];
    if (state.missingData.commanders.length > 0) {
      missingItems.push(`Commanders for: ${state.missingData.commanders.join(', ')}`);
    }
    if (state.missingData.gameLength) missingItems.push('Game length');
    if (state.missingData.turns) missingItems.push('Turn count');
    if (state.missingData.notes) missingItems.push('Additional notes');
    
    embed.addFields({
      name: '⚠️ Missing Information',
      value: missingItems.join('\n'),
      inline: false
    });
  }

  const buttons = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`fill-missing-${conversationId}`)
        .setLabel(missingCount > 0 ? 'Fill Missing Info' : 'Make Changes')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📝'),
      new ButtonBuilder()
        .setCustomId(`submit-${conversationId}`)
        .setLabel('Submit Report')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('✅'),
      new ButtonBuilder()
        .setCustomId(`cancel-${conversationId}`)
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌')
    );

  const response = { embeds: [embed], components: [buttons] };

  if (interaction.deferred || interaction.replied) {
    await interaction.editReply(response);
  } else {
    await interaction.update(response);
  }
}

// Wrap button handler with error recovery
const handleButtonInteraction = ErrorRecoveryMiddleware.wrapButtonHandler(
  async (interaction: ButtonInteraction) => {
    const customId = interaction.customId;
    let action = '';
    let conversationId = '';
    
    if (customId.startsWith('fill-missing-')) {
      action = 'fill-missing';
      conversationId = customId.replace('fill-missing-', '');
    } else if (customId.startsWith('submit-')) {
      action = 'submit';
      conversationId = customId.replace('submit-', '');
    } else if (customId.startsWith('cancel-')) {
      action = 'cancel';
      conversationId = customId.replace('cancel-', '');
    }
    
    console.log('🔍 Button clicked:', { customId, action, conversationId });
    
    const state = activeConversations.get(conversationId);
    if (!state) {
      console.log('❌ No conversation found for ID:', conversationId);
      await interaction.reply({ 
        content: 'This conversation has expired. Please start a new report.', 
        ephemeral: true 
      });
      return;
    }

    console.log('✅ Found conversation state');

    if (action === 'fill-missing') {
      await showMissingDataModal(interaction, state, conversationId);
    } else if (action === 'submit') {
      await submitReport(interaction, state, conversationId);
    } else if (action === 'cancel') {
      activeConversations.delete(conversationId);
      await interaction.update({ 
        content: '❌ Report cancelled.', 
        embeds: [], 
        components: [] 
      });
    }
  }
);

async function showMissingDataModal(interaction: ButtonInteraction, state: ConversationState, conversationId: string) {
  const modal = new ModalBuilder()
    .setCustomId(`missing-data-${conversationId}`)
    .setTitle('Update Game Details');

  const components: ActionRowBuilder<TextInputBuilder>[] = [];

  // Always show commanders field (so users can correct AI mistakes)
  const commandersInput = new TextInputBuilder()
    .setCustomId('commanders')
    .setLabel('Player Commanders')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g., Scott: Teysa, Milan: Atraxa')
    .setRequired(false);

  components.push(new ActionRowBuilder<TextInputBuilder>().addComponents(commandersInput));

  // Always show game length (so users can correct)
  const gameLengthInput = new TextInputBuilder()
    .setCustomId('gameLength')
    .setLabel('Game Length (minutes)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g., 90')
    .setValue(state.parsedData.game_length_minutes?.toString() || '')
    .setRequired(false);

  components.push(new ActionRowBuilder<TextInputBuilder>().addComponents(gameLengthInput));

  // Always show turns
  const turnsInput = new TextInputBuilder()
    .setCustomId('turns')
    .setLabel('Number of Turns')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g., 12')
    .setValue(state.parsedData.turns?.toString() || '')
    .setRequired(false);

  components.push(new ActionRowBuilder<TextInputBuilder>().addComponents(turnsInput));

  // Always show notes
  const notesInput = new TextInputBuilder()
    .setCustomId('notes')
    .setLabel('Additional Notes')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Any additional details about the game...')
    .setValue(state.parsedData.notes || '')
    .setRequired(false);

  components.push(new ActionRowBuilder<TextInputBuilder>().addComponents(notesInput));

  // Add a "corrections" field for free-form updates
  const correctionsInput = new TextInputBuilder()
    .setCustomId('corrections')
    .setLabel('Corrections (optional)')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('e.g., "Milan, Jeremy, and Kevin all played Elminster" or other corrections')
    .setRequired(false);

  if (components.length < 5) {
    components.push(new ActionRowBuilder<TextInputBuilder>().addComponents(correctionsInput));
  }

  modal.addComponents(components);
  await interaction.showModal(modal);
}

// RESTORE THE AI-FIRST APPROACH - this is the key fix
const handleModalSubmit = ErrorRecoveryMiddleware.wrapModalHandler(
  async (interaction: ModalSubmitInteraction) => {
    const conversationId = interaction.customId.replace('missing-data-', '');
    console.log('🔍 Modal submitted for conversation:', conversationId);
    
    const state = activeConversations.get(conversationId);
    if (!state) {
      console.log('❌ No conversation state found');
      await interaction.reply({ 
        content: 'This conversation has expired. Please start a new report.', 
        ephemeral: true 
      });
      return;
    }

    await interaction.deferUpdate();

    try {
      // Extract modal data
      let commanders = '';
      let gameLength = '';
      let turns = '';
      let notes = '';
      let corrections = '';
      
      try { commanders = interaction.fields.getTextInputValue('commanders') || ''; } catch (e) {}
      try { gameLength = interaction.fields.getTextInputValue('gameLength') || ''; } catch (e) {}
      try { turns = interaction.fields.getTextInputValue('turns') || ''; } catch (e) {}
      try { notes = interaction.fields.getTextInputValue('notes') || ''; } catch (e) {}
      try { corrections = interaction.fields.getTextInputValue('corrections') || ''; } catch (e) {}

      console.log('📊 Modal values:', { commanders, gameLength, turns, notes, corrections });

      // BUILD A COMPREHENSIVE UPDATE PROMPT FOR AI
      const updatePrompt = createSmartUpdatePrompt(state, commanders, gameLength, turns, notes, corrections);
      
      console.log('🤖 Sending comprehensive update to Gemini:', updatePrompt);
      
      // ALWAYS try AI first with the retry service
      const updateResult = await GeminiRetryService.parseWithRetry(updatePrompt);
      
      if (updateResult.success && updateResult.data) {
        console.log('✅ Gemini successfully updated the data');
        
        // Merge the AI updates with existing data
        state.parsedData = { ...state.parsedData, ...updateResult.data };
        
        // Re-match players to ensure usernames are still correct
        const newMatchResult = await findPlayerMatches(state.parsedData.players);
        if (newMatchResult.unmatchedPlayers.length === 0) {
          state.matchedPlayers = newMatchResult.matchedPlayers;
          console.log('✅ Players re-matched successfully');
        } else {
          console.log('⚠️ Some players could not be re-matched, keeping original matches');
        }
        
      } else {
        console.log('❌ Gemini failed, falling back to manual parsing');
        // Only fall back to manual if AI completely fails
        updateDataManuallyAsLastResort(state, commanders, gameLength, turns, notes);
      }
      
      // Recalculate missing data
      state.missingData = analyzeMissingData(state.parsedData, state.matchedPlayers);

      console.log('🔄 Updated state - showing review embed');

      // Show the updated review embed
      await showReviewEmbed(interaction, state, conversationId);

    } catch (error) {
      console.error('Error handling modal submit:', error);
      throw error;
    }
  }
);

// CREATE A MUCH BETTER PROMPT FOR AI
function createSmartUpdatePrompt(state: ConversationState, commanders: string, gameLength: string, turns: string, notes: string, corrections: string): string {
  const currentData = JSON.stringify(state.parsedData, null, 2);
  const currentPlayers = state.matchedPlayers.map(p => `${p.name} (${p.commander})`).join(', ');
  
  let prompt = `You are updating MTG Commander game data. Here's the current game information:

CURRENT GAME DATA:
${currentData}

CURRENT MATCHED PLAYERS: ${currentPlayers}

UPDATE REQUESTS:
`;

  if (corrections) {
    prompt += `CORRECTIONS/UPDATES: "${corrections}"
`;
  }
  
  if (commanders) {
    prompt += `COMMANDER INFO: "${commanders}"
`;
  }
  
  if (gameLength) {
    prompt += `GAME LENGTH: ${gameLength} minutes
`;
  }
  
  if (turns) {
    prompt += `TURN COUNT: ${turns}
`;
  }
  
  if (notes) {
    prompt += `ADDITIONAL NOTES: "${notes}"
`;
  }

  prompt += `
INSTRUCTIONS:
1. Parse the commander information intelligently (handle formats like "Milan, Jeremy, and Kevin all played Elminster")
2. Update the existing game data with the new information
3. Keep the same JSON structure
4. Return ONLY the updated JSON data
5. Make sure each player has a commander assigned

UPDATE THE JSON DATA:`;

  return prompt;
}

// Simplified fallback (only used if AI completely fails)
function updateDataManuallyAsLastResort(state: ConversationState, commanders: string, gameLength: string, turns: string, notes: string): void {
  console.log('🔧 Manual fallback (AI failed completely)');
  
  // Update simple fields only
  if (gameLength && !isNaN(parseInt(gameLength))) {
    state.parsedData.game_length_minutes = parseInt(gameLength);
  }
  if (turns && !isNaN(parseInt(turns))) {
    state.parsedData.turns = parseInt(turns);
  }
  if (notes) {
    state.parsedData.notes = notes;
  }
  
  console.log('⚠️ Could not parse commanders manually - AI parsing would have been much better');
}

async function submitReport(interaction: ButtonInteraction, state: ConversationState, conversationId: string): Promise<void> {
  await interaction.deferUpdate();

  try {
    console.log('📝 Submitting report to database...', state);
    
    // Fix the type issues to match your existing CreatePodInput interface
    const podInput = {
      league_id: undefined,
      date: state.parsedData.date, // FIXED: Already a string, don't wrap in new Date()
      game_length_minutes: state.parsedData.game_length_minutes || undefined,
      turns: state.parsedData.turns || undefined,
      notes: state.parsedData.notes || undefined,
      participants: state.matchedPlayers.map(player => ({
        player_id: player.id, // FIXED: Now uses UUID instead of discord_username
        commander_deck: player.commander,
        result: player.result
      }))
    };

    console.log('🗄️ Creating pod with serviceSupabase...');

    // QUICK FIX: Use serviceSupabase directly instead of db.pods.create()
    const { data: pod, error: podError } = await serviceSupabase
      .from('pods')
      .insert({
        league_id: podInput.league_id || null,
        date: podInput.date,
        game_length_minutes: podInput.game_length_minutes || null,
        turns: podInput.turns || null,
        participant_count: podInput.participants.length,
        notes: podInput.notes || null
      })
      .select()
      .single();
    
    if (podError) throw podError;

    // Insert participants
    const { data: participants, error: participantsError } = await serviceSupabase
      .from('pod_participants')
      .insert(
        podInput.participants.map(p => ({
          pod_id: pod.id,
          player_id: p.player_id, // Now contains actual UUID
          commander_deck: p.commander_deck,
          result: p.result
        }))
      )
      .select();
    
    if (participantsError) throw participantsError;

    console.log('✅ Pod created successfully:', pod);

    // Remove from active conversations
    activeConversations.delete(conversationId);
    
    // Create success embed
    const embed = new EmbedBuilder()
      .setColor(Colors.Green)
      .setTitle('✅ Report Submitted Successfully!')
      .setDescription('Your Commander game has been recorded in the database.')
      .addFields(
        { name: '🆔 Pod ID', value: pod.id, inline: true },
        { name: '📅 Date', value: state.parsedData.date, inline: true },
        { name: '🏆 Winner', value: state.matchedPlayers.find(p => p.result === 'win')?.name || 'Unknown', inline: true },
        { name: '👥 Players', value: state.matchedPlayers.map(p => `${p.name} (${p.commander})`).join('\n'), inline: false }
      );

    if (state.parsedData.game_length_minutes) {
      embed.addFields({ name: '⏱️ Duration', value: `${state.parsedData.game_length_minutes} minutes`, inline: true });
    }
    
    if (state.parsedData.turns) {
      embed.addFields({ name: '🔄 Turns', value: `${state.parsedData.turns}`, inline: true });
    }

    await interaction.editReply({
      embeds: [embed],
      components: []
    });

  } catch (error) {
    console.error('❌ Error submitting report:', error);
    
    // FIXED: Properly handle unknown error type
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    const errorEmbed = new EmbedBuilder()
      .setColor(Colors.Red)
      .setTitle('❌ Submission Failed')
      .setDescription(`Failed to save the game report: ${errorMessage}`)
      .addFields({
        name: '🔄 Try Again',
        value: 'You can try submitting again or make corrections.'
      });

    const retryButtons = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`submit-${conversationId}`)
          .setLabel('Try Again')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🔄'),
        new ButtonBuilder()
          .setCustomId(`fill-missing-${conversationId}`)
          .setLabel('Make Changes')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('📝')
      );

    await interaction.editReply({
      embeds: [errorEmbed],
      components: [retryButtons]
    });
  }
}


// Main interaction handler
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
          break;
        case 'report':
          await handleReportCommand(interaction);
          break;
        default:
          await interaction.reply({ 
            content: `❓ Unknown command: ${interaction.commandName}`, 
            ephemeral: true 
          });
      }
    } else if (interaction.isButton()) {
      commandName = 'button-interaction';
      await handleButtonInteraction(interaction);
    } else if (interaction.isModalSubmit()) {
      commandName = 'modal-submit';
      await handleModalSubmit(interaction);
    }
    success = true;
  } catch (error) {
    console.error('❌ Unhandled interaction error:', error);
    success = false;
    
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
    // Log command usage for monitoring
    if (commandName) {
      const responseTime = Date.now() - startTime;
      DiscordBotMonitoring.logCommandUsage(
        commandName,
        interaction.user.id,
        interaction.guildId || '',
        success,
        responseTime
      ).catch(monitoringError => {
        console.error('Monitoring error:', monitoringError);
      });
    }
  }
});

// Error handling for the client itself
client.on('error', (error) => {
  console.error('❌ Discord client error:', error);
});

client.on('warn', (warning) => {
  console.warn('⚠️ Discord client warning:', warning);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🔄 Received SIGINT, shutting down gracefully...');
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🔄 Received SIGTERM, shutting down gracefully...');
  client.destroy();
  process.exit(0);
});

// Start the bot
client.login(process.env.DISCORD_BOT_TOKEN);
