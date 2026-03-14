-- =============================================
-- FIX: Políticas RLS para user_profiles
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Primero, eliminar políticas existentes que pueden estar mal configuradas
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;

-- Verificar que RLS esté habilitado
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios puedan ver su propio perfil
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Política para que los usuarios puedan actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política para que los usuarios puedan insertar su propio perfil (para auto-creación)
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Verificar las políticas creadas
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_profiles';
