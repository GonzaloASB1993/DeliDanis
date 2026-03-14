// Script para verificar usuarios en Supabase
// Ejecutar con: npx tsx scripts/check-users.ts

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkUsers() {
  console.log('🔍 Verificando usuarios...\n')

  // 1. Verificar usuarios en auth.users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

  if (authError) {
    console.error('❌ Error obteniendo usuarios de auth:', authError.message)
    return
  }

  console.log(`📋 Usuarios en auth.users: ${authUsers.users.length}`)
  authUsers.users.forEach(user => {
    console.log(`   - ${user.email} (ID: ${user.id})`)
  })

  // 2. Verificar perfiles en user_profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('*')

  if (profilesError) {
    console.error('\n❌ Error obteniendo perfiles:', profilesError.message)
    console.log('\n💡 Probablemente la tabla user_profiles no existe. Ejecuta la migración:')
    console.log('   supabase/migrations/010_user_profiles.sql')
    return
  }

  console.log(`\n📋 Perfiles en user_profiles: ${profiles?.length || 0}`)
  profiles?.forEach(profile => {
    console.log(`   - ${profile.email}`)
    console.log(`     ID: ${profile.id}`)
    console.log(`     Rol: ${profile.role}`)
    console.log(`     Activo: ${profile.is_active}`)
    console.log('')
  })

  // 3. Verificar usuarios sin perfil
  const profileIds = profiles?.map(p => p.id) || []
  const usersWithoutProfile = authUsers.users.filter(u => !profileIds.includes(u.id))

  if (usersWithoutProfile.length > 0) {
    console.log('\n⚠️  Usuarios SIN perfil (necesitan ser creados):')
    usersWithoutProfile.forEach(user => {
      console.log(`   - ${user.email} (ID: ${user.id})`)
    })

    console.log('\n💡 Para crear los perfiles faltantes, ejecuta:')
    usersWithoutProfile.forEach(user => {
      console.log(`
INSERT INTO user_profiles (id, email, role, is_active)
VALUES ('${user.id}', '${user.email}', 'admin', true);`)
    })
  }

  // 4. Verificar perfiles inactivos
  const inactiveProfiles = profiles?.filter(p => !p.is_active) || []
  if (inactiveProfiles.length > 0) {
    console.log('\n⚠️  Perfiles INACTIVOS (no pueden hacer login):')
    inactiveProfiles.forEach(profile => {
      console.log(`   - ${profile.email}`)
    })

    console.log('\n💡 Para activarlos, ejecuta:')
    console.log(`
UPDATE user_profiles SET is_active = true WHERE is_active = false;`)
  }

  // 5. Verificar perfiles sin rol admin
  const nonAdminProfiles = profiles?.filter(p => p.role !== 'admin') || []
  if (nonAdminProfiles.length > 0) {
    console.log('\n⚠️  Perfiles SIN rol admin:')
    nonAdminProfiles.forEach(profile => {
      console.log(`   - ${profile.email} (rol: ${profile.role})`)
    })

    console.log('\n💡 Para darles rol admin, ejecuta:')
    console.log(`
UPDATE user_profiles SET role = 'admin' WHERE role != 'admin';`)
  }

  console.log('\n✅ Verificación completada')
}

checkUsers().catch(console.error)
