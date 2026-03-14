// Test de RLS - simula lo que hace el frontend
// Ejecutar con: npx tsx scripts/test-rls.ts

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function testRLS() {
  console.log('🧪 TEST DE RLS\n')

  // 1. Obtener un usuario para hacer login
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  const { data: users } = await supabaseAdmin.auth.admin.listUsers()
  const testUser = users?.users[0]

  if (!testUser) {
    console.log('❌ No hay usuarios para probar')
    return
  }

  console.log(`👤 Usuario de prueba: ${testUser.email}`)
  console.log(`   ID: ${testUser.id}\n`)

  // 2. Verificar políticas actuales
  console.log('📋 POLÍTICAS ACTUALES EN user_profiles:')
  const { data: policies } = await supabaseAdmin.rpc('get_rls_policies', {
    table_name: 'user_profiles'
  }).single()

  if (!policies) {
    // Consulta alternativa
    const { data: policiesAlt, error } = await supabaseAdmin
      .from('pg_policies')
      .select('*')

    if (error) {
      console.log('   (No se pueden consultar políticas directamente)\n')
    }
  }

  // 3. Probar con service role (sin RLS)
  console.log('🔓 TEST CON SERVICE ROLE (sin RLS):')
  const { data: profileAdmin, error: errorAdmin } = await supabaseAdmin
    .from('user_profiles')
    .select('*')
    .eq('id', testUser.id)
    .single()

  if (errorAdmin) {
    console.log(`   ❌ Error: ${errorAdmin.message}`)
  } else {
    console.log(`   ✅ Perfil encontrado: ${profileAdmin.email}, rol: ${profileAdmin.role}`)
  }

  // 4. Probar acceso anónimo (con RLS)
  console.log('\n🔒 TEST CON ANON KEY (con RLS, sin auth):')
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)

  const { data: profileAnon, error: errorAnon } = await supabaseAnon
    .from('user_profiles')
    .select('*')
    .eq('id', testUser.id)
    .single()

  if (errorAnon) {
    console.log(`   ❌ Error: ${errorAnon.message}`)
    console.log(`      (Esto es esperado si RLS está activo)`)
  } else {
    console.log(`   ✅ Perfil encontrado (RLS permite acceso anónimo)`)
  }

  // 5. Test de orders
  console.log('\n📦 TEST DE ORDERS:')
  const { data: ordersAdmin, error: ordersError } = await supabaseAdmin
    .from('orders')
    .select('id, order_number')
    .limit(1)

  if (ordersError) {
    console.log(`   ❌ Error: ${ordersError.message}`)
  } else {
    console.log(`   ✅ Orders accesible: ${ordersAdmin?.length || 0} registros`)
  }

  // 6. Verificar si RLS está habilitado
  console.log('\n🔐 ESTADO DE RLS EN TABLAS:')
  const { data: rlsStatus } = await supabaseAdmin.rpc('check_rls_status')

  if (!rlsStatus) {
    // Consulta manual
    const tables = ['user_profiles', 'orders', 'customers', 'order_items']
    for (const table of tables) {
      const { count, error } = await supabaseAnon
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.log(`   ❌ ${table}: BLOQUEADO por RLS (${error.code})`)
      } else {
        console.log(`   ✅ ${table}: Accesible (${count} registros)`)
      }
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('💡 SOLUCIÓN:')
  console.log('   Si ves "BLOQUEADO por RLS", necesitas ejecutar:')
  console.log('   scripts/fix-rls-simple.sql en Supabase SQL Editor')
}

testRLS().catch(console.error)
