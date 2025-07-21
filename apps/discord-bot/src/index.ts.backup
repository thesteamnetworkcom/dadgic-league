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
import { parseWithAI } from '@dadgic/shared';
import { findPlayerMatches } from '@dadgic/shared';
import { db } from '@dadgic/database';
import type { ParsedPodData } from '@dadgic/shared';

// ADD THIS: Override the supabase client for Discord bot
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
  
  try {
    await client.application?.commands.set([reportCommand, helpCommand]);
    console.log('✅ Slash commands registered');
  } catch (error) {
    console.error('❌ Failed to register commands:', error);
  }
});

client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'report') {
        await handleReportCommand(interaction);
      } else if (interaction.commandName === 'help') {
        await handleHelpCommand(interaction);
      }
    } else if (interaction.isButton()) {
      await handleButtonInteraction(interaction);
    } else if (interaction.isModalSubmit()) {
      await handleModalSubmit(interaction);
    }
  } catch (error) {
    console.error('Error handling interaction:', error);
  }
});

async function handleReportCommand(interaction: ChatInputCommandInteraction) {
  const gameDescription = interaction.options.getString('game', true);
  
  await interaction.deferReply({ ephemeral: true });

  try {
    // Step 1: Parse with AI
    console.log('🤖 Parsing with AI:', gameDescription);
    const aiResult = await parseWithAI(gameDescription);
    
    if (!aiResult.success || !aiResult.data) {
      const errorEmbed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle('❌ Parse Error')
        .setDescription('I couldn\'t parse that game report. Please try again with more details.')
        .addFields({
          name: 'Example',
          value: '`Scott beat Mike and John yesterday with Teval. Mike played Atraxa, John had Krenko`'
        });

      await interaction.editReply({ embeds: [errorEmbed] });
      return;
    }

    // Step 2: Match players
    console.log('🔍 Matching players:', aiResult.data.players);
    const matchResult = await findPlayerMatches(aiResult.data.players);
    
    if (matchResult.unmatchedPlayers.length > 0) {
      const errorEmbed = new EmbedBuilder()
        .setColor(Colors.Orange)
        .setTitle('⚠️ Players Not Found')
        .setDescription('I couldn\'t find these players in the database:')
        .addFields({
          name: 'Unmatched Players',
          value: matchResult.unmatchedPlayers.join(', ')
        });

      if (matchResult.suggestions.length > 0) {
        const suggestionsText = matchResult.suggestions.map(s => 
          `**${s.input}**: ${s.suggestions[0]?.name} (${s.suggestions[0]?.confidence}% match)`
        ).join('\n');
        
        errorEmbed.addFields({
          name: 'Did you mean?',
          value: suggestionsText
        });
      }

      await interaction.editReply({ embeds: [errorEmbed] });
      return;
    }

    // Step 3: Create conversation state
    const conversationId = `${interaction.user.id}-${Date.now()}`;
    const missingData = analyzeMissingData(aiResult.data, matchResult.matchedPlayers);
    
    const conversationState: ConversationState = {
      originalInput: gameDescription,
      parsedData: aiResult.data,
      matchedPlayers: matchResult.matchedPlayers,
      missingData
    };
    
    activeConversations.set(conversationId, conversationState);
    
    // Step 4: Show review
    await showReviewEmbed(interaction, conversationState, conversationId);

  } catch (error) {
    console.error('Error handling report command:', error);
    
    const errorEmbed = new EmbedBuilder()
      .setColor(Colors.Red)
      .setTitle('❌ Unexpected Error')
      .setDescription('An error occurred while processing your report. Please try again.');

    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

function analyzeMissingData(parsedData: ParsedPodData, matchedPlayers: any[]) {
  const missingCommanders = matchedPlayers
    .filter(p => !p.commander || p.commander.trim() === '')
    .map(p => p.name);

  return {
    commanders: missingCommanders,
    gameLength: !parsedData.game_length_minutes,
    turns: !parsedData.turns,
    notes: !parsedData.notes
  };
}

async function showReviewEmbed(interaction: any, state: ConversationState, conversationId: string) {
  const embed = new EmbedBuilder()
    .setColor(Colors.Blue)
    .setTitle('📋 Game Report Review')
    .setDescription('I parsed your game! Please review and let me know if anything needs to be added or corrected.')
    .addFields(
      { name: '📅 Date', value: state.parsedData.date, inline: true },
      { name: '⏱️ Game Length', value: state.parsedData.game_length_minutes ? `${state.parsedData.game_length_minutes} min` : '*Not specified*', inline: true },
      { name: '🔄 Turns', value: state.parsedData.turns ? state.parsedData.turns.toString() : '*Not specified*', inline: true }
    );

  // Add players
  const playersText = state.matchedPlayers.map(p => {
    const resultEmoji = p.result === 'win' ? '🏆' : p.result === 'draw' ? '🤝' : '❌';
    const commander = p.commander || '*No commander specified*';
    return `${resultEmoji} **${p.name}** - ${commander}`;
  }).join('\n');

  embed.addFields({ name: '👥 Players', value: playersText, inline: false });

  if (state.parsedData.notes) {
    embed.addFields({ name: '📝 Notes', value: state.parsedData.notes, inline: false });
  }

  // Check if we need to ask for missing data
  const needsInfo = state.missingData.commanders.length > 0 || 
                   state.missingData.gameLength || 
                   state.missingData.turns;

  const buttons = new ActionRowBuilder<ButtonBuilder>();

  // Always show "Fill Missing Info" button (renamed to "Update Info")
  buttons.addComponents(
    new ButtonBuilder()
      .setCustomId(`fill-missing-${conversationId}`)
      .setLabel(needsInfo ? 'Fill Missing Info' : 'Update Info')
      .setStyle(needsInfo ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setEmoji('📝')
  );

  buttons.addComponents(
    new ButtonBuilder()
      .setCustomId(`submit-${conversationId}`)
      .setLabel('Submit Report')
      .setStyle(ButtonStyle.Success)
      .setEmoji('✅'),
    new ButtonBuilder()
      .setCustomId(`cancel-${conversationId}`)
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('❌')
  );

  if (needsInfo) {
    const missingItems = [];
    if (state.missingData.commanders.length > 0) {
      missingItems.push(`• Commanders for: ${state.missingData.commanders.join(', ')}`);
    }
    if (state.missingData.gameLength) missingItems.push('• Game length');
    if (state.missingData.turns) missingItems.push('• Turn count');

    embed.addFields({
      name: '⚠️ Missing Information',
      value: missingItems.join('\n')
    });
  } else {
    embed.addFields({
      name: '✅ Report Complete',
      value: 'All information looks good! You can submit or make additional updates.'
    });
  }

  const response = { embeds: [embed], components: [buttons] };

  if (interaction.deferred || interaction.replied) {
    await interaction.editReply(response);
  } else {
    await interaction.update(response);
  }
}

async function handleButtonInteraction(interaction: ButtonInteraction) {
  // Fix the parsing logic
  // Button format: "submit-170599931432665088-1752757996198"
  // We want: action="submit", conversationId="170599931432665088-1752757996198"
  
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
  
  console.log('🔍 Button clicked:', { 
    customId, 
    action, 
    conversationId,
    activeConversations: Array.from(activeConversations.keys())
  });
  
  const state = activeConversations.get(conversationId);
  if (!state) {
    console.log('❌ No conversation found for ID:', conversationId);
    console.log('📋 Available conversations:', Array.from(activeConversations.keys()));
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
    .setPlaceholder('e.g., "Teval should be Teysa, Orzhov Scion" or any other corrections')
    .setRequired(false);

  // Only add corrections if we have room (Discord limit: 5 action rows)
  if (components.length < 5) {
    components.push(new ActionRowBuilder<TextInputBuilder>().addComponents(correctionsInput));
  }

  modal.addComponents(components);

  await interaction.showModal(modal);
}

async function handleModalSubmit(interaction: ModalSubmitInteraction) {
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
    // Extract all submitted data
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

    // Create an update prompt for Gemini that includes corrections
    const updatePrompt = createUpdatePrompt(state, commanders, gameLength, turns, notes, corrections);
    
    if (updatePrompt) {
      console.log('🤖 Sending update to Gemini:', updatePrompt);
      
      // Have Gemini update the data
      const updateResult = await parseWithAI(updatePrompt);
      
      if (updateResult.success && updateResult.data) {
        console.log('✅ Gemini updated the data successfully');
        
        // Update our state with Gemini's response
        state.parsedData = updateResult.data;
        
        // Re-match players to make sure usernames are still correct
        const newMatchResult = await findPlayerMatches(updateResult.data.players);
        if (newMatchResult.unmatchedPlayers.length === 0) {
          state.matchedPlayers = newMatchResult.matchedPlayers;
        }
        
        // Recalculate missing data
        state.missingData = analyzeMissingData(state.parsedData, state.matchedPlayers);
      } else {
        console.log('❌ Gemini failed to update data, falling back to manual parsing');
        // Fallback to simple manual updates
        updateDataManually(state, commanders, gameLength, turns, notes);
      }
    } else {
      // No AI needed, just simple updates
      updateDataManually(state, commanders, gameLength, turns, notes);
    }

    console.log('🔄 Final updated state:', JSON.stringify(state.missingData, null, 2));

    // Show updated review
    await showReviewEmbed(interaction, state, conversationId);

  } catch (error) {
    console.error('Error handling modal submit:', error);
    await interaction.followUp({ 
      content: '❌ Error processing your input. Please try again.', 
      ephemeral: true 
    });
  }
}

function createUpdatePrompt(state: ConversationState, commanders: string, gameLength: string, turns: string, notes: string, corrections: string): string | null {
  const updates = [];
  
  if (commanders.trim()) {
    updates.push(`Player commanders: ${commanders}`);
  }
  
  if (gameLength.trim()) {
    updates.push(`Game length: ${gameLength} minutes`);
  }
  
  if (turns.trim()) {
    updates.push(`Number of turns: ${turns}`);
  }
  
  if (notes.trim()) {
    updates.push(`Additional notes: ${notes}`);
  }
  
  if (corrections.trim()) {
    updates.push(`CORRECTIONS NEEDED: ${corrections}`);
  }
  
  if (updates.length === 0) {
    return null; // No updates needed
  }
  
  const existingPlayersText = state.matchedPlayers.map(p => 
    `${p.name} played ${p.commander || 'unknown commander'} and ${p.result === 'win' ? 'won' : 'lost'}`
  ).join(', ');
  
  return `Update this Commander game report with new information:

EXISTING GAME: "${existingPlayersText} on ${state.parsedData.date}"

UPDATES: ${updates.join('. ')}

IMPORTANT: Pay special attention to any corrections mentioned. If the user says a commander name is wrong, use the corrected name they provide.

Please return the complete updated game report in the same JSON format, incorporating all updates and corrections with the existing data.`;
}

function updateDataManually(state: ConversationState, commanders: string, gameLength: string, turns: string, notes: string) {
  console.log('🔧 Updating data manually as fallback');
  
  if (gameLength.trim()) {
    const lengthNum = parseInt(gameLength);
    if (!isNaN(lengthNum)) {
      state.parsedData.game_length_minutes = lengthNum;
      state.missingData.gameLength = false;
    }
  }

  if (turns.trim()) {
    const turnsNum = parseInt(turns);
    if (!isNaN(turnsNum)) {
      state.parsedData.turns = turnsNum;
      state.missingData.turns = false;
    }
  }

  if (notes.trim()) {
    state.parsedData.notes = notes.trim();
    state.missingData.notes = false;
  }
  
  // For commanders, we'd still need some basic parsing as fallback
  // But now it's just a fallback, not the primary method
  if (commanders.trim()) {
    updateCommandersFromText(state, commanders);
  }
}

function updateCommandersFromText(state: ConversationState, commandersText: string) {
  console.log('🎯 Updating commanders from text:', commandersText);
  
  // Parse commanders text - handle multiple formats
  // "Mike: Atraxa, Kevin: Krenko" OR "Mike - Atraxa, Kevin - Krenko" 
  const commanderPairs = commandersText.split(',').map(pair => {
    // Try both : and - as separators
    let name = '', commander = '';
    
    if (pair.includes(':')) {
      [name, commander] = pair.split(':').map(s => s.trim());
    } else if (pair.includes('-')) {
      [name, commander] = pair.split('-').map(s => s.trim());
    } else {
      // If no separator, treat the whole thing as a commander for the first missing player
      commander = pair.trim();
      name = state.missingData.commanders[0] || '';
    }
    
    return { name, commander };
  });

  console.log('📋 Parsed commander pairs:', commanderPairs);

  // Update matched players with commanders
  for (const pair of commanderPairs) {
    if (pair.name && pair.commander) {
      const player = state.matchedPlayers.find(p => 
        p.name.toLowerCase().includes(pair.name.toLowerCase()) ||
        pair.name.toLowerCase().includes(p.name.toLowerCase())
      );
      
      if (player) {
        console.log(`✅ Updated ${player.name} commander to ${pair.commander}`);
        player.commander = pair.commander;
      } else {
        console.log(`❌ Could not find player for: ${pair.name}`);
      }
    }
  }

  // Recalculate missing commanders after update
  state.missingData.commanders = state.matchedPlayers
    .filter(p => !p.commander || p.commander.trim() === '')
    .map(p => p.name);
    
  console.log('📊 Remaining missing commanders:', state.missingData.commanders);
}

async function submitReport(interaction: ButtonInteraction, state: ConversationState, conversationId: string) {
  try {
    // Get all players to look up IDs
    const allPlayers = await db.players.getAll();
    
    // Convert players to participants format
    const participants = [];
    for (const player of state.matchedPlayers) {
      // Find the internal player ID using discord_username
      const dbPlayer = allPlayers.find(p => p.discord_username === player.discord_username);
      
      if (!dbPlayer) {
        throw new Error(`Player ${player.name} not found in database`);
      }
      
      participants.push({
        player_id: dbPlayer.id,
        commander_deck: player.commander || 'Unknown Commander',
        result: player.result
      });
    }

    // Create pod data
    const podData = {
      date: state.parsedData.date,
      game_length_minutes: state.parsedData.game_length_minutes || undefined,
      turns: state.parsedData.turns || undefined,
      notes: state.parsedData.notes || undefined,
      participants
    };

    console.log('📊 Submitting pod data:', JSON.stringify(podData, null, 2));

    // Submit to database
    //const result = await db.pods.create(podData);
    const { data: result, error } = await serviceSupabase
        .from('pods')
        .insert(podData)
        .select()
        .single();
    activeConversations.delete(conversationId);
    
    const embed = new EmbedBuilder()
      .setColor(Colors.Green)
      .setTitle('✅ Game Report Submitted!')
      .setDescription('Your Commander game has been recorded successfully.')
      .addFields(
        { name: '📅 Date', value: state.parsedData.date, inline: true },
        { name: '🏆 Winner', value: state.matchedPlayers.find(p => p.result === 'win')?.name || 'Unknown', inline: true },
        { name: '👥 Players', value: state.matchedPlayers.map(p => p.name).join(', '), inline: false }
      );

    await interaction.update({
      embeds: [embed],
      components: []
    });

    console.log('✅ Successfully submitted report with ID:', result.id);

  } catch (error) {
    console.error('Error submitting report:', error);
    
    const errorEmbed = new EmbedBuilder()
      .setColor(Colors.Red)
      .setTitle('❌ Submission Failed')
      .setDescription(`Failed to save the game report: ${error instanceof Error ? error.message : 'Unknown error'}`)
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

    await interaction.update({
      embeds: [errorEmbed],
      components: [retryButtons]
    });
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
      }
    )
    .setFooter({ text: 'Made with ❤️ for the MTG Commander community' });

  await interaction.reply({ embeds: [helpEmbed] });
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