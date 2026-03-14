-- =============================================
-- Migración para productos de TORTAS
-- Sistema administrable desde panel admin
-- =============================================

-- Categorías de tortas
CREATE TABLE IF NOT EXISTS cake_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Productos de tortas
CREATE TABLE IF NOT EXISTS cake_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES cake_categories(id) ON DELETE SET NULL,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  description TEXT,
  short_description VARCHAR(300),

  -- Precios
  base_price DECIMAL(10,2) NOT NULL,
  min_portions INTEGER DEFAULT 15,
  max_portions INTEGER DEFAULT 100,
  price_per_portion DECIMAL(10,2) NOT NULL,

  -- Configuración
  preparation_days INTEGER DEFAULT 3,
  is_customizable BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,

  -- Metadata
  metadata JSONB DEFAULT '{}', -- event_types, tags, etc.

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Imágenes de tortas
CREATE TABLE IF NOT EXISTS cake_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES cake_products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text VARCHAR(200),
  is_primary BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cake_categories_active ON cake_categories(is_active, order_index);
CREATE INDEX IF NOT EXISTS idx_cake_products_category ON cake_products(category_id);
CREATE INDEX IF NOT EXISTS idx_cake_products_active ON cake_products(is_active);
CREATE INDEX IF NOT EXISTS idx_cake_products_featured ON cake_products(is_featured);
CREATE INDEX IF NOT EXISTS idx_cake_images_product ON cake_images(product_id);

-- Row Level Security
ALTER TABLE cake_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cake_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cake_images ENABLE ROW LEVEL SECURITY;

-- Políticas públicas de lectura
CREATE POLICY "Public can read active cake categories"
  ON cake_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can read active cake products"
  ON cake_products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can read cake images"
  ON cake_images FOR SELECT
  USING (true);

-- Triggers para updated_at
CREATE TRIGGER cake_categories_updated_at
  BEFORE UPDATE ON cake_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_customers_updated_at(); -- Reutilizamos la función existente

CREATE TRIGGER cake_products_updated_at
  BEFORE UPDATE ON cake_products
  FOR EACH ROW
  EXECUTE FUNCTION update_customers_updated_at();

-- Insertar categorías de ejemplo
INSERT INTO cake_categories (name, slug, description, order_index) VALUES
  ('Clásicas', 'clasicas', 'Tortas tradicionales y favoritas de siempre', 1),
  ('Premium', 'premium', 'Tortas especiales con ingredientes de alta calidad', 2),
  ('Temáticas', 'tematicas', 'Diseños personalizados para cada ocasión', 3);

-- Insertar productos de ejemplo (basados en tu mock data)
WITH categoria_clasicas AS (SELECT id FROM cake_categories WHERE slug = 'clasicas'),
     categoria_premium AS (SELECT id FROM cake_categories WHERE slug = 'premium')
INSERT INTO cake_products (
  category_id, name, slug, description, short_description,
  base_price, min_portions, max_portions, price_per_portion,
  preparation_days, is_customizable, is_featured, metadata
) VALUES
  -- Clásicas
  ((SELECT id FROM categoria_clasicas), 'Torta de Chocolate', 'torta-chocolate',
   'Bizcocho de chocolate belga con ganache de chocolate semi-amargo',
   'Chocolate belga premium con ganache',
   180000, 15, 80, 8000, 3, true, true,
   '{"event_types": ["bodas", "cumpleanos", "dias-especiales", "corporativos", "quinceaneras"]}'::jsonb),

  ((SELECT id FROM categoria_clasicas), 'Torta Hojarasca', 'torta-hojarasca',
   'Capas de hojaldre crujiente con arequipe casero y merengue italiano',
   'Hojaldre y arequipe artesanal',
   160000, 15, 70, 7500, 3, true, true,
   '{"event_types": ["bodas", "cumpleanos", "dias-especiales", "baby-shower"]}'::jsonb),

  ((SELECT id FROM categoria_clasicas), 'Torta Amor (Fresas con Crema)', 'torta-amor',
   'Clásica torta de fresas frescas con crema chantilly',
   'Fresas frescas con crema chantilly',
   150000, 15, 70, 7000, 2, true, true,
   '{"event_types": ["cumpleanos", "baby-shower", "dias-especiales", "quinceaneras"]}'::jsonb),

  ((SELECT id FROM categoria_clasicas), 'Torta Tres Leches', 'torta-tres-leches',
   'Bizcocho empapado en mezcla de tres leches con crema batida',
   'Suave y húmeda, un clásico irresistible',
   140000, 15, 80, 6500, 2, true, true,
   '{"event_types": ["cumpleanos", "bautizos", "primera-comunion", "baby-shower", "dias-especiales"]}'::jsonb),

  -- Premium
  ((SELECT id FROM categoria_premium), 'Torta Red Velvet', 'torta-red-velvet',
   'Aterciopelado bizcocho rojo con frosting de queso crema',
   'Elegante y deliciosa con frosting de queso',
   190000, 15, 80, 8500, 3, true, true,
   '{"event_types": ["bodas", "cumpleanos", "quinceaneras", "aniversarios", "dias-especiales"]}'::jsonb),

  ((SELECT id FROM categoria_premium), 'Torta Zanahoria', 'torta-zanahoria',
   'Bizcocho especiado de zanahoria con frosting de queso crema y nueces',
   'Especiada con nueces y frosting cremoso',
   170000, 15, 70, 7800, 3, true, false,
   '{"event_types": ["cumpleanos", "dias-especiales", "aniversarios"]}'::jsonb),

  ((SELECT id FROM categoria_clasicas), 'Torta de Vainilla', 'torta-vainilla',
   'Suave bizcocho de vainilla con buttercream de vainilla',
   'Clásica y versátil para cualquier ocasión',
   130000, 15, 80, 6000, 2, true, false,
   '{"event_types": ["cumpleanos", "bautizos", "primera-comunion", "baby-shower"]}'::jsonb);

-- Comentarios
COMMENT ON TABLE cake_categories IS 'Categorías de tortas administrables desde el panel';
COMMENT ON TABLE cake_products IS 'Productos de tortas con precios por porción';
COMMENT ON TABLE cake_images IS 'Galería de imágenes para cada torta';
