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

async function createTable() {
  console.log('🔄 Creating test table in Supabase...\n')

  try {
    // 1. Crear la tabla
    console.log('1️⃣ Creating table test_mcp...')
    const { data: createData, error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS test_mcp (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL,
          description TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    })

    if (createError) {
      console.error('❌ Error creating table:', createError.message)
      console.log('\n💡 Intentando método alternativo...\n')

      // Método alternativo: insertar directamente y dejar que Supabase cree la tabla implícitamente
      // Esto no funcionará, así que usaremos la API REST directamente
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey || '',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          query: `
            CREATE TABLE IF NOT EXISTS test_mcp (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              name VARCHAR(100) NOT NULL,
              description TEXT,
              created_at TIMESTAMPTZ DEFAULT NOW(),
              updated_at TIMESTAMPTZ DEFAULT NOW()
            );
          `
        })
      })

      if (!response.ok) {
        console.error('❌ Alternative method also failed')
        console.log('\n💡 Usando método directo con SQL raw...\n')

        // Intentar crear usando la tabla directamente
        const { error: directError } = await supabase
          .from('test_mcp')
          .select('*')
          .limit(1)

        if (directError && directError.code === '42P01') {
          console.log('⚠️  La tabla no existe. Creando manualmente...')

          // Como último recurso, hacer una petición HTTP directa al endpoint de SQL
          const sqlResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey || '',
              'Authorization': `Bearer ${supabaseKey}`,
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({
              query: 'CREATE TABLE test_mcp...'
            })
          })

          console.log('❌ No se puede crear la tabla directamente desde el SDK')
          console.log('\n📋 Solución: Usa Supabase CLI o ejecuta este comando:\n')
          console.log('npx supabase db execute --project-ref ezqhprxxojhnmiypxjtl --file scripts/create-test-table.sql\n')
          return false
        }
      }
    }

    console.log('✅ Table created (or already exists)!\n')

    // 2. Insertar datos de prueba
    console.log('2️⃣ Inserting test data...')
    const { data: insertData, error: insertError } = await supabase
      .from('test_mcp')
      .insert([
        { name: 'Torta de Chocolate', description: 'Deliciosa torta de chocolate con ganache' },
        { name: 'Torta de Vainilla', description: 'Clásica torta de vainilla con buttercream' },
        { name: 'Cupcakes', description: 'Set de 12 cupcakes decorados' }
      ])
      .select()

    if (insertError) {
      console.error('❌ Error inserting data:', insertError.message)
      console.log('\nCódigo de error:', insertError.code)

      if (insertError.code === '42P01') {
        console.log('\n💡 La tabla no existe. Voy a intentar crearla primero usando otro método...\n')
        return false
      }

      return false
    }

    console.log('✅ Data inserted successfully!')
    console.log(`   Inserted ${insertData?.length || 0} records\n`)

    // 3. Consultar los datos para verificar
    console.log('3️⃣ Verifying data...')
    const { data: queryData, error: queryError } = await supabase
      .from('test_mcp')
      .select('*')
      .order('created_at', { ascending: false })

    if (queryError) {
      console.error('❌ Error querying data:', queryError.message)
      return false
    }

    console.log('✅ Query successful!\n')
    console.log(`📊 Found ${queryData?.length || 0} records:\n`)

    queryData?.forEach((record, index) => {
      console.log(`${index + 1}. ${record.name}`)
      console.log(`   Description: ${record.description || 'N/A'}`)
      console.log(`   ID: ${record.id}`)
      console.log(`   Created: ${new Date(record.created_at).toLocaleString()}`)
      console.log()
    })

    console.log('✅ ¡Todo funcionó correctamente!')
    console.log('\n📊 Puedes ver la tabla en Supabase:')
    console.log('https://app.supabase.com/project/ezqhprxxojhnmiypxjtl/editor')
    console.log('\n🎉 El MCP de Supabase está configurado y funcionando!')

    return true

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return false
  }
}

createTable()
