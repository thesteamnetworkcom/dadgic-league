import { ErrorLogger, HealthChecker } from '@dadgic/shared'
import { Client } from 'discord.js'

export class DiscordBotMonitoring {
	private static client: Client | null = null
	private static startTime = Date.now()
	private static commandStats = {
		totalCommands: 0,
		successfulCommands: 0,
		failedCommands: 0
	}

	static initialize(client: Client): void {
		this.client = client

		// Log when bot comes online
		client.once('ready', () => {
			console.log('🤖 Discord bot monitoring initialized')
			ErrorLogger.logError('Discord bot started', {
				component: 'discord-bot',
				action: 'startup',
				severity: 'low',
				metadata: {
					botTag: client.user?.tag,
					guildCount: client.guilds.cache.size
				}
			})
		})

		// Monitor for disconnections
		client.on('disconnect', () => {
			ErrorLogger.logError('Discord bot disconnected', {
				component: 'discord-bot',
				action: 'disconnect',
				severity: 'high',
				metadata: {
					uptime: Date.now() - this.startTime
				}
			})
		})

		// Monitor for reconnections
		client.on('reconnecting', () => {
			ErrorLogger.logError('Discord bot reconnecting', {
				component: 'discord-bot',
				action: 'reconnect',
				severity: 'medium'
			})
		})

		// Register Discord-specific health check
		HealthChecker.registerCheck('discord-bot', this.discordHealthCheck.bind(this))
	}

	static async discordHealthCheck() {
		const startTime = Date.now()

		try {
			if (!this.client) {
				throw new Error('Discord client not initialized')
			}

			const status = this.client.readyAt ? 'healthy' : 'unhealthy'
			const uptime = this.client.uptime || 0
			const ping = this.client.ws.ping

			return {
				name: 'discord-bot',
				status: status as 'healthy' | 'unhealthy',
				responseTime: Date.now() - startTime,
				metadata: {
					botUptime: uptime,
					websocketPing: ping,
					guildCount: this.client.guilds.cache.size,
					userCount: this.client.users.cache.size,
					readyAt: this.client.readyAt?.toISOString(),
					commandStats: this.commandStats
				},
				timestamp: new Date().toISOString()
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Discord bot health check failed'
			return {
				name: 'discord-bot',
				status: 'unhealthy' as const,
				responseTime: Date.now() - startTime,
				error: errorMessage,
				timestamp: new Date().toISOString()
			}
		}
	}

	static async logCommandUsage(
		commandName: string,
		userId: string,
		guildId: string,
		success: boolean,
		responseTime: number,
		error?: Error
	): Promise<void> {
		this.commandStats.totalCommands++

		if (success) {
			this.commandStats.successfulCommands++
			// Only log successful commands at very low severity for stats
			await ErrorLogger.logError(`Command: ${commandName}`, {
				component: 'discord-bot',
				action: `command:${commandName}`,
				userId,
				severity: 'low',
				metadata: {
					commandName,
					guildId,
					responseTime,
					success: true
				}
			})
		} else {
			this.commandStats.failedCommands++
			await ErrorLogger.logDiscordBotError(commandName, userId, error || new Error('Command failed'))
		}
	}

	static getStatistics(): {
		uptime: number
		commandsProcessed: number
		successRate: number
		errorsToday: number
	} {
		const uptime = Date.now() - this.startTime
		const errorStats = ErrorLogger.getErrorStats()
		const discordErrors = errorStats.byComponent['discord-bot'] || 0
		const successRate = this.commandStats.totalCommands > 0
			? (this.commandStats.successfulCommands / this.commandStats.totalCommands) * 100
			: 100

		return {
			uptime,
			commandsProcessed: this.commandStats.totalCommands,
			successRate,
			errorsToday: discordErrors
		}
	}
}
