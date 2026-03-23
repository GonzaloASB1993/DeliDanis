-- Create settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure RLS is enabled on settings table
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (idempotent)
DROP POLICY IF EXISTS "Admin can read settings" ON settings;
DROP POLICY IF EXISTS "Admin can write settings" ON settings;
DROP POLICY IF EXISTS "Public can read settings" ON settings;
DROP POLICY IF EXISTS "Authenticated can read settings" ON settings;
DROP POLICY IF EXISTS "Authenticated can upsert settings" ON settings;
DROP POLICY IF EXISTS "Authenticated can update settings" ON settings;
DROP POLICY IF EXISTS "Public can read public settings" ON settings;

-- Authenticated admin users can read all settings
CREATE POLICY "Authenticated can read settings"
  ON settings FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated admin users can insert settings
CREATE POLICY "Authenticated can upsert settings"
  ON settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated admin users can update settings
CREATE POLICY "Authenticated can update settings"
  ON settings FOR UPDATE
  TO authenticated
  USING (true);

-- Public (anon) can read non-sensitive settings keys
CREATE POLICY "Public can read public settings"
  ON settings FOR SELECT
  TO anon
  USING (key IN ('payments', 'business'));
