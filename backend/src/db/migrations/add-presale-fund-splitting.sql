-- Migration: Add fund splitting support to presale system
-- This allows automatic splitting of presale funds to different wallets based on tokenomics

-- Add allocation wallet addresses to presale_config
ALTER TABLE presale_config 
ADD COLUMN IF NOT EXISTS liquidity_wallet TEXT,
ADD COLUMN IF NOT EXISTS dev_wallet TEXT,
ADD COLUMN IF NOT EXISTS marketing_wallet TEXT,
ADD COLUMN IF NOT EXISTS auto_split_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS split_threshold_sol DOUBLE PRECISION DEFAULT 1.0; -- Minimum SOL before splitting

-- Table to track fund splits
CREATE TABLE IF NOT EXISTS presale_fund_splits (
  id SERIAL PRIMARY KEY,
  presale_id TEXT NOT NULL,
  transaction_id INTEGER, -- Link to presale_transactions (optional)
  total_sol_amount DOUBLE PRECISION NOT NULL, -- Total SOL that was split
  liquidity_amount DOUBLE PRECISION NOT NULL, -- Amount sent to liquidity wallet
  dev_amount DOUBLE PRECISION NOT NULL, -- Amount sent to dev wallet
  marketing_amount DOUBLE PRECISION NOT NULL, -- Amount sent to marketing wallet
  liquidity_tx_hash TEXT, -- Solana transaction hash for liquidity transfer
  dev_tx_hash TEXT, -- Solana transaction hash for dev transfer
  marketing_tx_hash TEXT, -- Solana transaction hash for marketing transfer
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed
  error_message TEXT, -- Error message if split failed
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  FOREIGN KEY (presale_id) REFERENCES presale_config(id) ON DELETE CASCADE,
  FOREIGN KEY (transaction_id) REFERENCES presale_transactions(id) ON DELETE SET NULL
);

-- Table to track accumulated unsplit funds
CREATE TABLE IF NOT EXISTS presale_unsplit_funds (
  id SERIAL PRIMARY KEY,
  presale_id TEXT NOT NULL UNIQUE,
  accumulated_sol DOUBLE PRECISION NOT NULL DEFAULT 0, -- SOL waiting to be split
  last_transaction_id INTEGER, -- Last transaction that contributed to this
  last_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (presale_id) REFERENCES presale_config(id) ON DELETE CASCADE,
  FOREIGN KEY (last_transaction_id) REFERENCES presale_transactions(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_presale_fund_splits_presale_id ON presale_fund_splits(presale_id);
CREATE INDEX IF NOT EXISTS idx_presale_fund_splits_status ON presale_fund_splits(status);
CREATE INDEX IF NOT EXISTS idx_presale_fund_splits_transaction_id ON presale_fund_splits(transaction_id);
CREATE INDEX IF NOT EXISTS idx_presale_unsplit_funds_presale_id ON presale_unsplit_funds(presale_id);

