-- =============================================
-- Migration: Sistema de Pagos/Abonos para Orders
-- Agrega campos necesarios para gestionar abonos
-- =============================================

-- Agregar campos faltantes a orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS deposit_paid BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS special_requests TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES user_profiles(id);

-- Agregar product_name a order_items para facilitar consultas
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_name VARCHAR(200);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS portions INTEGER;

-- Crear tabla de pagos/abonos
CREATE TABLE IF NOT EXISTS order_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,

  -- Monto y método
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL, -- 'cash', 'transfer', 'card', 'mercadopago'

  -- Referencia de pago
  reference VARCHAR(200),

  -- Notas
  notes TEXT,

  -- Quién registró el pago
  created_by UUID REFERENCES user_profiles(id),

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_order_payments_order_id ON order_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_payments_created_at ON order_payments(created_at DESC);

-- RLS para order_payments
ALTER TABLE order_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order payments are publicly accessible"
  ON order_payments FOR ALL
  USING (true)
  WITH CHECK (true);

-- Función para calcular total pagado de un pedido
CREATE OR REPLACE FUNCTION get_order_paid_amount(order_uuid UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  total_paid DECIMAL(10,2);
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM order_payments
  WHERE order_id = order_uuid;

  RETURN total_paid;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar payment_status automáticamente
CREATE OR REPLACE FUNCTION update_order_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  order_total DECIMAL(10,2);
  total_paid DECIMAL(10,2);
BEGIN
  -- Obtener el total del pedido
  SELECT total INTO order_total FROM orders WHERE id = NEW.order_id;

  -- Calcular total pagado
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM order_payments
  WHERE order_id = NEW.order_id;

  -- Actualizar estado de pago
  IF total_paid >= order_total THEN
    UPDATE orders SET payment_status = 'paid', deposit_paid = true, deposit_amount = total_paid
    WHERE id = NEW.order_id;
  ELSIF total_paid > 0 THEN
    UPDATE orders SET payment_status = 'partial', deposit_paid = true, deposit_amount = total_paid
    WHERE id = NEW.order_id;
  ELSE
    UPDATE orders SET payment_status = 'pending', deposit_paid = false, deposit_amount = 0
    WHERE id = NEW.order_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar payment_status cuando se agrega un pago
DROP TRIGGER IF EXISTS update_payment_status_on_payment ON order_payments;
CREATE TRIGGER update_payment_status_on_payment
  AFTER INSERT OR DELETE ON order_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_order_payment_status();

COMMENT ON TABLE order_payments IS 'Registro de pagos/abonos para cada pedido';
