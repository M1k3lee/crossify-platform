-- Migration: Add token verification and analytics fields
-- This adds support for token verification, holder tracking, and enhanced analytics

-- Add verification field to tokens table
ALTER TABLE tokens ADD COLUMN verified INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tokens ADD COLUMN verified_at TEXT;
ALTER TABLE tokens ADD COLUMN verified_by TEXT; -- Admin address or identifier

-- Add holder count to token_deployments (per chain)
ALTER TABLE token_deployments ADD COLUMN holder_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE token_deployments ADD COLUMN holder_count_updated_at TEXT;

-- Create index for verified tokens
CREATE INDEX IF NOT EXISTS idx_tokens_verified ON tokens(verified);

-- Create index for holder counts
CREATE INDEX IF NOT EXISTS idx_token_deployments_holder_count ON token_deployments(holder_count);

