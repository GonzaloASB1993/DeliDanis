-- Script de prueba para verificar MCP de Supabase
-- Ejecuta este SQL en: https://app.supabase.com/project/ezqhprxxojhnmiypxjtl/sql/new

-- 1. Crear tabla de prueba
CREATE TABLE IF NOT EXISTS test_mcp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar Row Level Security (RLS)
ALTER TABLE test_mcp ENABLE ROW LEVEL SECURITY;

-- 3. Crear política para permitir todas las operaciones (solo para pruebas)
CREATE POLICY "Allow all operations for test_mcp" ON test_mcp
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. Insertar datos de prueba
INSERT INTO test_mcp (name, description) VALUES
  ('Torta de Chocolate', 'Deliciosa torta de chocolate con ganache'),
  ('Torta de Vainilla', 'Clásica torta de vainilla con buttercream'),
  ('Cupcakes', 'Set de 12 cupcakes decorados');

-- 5. Verificar que los datos se insertaron correctamente
SELECT * FROM test_mcp;
