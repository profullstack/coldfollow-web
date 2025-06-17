-- Migration: create_campaigns_table
-- Created at: 2025-06-17T09:20:28.941Z

---------------------------------------------------------------------------
-- UP MIGRATION - Changes to apply
---------------------------------------------------------------------------

-- Example up migration:
-- CREATE TABLE new_table (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--   name TEXT NOT NULL
-- );

-- Create campaigns table for managing marketing campaigns
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('email', 'sms', 'phone', 'social', 'mixed')),
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled')),
  target_audience JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_type ON campaigns(type);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own campaigns" ON campaigns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own campaigns" ON campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns" ON campaigns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns" ON campaigns
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();



---------------------------------------------------------------------------
-- DOWN MIGRATION - How to revert the changes (for rollbacks)
---------------------------------------------------------------------------

-- Example down migration:
-- DROP TABLE IF EXISTS new_table;

-- Drop the trigger first
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;

-- Drop the function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop the table (this will also drop indexes and policies)
DROP TABLE IF EXISTS campaigns;

