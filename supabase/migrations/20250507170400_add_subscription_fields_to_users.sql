-- Add subscription fields to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES subscriptions(id),
  ADD COLUMN IF NOT EXISTS subscription_status TEXT,
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT;
