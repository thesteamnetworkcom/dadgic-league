import { ChatInputCommandInteraction, ButtonInteraction, ModalSubmitInteraction } from 'discord.js'

interface ConversationState {
	originalInput: string
	parsedData?: any
	matchedPlayers?: any[]
	missingData?: any
	lastActivity: number
	attempts: number
}

export class ConversationRecoveryService {
	private static conversations = new Map<string, ConversationState>()
	private static readonly CONVERSATION_TIMEOUT = 1800000 // 30 minutes
	private static readonly MAX_ATTEMPTS = 5

	static saveConversationState(userId: string, state: Partial<ConversationState>): void {
		const existing = this.conversations.get(userId) || {
			originalInput: '',
			lastActivity: Date.now(),
			attempts: 0
		}

		this.conversations.set(userId, {
			...existing,
			...state,
			lastActivity: Date.now(),
			attempts: existing.attempts + 1
		})
	}

	static getConversationState(userId: string): ConversationState | null {
		const state = this.conversations.get(userId)

		if (!state) return null

		// Check if conversation has timed out
		if (Date.now() - state.lastActivity > this.CONVERSATION_TIMEOUT) {
			this.clearConversationState(userId)
			return null
		}

		return state
	}

	static clearConversationState(userId: string): void {
		this.conversations.delete(userId)
		console.log(`🧹 Cleared conversation state for user ${userId}`)
	}

	static async handleBrokenConversation(
		interaction: ChatInputCommandInteraction | ButtonInteraction | ModalSubmitInteraction,
		error: Error
	): Promise<void> {
		const userId = interaction.user.id
		const state = this.getConversationState(userId)

		console.log(`🔧 Handling broken conversation for user ${userId}`, {
			hasState: !!state,
			attempts: state?.attempts || 0,
			error: error.message
		})

		// Clear the broken state
		this.clearConversationState(userId)

		const message = state
			? `🔄 **Conversation Reset**

Your previous game reporting session encountered an error and has been reset.

**What happened:** ${error.message.substring(0, 100)}...
**Attempts made:** ${state.attempts}

Please start over with a fresh \`/report\` command. Your data is safe!`
			: `❌ **Session Error**

There was an error with your request. Please try starting fresh with a new command.

**Error:** ${error.message.substring(0, 100)}...`

		try {
			if (interaction.deferred || interaction.replied) {
				await interaction.followUp({ content: message, ephemeral: true })
			} else {
				await interaction.reply({ content: message, ephemeral: true })
			}
		} catch (replyError) {
			console.error('Failed to send conversation recovery message:', replyError)
		}
	}

	static isConversationHealthy(userId: string): boolean {
		const state = this.getConversationState(userId)

		if (!state) return true // No conversation is healthy

		return (
			state.attempts < this.MAX_ATTEMPTS &&
			(Date.now() - state.lastActivity) < this.CONVERSATION_TIMEOUT
		)
	}

	static cleanupOldConversations(): void {
		const now = Date.now()
		let cleanedCount = 0

		for (const [userId, state] of this.conversations.entries()) {
			if (now - state.lastActivity > this.CONVERSATION_TIMEOUT) {
				this.conversations.delete(userId)
				cleanedCount++
			}
		}

		if (cleanedCount > 0) {
			console.log(`🧹 Cleaned up ${cleanedCount} old conversations`)
		}
	}

	static getActiveConversationCount(): number {
		return this.conversations.size
	}

	static getConversationStats(): {
		active: number
		avgAttempts: number
		oldestConversation: number
	} {
		const conversations = Array.from(this.conversations.values())
		const now = Date.now()

		return {
			active: conversations.length,
			avgAttempts: conversations.reduce((sum, c) => sum + c.attempts, 0) / conversations.length || 0,
			oldestConversation: conversations.reduce((oldest, c) =>
				Math.max(oldest, now - c.lastActivity), 0
			)
		}
	}
}
