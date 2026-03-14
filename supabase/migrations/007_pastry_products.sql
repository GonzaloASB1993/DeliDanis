-- =============================================
-- Migración para productos de PASTELERÍA
-- Sistema administrable desde panel admin
-- =============================================

-- Productos de pastelería artesanal
CREATE TABLE IF NOT EXISTS pastry_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) NOT NULL, -- 'unidad', 'docena', 'paquete de 6', etc.
  min_order_quantity INTEGER DEFAULT 1,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pastry_products_active ON pastry_products(is_active);
CREATE INDEX IF NOT EXISTS idx_pastry_products_featured ON pastry_products(is_featured);

-- Row Level Security
ALTER TABLE pastry_products ENABLE ROW LEVEL SECURITY;

-- Política pública de lectura
CREATE POLICY "Public can read active pastry products"
  ON pastry_products FOR SELECT
  USING (is_active = true);

-- Trigger para updated_at
CREATE TRIGGER pastry_products_updated_at
  BEFORE UPDATE ON pastry_products
  FOR EACH ROW
  EXECUTE FUNCTION update_customers_updated_at();

-- Insertar productos de ejemplo
INSERT INTO pastry_products (name, slug, description, price, unit, min_order_quantity, is_featured, order_index) VALUES
  ('Pie de Limón', 'pie-limon',
   'Pie completo de limón con merengue italiano. Base crujiente y relleno cremoso.',
   35000, 'unidad', 1, true, 1),

  ('Tartas Artesanales', 'tartas',
   'Tartas de frutas frescas. Sabores variados según temporada.',
   40000, 'unidad', 1, true, 2),

  ('Galletas Artesanales', 'galletas',
   'Galletas de mantequilla decoradas. Sabores: vainilla, chocolate, naranja.',
   15000, 'docena', 1, false, 3),

  ('Rollitos de Canela', 'rollitos-canela',
   'Rollitos de canela recién horneados con glaseado de queso crema.',
   25000, 'paquete de 6', 1, false, 4);

-- Comentarios
COMMENT ON TABLE pastry_products IS 'Productos de pastelería artesanal administrables desde el panel';
