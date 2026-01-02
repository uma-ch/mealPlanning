-- Migration: Add API Keys Table
-- Description: Create table for storing API keys used by browser extension and other integrations
-- Created: 2026-01-03

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  key_prefix VARCHAR(16) NOT NULL,
  name VARCHAR(100) NOT NULL,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);

-- Add comment for documentation
COMMENT ON TABLE api_keys IS 'Stores hashed API keys for authentication from browser extensions and other integrations';
COMMENT ON COLUMN api_keys.key_hash IS 'SHA-256 hash of the API key for secure storage';
COMMENT ON COLUMN api_keys.key_prefix IS 'First 12 characters of the key for display purposes (e.g., rp_live_abc...)';
COMMENT ON COLUMN api_keys.name IS 'User-friendly name for the API key (e.g., "Chrome Extension")';
COMMENT ON COLUMN api_keys.last_used_at IS 'Timestamp of when the API key was last used for authentication';
COMMENT ON COLUMN api_keys.is_active IS 'Whether the API key is active (false = revoked)';
