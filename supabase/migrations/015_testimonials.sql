-- Migration: 015_testimonials.sql
-- Creates the testimonials table with RLS policies

CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(200) NOT NULL,
  customer_initials VARCHAR(5),
  event_type VARCHAR(100),
  comment TEXT NOT NULL,
  rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_testimonials_active ON testimonials(is_active);
CREATE INDEX idx_testimonials_featured ON testimonials(is_featured);
CREATE INDEX idx_testimonials_order ON testimonials(order_index);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_testimonials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER testimonials_updated_at
  BEFORE UPDATE ON testimonials
  FOR EACH ROW EXECUTE FUNCTION update_testimonials_updated_at();

-- RLS
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Public can read active testimonials (anon key access)
CREATE POLICY "Public can view active testimonials" ON testimonials
  FOR SELECT USING (is_active = true);

-- Admin full access
CREATE POLICY "Admin full access testimonials" ON testimonials
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE role IN ('admin', 'manager')
    )
  );

-- Seed data: sample testimonials so the public site shows content immediately
INSERT INTO testimonials (customer_name, customer_initials, event_type, comment, rating, is_active, is_featured, order_index) VALUES
  ('Maria Gonzalez',  'MG', 'Matrimonio',        'La torta de nuestra boda fue espectacular. Todos los invitados quedaron encantados con el sabor y la presentacion. Supero nuestras expectativas!', 5, true, true,  0),
  ('Carlos Ramirez',  'CR', 'Corporativo',        'Excelente servicio y atencion al detalle. La torta con el logo de nuestra empresa quedo perfecta. Definitivamente volveremos a ordenar.',            5, true, false, 1),
  ('Ana Martinez',    'AM', 'Quinceañero',        'Mi hija quedo feliz con su torta de quinceañera. El diseno personalizado fue exactamente lo que imaginamos. Totalmente recomendados.',                5, true, false, 2),
  ('Luis Hernandez',  'LH', 'Cumpleaños',         'La atencion personalizada y el resultado final fueron increibles. La torta no solo se veia hermosa, sino que el sabor era excepcional.',              5, true, false, 3),
  ('Patricia Silva',  'PS', 'Baby Shower',        'Quede maravillada con el nivel de detalle y creatividad. La torta fue el centro de atencion de la fiesta. Muchas gracias!',                           5, true, false, 4);
