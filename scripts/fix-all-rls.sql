-- =============================================
-- FIX COMPLETO: Políticas RLS para TODAS las tablas
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- =============================================
-- 1. USER_PROFILES
-- =============================================
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Usuarios autenticados pueden ver su propio perfil
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Usuarios autenticados pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Usuarios autenticados pueden insertar su propio perfil
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================
-- 2. CUSTOMERS - Acceso para usuarios autenticados
-- =============================================
DROP POLICY IF EXISTS "Customers are publicly accessible" ON customers;
DROP POLICY IF EXISTS "Authenticated users can access customers" ON customers;

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can access customers" ON customers
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- =============================================
-- 3. ORDERS - Acceso para usuarios autenticados
-- =============================================
DROP POLICY IF EXISTS "Orders are publicly accessible" ON orders;
DROP POLICY IF EXISTS "Authenticated users can access orders" ON orders;

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can access orders" ON orders
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- =============================================
-- 4. ORDER_ITEMS - Acceso para usuarios autenticados
-- =============================================
DROP POLICY IF EXISTS "Order items are publicly accessible" ON order_items;
DROP POLICY IF EXISTS "Authenticated users can access order_items" ON order_items;

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can access order_items" ON order_items
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- =============================================
-- 5. ORDER_HISTORY - Acceso para usuarios autenticados
-- =============================================
DROP POLICY IF EXISTS "Order history is publicly readable" ON order_history;
DROP POLICY IF EXISTS "Order history is publicly writable" ON order_history;
DROP POLICY IF EXISTS "Authenticated users can access order_history" ON order_history;

ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can access order_history" ON order_history
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- =============================================
-- 6. ORDER_PAYMENTS (si existe)
-- =============================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'order_payments') THEN
    DROP POLICY IF EXISTS "Order payments are publicly accessible" ON order_payments;
    DROP POLICY IF EXISTS "Authenticated users can access order_payments" ON order_payments;

    ALTER TABLE order_payments ENABLE ROW LEVEL SECURITY;

    EXECUTE 'CREATE POLICY "Authenticated users can access order_payments" ON order_payments
      FOR ALL USING (auth.role() = ''authenticated'')
      WITH CHECK (auth.role() = ''authenticated'')';
  END IF;
END $$;

-- =============================================
-- 7. PRODUCTOS - Acceso público para lectura, autenticado para escritura
-- =============================================

-- Cake products
DROP POLICY IF EXISTS "Anyone can view cake_products" ON cake_products;
DROP POLICY IF EXISTS "Authenticated users can manage cake_products" ON cake_products;

ALTER TABLE cake_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view cake_products" ON cake_products
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage cake_products" ON cake_products
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Cake categories
DROP POLICY IF EXISTS "Anyone can view cake_categories" ON cake_categories;
DROP POLICY IF EXISTS "Authenticated users can manage cake_categories" ON cake_categories;

ALTER TABLE cake_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view cake_categories" ON cake_categories
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage cake_categories" ON cake_categories
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Cocktail products
DROP POLICY IF EXISTS "Anyone can view cocktail_products" ON cocktail_products;
DROP POLICY IF EXISTS "Authenticated users can manage cocktail_products" ON cocktail_products;

ALTER TABLE cocktail_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view cocktail_products" ON cocktail_products
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage cocktail_products" ON cocktail_products
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Cocktail categories
DROP POLICY IF EXISTS "Anyone can view cocktail_categories" ON cocktail_categories;
DROP POLICY IF EXISTS "Authenticated users can manage cocktail_categories" ON cocktail_categories;

ALTER TABLE cocktail_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view cocktail_categories" ON cocktail_categories
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage cocktail_categories" ON cocktail_categories
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Pastry products (si existe)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'pastry_products') THEN
    DROP POLICY IF EXISTS "Anyone can view pastry_products" ON pastry_products;
    DROP POLICY IF EXISTS "Authenticated users can manage pastry_products" ON pastry_products;

    ALTER TABLE pastry_products ENABLE ROW LEVEL SECURITY;

    EXECUTE 'CREATE POLICY "Anyone can view pastry_products" ON pastry_products FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Authenticated users can manage pastry_products" ON pastry_products
      FOR ALL USING (auth.role() = ''authenticated'')
      WITH CHECK (auth.role() = ''authenticated'')';
  END IF;
END $$;

-- Pastry categories (si existe)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'pastry_categories') THEN
    DROP POLICY IF EXISTS "Anyone can view pastry_categories" ON pastry_categories;
    DROP POLICY IF EXISTS "Authenticated users can manage pastry_categories" ON pastry_categories;

    ALTER TABLE pastry_categories ENABLE ROW LEVEL SECURITY;

    EXECUTE 'CREATE POLICY "Anyone can view pastry_categories" ON pastry_categories FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Authenticated users can manage pastry_categories" ON pastry_categories
      FOR ALL USING (auth.role() = ''authenticated'')
      WITH CHECK (auth.role() = ''authenticated'')';
  END IF;
END $$;

-- Product images
DROP POLICY IF EXISTS "Anyone can view product_images" ON product_images;
DROP POLICY IF EXISTS "Authenticated users can manage product_images" ON product_images;

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product_images" ON product_images
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage product_images" ON product_images
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- =============================================
-- VERIFICAR QUE TODO ESTÉ CORRECTO
-- =============================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
