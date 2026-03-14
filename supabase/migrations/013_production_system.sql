-- =============================================
-- Migration: Sistema de Producción + Info Nutricional
-- Tablas: production_orders, production_movements
-- Agrega columnas nutricionales a ingredients
-- =============================================

-- 1A. Agregar columnas nutricionales a ingredients (valores por 100g/100ml)
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS calories DECIMAL(8,2) DEFAULT 0;
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS protein DECIMAL(8,2) DEFAULT 0;
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS fat DECIMAL(8,2) DEFAULT 0;
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS saturated_fat DECIMAL(8,2) DEFAULT 0;
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS carbohydrates DECIMAL(8,2) DEFAULT 0;
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS sugar DECIMAL(8,2) DEFAULT 0;
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS fiber DECIMAL(8,2) DEFAULT 0;
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS sodium DECIMAL(8,2) DEFAULT 0;

-- 1B. Tabla production_orders
CREATE TABLE IF NOT EXISTS production_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  product_id UUID NOT NULL,
  product_type VARCHAR(20) NOT NULL CHECK (product_type IN ('cake', 'cocktail', 'pastry')),
  product_name VARCHAR(200) NOT NULL,
  quantity INTEGER DEFAULT 1,
  sku VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  nutritional_info JSONB,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1C. Tabla production_movements
CREATE TABLE IF NOT EXISTS production_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_order_id UUID REFERENCES production_orders(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id),
  planned_quantity DECIMAL(10,3) NOT NULL,
  actual_quantity DECIMAL(10,3),
  waste_quantity DECIMAL(10,3) DEFAULT 0,
  movement_id UUID REFERENCES inventory_movements(id),
  waste_movement_id UUID REFERENCES inventory_movements(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_production_orders_status ON production_orders(status);
CREATE INDEX IF NOT EXISTS idx_production_orders_order_id ON production_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_production_orders_created_at ON production_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_production_orders_sku ON production_orders(sku);
CREATE INDEX IF NOT EXISTS idx_production_movements_production_order ON production_movements(production_order_id);
CREATE INDEX IF NOT EXISTS idx_production_movements_ingredient ON production_movements(ingredient_id);

-- RLS
ALTER TABLE production_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Production orders are accessible by authenticated users"
  ON production_orders FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Production movements are accessible by authenticated users"
  ON production_movements FOR ALL
  USING (true)
  WITH CHECK (true);

-- 1D. Función para generar secuencia de SKU
CREATE OR REPLACE FUNCTION get_next_sku_sequence(type_code TEXT, date_str TEXT)
RETURNS INTEGER AS $$
DECLARE
  prefix TEXT;
  current_count INTEGER;
BEGIN
  prefix := 'DD-' || type_code || '-' || date_str || '-';

  SELECT COUNT(*) INTO current_count
  FROM production_orders
  WHERE sku LIKE prefix || '%';

  RETURN current_count + 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE production_orders IS 'Órdenes de producción: producción contra pedido o para stock';
COMMENT ON TABLE production_movements IS 'Movimientos de producción: consumo de ingredientes por orden de producción';
COMMENT ON FUNCTION get_next_sku_sequence IS 'Genera el siguiente número de secuencia para SKU de producción';
