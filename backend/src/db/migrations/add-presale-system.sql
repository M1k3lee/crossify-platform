-- Migration: Add presale system tables
-- This adds support for Solana presale with transaction tracking, allocations, and affiliates

-- Presale configuration table
CREATE TABLE IF NOT EXISTS presale_config (
  id TEXT PRIMARY KEY,
  token_symbol TEXT NOT NULL,
  token_name TEXT NOT NULL,
  solana_address TEXT NOT NULL UNIQUE, -- Solana wallet address to receive payments
  presale_price DOUBLE PRECISION NOT NULL, -- Price per token in SOL
  total_tokens_for_presale TEXT NOT NULL, -- Total tokens allocated for presale
  min_purchase_sol DOUBLE PRECISION NOT NULL DEFAULT 0.1, -- Minimum SOL purchase
  max_purchase_sol DOUBLE PRECISION, -- Maximum SOL purchase (NULL = unlimited)
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, active, paused, completed, cancelled
  liquidity_percentage DOUBLE PRECISION NOT NULL DEFAULT 60, -- % of raised SOL for liquidity
  dev_percentage DOUBLE PRECISION NOT NULL DEFAULT 20, -- % of raised SOL for dev payments
  marketing_percentage DOUBLE PRECISION NOT NULL DEFAULT 20, -- % of raised SOL for marketing
  affiliate_reward_percentage DOUBLE PRECISION NOT NULL DEFAULT 5, -- % of referral's purchase as reward
  total_raised_sol DOUBLE PRECISION NOT NULL DEFAULT 0,
  total_contributors INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Presale transactions table - tracks all SOL received
CREATE TABLE IF NOT EXISTS presale_transactions (
  id SERIAL PRIMARY KEY,
  presale_id TEXT NOT NULL,
  solana_tx_hash TEXT NOT NULL UNIQUE, -- Solana transaction hash
  buyer_address TEXT NOT NULL, -- Buyer's Solana wallet address
  sol_amount DOUBLE PRECISION NOT NULL, -- Amount of SOL sent
  token_amount TEXT NOT NULL, -- Tokens allocated (calculated based on presale_price)
  referral_code TEXT, -- Affiliate referral code if used
  referral_address TEXT, -- Address of the referrer
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, failed
  confirmed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (presale_id) REFERENCES presale_config(id) ON DELETE CASCADE
);

-- Presale allocations table - tracks token allocations per user
CREATE TABLE IF NOT EXISTS presale_allocations (
  id SERIAL PRIMARY KEY,
  presale_id TEXT NOT NULL,
  buyer_address TEXT NOT NULL, -- Buyer's Solana wallet address
  total_sol_contributed DOUBLE PRECISION NOT NULL DEFAULT 0,
  total_tokens_allocated TEXT NOT NULL DEFAULT '0',
  transaction_count INTEGER NOT NULL DEFAULT 0,
  first_contribution_at TIMESTAMP,
  last_contribution_at TIMESTAMP,
  tokens_claimed BOOLEAN NOT NULL DEFAULT false,
  tokens_claimed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (presale_id) REFERENCES presale_config(id) ON DELETE CASCADE,
  UNIQUE(presale_id, buyer_address)
);

-- Affiliates table - tracks referral codes and rewards
CREATE TABLE IF NOT EXISTS presale_affiliates (
  id SERIAL PRIMARY KEY,
  presale_id TEXT NOT NULL,
  referral_code TEXT NOT NULL UNIQUE, -- Unique referral code
  affiliate_address TEXT NOT NULL, -- Affiliate's Solana wallet address
  total_referrals INTEGER NOT NULL DEFAULT 0, -- Number of successful referrals
  total_volume_sol DOUBLE PRECISION NOT NULL DEFAULT 0, -- Total SOL volume from referrals
  total_rewards_sol DOUBLE PRECISION NOT NULL DEFAULT 0, -- Total rewards earned
  rewards_claimed_sol DOUBLE PRECISION NOT NULL DEFAULT 0, -- Rewards already claimed
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (presale_id) REFERENCES presale_config(id) ON DELETE CASCADE,
  UNIQUE(presale_id, referral_code)
);

-- Affiliate referrals table - tracks individual referrals
CREATE TABLE IF NOT EXISTS presale_referrals (
  id SERIAL PRIMARY KEY,
  presale_id TEXT NOT NULL,
  affiliate_id INTEGER NOT NULL,
  referral_code TEXT NOT NULL,
  buyer_address TEXT NOT NULL, -- Address of the person who used the referral
  sol_amount DOUBLE PRECISION NOT NULL, -- Amount of SOL from this referral
  reward_amount_sol DOUBLE PRECISION NOT NULL, -- Reward earned by affiliate
  transaction_id INTEGER NOT NULL, -- Link to presale_transactions
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (presale_id) REFERENCES presale_config(id) ON DELETE CASCADE,
  FOREIGN KEY (affiliate_id) REFERENCES presale_affiliates(id) ON DELETE CASCADE,
  FOREIGN KEY (transaction_id) REFERENCES presale_transactions(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_presale_transactions_presale_id ON presale_transactions(presale_id);
CREATE INDEX IF NOT EXISTS idx_presale_transactions_buyer_address ON presale_transactions(buyer_address);
CREATE INDEX IF NOT EXISTS idx_presale_transactions_status ON presale_transactions(status);
CREATE INDEX IF NOT EXISTS idx_presale_allocations_presale_id ON presale_allocations(presale_id);
CREATE INDEX IF NOT EXISTS idx_presale_allocations_buyer_address ON presale_allocations(buyer_address);
CREATE INDEX IF NOT EXISTS idx_presale_affiliates_presale_id ON presale_affiliates(presale_id);
CREATE INDEX IF NOT EXISTS idx_presale_affiliates_referral_code ON presale_affiliates(referral_code);
CREATE INDEX IF NOT EXISTS idx_presale_referrals_affiliate_id ON presale_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_presale_referrals_buyer_address ON presale_referrals(buyer_address);

