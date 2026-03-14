-- =============================================
-- Migration: Sistema de Inventario + Recetas
-- Tablas: ingredients, inventory_movements, recipes
-- Incluye mermas (waste) como tipo de movimiento
-- =============================================

-- Tabla de ingredientes/insumos
CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  category VARCHAR(100), -- harina, fruta, lacteo, decoracion, empaque, etc.
  unit VARCHAR(50) NOT NULL, -- kg, lt, unidad, gr, ml
  current_stock DECIMAL(10,3) DEFAULT 0,
  min_stock DECIMAL(10,3) DEFAULT 0,
  unit_cost DECIMAL(10,2) DEFAULT 0,
  supplier VARCHAR(200),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de movimientos de inventario
-- movement_type: 'in' (entrada), 'out' (salida produccion), 'adjustment' (ajuste), 'waste' (merma)
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'waste')),
  quantity DECIMAL(10,3) NOT NULL,
  unit_cost DECIMAL(10,2),
  reference VARCHAR(200), -- 'Compra #123', 'Pedido #456', 'Vencimiento', etc.
  notes TEXT,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de recetas (ingredientes por producto)
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  product_type VARCHAR(20) NOT NULL CHECK (product_type IN ('cake', 'cocktail', 'pastry')),
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity_needed DECIMAL(10,4) NOT NULL,
  waste_percentage DECIMAL(5,2) DEFAULT 0, -- % de merma esperada (ej: 5.00 = 5%)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_recipe_ingredient UNIQUE(product_id, product_type, ingredient_id)
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients(category);
CREATE INDEX IF NOT EXISTS idx_ingredients_active ON ingredients(is_active);
CREATE INDEX IF NOT EXISTS idx_ingredients_stock ON ingredients(current_stock, min_stock);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_ingredient ON inventory_movements(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON inventory_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON inventory_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_product ON recipes(product_id, product_type);
CREATE INDEX IF NOT EXISTS idx_recipes_ingredient ON recipes(ingredient_id);

-- RLS
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ingredients are publicly accessible"
  ON ingredients FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Inventory movements are publicly accessible"
  ON inventory_movements FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Recipes are publicly accessible"
  ON recipes FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger: actualizar current_stock y costo promedio ponderado cuando se inserta un movimiento
CREATE OR REPLACE FUNCTION update_ingredient_stock()
RETURNS TRIGGER AS $$
DECLARE
  v_current_stock DECIMAL(10,3);
  v_current_cost DECIMAL(10,2);
  v_new_avg_cost DECIMAL(10,2);
BEGIN
  IF NEW.movement_type = 'in' THEN
    -- Costo promedio ponderado: ((stock_actual * costo_actual) + (qty_nueva * costo_nuevo)) / (stock_actual + qty_nueva)
    SELECT current_stock, unit_cost INTO v_current_stock, v_current_cost
    FROM ingredients WHERE id = NEW.ingredient_id;

    IF NEW.unit_cost IS NOT NULL AND NEW.unit_cost > 0 THEN
      IF (v_current_stock + NEW.quantity) > 0 THEN
        v_new_avg_cost := ((v_current_stock * v_current_cost) + (NEW.quantity * NEW.unit_cost))
                          / (v_current_stock + NEW.quantity);
      ELSE
        v_new_avg_cost := NEW.unit_cost;
      END IF;

      UPDATE ingredients
      SET current_stock = current_stock + NEW.quantity,
          unit_cost = ROUND(v_new_avg_cost, 2)
      WHERE id = NEW.ingredient_id;
    ELSE
      UPDATE ingredients
      SET current_stock = current_stock + NEW.quantity
      WHERE id = NEW.ingredient_id;
    END IF;
  ELSIF NEW.movement_type IN ('out', 'waste') THEN
    UPDATE ingredients
    SET current_stock = current_stock - NEW.quantity
    WHERE id = NEW.ingredient_id;
  ELSIF NEW.movement_type = 'adjustment' THEN
    UPDATE ingredients
    SET current_stock = NEW.quantity
    WHERE id = NEW.ingredient_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_ingredient_stock ON inventory_movements;
CREATE TRIGGER trigger_update_ingredient_stock
  AFTER INSERT ON inventory_movements
  FOR EACH ROW
  EXECUTE FUNCTION update_ingredient_stock();

-- Trigger: actualizar updated_at en ingredients
CREATE OR REPLACE FUNCTION update_ingredient_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_ingredient_timestamp ON ingredients;
CREATE TRIGGER trigger_update_ingredient_timestamp
  BEFORE UPDATE ON ingredients
  FOR EACH ROW
  EXECUTE FUNCTION update_ingredient_timestamp();

COMMENT ON TABLE ingredients IS 'Insumos e ingredientes del inventario';
COMMENT ON TABLE inventory_movements IS 'Movimientos de inventario: entradas, salidas, ajustes y mermas';
COMMENT ON TABLE recipes IS 'Recetas: ingredientes necesarios por producto con porcentaje de merma esperada';
