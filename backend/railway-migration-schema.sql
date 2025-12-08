-- PostgreSQL Schema for Cloud SQL
-- This creates all tables needed for the migration

CREATE TABLE IF NOT EXISTS tokens (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  decimals INTEGER NOT NULL DEFAULT 18,
  initial_supply TEXT NOT NULL,
  logo_ipfs TEXT,
  description TEXT,
  twitter_url TEXT,
  discord_url TEXT,
  telegram_url TEXT,
  website_url TEXT,
  github_url TEXT,
  medium_url TEXT,
  reddit_url TEXT,
  youtube_url TEXT,
  linkedin_url TEXT,
  base_price DOUBLE PRECISION NOT NULL,
  slope DOUBLE PRECISION NOT NULL,
  graduation_threshold DOUBLE PRECISION NOT NULL,
  buy_fee_percent DOUBLE PRECISION NOT NULL DEFAULT 0,
  sell_fee_percent DOUBLE PRECISION NOT NULL DEFAULT 0,
  cross_chain_enabled INTEGER NOT NULL DEFAULT 0,
  creator_address TEXT,
  advanced_settings TEXT,
  banner_image_ipfs TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  accent_color TEXT DEFAULT '#8B5CF6',
  background_color TEXT,
  layout_template TEXT DEFAULT 'default',
  custom_settings TEXT,
  archived INTEGER NOT NULL DEFAULT 0,
  pinned INTEGER NOT NULL DEFAULT 0,
  deleted INTEGER NOT NULL DEFAULT 0,
  visible_in_marketplace INTEGER NOT NULL DEFAULT 1,
  verified INTEGER NOT NULL DEFAULT 0,
  verified_at TIMESTAMP,
  verified_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS token_deployments (
  id SERIAL PRIMARY KEY,
  token_id TEXT NOT NULL,
  chain TEXT NOT NULL,
  token_address TEXT,
  curve_address TEXT,
  pool_address TEXT,
  bridge_address TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  is_graduated BOOLEAN NOT NULL DEFAULT false,
  dex_pool_address TEXT,
  dex_name TEXT,
  graduated_at TIMESTAMP,
  graduation_tx_hash TEXT,
  current_supply TEXT NOT NULL DEFAULT '0',
  reserve_balance TEXT NOT NULL DEFAULT '0',
  market_cap DOUBLE PRECISION NOT NULL DEFAULT 0,
  holder_count INTEGER NOT NULL DEFAULT 0,
  holder_count_updated_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE,
  UNIQUE(token_id, chain)
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  token_id TEXT NOT NULL,
  chain TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  type TEXT NOT NULL,
  from_address TEXT,
  to_address TEXT,
  amount TEXT,
  price DOUBLE PRECISION,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shared_liquidity_pools (
  id SERIAL PRIMARY KEY,
  token_id TEXT NOT NULL,
  chain TEXT NOT NULL,
  pool_address TEXT NOT NULL,
  balance TEXT NOT NULL DEFAULT '0',
  tvl DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE,
  UNIQUE(token_id, chain)
);

CREATE TABLE IF NOT EXISTS platform_fees (
  id SERIAL PRIMARY KEY,
  token_id TEXT,
  chain TEXT NOT NULL,
  fee_type TEXT NOT NULL,
  amount TEXT NOT NULL,
  amount_usd DOUBLE PRECISION,
  native_amount TEXT,
  from_address TEXT,
  to_address TEXT,
  tx_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  collected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS fee_statistics (
  id SERIAL PRIMARY KEY,
  date TEXT NOT NULL,
  total_fees_usd DOUBLE PRECISION NOT NULL DEFAULT 0,
  token_creation_fees DOUBLE PRECISION NOT NULL DEFAULT 0,
  mint_fees DOUBLE PRECISION NOT NULL DEFAULT 0,
  cross_chain_fees DOUBLE PRECISION NOT NULL DEFAULT 0,
  bridge_fees DOUBLE PRECISION NOT NULL DEFAULT 0,
  buyback_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  liquidity_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  burn_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date)
);

CREATE TABLE IF NOT EXISTS presale_config (
  id TEXT PRIMARY KEY,
  token_symbol TEXT NOT NULL,
  token_name TEXT NOT NULL,
  solana_address TEXT NOT NULL UNIQUE,
  presale_price DOUBLE PRECISION NOT NULL,
  total_tokens_for_presale TEXT NOT NULL,
  min_purchase_sol DOUBLE PRECISION NOT NULL DEFAULT 0.1,
  max_purchase_sol DOUBLE PRECISION,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'pending',
  liquidity_percentage DOUBLE PRECISION NOT NULL DEFAULT 60,
  dev_percentage DOUBLE PRECISION NOT NULL DEFAULT 20,
  marketing_percentage DOUBLE PRECISION NOT NULL DEFAULT 20,
  affiliate_reward_percentage DOUBLE PRECISION NOT NULL DEFAULT 5,
  total_raised_sol DOUBLE PRECISION NOT NULL DEFAULT 0,
  total_contributors INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS presale_transactions (
  id SERIAL PRIMARY KEY,
  presale_id TEXT NOT NULL,
  solana_tx_hash TEXT NOT NULL UNIQUE,
  buyer_address TEXT NOT NULL,
  sol_amount DOUBLE PRECISION NOT NULL,
  token_amount TEXT NOT NULL,
  referral_code TEXT,
  referral_address TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  confirmed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (presale_id) REFERENCES presale_config(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS presale_allocations (
  id SERIAL PRIMARY KEY,
  presale_id TEXT NOT NULL,
  buyer_address TEXT NOT NULL,
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

CREATE TABLE IF NOT EXISTS presale_affiliates (
  id SERIAL PRIMARY KEY,
  presale_id TEXT NOT NULL,
  referral_code TEXT NOT NULL UNIQUE,
  affiliate_address TEXT NOT NULL,
  total_referrals INTEGER NOT NULL DEFAULT 0,
  total_volume_sol DOUBLE PRECISION NOT NULL DEFAULT 0,
  total_rewards_sol DOUBLE PRECISION NOT NULL DEFAULT 0,
  rewards_claimed_sol DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (presale_id) REFERENCES presale_config(id) ON DELETE CASCADE,
  UNIQUE(presale_id, referral_code)
);

CREATE TABLE IF NOT EXISTS presale_referrals (
  id SERIAL PRIMARY KEY,
  presale_id TEXT NOT NULL,
  affiliate_id INTEGER NOT NULL,
  referral_code TEXT NOT NULL,
  buyer_address TEXT NOT NULL,
  sol_amount DOUBLE PRECISION NOT NULL,
  reward_amount_sol DOUBLE PRECISION NOT NULL,
  transaction_id INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (presale_id) REFERENCES presale_config(id) ON DELETE CASCADE,
  FOREIGN KEY (affiliate_id) REFERENCES presale_affiliates(id) ON DELETE CASCADE,
  FOREIGN KEY (transaction_id) REFERENCES presale_transactions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS liquidity_requests (
  id SERIAL PRIMARY KEY,
  token_id TEXT NOT NULL,
  target_chain TEXT NOT NULL,
  source_chain TEXT,
  amount TEXT NOT NULL,
  request_id TEXT,
  tx_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cfy_vesting_schedules (
  id SERIAL PRIMARY KEY,
  beneficiary_address TEXT NOT NULL,
  total_amount TEXT NOT NULL,
  tge_amount TEXT NOT NULL,
  vesting_amount TEXT NOT NULL,
  tge_released BOOLEAN NOT NULL DEFAULT false,
  tge_released_at TIMESTAMP,
  vesting_start_date TIMESTAMP NOT NULL,
  vesting_duration_months INTEGER NOT NULL DEFAULT 18,
  monthly_release_amount TEXT NOT NULL,
  total_released TEXT NOT NULL DEFAULT '0',
  last_release_date TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(beneficiary_address)
);

CREATE TABLE IF NOT EXISTS cfy_vesting_releases (
  id SERIAL PRIMARY KEY,
  vesting_schedule_id INTEGER NOT NULL,
  beneficiary_address TEXT NOT NULL,
  release_amount TEXT NOT NULL,
  release_type TEXT NOT NULL,
  release_date TIMESTAMP NOT NULL,
  transaction_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vesting_schedule_id) REFERENCES cfy_vesting_schedules(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cfy_staking_pools (
  id SERIAL PRIMARY KEY,
  pool_name TEXT NOT NULL UNIQUE,
  pool_type TEXT NOT NULL,
  apy_percentage DOUBLE PRECISION NOT NULL,
  lock_period_days INTEGER,
  min_stake_amount TEXT NOT NULL DEFAULT '0',
  max_stake_amount TEXT,
  total_staked TEXT NOT NULL DEFAULT '0',
  total_rewards_distributed TEXT NOT NULL DEFAULT '0',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cfy_staking_positions (
  id SERIAL PRIMARY KEY,
  pool_id INTEGER NOT NULL,
  staker_address TEXT NOT NULL,
  staked_amount TEXT NOT NULL,
  staked_at TIMESTAMP NOT NULL,
  lock_until TIMESTAMP,
  total_rewards_earned TEXT NOT NULL DEFAULT '0',
  rewards_claimed TEXT NOT NULL DEFAULT '0',
  last_reward_calculation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN NOT NULL DEFAULT true,
  unstaked_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pool_id) REFERENCES cfy_staking_pools(id) ON DELETE CASCADE,
  UNIQUE(pool_id, staker_address, staked_at)
);

CREATE TABLE IF NOT EXISTS cfy_staking_rewards (
  id SERIAL PRIMARY KEY,
  position_id INTEGER NOT NULL,
  staker_address TEXT NOT NULL,
  reward_amount TEXT NOT NULL,
  reward_period_start TIMESTAMP NOT NULL,
  reward_period_end TIMESTAMP NOT NULL,
  calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  claimed_at TIMESTAMP,
  transaction_hash TEXT,
  FOREIGN KEY (position_id) REFERENCES cfy_staking_positions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS token_custom_sections (
  id SERIAL PRIMARY KEY,
  token_id TEXT NOT NULL,
  section_type TEXT NOT NULL,
  title TEXT,
  content TEXT,
  section_order INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE,
  UNIQUE(token_id, section_type, section_order)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_token_deployments_token_id ON token_deployments(token_id);
CREATE INDEX IF NOT EXISTS idx_token_deployments_chain ON token_deployments(chain);
CREATE INDEX IF NOT EXISTS idx_transactions_token_id ON transactions(token_id);
CREATE INDEX IF NOT EXISTS idx_transactions_chain ON transactions(chain);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_platform_fees_token_id ON platform_fees(token_id);
CREATE INDEX IF NOT EXISTS idx_platform_fees_type ON platform_fees(fee_type);
CREATE INDEX IF NOT EXISTS idx_platform_fees_collected_at ON platform_fees(collected_at);
CREATE INDEX IF NOT EXISTS idx_fee_statistics_date ON fee_statistics(date);

