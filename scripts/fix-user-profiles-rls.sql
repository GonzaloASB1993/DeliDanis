-- =============================================
-- FIX: Políticas RLS para user_profiles
-- El problema era una referencia circular en las políticas
-- =============================================

-- Primero, eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Authenticated users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role full access" ON user_profiles;

-- Deshabilitar y rehabilitar RLS para limpiar
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- NUEVAS POLÍTICAS SIMPLIFICADAS
-- =============================================

-- 1. Usuarios autenticados pueden leer SU PROPIO perfil
-- Esta es la política más importante y simple
CREATE POLICY "Users read own profile" ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 2. Usuarios autenticados pueden actualizar SU PROPIO perfil
CREATE POLICY "Users update own profile" ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. Permitir INSERT para crear el perfil propio
-- (necesario para el trigger y para cuando se crea manualmente)
CREATE POLICY "Users insert own profile" ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 4. Admins pueden ver TODOS los perfiles
-- IMPORTANTE: Usamos una función SECURITY DEFINER para evitar la recursión
CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Ahora la política de admin usa la función
CREATE POLICY "Admins read all profiles" ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id -- Siempre puede ver el suyo
    OR is_admin_user(auth.uid()) -- O si es admin, puede ver todos
  );

-- 5. Admins pueden gestionar TODOS los perfiles
CREATE POLICY "Admins manage all profiles" ON user_profiles
  FOR ALL
  TO authenticated
  USING (is_admin_user(auth.uid()))
  WITH CHECK (is_admin_user(auth.uid()));

-- =============================================
-- VERIFICACIÓN
-- =============================================

-- Verificar políticas creadas
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'user_profiles';

-- Verificar usuarios y sus roles
SELECT id, email, role, is_active, created_at
FROM user_profiles
ORDER BY created_at DESC;
