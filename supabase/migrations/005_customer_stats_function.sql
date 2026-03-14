-- =============================================
-- Migration: Customer Statistics Function
-- Descripción: Función para actualizar estadísticas de clientes
-- =============================================

-- =============================================
-- FUNCIÓN: Incrementar estadísticas de cliente
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

-- Comentario
COMMENT ON FUNCTION increment_customer_stats IS 'Incrementa el total de pedidos y gasto total del cliente';

-- =============================================
-- TRIGGER: Actualizar stats cuando se completa un pedido
-- =============================================
CREATE OR REPLACE FUNCTION update_customer_stats_on_order_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo actualizar cuando el pedido pasa a 'completed'
  IF OLD.status IS DISTINCT FROM 'completed' AND NEW.status = 'completed' THEN
    -- Incrementar estadísticas del cliente
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

-- Comentario
COMMENT ON FUNCTION update_customer_stats_on_order_complete IS 'Actualiza automáticamente las estadísticas del cliente cuando un pedido se completa';
