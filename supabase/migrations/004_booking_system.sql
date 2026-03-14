-- =============================================
-- Migration: Booking System Tables
-- Descripción: Sistema de agendamiento multi-servicio
-- Tablas: customers, orders, order_items, order_history
-- =============================================

-- =============================================
-- 1. TABLA CUSTOMERS
-- =============================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Información de contacto
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,

  -- Dirección (opcional, solo para delivery)
  address TEXT,
  city VARCHAR(100),

  -- Metadata
  notes TEXT,
  tags TEXT[] DEFAULT '{}',

  -- Estadísticas
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para customers
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at DESC);

-- =============================================
-- 2. TABLA ORDERS
-- =============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Número de orden único
  order_number VARCHAR(20) UNIQUE NOT NULL,

  -- Relación con cliente
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  -- Estado del pedido
  status VARCHAR(50) DEFAULT 'pending',
  -- Valores: pending, confirmed, in_production, ready, delivered, completed, cancelled

  -- Información del evento
  event_type VARCHAR(100),
  event_date DATE NOT NULL,
  event_time VARCHAR(10), -- 'AM' o 'PM'

  -- Entrega
  delivery_type VARCHAR(20) NOT NULL, -- 'pickup' o 'delivery'
  delivery_address TEXT,
  delivery_city VARCHAR(100),
  delivery_fee DECIMAL(10,2) DEFAULT 0,

  -- Montos
  subtotal DECIMAL(12,2) NOT NULL,
  discount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,

  -- Estado de pago
  payment_status VARCHAR(50) DEFAULT 'pending',
  -- Valores: pending, partial, paid

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para orders
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_event_date ON orders(event_date);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- =============================================
-- 3. TABLA ORDER_ITEMS
-- =============================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relación con pedido
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,

  -- Tipo de servicio
  service_type VARCHAR(20) NOT NULL,
  -- Valores: 'torta', 'cocteleria', 'pasteleria'

  -- Datos del servicio (almacenados como JSONB)
  -- Para torta: {product: {...}, portions: 15, customizations: {...}}
  -- Para cocteleria: {items: {productId: quantity, ...}}
  -- Para pasteleria: {items: {pieLimon: 2, tartas: 1, ...}}
  service_data JSONB NOT NULL,

  -- Precio
  unit_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  total_price DECIMAL(10,2) NOT NULL,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_service_type ON order_items(service_type);

-- =============================================
-- 4. TABLA ORDER_HISTORY
-- =============================================
CREATE TABLE IF NOT EXISTS order_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relación con pedido
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,

  -- Cambio de estado
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,

  -- Notas opcionales
  notes TEXT,

  -- Quién hizo el cambio (opcional, para cuando tengamos auth)
  created_by UUID,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para order_history
CREATE INDEX IF NOT EXISTS idx_order_history_order_id ON order_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_history_created_at ON order_history(created_at DESC);

-- =============================================
-- 5. TRIGGERS
-- =============================================

-- Trigger para actualizar updated_at en customers
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

-- Trigger para actualizar updated_at en orders
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

-- Trigger para crear registro en order_history cuando cambia el status
CREATE OR REPLACE FUNCTION create_order_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo crear historial si el status cambió
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

-- Trigger para insertar historial inicial cuando se crea un pedido
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

-- =============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;

-- Políticas temporales: PÚBLICO (sin autenticación)
-- TODO: Actualizar cuando se implemente autenticación

-- Customers: Lectura y escritura pública
CREATE POLICY "Customers are publicly accessible"
  ON customers FOR ALL
  USING (true)
  WITH CHECK (true);

-- Orders: Lectura y escritura pública
CREATE POLICY "Orders are publicly accessible"
  ON orders FOR ALL
  USING (true)
  WITH CHECK (true);

-- Order Items: Lectura y escritura pública
CREATE POLICY "Order items are publicly accessible"
  ON order_items FOR ALL
  USING (true)
  WITH CHECK (true);

-- Order History: Solo lectura pública
CREATE POLICY "Order history is publicly readable"
  ON order_history FOR SELECT
  USING (true);

CREATE POLICY "Order history is publicly writable"
  ON order_history FOR INSERT
  WITH CHECK (true);

-- =============================================
-- 7. COMENTARIOS EN TABLAS
-- =============================================

COMMENT ON TABLE customers IS 'Información de clientes que realizan pedidos';
COMMENT ON TABLE orders IS 'Pedidos/agendamientos de servicios';
COMMENT ON TABLE order_items IS 'Items/servicios individuales de cada pedido';
COMMENT ON TABLE order_history IS 'Historial de cambios de estado de pedidos';

COMMENT ON COLUMN orders.service_type IS 'Tipo de servicio: torta, cocteleria, pasteleria';
COMMENT ON COLUMN order_items.service_data IS 'Datos del servicio en formato JSONB - estructura varía según service_type';
COMMENT ON COLUMN orders.status IS 'Estado: pending, confirmed, in_production, ready, delivered, completed, cancelled';
COMMENT ON COLUMN orders.payment_status IS 'Estado de pago: pending, partial, paid';
