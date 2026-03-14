-- Migración para productos de coctelería
-- Este schema permite administrar todos los productos desde el panel admin

-- Categorías principales de coctelería (Dulce/Salado)
CREATE TABLE cocktail_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  icon TEXT, -- Emoji o URL de icono
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subcategorías de productos (Mini Pies, Tapaditos, etc.)
CREATE TABLE cocktail_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES cocktail_categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, slug)
);

-- Productos de coctelería
CREATE TABLE cocktail_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcategory_id UUID REFERENCES cocktail_subcategories(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  min_order_quantity INTEGER DEFAULT 15, -- Mínimo por producto
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejor performance
CREATE INDEX idx_cocktail_categories_active ON cocktail_categories(is_active, order_index);
CREATE INDEX idx_cocktail_subcategories_category ON cocktail_subcategories(category_id);
CREATE INDEX idx_cocktail_subcategories_active ON cocktail_subcategories(is_active, order_index);
CREATE INDEX idx_cocktail_products_subcategory ON cocktail_products(subcategory_id);
CREATE INDEX idx_cocktail_products_active ON cocktail_products(is_active, order_index);

-- Configuración global de coctelería
CREATE TABLE cocktail_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  min_order_amount DECIMAL(10,2) DEFAULT 50000, -- Mínimo total del pedido
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar configuración por defecto
INSERT INTO cocktail_settings (min_order_amount) VALUES (50000);

-- Insertar categorías principales
INSERT INTO cocktail_categories (name, slug, icon, description, order_index) VALUES
  ('Dulce', 'dulce', '🧁', 'Dulces y postres para coctelería', 1),
  ('Salado', 'salado', '🥪', 'Productos salados para coctelería', 2);

-- Insertar subcategorías para DULCE
WITH dulce_cat AS (SELECT id FROM cocktail_categories WHERE slug = 'dulce')
INSERT INTO cocktail_subcategories (category_id, name, slug, description, order_index) VALUES
  ((SELECT id FROM dulce_cat), 'Mini Pies', 'mini-pies', 'Pies individuales con diferentes sabores', 1),
  ((SELECT id FROM dulce_cat), 'Mini Cheesecakes', 'mini-cheesecakes', 'Cheesecakes individuales cremosos', 2),
  ((SELECT id FROM dulce_cat), 'Bocados Dulces', 'bocados-dulces', 'Variedad de bocados dulces', 3);

-- Insertar subcategorías para SALADO
WITH salado_cat AS (SELECT id FROM cocktail_categories WHERE slug = 'salado')
INSERT INTO cocktail_subcategories (category_id, name, slug, description, order_index) VALUES
  ((SELECT id FROM salado_cat), 'Tapaditos', 'tapaditos', 'Tapaditos tradicionales con diferentes rellenos', 1),
  ((SELECT id FROM salado_cat), 'Mini Hamburguesas', 'mini-hamburguesas', 'Hamburguesas en versión mini', 2),
  ((SELECT id FROM salado_cat), 'Mini Croissants', 'mini-croissants', 'Croissants salados rellenos', 3),
  ((SELECT id FROM salado_cat), 'Empanadas', 'empanadas', 'Empanadas al horno', 4),
  ((SELECT id FROM salado_cat), 'Otros', 'otros', 'Canapés, tequeños y más', 5);

-- Insertar productos DULCES - Mini Pies
WITH mini_pies AS (SELECT id FROM cocktail_subcategories WHERE slug = 'mini-pies')
INSERT INTO cocktail_products (subcategory_id, name, slug, description, price, order_index) VALUES
  ((SELECT id FROM mini_pies), 'Mini Pie de Limón', 'mini-pie-limon', 'Base crujiente con relleno cremoso de limón', 3500, 1),
  ((SELECT id FROM mini_pies), 'Mini Pie de Manzana', 'mini-pie-manzana', 'Relleno de manzana canela con masa quebrada', 3500, 2),
  ((SELECT id FROM mini_pies), 'Mini Pie de Frutillas', 'mini-pie-frutillas', 'Crema pastelera con frutillas frescas', 3800, 3);

-- Insertar productos DULCES - Mini Cheesecakes
WITH mini_cheesecakes AS (SELECT id FROM cocktail_subcategories WHERE slug = 'mini-cheesecakes')
INSERT INTO cocktail_products (subcategory_id, name, slug, description, price, order_index) VALUES
  ((SELECT id FROM mini_cheesecakes), 'Mini Cheesecake Frutos Rojos', 'mini-cheesecake-frutos-rojos', 'Cremoso cheesecake con salsa de frutos rojos', 4000, 1),
  ((SELECT id FROM mini_cheesecakes), 'Mini Cheesecake Oreo', 'mini-cheesecake-oreo', 'Base de oreo con queso crema', 4200, 2),
  ((SELECT id FROM mini_cheesecakes), 'Mini Cheesecake Maracuyá', 'mini-cheesecake-maracuya', 'Toque tropical con maracuyá fresco', 4000, 3);

-- Insertar productos DULCES - Bocados Dulces
WITH bocados AS (SELECT id FROM cocktail_subcategories WHERE slug = 'bocados-dulces')
INSERT INTO cocktail_products (subcategory_id, name, slug, description, price, order_index) VALUES
  ((SELECT id FROM bocados), 'Profiteroles', 'profiteroles', 'Rellenos de crema pastelera, bañados en chocolate', 3000, 1),
  ((SELECT id FROM bocados), 'Macarons Variados', 'macarons-variados', 'Sabores: chocolate, vainilla, frambuesa', 4500, 2),
  ((SELECT id FROM bocados), 'Trufas de Chocolate', 'trufas-chocolate', 'Chocolate belga con coberturas variadas', 3500, 3),
  ((SELECT id FROM bocados), 'Alfajores', 'alfajores', 'Rellenos de arequipe, cubiertos de chocolate', 3000, 4);

-- Insertar productos SALADOS - Tapaditos
WITH tapaditos AS (SELECT id FROM cocktail_subcategories WHERE slug = 'tapaditos')
INSERT INTO cocktail_products (subcategory_id, name, slug, description, price, order_index) VALUES
  ((SELECT id FROM tapaditos), 'Tapaditos Jamón y Queso', 'tapaditos-jamon-queso', 'Clásicos selladitos con jamón y queso', 2500, 1),
  ((SELECT id FROM tapaditos), 'Tapaditos Pollo', 'tapaditos-pollo', 'Relleno de pollo con mayonesa casera', 2500, 2),
  ((SELECT id FROM tapaditos), 'Tapaditos Atún', 'tapaditos-atun', 'Atún con verduras y mayonesa', 2800, 3),
  ((SELECT id FROM tapaditos), 'Tapaditos Vegetales', 'tapaditos-vegetales', 'Mezcla de vegetales frescos', 2500, 4);

-- Insertar productos SALADOS - Mini Hamburguesas
WITH burgers AS (SELECT id FROM cocktail_subcategories WHERE slug = 'mini-hamburguesas')
INSERT INTO cocktail_products (subcategory_id, name, slug, description, price, order_index) VALUES
  ((SELECT id FROM burgers), 'Mini Hamburguesa Clásica', 'mini-hamburguesa-clasica', 'Carne, queso, lechuga, tomate', 3500, 1),
  ((SELECT id FROM burgers), 'Mini Hamburguesa BBQ', 'mini-hamburguesa-bbq', 'Con salsa BBQ y cebolla caramelizada', 3800, 2),
  ((SELECT id FROM burgers), 'Mini Hamburguesa Pollo', 'mini-hamburguesa-pollo', 'Pollo crispy con salsa especial', 3500, 3);

-- Insertar productos SALADOS - Mini Croissants
WITH croissants AS (SELECT id FROM cocktail_subcategories WHERE slug = 'mini-croissants')
INSERT INTO cocktail_products (subcategory_id, name, slug, description, price, order_index) VALUES
  ((SELECT id FROM croissants), 'Mini Croissant Jamón y Queso', 'mini-croissant-jamon-queso', 'Crujiente croissant con jamón y queso', 3500, 1),
  ((SELECT id FROM croissants), 'Mini Croissant Pollo Champiñones', 'mini-croissant-pollo-champinones', 'Pollo con champiñones en salsa cremosa', 3800, 2);

-- Insertar productos SALADOS - Empanadas
WITH empanadas AS (SELECT id FROM cocktail_subcategories WHERE slug = 'empanadas')
INSERT INTO cocktail_products (subcategory_id, name, slug, description, price, order_index) VALUES
  ((SELECT id FROM empanadas), 'Empanada de Pino', 'empanada-pino', 'Relleno tradicional de carne', 2800, 1),
  ((SELECT id FROM empanadas), 'Empanada de Queso', 'empanada-queso', 'Queso derretido', 2500, 2),
  ((SELECT id FROM empanadas), 'Empanada Napolitana', 'empanada-napolitana', 'Jamón, queso y tomate', 2800, 3);

-- Insertar productos SALADOS - Otros
WITH otros AS (SELECT id FROM cocktail_subcategories WHERE slug = 'otros')
INSERT INTO cocktail_products (subcategory_id, name, slug, description, price, order_index) VALUES
  ((SELECT id FROM otros), 'Tequeños', 'tequenos', 'Crujientes tequeños rellenos de queso', 2500, 1),
  ((SELECT id FROM otros), 'Canapés Variados', 'canapes-variados', 'Salmón, jamón serrano, quesos finos', 4000, 2),
  ((SELECT id FROM otros), 'Quiches Individuales', 'quiches-individuales', 'Espinaca, tocineta o champiñones', 3500, 3);

-- Row Level Security (RLS)
ALTER TABLE cocktail_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cocktail_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cocktail_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cocktail_settings ENABLE ROW LEVEL SECURITY;

-- Políticas: todos pueden leer productos activos
CREATE POLICY "Public can read active cocktail categories"
  ON cocktail_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can read active cocktail subcategories"
  ON cocktail_subcategories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can read active cocktail products"
  ON cocktail_products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can read cocktail settings"
  ON cocktail_settings FOR SELECT
  USING (true);

-- Políticas de admin (para implementar cuando exista auth)
-- CREATE POLICY "Admin full access to cocktail categories"
--   ON cocktail_categories FOR ALL
--   USING (auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin'));

-- CREATE POLICY "Admin full access to cocktail subcategories"
--   ON cocktail_subcategories FOR ALL
--   USING (auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin'));

-- CREATE POLICY "Admin full access to cocktail products"
--   ON cocktail_products FOR ALL
--   USING (auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin'));

-- CREATE POLICY "Admin full access to cocktail settings"
--   ON cocktail_settings FOR ALL
--   USING (auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin'));

COMMENT ON TABLE cocktail_categories IS 'Categorías principales de coctelería (Dulce/Salado)';
COMMENT ON TABLE cocktail_subcategories IS 'Subcategorías de productos (Mini Pies, Tapaditos, etc.)';
COMMENT ON TABLE cocktail_products IS 'Productos individuales de coctelería';
COMMENT ON TABLE cocktail_settings IS 'Configuración global de coctelería (pedido mínimo, etc.)';
