-- Migration: 017_testimonials_public_submit.sql
-- Adds public submission workflow (pending/approved/rejected) to testimonials

-- Add status field for approval workflow
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'approved';
-- Values: 'pending', 'approved', 'rejected'

-- Add customer email for notifications
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);

-- Add image URLs array for customer photos
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

-- Add admin response/rejection reason
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS admin_response TEXT;

-- Update existing rows to 'approved' status so they remain visible
UPDATE testimonials SET status = 'approved' WHERE status IS NULL;

-- Update the public read policy to only show approved testimonials
DROP POLICY IF EXISTS "Public can view active testimonials" ON testimonials;
CREATE POLICY "Public can view approved testimonials" ON testimonials
  FOR SELECT USING (is_active = true AND status = 'approved');

-- Allow anonymous inserts for public form submissions
-- Incoming rows must arrive as pending and inactive so they don't surface publicly
CREATE POLICY "Public can submit testimonials" ON testimonials
  FOR INSERT WITH CHECK (
    status = 'pending' AND is_active = false
  );

-- Index on status for admin filtering
CREATE INDEX IF NOT EXISTS idx_testimonials_status ON testimonials(status);
