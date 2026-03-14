-- =============================================
-- FIX SIMPLE: Desactivar RLS en tablas internas
-- Las tablas de admin no necesitan RLS porque
-- solo usuarios autenticados acceden al panel
-- =============================================

-- USER_PROFILES: Mantener RLS pero simplificar
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON user_profiles;

CREATE POLICY "Enable all for authenticated users" ON user_profiles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ORDERS: Acceso total para autenticados
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Orders are publicly accessible" ON orders;
DROP POLICY IF EXISTS "Authenticated users can access orders" ON orders;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON orders;

CREATE POLICY "Enable all for authenticated users" ON orders
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- También permitir acceso público para crear pedidos desde la landing
CREATE POLICY "Public can insert orders" ON orders
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- CUSTOMERS
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers are publicly accessible" ON customers;
DROP POLICY IF EXISTS "Authenticated users can access customers" ON customers;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON customers;

CREATE POLICY "Enable all for authenticated users" ON customers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can insert customers" ON customers
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- ORDER_ITEMS
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Order items are publicly accessible" ON order_items;
DROP POLICY IF EXISTS "Authenticated users can access order_items" ON order_items;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON order_items;

CREATE POLICY "Enable all for authenticated users" ON order_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can insert order_items" ON order_items
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- ORDER_HISTORY
ALTER TABLE order_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Order history is publicly readable" ON order_history;
DROP POLICY IF EXISTS "Order history is publicly writable" ON order_history;
DROP POLICY IF EXISTS "Authenticated users can access order_history" ON order_history;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON order_history;

CREATE POLICY "Enable all for authenticated users" ON order_history
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ORDER_PAYMENTS (si existe)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'order_payments') THEN
    ALTER TABLE order_payments DISABLE ROW LEVEL SECURITY;
    ALTER TABLE order_payments ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Order payments are publicly accessible" ON order_payments;
    DROP POLICY IF EXISTS "Authenticated users can access order_payments" ON order_payments;
    DROP POLICY IF EXISTS "Enable all for authenticated users" ON order_payments;

    CREATE POLICY "Enable all for authenticated users" ON order_payments
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- PRODUCTOS: Lectura pública, escritura autenticada

-- cake_products
ALTER TABLE cake_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE cake_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view cake_products" ON cake_products;
DROP POLICY IF EXISTS "Authenticated users can manage cake_products" ON cake_products;
DROP POLICY IF EXISTS "Public read cake_products" ON cake_products;
DROP POLICY IF EXISTS "Auth manage cake_products" ON cake_products;

CREATE POLICY "Public read cake_products" ON cake_products
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Auth manage cake_products" ON cake_products
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- cake_categories
ALTER TABLE cake_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE cake_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view cake_categories" ON cake_categories;
DROP POLICY IF EXISTS "Authenticated users can manage cake_categories" ON cake_categories;
DROP POLICY IF EXISTS "Public read cake_categories" ON cake_categories;
DROP POLICY IF EXISTS "Auth manage cake_categories" ON cake_categories;

CREATE POLICY "Public read cake_categories" ON cake_categories
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Auth manage cake_categories" ON cake_categories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- cocktail_products
ALTER TABLE cocktail_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE cocktail_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view cocktail_products" ON cocktail_products;
DROP POLICY IF EXISTS "Authenticated users can manage cocktail_products" ON cocktail_products;
DROP POLICY IF EXISTS "Public read cocktail_products" ON cocktail_products;
DROP POLICY IF EXISTS "Auth manage cocktail_products" ON cocktail_products;

CREATE POLICY "Public read cocktail_products" ON cocktail_products
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Auth manage cocktail_products" ON cocktail_products
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- cocktail_categories
ALTER TABLE cocktail_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE cocktail_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view cocktail_categories" ON cocktail_categories;
DROP POLICY IF EXISTS "Authenticated users can manage cocktail_categories" ON cocktail_categories;
DROP POLICY IF EXISTS "Public read cocktail_categories" ON cocktail_categories;
DROP POLICY IF EXISTS "Auth manage cocktail_categories" ON cocktail_categories;

CREATE POLICY "Public read cocktail_categories" ON cocktail_categories
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Auth manage cocktail_categories" ON cocktail_categories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- product_images
ALTER TABLE product_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view product_images" ON product_images;
DROP POLICY IF EXISTS "Authenticated users can manage product_images" ON product_images;
DROP POLICY IF EXISTS "Public read product_images" ON product_images;
DROP POLICY IF EXISTS "Auth manage product_images" ON product_images;

CREATE POLICY "Public read product_images" ON product_images
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Auth manage product_images" ON product_images
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================
-- VERIFICAR
-- =============================================
SELECT 'Políticas actualizadas correctamente' as status;

SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
