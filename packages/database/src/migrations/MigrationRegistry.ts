import type { Migration } from '../migration-runner/MigrationRunner'

// All migrations are registered here
export const migrations: Migration[] = [
	{
		version: '1.0.0',
		name: 'initial_schema_validation',
		description: 'Validate and ensure RLS policies are correct for all tables',
		createdAt: '2025-07-21T00:00:00Z',
		up: [
			'ALTER TABLE players ENABLE ROW LEVEL SECURITY;',
			'ALTER TABLE pods ENABLE ROW LEVEL SECURITY;',
			'ALTER TABLE pod_participants ENABLE ROW LEVEL SECURITY;',
			'ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;',
			'ALTER TABLE scheduled_pods ENABLE ROW LEVEL SECURITY;',

			'CREATE INDEX IF NOT EXISTS idx_players_discord_username ON players(discord_username);',
			'CREATE INDEX IF NOT EXISTS idx_players_discord_id ON players(discord_id);',
			'CREATE INDEX IF NOT EXISTS idx_pods_date ON pods(date);',
			'CREATE INDEX IF NOT EXISTS idx_pods_league_id ON pods(league_id);',
			'CREATE INDEX IF NOT EXISTS idx_pod_participants_pod_id ON pod_participants(pod_id);',
			'CREATE INDEX IF NOT EXISTS idx_pod_participants_player_id ON pod_participants(player_id);',
			'CREATE INDEX IF NOT EXISTS idx_leagues_status ON leagues(status);',
			'CREATE INDEX IF NOT EXISTS idx_scheduled_pods_league_id ON scheduled_pods(league_id);'
		],
		down: [
			'DROP INDEX IF EXISTS idx_players_discord_username;',
			'DROP INDEX IF EXISTS idx_players_discord_id;',
			'DROP INDEX IF EXISTS idx_pods_date;',
			'DROP INDEX IF EXISTS idx_pods_league_id;',
			'DROP INDEX IF EXISTS idx_pod_participants_pod_id;',
			'DROP INDEX IF EXISTS idx_pod_participants_player_id;',
			'DROP INDEX IF EXISTS idx_leagues_status;',
			'DROP INDEX IF EXISTS idx_scheduled_pods_league_id;'
		]
	},
	{
		version: '1.1.0',
		name: 'add_backup_metadata',
		description: 'Add metadata tables for backup and recovery tracking',
		createdAt: '2025-07-21T01:00:00Z',
		up: [
			`CREATE TABLE IF NOT EXISTS backup_metadata (
        id SERIAL PRIMARY KEY,
        backup_type VARCHAR(50) NOT NULL,
        table_name VARCHAR(100) NOT NULL,
        backup_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        record_count INTEGER,
        backup_size_bytes BIGINT,
        checksum VARCHAR(64),
        status VARCHAR(20) DEFAULT 'completed',
        metadata JSONB
      );`,
			'CREATE INDEX IF NOT EXISTS idx_backup_metadata_timestamp ON backup_metadata(backup_timestamp);',
			'CREATE INDEX IF NOT EXISTS idx_backup_metadata_table ON backup_metadata(table_name);'
		],
		down: [
			'DROP TABLE IF EXISTS backup_metadata;'
		]
	}
]
