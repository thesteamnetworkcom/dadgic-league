-- Migration: 1.0.0 - Initial Schema Validation
-- Description: Validate and ensure RLS policies are correct for all tables
-- Apply this manually in your Supabase SQL editor

-- Enable RLS on all tables
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE pods ENABLE ROW LEVEL SECURITY;
ALTER TABLE pod_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_pods ENABLE ROW LEVEL SECURITY;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_players_discord_username ON players(discord_username);
CREATE INDEX IF NOT EXISTS idx_players_discord_id ON players(discord_id);
CREATE INDEX IF NOT EXISTS idx_pods_date ON pods(date);
CREATE INDEX IF NOT EXISTS idx_pods_league_id ON pods(league_id);
CREATE INDEX IF NOT EXISTS idx_pod_participants_pod_id ON pod_participants(pod_id);
CREATE INDEX IF NOT EXISTS idx_pod_participants_player_id ON pod_participants(player_id);
CREATE INDEX IF NOT EXISTS idx_leagues_status ON leagues(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_pods_league_id ON scheduled_pods(league_id);

-- Create migrations table
CREATE TABLE IF NOT EXISTS migrations (
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
