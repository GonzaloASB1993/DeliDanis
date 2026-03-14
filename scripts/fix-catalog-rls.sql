-- =============================================
-- FIX: Políticas RLS para TODAS las tablas de catálogo
-- Ejecutar después de fix-rls-simple.sql
-- =============================================

-- CAKE SUBCATEGORIES
ALTER TABLE cake_subcategories DISABLE ROW LEVEL SECURITY;
ALTER TABLE cake_subcategories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read cake_subcategories" ON cake_subcategories;
DROP POLICY IF EXISTS "Auth manage cake_subcategories" ON cake_subcategories;

CREATE POLICY "Public read cake_subcategories" ON cake_subcategories
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Auth manage cake_subcategories" ON cake_subcategories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- COCKTAIL SUBCATEGORIES
ALTER TABLE cocktail_subcategories DISABLE ROW LEVEL SECURITY;
ALTER TABLE cocktail_subcategories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read cocktail_subcategories" ON cocktail_subcategories;
DROP POLICY IF EXISTS "Auth manage cocktail_subcategories" ON cocktail_subcategories;

CREATE POLICY "Public read cocktail_subcategories" ON cocktail_subcategories
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Auth manage cocktail_subcategories" ON cocktail_subcategories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- PASTRY CATEGORIES
ALTER TABLE pastry_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE pastry_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read pastry_categories" ON pastry_categories;
DROP POLICY IF EXISTS "Auth manage pastry_categories" ON pastry_categories;

CREATE POLICY "Public read pastry_categories" ON pastry_categories
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Auth manage pastry_categories" ON pastry_categories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- PASTRY SUBCATEGORIES
ALTER TABLE pastry_subcategories DISABLE ROW LEVEL SECURITY;
ALTER TABLE pastry_subcategories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read pastry_subcategories" ON pastry_subcategories;
DROP POLICY IF EXISTS "Auth manage pastry_subcategories" ON pastry_subcategories;

CREATE POLICY "Public read pastry_subcategories" ON pastry_subcategories
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Auth manage pastry_subcategories" ON pastry_subcategories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- PASTRY PRODUCTS
ALTER TABLE pastry_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE pastry_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read pastry_products" ON pastry_products;
DROP POLICY IF EXISTS "Auth manage pastry_products" ON pastry_products;

CREATE POLICY "Public read pastry_products" ON pastry_products
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Auth manage pastry_products" ON pastry_products
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- COCKTAIL SETTINGS (si existe)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'cocktail_settings') THEN
    ALTER TABLE cocktail_settings DISABLE ROW LEVEL SECURITY;
    ALTER TABLE cocktail_settings ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Public read cocktail_settings" ON cocktail_settings;
    DROP POLICY IF EXISTS "Auth manage cocktail_settings" ON cocktail_settings;

    CREATE POLICY "Public read cocktail_settings" ON cocktail_settings
      FOR SELECT TO anon, authenticated USING (true);

    CREATE POLICY "Auth manage cocktail_settings" ON cocktail_settings
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- =============================================
-- VERIFICAR
-- =============================================
SELECT 'Políticas de catálogo actualizadas' as status;

SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'cake_categories', 'cake_subcategories', 'cake_products',
    'cocktail_categories', 'cocktail_subcategories', 'cocktail_products',
    'pastry_categories', 'pastry_subcategories', 'pastry_products',
    'product_images'
  )
ORDER BY tablename, policyname;
