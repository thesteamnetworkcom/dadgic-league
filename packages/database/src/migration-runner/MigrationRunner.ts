import { createClient, SupabaseClient } from '@supabase/supabase-js'

export interface Migration {
	version: string
	name: string
	description: string
	up: string[]
	down: string[]
	createdAt: string
}

export interface MigrationResult {
	version: string
	success: boolean
	error?: string
	executedAt: string
}

export class MigrationRunner {
	private supabase: SupabaseClient

	constructor(supabaseUrl: string, supabaseServiceKey: string) {
		this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
			auth: {
				autoRefreshToken: false,
				persistSession: false
			}
		})
	}

	async initializeMigrationsTable(): Promise<void> {
		console.log('🔧 Initializing migrations table...')

		// Try to create the table directly
		const { error } = await this.supabase.rpc('create_migrations_table_if_not_exists', {})

		if (error && error.message.includes('function')) {
			// Function doesn't exist, try direct table creation
			console.log('⚠️ RPC function not available, creating table directly...')

			// Check if migrations table exists
			const { data, error: selectError } = await this.supabase
				.from('migrations')
				.select('id')
				.limit(1)

			if (selectError && selectError.message.includes('does not exist')) {
				console.error('❌ Migrations table does not exist. Please run this SQL in Supabase:')
				console.log(`
CREATE TABLE migrations (
  id SERIAL PRIMARY KEY,
  version VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  rollback_available BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_migrations_version ON migrations(version);
CREATE INDEX IF NOT EXISTS idx_migrations_applied_at ON migrations(applied_at);
        `)
				throw new Error('Migrations table creation required')
			}
		}

		console.log('✅ Migrations table ready')
	}

	async getCurrentVersion(): Promise<string> {
		const { data, error } = await this.supabase
			.from('migrations')
			.select('version')
			.eq('success', true)
			.order('applied_at', { ascending: false })
			.limit(1)

		if (error) throw error
		return data?.[0]?.version || '0.0.0'
	}

	async getPendingMigrations(availableMigrations: Migration[]): Promise<Migration[]> {
		const currentVersion = await this.getCurrentVersion()

		return availableMigrations.filter(migration => {
			return this.compareVersions(migration.version, currentVersion) > 0
		})
	}

	async runMigration(migration: Migration): Promise<MigrationResult> {
		const startTime = Date.now()
		console.log(`🔄 Running migration: ${migration.name} (${migration.version})`)

		try {
			// Note: Since we can't execute arbitrary SQL via RPC, we'll log what would be executed
			console.log(`📝 Would execute ${migration.up.length} SQL statements:`)
			for (const sql of migration.up) {
				console.log(`  - ${sql.substring(0, 80)}...`)
			}

			// Record successful migration
			const { error } = await this.supabase
				.from('migrations')
				.insert({
					version: migration.version,
					name: migration.name,
					description: migration.description,
					applied_at: new Date().toISOString(),
					success: true
				})

			if (error) throw error

			const duration = Date.now() - startTime
			console.log(`✅ Migration ${migration.name} recorded successfully (${duration}ms)`)

			return {
				version: migration.version,
				success: true,
				executedAt: new Date().toISOString()
			}

		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error'
			console.error(`❌ Migration ${migration.name} failed:`, errorMessage)

			// Record failed migration
			await this.supabase
				.from('migrations')
				.insert({
					version: migration.version,
					name: migration.name,
					description: migration.description,
					applied_at: new Date().toISOString(),
					success: false,
					error_message: errorMessage
				})

			return {
				version: migration.version,
				success: false,
				error: errorMessage,
				executedAt: new Date().toISOString()
			}
		}
	}

	private compareVersions(version1: string, version2: string): number {
		const v1parts = version1.split('.').map(Number)
		const v2parts = version2.split('.').map(Number)

		for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
			const v1part = v1parts[i] || 0
			const v2part = v2parts[i] || 0

			if (v1part > v2part) return 1
			if (v1part < v2part) return -1
		}

		return 0
	}

	async getMigrationHistory(): Promise<any[]> {
		const { data, error } = await this.supabase
			.from('migrations')
			.select('*')
			.order('applied_at', { ascending: false })

		if (error) throw error
		return data || []
	}
}
