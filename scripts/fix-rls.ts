// Script para arreglar políticas RLS de user_profiles
// Ejecutar con: npx tsx scripts/fix-rls.ts

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixRLS() {
  console.log('🔧 Arreglando políticas RLS de user_profiles...\n')

  const sql = `
    -- Eliminar políticas existentes
    DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
    DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

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

    -- Política para que los usuarios puedan insertar su propio perfil
    CREATE POLICY "Users can insert own profile" ON user_profiles
      FOR INSERT
      WITH CHECK (auth.uid() = id);
  `

  const { error } = await supabase.rpc('exec_sql', { sql_query: sql })

  if (error) {
    // Si rpc no existe, mostrar instrucciones
    console.log('⚠️  No se puede ejecutar SQL directamente desde el cliente.')
    console.log('\n📋 Por favor, ejecuta este SQL en el Supabase SQL Editor:\n')
    console.log('Ve a: https://supabase.com/dashboard/project/[tu-proyecto]/sql/new')
    console.log('\nY ejecuta:\n')
    console.log(sql)
  } else {
    console.log('✅ Políticas RLS actualizadas correctamente')
  }

  // Verificar si podemos leer los perfiles
  console.log('\n📋 Verificando acceso a user_profiles...')

  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('id, email, role, is_active')

  if (profilesError) {
    console.log(`❌ Error: ${profilesError.message}`)
  } else {
    console.log(`✅ Se pueden leer ${profiles?.length || 0} perfiles (usando service_role)`)
    profiles?.forEach(p => {
      console.log(`   - ${p.email}: role=${p.role}, active=${p.is_active}`)
    })
  }
}

fixRLS().catch(console.error)
