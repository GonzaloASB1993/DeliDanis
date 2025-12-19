import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Cargar variables de entorno
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function queryTestTable() {
  console.log('🔄 Querying test_mcp table...\n')

  try {
    // Consultar datos de la tabla de prueba
    const { data, error } = await supabase
      .from('test_mcp')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error querying table:', error.message)
      console.log('\n💡 Si la tabla no existe, ejecuta el SQL en:')
      console.log('https://app.supabase.com/project/ezqhprxxojhnmiypxjtl/sql/new')
      console.log('\nEl archivo SQL está en: scripts/create-test-table.sql')
      return false
    }

    if (!data || data.length === 0) {
      console.log('⚠️  Table exists but no data found')
      console.log('\n💡 Ejecuta el SQL completo para insertar datos de prueba:')
      console.log('Ver archivo: scripts/create-test-table.sql')
      return false
    }

    console.log('✅ Connection successful!')
    console.log(`\n📊 Found ${data.length} records:\n`)

    data.forEach((record, index) => {
      console.log(`${index + 1}. ${record.name}`)
      console.log(`   Description: ${record.description || 'N/A'}`)
      console.log(`   Created: ${new Date(record.created_at).toLocaleString()}`)
      console.log()
    })

    console.log('✅ Supabase MCP is working correctly!')
    console.log('\n📊 View in Supabase:')
    console.log('https://app.supabase.com/project/ezqhprxxojhnmiypxjtl/editor')

    return true

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return false
  }
}

queryTestTable()
