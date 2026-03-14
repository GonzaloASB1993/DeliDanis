-- =============================================
-- MIGRACIONES COMPLETAS DEL SISTEMA DE AGENDAMIENTO
-- Ejecuta este archivo completo en Supabase SQL Editor
-- =============================================

-- =============================================
-- PARTE 1: Booking System Tables
-- =============================================

-- 1. TABLA CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at DESC);

-- 2. TABLA ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(20) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'pending',
  event_type VARCHAR(100),
  event_date DATE NOT NULL,
  event_time VARCHAR(10),
  delivery_type VARCHAR(20) NOT NULL,
  delivery_address TEXT,
  delivery_city VARCHAR(100),
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  subtotal DECIMAL(12,2) NOT NULL,
  discount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_event_date ON orders(event_date);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- 3. TABLA ORDER_ITEMS
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  service_type VARCHAR(20) NOT NULL,
  service_data JSONB NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_service_type ON order_items(service_type);

-- 4. TABLA ORDER_HISTORY
CREATE TABLE IF NOT EXISTS order_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_history_order_id ON order_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_history_created_at ON order_history(created_at DESC);

-- 5. TRIGGERS
CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_customers_updated_at();

CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

CREATE OR REPLACE FUNCTION create_order_history()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_history (order_id, old_status, new_status)
    VALUES (NEW.id, OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_status_change
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_order_history();

CREATE OR REPLACE FUNCTION create_initial_order_history()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO order_history (order_id, old_status, new_status)
  VALUES (NEW.id, NULL, NEW.status);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_initial_history
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_order_history();

-- 6. ROW LEVEL SECURITY (RLS)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers are publicly accessible"
  ON customers FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Orders are publicly accessible"
  ON orders FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Order items are publicly accessible"
  ON order_items FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Order history is publicly readable"
  ON order_history FOR SELECT
  USING (true);

CREATE POLICY "Order history is publicly writable"
  ON order_history FOR INSERT
  WITH CHECK (true);

-- 7. COMENTARIOS
COMMENT ON TABLE customers IS 'Información de clientes que realizan pedidos';
COMMENT ON TABLE orders IS 'Pedidos/agendamientos de servicios';
COMMENT ON TABLE order_items IS 'Items/servicios individuales de cada pedido';
COMMENT ON TABLE order_history IS 'Historial de cambios de estado de pedidos';

-- =============================================
-- PARTE 2: Customer Statistics Function
-- =============================================

CREATE OR REPLACE FUNCTION increment_customer_stats(
  p_customer_id UUID,
  p_order_total DECIMAL(12,2)
)
RETURNS void AS $$
BEGIN
  UPDATE customers
  SET
    total_orders = total_orders + 1,
    total_spent = total_spent + p_order_total,
    updated_at = NOW()
  WHERE id = p_customer_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_customer_stats IS 'Incrementa el total de pedidos y gasto total del cliente';

CREATE OR REPLACE FUNCTION update_customer_stats_on_order_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM 'completed' AND NEW.status = 'completed' THEN
    UPDATE customers
    SET
      total_orders = total_orders + 1,
      total_spent = total_spent + NEW.total,
      updated_at = NOW()
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_update_customer_stats
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_stats_on_order_complete();

COMMENT ON FUNCTION update_customer_stats_on_order_complete IS 'Actualiza automáticamente las estadísticas del cliente cuando un pedido se completa';
