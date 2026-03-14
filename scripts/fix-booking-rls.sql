-- =====================================================
-- FIX: Políticas RLS para el flujo de agendamiento público
-- =====================================================
-- Este script permite que usuarios anónimos puedan:
-- 1. Crear/buscar clientes (customers)
-- 2. Crear pedidos (orders)
-- 3. Crear items de pedido (order_items)
-- =====================================================

-- =====================================================
-- CUSTOMERS: Permitir creación y actualización pública
-- =====================================================

-- Habilitar RLS si no está habilitado
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes para recrearlas
DROP POLICY IF EXISTS "customers_public_insert" ON customers;
DROP POLICY IF EXISTS "customers_public_select" ON customers;
DROP POLICY IF EXISTS "customers_public_update" ON customers;
DROP POLICY IF EXISTS "customers_admin_all" ON customers;

-- Política: Permitir que cualquiera pueda crear un cliente (para el flujo de agendamiento)
CREATE POLICY "customers_public_insert" ON customers
  FOR INSERT
  WITH CHECK (true);

-- Política: Permitir buscar clientes por email (para verificar si ya existe)
CREATE POLICY "customers_public_select" ON customers
  FOR SELECT
  USING (true);

-- Política: Permitir actualizar clientes (para actualizar datos cuando ya existe)
CREATE POLICY "customers_public_update" ON customers
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Política: Admins tienen acceso completo
CREATE POLICY "customers_admin_all" ON customers
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE role IN ('admin', 'sales')
    )
  );

-- =====================================================
-- ORDERS: Permitir creación pública de pedidos
-- =====================================================

-- Habilitar RLS si no está habilitado
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "orders_public_insert" ON orders;
DROP POLICY IF EXISTS "orders_public_select_own" ON orders;
DROP POLICY IF EXISTS "orders_admin_all" ON orders;

-- Política: Permitir que cualquiera cree un pedido
CREATE POLICY "orders_public_insert" ON orders
  FOR INSERT
  WITH CHECK (true);

-- Política: Permitir ver pedido por número de orden (para seguimiento público)
CREATE POLICY "orders_public_select_own" ON orders
  FOR SELECT
  USING (true);

-- Política: Admins tienen acceso completo
CREATE POLICY "orders_admin_all" ON orders
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE role IN ('admin', 'sales', 'production')
    )
  );

-- =====================================================
-- ORDER_ITEMS: Permitir creación pública
-- =====================================================

-- Habilitar RLS si no está habilitado
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "order_items_public_insert" ON order_items;
DROP POLICY IF EXISTS "order_items_public_select" ON order_items;
DROP POLICY IF EXISTS "order_items_admin_all" ON order_items;

-- Política: Permitir que cualquiera cree items de pedido
CREATE POLICY "order_items_public_insert" ON order_items
  FOR INSERT
  WITH CHECK (true);

-- Política: Permitir ver items (relacionados con orders públicos)
CREATE POLICY "order_items_public_select" ON order_items
  FOR SELECT
  USING (true);

-- Política: Admins tienen acceso completo
CREATE POLICY "order_items_admin_all" ON order_items
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE role IN ('admin', 'sales', 'production')
    )
  );

-- =====================================================
-- ORDER_HISTORY: Permitir creación pública (para triggers)
-- =====================================================

-- Habilitar RLS si no está habilitado
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "order_history_public_insert" ON order_history;
DROP POLICY IF EXISTS "order_history_public_select" ON order_history;
DROP POLICY IF EXISTS "order_history_admin_all" ON order_history;

-- Política: Permitir que cualquiera cree historial de pedido (para triggers)
CREATE POLICY "order_history_public_insert" ON order_history
  FOR INSERT
  WITH CHECK (true);

-- Política: Permitir ver historial (para seguimiento público)
CREATE POLICY "order_history_public_select" ON order_history
  FOR SELECT
  USING (true);

-- Política: Admins tienen acceso completo
CREATE POLICY "order_history_admin_all" ON order_history
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE role IN ('admin', 'sales', 'production')
    )
  );

-- =====================================================
-- Verificar que las políticas se crearon correctamente
-- =====================================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('customers', 'orders', 'order_items', 'order_history')
ORDER BY tablename, policyname;
