-- =============================================
-- ESTANDARIZACIÓN DE CATEGORÍAS Y SUBCATEGORÍAS
-- Todas las categorías de productos tendrán la misma estructura
-- =============================================

-- =============================================
-- PARTE 1: CATEGORÍAS Y SUBCATEGORÍAS DE PASTELERÍA
-- =============================================

-- Tabla de categorías de pastelería
CREATE TABLE IF NOT EXISTS pastry_categories (
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

-- Tabla de subcategorías de pastelería
CREATE TABLE IF NOT EXISTS pastry_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES pastry_categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, slug)
);

-- Índices para pastelería
CREATE INDEX IF NOT EXISTS idx_pastry_categories_active ON pastry_categories(is_active, order_index);
CREATE INDEX IF NOT EXISTS idx_pastry_subcategories_category ON pastry_subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_pastry_subcategories_active ON pastry_subcategories(is_active);

-- RLS para pastelería
ALTER TABLE pastry_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE pastry_subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active pastry categories"
  ON pastry_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can read active pastry subcategories"
  ON pastry_subcategories FOR SELECT
  USING (is_active = true);

-- Triggers para pastelería
CREATE TRIGGER pastry_categories_updated_at
  BEFORE UPDATE ON pastry_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_customers_updated_at();

CREATE TRIGGER pastry_subcategories_updated_at
  BEFORE UPDATE ON pastry_subcategories
  FOR EACH ROW
  EXECUTE FUNCTION update_customers_updated_at();

-- =============================================
-- PARTE 2: SUBCATEGORÍAS DE TORTAS (para consistencia)
-- =============================================

-- Tabla de subcategorías de tortas
CREATE TABLE IF NOT EXISTS cake_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES cake_categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, slug)
);

-- Índices para subcategorías de tortas
CREATE INDEX IF NOT EXISTS idx_cake_subcategories_category ON cake_subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_cake_subcategories_active ON cake_subcategories(is_active);

-- RLS para subcategorías de tortas
ALTER TABLE cake_subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active cake subcategories"
  ON cake_subcategories FOR SELECT
  USING (is_active = true);

-- Trigger para subcategorías de tortas
CREATE TRIGGER cake_subcategories_updated_at
  BEFORE UPDATE ON cake_subcategories
  FOR EACH ROW
  EXECUTE FUNCTION update_customers_updated_at();

-- =============================================
-- PARTE 3: ACTUALIZAR TABLA DE PRODUCTOS DE PASTELERÍA
-- =============================================

-- Agregar columnas de categoría y subcategoría a pastry_products
ALTER TABLE pastry_products
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES pastry_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES pastry_subcategories(id) ON DELETE SET NULL;

-- Agregar subcategory_id a cake_products para consistencia
ALTER TABLE cake_products
  ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES cake_subcategories(id) ON DELETE SET NULL;

-- Índices adicionales
CREATE INDEX IF NOT EXISTS idx_pastry_products_category ON pastry_products(category_id);
CREATE INDEX IF NOT EXISTS idx_pastry_products_subcategory ON pastry_products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_cake_products_subcategory ON cake_products(subcategory_id);

-- =============================================
-- PARTE 4: DATOS DE EJEMPLO
-- =============================================

-- Categorías de pastelería
INSERT INTO pastry_categories (name, slug, description, order_index) VALUES
  ('Pies', 'pies', 'Deliciosos pies artesanales', 1),
  ('Tartas', 'tartas', 'Tartas de frutas y sabores variados', 2),
  ('Galletas', 'galletas', 'Galletas decoradas y tradicionales', 3),
  ('Bocaditos', 'bocaditos', 'Pequeños bocados dulces perfectos para eventos', 4)
ON CONFLICT (slug) DO NOTHING;

-- Subcategorías de pastelería (ejemplos)
WITH cat_pies AS (SELECT id FROM pastry_categories WHERE slug = 'pies'),
     cat_tartas AS (SELECT id FROM pastry_categories WHERE slug = 'tartas'),
     cat_galletas AS (SELECT id FROM pastry_categories WHERE slug = 'galletas')
INSERT INTO pastry_subcategories (category_id, name, slug, order_index) VALUES
  ((SELECT id FROM cat_pies), 'Pies de Frutas', 'pies-frutas', 1),
  ((SELECT id FROM cat_pies), 'Pies de Crema', 'pies-crema', 2),
  ((SELECT id FROM cat_tartas), 'Tartas de Temporada', 'tartas-temporada', 1),
  ((SELECT id FROM cat_tartas), 'Tartas Clásicas', 'tartas-clasicas', 2),
  ((SELECT id FROM cat_galletas), 'Galletas Decoradas', 'galletas-decoradas', 1),
  ((SELECT id FROM cat_galletas), 'Galletas Tradicionales', 'galletas-tradicionales', 2);

-- Subcategorías de tortas (ejemplos opcionales)
WITH cat_clasicas AS (SELECT id FROM cake_categories WHERE slug = 'clasicas'),
     cat_premium AS (SELECT id FROM cake_categories WHERE slug = 'premium')
INSERT INTO cake_subcategories (category_id, name, slug, order_index) VALUES
  ((SELECT id FROM cat_clasicas), 'Chocolate', 'chocolate', 1),
  ((SELECT id FROM cat_clasicas), 'Frutas', 'frutas', 2),
  ((SELECT id FROM cat_clasicas), 'Cremas', 'cremas', 3),
  ((SELECT id FROM cat_premium), 'Especiales', 'especiales', 1),
  ((SELECT id FROM cat_premium), 'Gourmet', 'gourmet', 2);

-- Actualizar productos de pastelería existentes con categorías
UPDATE pastry_products
SET category_id = (SELECT id FROM pastry_categories WHERE slug = 'pies' LIMIT 1)
WHERE slug = 'pie-limon';

UPDATE pastry_products
SET category_id = (SELECT id FROM pastry_categories WHERE slug = 'tartas' LIMIT 1)
WHERE slug = 'tartas';

UPDATE pastry_products
SET category_id = (SELECT id FROM pastry_categories WHERE slug = 'galletas' LIMIT 1)
WHERE slug = 'galletas';

UPDATE pastry_products
SET category_id = (SELECT id FROM pastry_categories WHERE slug = 'bocaditos' LIMIT 1)
WHERE slug = 'rollitos-canela';

-- =============================================
-- COMENTARIOS
-- =============================================

COMMENT ON TABLE pastry_categories IS 'Categorías de productos de pastelería';
COMMENT ON TABLE pastry_subcategories IS 'Subcategorías de productos de pastelería';
COMMENT ON TABLE cake_subcategories IS 'Subcategorías de productos de tortas';
COMMENT ON COLUMN pastry_products.category_id IS 'Categoría del producto de pastelería';
COMMENT ON COLUMN pastry_products.subcategory_id IS 'Subcategoría del producto de pastelería (opcional)';
COMMENT ON COLUMN cake_products.subcategory_id IS 'Subcategoría del producto de torta (opcional)';
