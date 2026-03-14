-- Gallery images table for administrable public gallery
CREATE TABLE gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255),
  description TEXT,
  url TEXT NOT NULL,
  alt_text VARCHAR(200),
  category VARCHAR(50) NOT NULL DEFAULT 'tortas',
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gallery_images_category ON gallery_images(category);
CREATE INDEX idx_gallery_images_active ON gallery_images(is_active);

-- RLS
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

-- Public read for active images
CREATE POLICY "Public read active gallery" ON gallery_images
  FOR SELECT USING (is_active = true);

-- Admin full access
CREATE POLICY "Admin full access gallery" ON gallery_images
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'manager'))
  );
