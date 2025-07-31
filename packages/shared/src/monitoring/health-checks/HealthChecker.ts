import { createClient } from '@supabase/supabase-js'

export interface HealthCheck {
	name: string
	status: 'healthy' | 'unhealthy' | 'degraded'
	responseTime: number
	error?: string
	metadata?: Record<string, any>
	timestamp: string
}

export interface SystemHealth {
	overall: 'healthy' | 'unhealthy' | 'degraded'
	checks: HealthCheck[]
	timestamp: string
	version: string
	environment: string
}

export class HealthChecker {
	private static checks: Map<string, () => Promise<HealthCheck>> = new Map()

	static registerCheck(name: string, checkFunction: () => Promise<HealthCheck>): void {
		this.checks.set(name, checkFunction)
	}

	static async runAllChecks(): Promise<SystemHealth> {
		const startTime = Date.now()
		const checks: HealthCheck[] = []

		// Run all registered health checks
		for (const [name, checkFunction] of this.checks.entries()) {
			try {
				const check = await checkFunction()
				checks.push(check)
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error'
				checks.push({
					name,
					status: 'unhealthy',
					responseTime: Date.now() - startTime,
					error: errorMessage,
					timestamp: new Date().toISOString()
				})
			}
		}

		// Add default checks if none registered
		if (checks.length === 0) {
			checks.push(await this.basicHealthCheck())
		}

		// Determine overall health
		const overall = this.calculateOverallHealth(checks)

		return {
			overall,
			checks,
			timestamp: new Date().toISOString(),
			version: process.env.npm_package_version || '1.0.0',
			environment: process.env.NODE_ENV || 'development'
		}
	}

	static async basicHealthCheck(): Promise<HealthCheck> {
		const startTime = Date.now()

		try {
			// Basic memory and uptime check
			const memUsage = process.memoryUsage()
			const uptime = process.uptime()

			return {
				name: 'basic',
				status: 'healthy',
				responseTime: Date.now() - startTime,
				metadata: {
					memoryUsage: {
						used: Math.round(memUsage.heapUsed / 1024 / 1024),
						total: Math.round(memUsage.heapTotal / 1024 / 1024),
						unit: 'MB'
					},
					uptime: Math.round(uptime),
					nodeVersion: process.version
				},
				timestamp: new Date().toISOString()
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error'
			return {
				name: 'basic',
				status: 'unhealthy',
				responseTime: Date.now() - startTime,
				error: errorMessage,
				timestamp: new Date().toISOString()
			}
		}
	}

	static async databaseHealthCheck(): Promise<HealthCheck> {
		const startTime = Date.now()

		try {
			const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
			const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

			if (!supabaseUrl || !supabaseKey) {
				throw new Error('Supabase credentials not configured')
			}

			const supabase = createClient(supabaseUrl, supabaseKey)

			// Simple query to test database connectivity
			const { data, error } = await supabase
				.from('players')
				.select('count')
				.limit(1)

			if (error) throw error

			return {
				name: 'database',
				status: 'healthy',
				responseTime: Date.now() - startTime,
				metadata: {
					connection: 'successful',
					queryTime: Date.now() - startTime
				},
				timestamp: new Date().toISOString()
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Database connection failed'
			return {
				name: 'database',
				status: 'unhealthy',
				responseTime: Date.now() - startTime,
				error: errorMessage,
				timestamp: new Date().toISOString()
			}
		}
	}

	static async externalAPIHealthCheck(): Promise<HealthCheck> {
		const startTime = Date.now()

		try {
			// Test external APIs that your app depends on
			const checks = []

			// Check Gemini API if configured
			if (process.env.GEMINI_API_KEY) {
				try {
					// Simple test - we won't actually call Gemini but check if key is present
					checks.push({ service: 'gemini', status: 'configured' })
				} catch (error) {
					// FIXED: Properly handle unknown error type
					const errorMessage = error instanceof Error ? error.message : String(error)
					checks.push({ service: 'gemini', status: 'error', error: errorMessage })
				}
			}

			// Check Discord API if configured
			if (process.env.DISCORD_BOT_TOKEN) {
				checks.push({ service: 'discord', status: 'configured' })
			}

			const hasErrors = checks.some(check => check.status === 'error')

			return {
				name: 'external-apis',
				status: hasErrors ? 'degraded' : 'healthy',
				responseTime: Date.now() - startTime,
				metadata: {
					apiChecks: checks,
					configuredServices: checks.length
				},
				timestamp: new Date().toISOString()
			}
		} catch (error) {
			// FIXED: Properly handle unknown error type
			const errorMessage = error instanceof Error ? error.message : 'API check failed'
			return {
				name: 'external-apis',
				status: 'unhealthy',
				responseTime: Date.now() - startTime,
				error: errorMessage,
				timestamp: new Date().toISOString()
			}
		}
	}

	private static calculateOverallHealth(checks: HealthCheck[]): 'healthy' | 'unhealthy' | 'degraded' {
		if (checks.length === 0) return 'unhealthy'

		const statuses = checks.map(check => check.status)

		if (statuses.every(status => status === 'healthy')) {
			return 'healthy'
		}

		if (statuses.some(status => status === 'unhealthy')) {
			return 'unhealthy'
		}

		return 'degraded'
	}

	static async quickHealthCheck(): Promise<{ status: string; timestamp: string }> {
		try {
			const health = await this.runAllChecks()
			return {
				status: health.overall,
				timestamp: health.timestamp
			}
		} catch (error) {
			return {
				status: 'unhealthy',
				timestamp: new Date().toISOString()
			}
		}
	}
}

// Register default health checks
HealthChecker.registerCheck('basic', HealthChecker.basicHealthCheck)
HealthChecker.registerCheck('database', HealthChecker.databaseHealthCheck)
HealthChecker.registerCheck('external-apis', HealthChecker.externalAPIHealthCheck)
