// Verificar políticas RLS actuales
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function checkPolicies() {
  console.log('📋 VERIFICANDO POLÍTICAS RLS\n')

  // Consulta directa a pg_policies
  const { data, error } = await supabase.rpc('exec_sql', {
    sql_query: `
      SELECT
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `
  })

  if (error) {
    console.log('No se puede usar rpc. Consultando de otra forma...\n')

    // Intentar con query directa
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables' as any)
      .select('table_name')
      .eq('table_schema', 'public')

    if (tablesError) {
      console.log('❌ No se pueden consultar las políticas directamente.')
      console.log('\n📝 Ejecuta este SQL en Supabase SQL Editor para ver las políticas:\n')
      console.log(`
SELECT
  tablename,
  policyname,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
      `)
    }
  } else {
    console.log(data)
  }

  // Verificar si hay datos con diferentes niveles de acceso
  console.log('\n📊 CONTEO DE REGISTROS (con service role):')

  const tables = ['user_profiles', 'orders', 'customers', 'order_items', 'order_history']

  for (const table of tables) {
    const { count, error: countError } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })

    console.log(`   ${table}: ${countError ? 'ERROR' : count} registros`)
  }
}

checkPolicies().catch(console.error)
