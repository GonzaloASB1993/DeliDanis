-- =============================================
-- B2B System: prices, customer type, order channel
-- =============================================

-- 0. Add user_id column to customers (required for B2B login linkage)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);

-- 1. B2B prices table
CREATE TABLE IF NOT EXISTS b2b_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  product_type VARCHAR(20) NOT NULL, -- 'cake', 'pastry', 'cocktail'
  price DECIMAL(10,2) NOT NULL,
  min_quantity INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, product_type)
);

CREATE INDEX idx_b2b_prices_product ON b2b_prices(product_id, product_type);
CREATE INDEX idx_b2b_prices_active ON b2b_prices(is_active);

-- 2. Add customer type column
ALTER TABLE customers ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'particular';

-- 3. Add order channel column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS channel VARCHAR(20) DEFAULT 'public';

-- 4. RLS for b2b_prices
ALTER TABLE b2b_prices ENABLE ROW LEVEL SECURITY;

-- Admin/manager can do everything with b2b_prices
CREATE POLICY "Admin manages b2b_prices" ON b2b_prices
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE role IN ('admin', 'manager') AND is_active = true
    )
  );

-- B2B clients can read active prices
CREATE POLICY "B2B clients read active prices" ON b2b_prices
  FOR SELECT USING (
    is_active = true AND
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE role = 'b2b_client' AND is_active = true
    )
  );

-- 5. B2B clients can read products
CREATE POLICY "B2B clients read cake_products" ON cake_products
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE role = 'b2b_client' AND is_active = true
    )
  );

CREATE POLICY "B2B clients read pastry_products" ON pastry_products
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE role = 'b2b_client' AND is_active = true
    )
  );

CREATE POLICY "B2B clients read cocktail_products" ON cocktail_products
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE role = 'b2b_client' AND is_active = true
    )
  );

-- 6. B2B clients can read product_images
CREATE POLICY "B2B clients read product_images" ON product_images
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE role = 'b2b_client' AND is_active = true
    )
  );

-- 7. B2B clients can insert orders (their own)
CREATE POLICY "B2B clients create orders" ON orders
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM customers WHERE id = customer_id AND type = 'business'
    )
  );

-- 8. B2B clients can read their own orders
CREATE POLICY "B2B clients read own orders" ON orders
  FOR SELECT USING (
    channel = 'b2b' AND
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );

-- 9. B2B clients can insert order_items for their orders
CREATE POLICY "B2B clients create order_items" ON order_items
  FOR INSERT WITH CHECK (
    order_id IN (
      SELECT id FROM orders WHERE customer_id IN (
        SELECT id FROM customers WHERE user_id = auth.uid()
      )
    )
  );

-- 10. B2B clients can read their order_items
CREATE POLICY "B2B clients read own order_items" ON order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders WHERE customer_id IN (
        SELECT id FROM customers WHERE user_id = auth.uid()
      )
    )
  );
