-- =============================================
-- MIGRACIONES DE PRODUCTOS (Tortas, Pastelería e Imágenes Genéricas)
-- VERSIÓN 2: Con tabla genérica de imágenes
-- Ejecutar este archivo completo en Supabase SQL Editor
-- =============================================

-- =============================================
-- PARTE 1: PRODUCTOS DE TORTAS
-- =============================================

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

CREATE TABLE IF NOT EXISTS cake_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES cake_categories(id) ON DELETE SET NULL,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  description TEXT,
  short_description VARCHAR(300),
  base_price DECIMAL(10,2) NOT NULL,
  min_portions INTEGER DEFAULT 15,
  max_portions INTEGER DEFAULT 100,
  price_per_portion DECIMAL(10,2) NOT NULL,
  preparation_days INTEGER DEFAULT 3,
  is_customizable BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cake_categories_active ON cake_categories(is_active, order_index);
CREATE INDEX IF NOT EXISTS idx_cake_products_category ON cake_products(category_id);
CREATE INDEX IF NOT EXISTS idx_cake_products_active ON cake_products(is_active);
CREATE INDEX IF NOT EXISTS idx_cake_products_featured ON cake_products(is_featured);

ALTER TABLE cake_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cake_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active cake categories"
  ON cake_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can read active cake products"
  ON cake_products FOR SELECT
  USING (is_active = true);

CREATE TRIGGER cake_categories_updated_at
  BEFORE UPDATE ON cake_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_customers_updated_at();

CREATE TRIGGER cake_products_updated_at
  BEFORE UPDATE ON cake_products
  FOR EACH ROW
  EXECUTE FUNCTION update_customers_updated_at();

INSERT INTO cake_categories (name, slug, description, order_index) VALUES
  ('Clásicas', 'clasicas', 'Tortas tradicionales y favoritas de siempre', 1),
  ('Premium', 'premium', 'Tortas especiales con ingredientes de alta calidad', 2),
  ('Temáticas', 'tematicas', 'Diseños personalizados para cada ocasión', 3);

WITH categoria_clasicas AS (SELECT id FROM cake_categories WHERE slug = 'clasicas'),
     categoria_premium AS (SELECT id FROM cake_categories WHERE slug = 'premium')
INSERT INTO cake_products (
  category_id, name, slug, description, short_description,
  base_price, min_portions, max_portions, price_per_portion,
  preparation_days, is_customizable, is_featured, metadata
) VALUES
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

-- =============================================
-- PARTE 2: PRODUCTOS DE PASTELERÍA
-- =============================================

CREATE TABLE IF NOT EXISTS pastry_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  min_order_quantity INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pastry_products_active ON pastry_products(is_active);
CREATE INDEX IF NOT EXISTS idx_pastry_products_featured ON pastry_products(is_featured);

ALTER TABLE pastry_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active pastry products"
  ON pastry_products FOR SELECT
  USING (is_active = true);

CREATE TRIGGER pastry_products_updated_at
  BEFORE UPDATE ON pastry_products
  FOR EACH ROW
  EXECUTE FUNCTION update_customers_updated_at();

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

-- =============================================
-- PARTE 3: TABLA GENÉRICA DE IMÁGENES
-- =============================================

-- Eliminar cake_images si existe
DROP TABLE IF EXISTS cake_images CASCADE;

-- Crear tabla genérica para TODOS los productos
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type VARCHAR(20) NOT NULL, -- 'cake', 'cocktail', 'pastry'
  product_id UUID NOT NULL,
  url TEXT NOT NULL,
  alt_text VARCHAR(200),
  is_primary BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_type ON product_images(product_type);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON product_images(is_primary);
CREATE INDEX IF NOT EXISTS idx_product_images_composite ON product_images(product_type, product_id);

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read product images"
  ON product_images FOR SELECT
  USING (true);

-- Comentarios
COMMENT ON TABLE cake_categories IS 'Categorías de tortas administrables desde el panel';
COMMENT ON TABLE cake_products IS 'Productos de tortas con precios por porción';
COMMENT ON TABLE pastry_products IS 'Productos de pastelería artesanal administrables desde el panel';
COMMENT ON TABLE product_images IS 'Imágenes para todos los tipos de productos (tortas, coctelería, pastelería)';
COMMENT ON COLUMN product_images.product_type IS 'Tipo de producto: cake, cocktail, pastry';
