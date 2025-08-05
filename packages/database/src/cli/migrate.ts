#!/usr/bin/env node

import { MigrationRunner } from '../migration-runner/MigrationRunner.js'
import { migrations } from '../migrations/MigrationRegistry.js'
import { BackupService } from '../backup/BackupService.js'

async function main() {
	const command = process.argv[2]
	const subcommand = process.argv[3]

	const supabaseUrl = process.env.SUPABASE_URL
	const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

	if (!supabaseUrl || !supabaseServiceKey) {
		console.error('❌ Missing environment variables:')
		console.error('   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
		process.exit(1)
	}

	const migrationRunner = new MigrationRunner(supabaseUrl, supabaseServiceKey)
	const backupService = new BackupService(supabaseUrl, supabaseServiceKey)

	try {
		switch (command) {
			case 'migrate':
				await handleMigrateCommand(migrationRunner, subcommand)
				break
			case 'backup':
				await handleBackupCommand(backupService, subcommand)
				break
			case 'status':
				await handleStatusCommand(migrationRunner)
				break
			default:
				showUsage()
		}
	} catch (error) {
		console.error('❌ Command failed:', error instanceof Error ? error.message : error)
		process.exit(1)
	}
}

async function handleMigrateCommand(runner: MigrationRunner, subcommand?: string) {
	await runner.initializeMigrationsTable()

	switch (subcommand) {
		case 'up':
			const pending = await runner.getPendingMigrations(migrations)
			if (pending.length === 0) {
				console.log('✅ No pending migrations')
				return
			}

			console.log(`📋 Found ${pending.length} pending migrations:`)
			for (const migration of pending) {
				console.log(`   - ${migration.version}: ${migration.name}`)
			}

			console.log('')
			console.log('⚠️ Note: SQL execution requires manual application in Supabase')
			console.log('   The migration system will track what has been applied')

			for (const migration of pending) {
				const result = await runner.runMigration(migration)
				if (!result.success) {
					console.error(`❌ Migration failed: ${result.error}`)
					process.exit(1)
				}
			}
			break

		case 'history':
			const history = await runner.getMigrationHistory()
			console.log('📋 Migration History:')
			for (const record of history) {
				const status = record.success ? '✅' : '❌'
				console.log(`   ${status} ${record.version}: ${record.name} (${record.applied_at})`)
				if (!record.success) {
					console.log(`      Error: ${record.error_message}`)
				}
			}
			break

		default:
			console.log('Available migration commands:')
			console.log('   migrate up      - Run pending migrations')
			console.log('   migrate history - Show migration history')
	}
}

async function handleBackupCommand(backupService: BackupService, subcommand?: string) {
	switch (subcommand) {
		case 'create':
			const result = await backupService.createBackup()
			if (result.success) {
				console.log('✅ Backup completed successfully')
			} else {
				console.error('❌ Backup failed:', result.error)
				process.exit(1)
			}
			break

		default:
			console.log('Available backup commands:')
			console.log('   backup create - Create new backup')
	}
}

async function handleStatusCommand(runner: MigrationRunner) {
	await runner.initializeMigrationsTable()

	const currentVersion = await runner.getCurrentVersion()
	const pending = await runner.getPendingMigrations(migrations)

	console.log('📊 Migration Status:')
	console.log(`   Current Version: ${currentVersion}`)
	console.log(`   Available Migrations: ${migrations.length}`)
	console.log(`   Pending Migrations: ${pending.length}`)

	if (pending.length > 0) {
		console.log('   Pending:')
		for (const migration of pending) {
			console.log(`     - ${migration.version}: ${migration.name}`)
		}
	}
}

function showUsage() {
	console.log('Database Migration and Backup CLI')
	console.log('')
	console.log('Usage:')
	console.log('   npm run db:migrate <command>')
	console.log('')
	console.log('Commands:')
	console.log('   status           - Show migration status')
	console.log('   migrate up       - Run pending migrations')
	console.log('   migrate history  - Show migration history')
	console.log('   backup create    - Create database backup')
	console.log('')
	console.log('Examples:')
	console.log('   npm run db:migrate status')
	console.log('   npm run db:migrate migrate up')
	console.log('   npm run db:migrate backup create')
}

main().catch(error => {
	console.error('❌ CLI Error:', error)
	process.exit(1)
})
