// Script para probar login directamente
// Ejecutar con: npx tsx scripts/test-login.ts email@example.com password123

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const email = process.argv[2]
const password = process.argv[3]

if (!email || !password) {
  console.log('Uso: npx tsx scripts/test-login.ts email@example.com password123')
  process.exit(1)
}

// Cliente normal (como el frontend)
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente admin
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testLogin() {
  console.log(`🔐 Probando login para: ${email}\n`)

  // 1. Verificar que el usuario existe
  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(
    (await supabaseAdmin.auth.admin.listUsers()).data.users.find(u => u.email === email)?.id || ''
  )

  if (userError || !userData.user) {
    console.log('❌ Usuario no encontrado en auth.users')
    return
  }

  console.log('✅ Usuario encontrado en auth.users')
  console.log(`   Email confirmado: ${userData.user.email_confirmed_at ? 'Sí' : '❌ NO (este es el problema!)'}`)
  console.log(`   Último login: ${userData.user.last_sign_in_at || 'Nunca'}`)
  console.log(`   Creado: ${userData.user.created_at}`)

  // Si el email no está confirmado, intentar confirmarlo
  if (!userData.user.email_confirmed_at) {
    console.log('\n💡 El email no está confirmado. Confirmándolo automáticamente...')

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userData.user.id,
      { email_confirm: true }
    )

    if (updateError) {
      console.log(`❌ Error confirmando email: ${updateError.message}`)
    } else {
      console.log('✅ Email confirmado exitosamente')
    }
  }

  // 2. Intentar login
  console.log('\n🔑 Intentando login...')

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.log(`❌ Error de login: ${error.message}`)

    if (error.message.includes('Invalid login credentials')) {
      console.log('\n💡 Posibles causas:')
      console.log('   1. La contraseña es incorrecta')
      console.log('   2. El email no está confirmado (ya lo verificamos arriba)')
      console.log('\n💡 Para resetear la contraseña, ve a Supabase Dashboard > Authentication > Users')
      console.log('   y usa "Send password recovery"')
    }
    return
  }

  console.log('✅ Login exitoso!')
  console.log(`   User ID: ${data.user?.id}`)
  console.log(`   Email: ${data.user?.email}`)

  // 3. Verificar perfil
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', data.user?.id)
    .single()

  if (profileError) {
    console.log(`\n⚠️  No se pudo obtener el perfil: ${profileError.message}`)
  } else {
    console.log(`\n📋 Perfil:`)
    console.log(`   Rol: ${profile.role}`)
    console.log(`   Activo: ${profile.is_active}`)
  }
}

testLogin().catch(console.error)
