// Verificar rol de usuario específico
// Ejecutar con: npx tsx scripts/check-user-role.ts

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function checkUserRole() {
  console.log('🔍 DIAGNÓSTICO DE ROLES DE USUARIO\n')
  console.log('='.repeat(50))

  // 1. Listar todos los usuarios de auth
  console.log('\n1️⃣ USUARIOS EN AUTH.USERS:')
  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()

  if (!authUsers?.users.length) {
    console.log('   No hay usuarios registrados')
    return
  }

  authUsers.users.forEach(u => {
    console.log(`   📧 ${u.email}`)
    console.log(`      ID: ${u.id}`)
    console.log(`      Creado: ${u.created_at}`)
    console.log(`      Último login: ${u.last_sign_in_at || 'Nunca'}`)
  })

  // 2. Verificar perfiles
  console.log('\n2️⃣ PERFILES EN USER_PROFILES:')
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (profilesError) {
    console.log('   ❌ Error:', profilesError.message)
  } else if (!profiles?.length) {
    console.log('   ⚠️  No hay perfiles creados')
    console.log('   💡 Los usuarios no tienen perfil asociado')
  } else {
    profiles.forEach(p => {
      console.log(`   👤 ${p.email}`)
      console.log(`      ID: ${p.id}`)
      console.log(`      Rol: ${p.role || '(vacío)'}`)
      console.log(`      Activo: ${p.is_active}`)
      console.log(`      Creado: ${p.created_at}`)
      console.log(`      Actualizado: ${p.updated_at}`)
    })
  }

  // 3. Comparar - usuarios sin perfil
  console.log('\n3️⃣ VERIFICACIÓN DE SINCRONIZACIÓN:')
  const authIds = new Set(authUsers.users.map(u => u.id))
  const profileIds = new Set((profiles || []).map(p => p.id))

  const usersWithoutProfile = authUsers.users.filter(u => !profileIds.has(u.id))
  const profilesWithoutUser = (profiles || []).filter(p => !authIds.has(p.id))

  if (usersWithoutProfile.length > 0) {
    console.log('   ⚠️  Usuarios SIN perfil:')
    usersWithoutProfile.forEach(u => {
      console.log(`      - ${u.email} (${u.id})`)
    })
    console.log('   💡 Ejecuta el SQL para crear el perfil:')
    usersWithoutProfile.forEach(u => {
      console.log(`
      INSERT INTO user_profiles (id, email, role, is_active)
      VALUES ('${u.id}', '${u.email}', 'admin', true);
      `)
    })
  } else {
    console.log('   ✅ Todos los usuarios tienen perfil')
  }

  if (profilesWithoutUser.length > 0) {
    console.log('   ⚠️  Perfiles huérfanos (sin usuario auth):')
    profilesWithoutUser.forEach(p => {
      console.log(`      - ${p.email} (${p.id})`)
    })
  }

  // 4. Verificar triggers
  console.log('\n4️⃣ VERIFICANDO TRIGGER handle_new_user:')
  console.log('   El trigger crea usuarios con rol "viewer" por defecto.')
  console.log('   Si necesitas que sea admin, debes actualizarlo manualmente:\n')
  console.log(`   UPDATE user_profiles SET role = 'admin' WHERE email = 'tu-email@example.com';`)

  // 5. Recomendaciones
  console.log('\n' + '='.repeat(50))
  console.log('📋 PASOS PARA SOLUCIONAR:\n')
  console.log('1. Ejecuta: scripts/fix-user-profiles-rls.sql en Supabase SQL Editor')
  console.log('2. Limpia el localStorage del navegador (o abre incógnito)')
  console.log('3. Si el rol sigue en "viewer", actualízalo manualmente en Supabase:')
  console.log(`   UPDATE user_profiles SET role = 'admin' WHERE email = 'TU_EMAIL';`)
  console.log('4. Vuelve a iniciar sesión')
}

checkUserRole().catch(console.error)
