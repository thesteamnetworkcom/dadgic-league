-- Migration: 1.1.0 - Add Backup Metadata
-- Description: Add metadata tables for backup and recovery tracking
-- Apply this manually in your Supabase SQL editor after running migration 1.0.0

CREATE TABLE IF NOT EXISTS backup_metadata (
  id SERIAL PRIMARY KEY,
  backup_type VARCHAR(50) NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  backup_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  record_count INTEGER,
  backup_size_bytes BIGINT,
  checksum VARCHAR(64),
  status VARCHAR(20) DEFAULT 'completed',
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_backup_metadata_timestamp ON backup_metadata(backup_timestamp);
CREATE INDEX IF NOT EXISTS idx_backup_metadata_table ON backup_metadata(table_name);
