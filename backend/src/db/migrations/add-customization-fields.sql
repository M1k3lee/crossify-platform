-- Migration: Add token customization fields
-- This adds support for banner images, color themes, and custom sections

-- Add customization fields to tokens table
ALTER TABLE tokens ADD COLUMN banner_image_ipfs TEXT;
ALTER TABLE tokens ADD COLUMN primary_color TEXT DEFAULT '#3B82F6';
ALTER TABLE tokens ADD COLUMN accent_color TEXT DEFAULT '#8B5CF6';
ALTER TABLE tokens ADD COLUMN background_color TEXT;
ALTER TABLE tokens ADD COLUMN layout_template TEXT DEFAULT 'default';
ALTER TABLE tokens ADD COLUMN custom_settings TEXT; -- JSON for flexible settings

-- Create table for custom sections (roadmap, team, FAQ, etc.)
CREATE TABLE IF NOT EXISTS token_custom_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_id TEXT NOT NULL,
  section_type TEXT NOT NULL, -- 'roadmap', 'team', 'faq', 'links', 'tokenomics'
  title TEXT,
  content TEXT, -- JSON or markdown depending on section type
  section_order INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE,
  UNIQUE(token_id, section_type, section_order)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_token_custom_sections_token_id ON token_custom_sections(token_id);
CREATE INDEX IF NOT EXISTS idx_token_custom_sections_enabled ON token_custom_sections(enabled);

-- Add more social links
ALTER TABLE tokens ADD COLUMN github_url TEXT;
ALTER TABLE tokens ADD COLUMN medium_url TEXT;
ALTER TABLE tokens ADD COLUMN reddit_url TEXT;
ALTER TABLE tokens ADD COLUMN youtube_url TEXT;
ALTER TABLE tokens ADD COLUMN linkedin_url TEXT;

