-- Migration: 016_daily_capacity
-- Creates the daily_capacity table for managing bakery production capacity per day

CREATE TABLE IF NOT EXISTS daily_capacity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  max_orders INTEGER DEFAULT 5,
  current_orders INTEGER DEFAULT 0,
  is_blocked BOOLEAN DEFAULT false,
  block_reason VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast date lookups (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_daily_capacity_date ON daily_capacity(date);

-- Index for range queries on blocked dates
CREATE INDEX IF NOT EXISTS idx_daily_capacity_blocked ON daily_capacity(is_blocked) WHERE is_blocked = true;

-- Enable Row Level Security
ALTER TABLE daily_capacity ENABLE ROW LEVEL SECURITY;

-- Public can read capacity (needed for booking calendar availability check)
CREATE POLICY "Public can read daily capacity"
  ON daily_capacity
  FOR SELECT
  USING (true);

-- Admin staff full access (insert, update, delete)
CREATE POLICY "Admin full access to daily capacity"
  ON daily_capacity
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM user_profiles
      WHERE role IN ('admin', 'sales', 'production')
        AND is_active = true
    )
  );
