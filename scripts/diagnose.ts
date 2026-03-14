// Diagnóstico completo de la base de datos
// Ejecutar con: npx tsx scripts/diagnose.ts

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Cliente con service role (sin RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// Cliente con anon key (con RLS)
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)

async function diagnose() {
  console.log('🔍 DIAGNÓSTICO DE BASE DE DATOS\n')
  console.log('='.repeat(50))

  // 1. Verificar conexión
  console.log('\n1️⃣ VERIFICANDO CONEXIÓN...')
  const { data: testData, error: testError } = await supabaseAdmin.from('user_profiles').select('count')
  if (testError) {
    console.log('❌ Error de conexión:', testError.message)
    return
  }
  console.log('✅ Conexión OK')

  // 2. Verificar user_profiles con service role
  console.log('\n2️⃣ USER_PROFILES (usando service role - sin RLS):')
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('user_profiles')
    .select('*')

  if (profilesError) {
    console.log('❌ Error:', profilesError.message)
  } else {
    console.log(`   Encontrados: ${profiles?.length || 0} perfiles`)
    profiles?.forEach(p => {
      console.log(`   - ${p.email}`)
      console.log(`     id: ${p.id}`)
      console.log(`     role: ${p.role}`)
      console.log(`     is_active: ${p.is_active}`)
      console.log(`     first_name: ${p.first_name || '(vacío)'}`)
    })
  }

  // 3. Verificar orders con service role
  console.log('\n3️⃣ ORDERS (usando service role - sin RLS):')
  const { data: orders, error: ordersError } = await supabaseAdmin
    .from('orders')
    .select('id, order_number, status, total')
    .limit(5)

  if (ordersError) {
    console.log('❌ Error:', ordersError.message)
  } else {
    console.log(`   Encontrados: ${orders?.length || 0} pedidos`)
    orders?.forEach(o => {
      console.log(`   - ${o.order_number}: ${o.status} - $${o.total}`)
    })
  }

  // 4. Verificar políticas RLS
  console.log('\n4️⃣ POLÍTICAS RLS:')
  const { data: policies, error: policiesError } = await supabaseAdmin
    .rpc('get_policies_info')
    .select('*')

  if (policiesError) {
    // Si la función no existe, intentar consulta directa
    const { data: policiesAlt, error: policiesAltError } = await supabaseAdmin
      .from('pg_policies')
      .select('tablename, policyname')

    if (policiesAltError) {
      console.log('   No se puede consultar políticas directamente')
      console.log('   Ejecuta este SQL en Supabase para ver las políticas:')
      console.log('   SELECT tablename, policyname FROM pg_policies WHERE schemaname = \'public\';')
    }
  } else {
    policies?.forEach((p: { tablename: string; policyname: string }) => {
      console.log(`   - ${p.tablename}: ${p.policyname}`)
    })
  }

  // 5. Test de acceso con usuario autenticado simulado
  console.log('\n5️⃣ VERIFICANDO TABLAS CRÍTICAS:')

  const tables = ['user_profiles', 'orders', 'customers', 'order_items', 'cake_products']

  for (const table of tables) {
    const { count, error } = await supabaseAdmin
      .from(table)
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.log(`   ❌ ${table}: Error - ${error.message}`)
    } else {
      console.log(`   ✅ ${table}: ${count} registros`)
    }
  }

  // 6. Verificar si la tabla order_payments existe
  console.log('\n6️⃣ VERIFICANDO TABLA ORDER_PAYMENTS:')
  const { error: paymentsError } = await supabaseAdmin
    .from('order_payments')
    .select('id')
    .limit(1)

  if (paymentsError) {
    console.log('   ❌ La tabla order_payments NO existe')
    console.log('   💡 Ejecuta: supabase/migrations/011_order_payments.sql')
  } else {
    console.log('   ✅ La tabla order_payments existe')
  }

  console.log('\n' + '='.repeat(50))
  console.log('🏁 DIAGNÓSTICO COMPLETADO\n')

  // Recomendaciones
  console.log('📋 RECOMENDACIONES:')
  console.log('1. Si user_profiles está vacío o sin datos, el perfil no se cargará')
  console.log('2. Si orders está vacío, el dashboard mostrará todo en 0')
  console.log('3. Asegúrate de haber ejecutado scripts/fix-all-rls.sql en Supabase')
  console.log('4. Asegúrate de haber ejecutado supabase/migrations/011_order_payments.sql')
}

diagnose().catch(console.error)
