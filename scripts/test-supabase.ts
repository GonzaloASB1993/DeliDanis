import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Cargar variables de entorno
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testConnection() {
  console.log('🔄 Testing Supabase connection...\n')

  try {
    // 1. Test connection
    console.log('1️⃣ Testing connection to Supabase...')
    const { data, error } = await supabase.from('_test').select('*').limit(1)

    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist (normal)
      console.error('❌ Connection error:', error.message)
      return false
    }

    console.log('✅ Connection successful!\n')

    // 2. Create test table
    console.log('2️⃣ Creating test table...')
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS test_mcp (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL,
          description TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    })

    if (createError) {
      // If RPC doesn't exist, use raw SQL (less safe but works)
      console.log('⚠️  Using alternative method...')

      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS test_mcp (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL,
          description TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `

      console.log('SQL to execute:')
      console.log(createTableSQL)
      console.log('\n⚠️  Please execute this SQL in your Supabase SQL Editor:')
      console.log('https://app.supabase.com/project/ezqhprxxojhnmiypxjtl/editor')
      console.log('\nAfter executing, run this script again.')

      return false
    }

    console.log('✅ Table created!\n')

    // 3. Insert test data
    console.log('3️⃣ Inserting test data...')
    const { data: insertData, error: insertError } = await supabase
      .from('test_mcp')
      .insert([
        { name: 'Test 1', description: 'First test record' },
        { name: 'Test 2', description: 'Second test record' }
      ])
      .select()

    if (insertError) {
      console.error('❌ Insert error:', insertError.message)
      return false
    }

    console.log('✅ Data inserted:', insertData?.length, 'records\n')

    // 4. Query test data
    console.log('4️⃣ Querying test data...')
    const { data: queryData, error: queryError } = await supabase
      .from('test_mcp')
      .select('*')

    if (queryError) {
      console.error('❌ Query error:', queryError.message)
      return false
    }

    console.log('✅ Query successful!')
    console.log('Records found:', queryData?.length)
    console.log('Data:', JSON.stringify(queryData, null, 2))

    console.log('\n✅ All tests passed!')
    console.log('\n📊 You can view the table in Supabase:')
    console.log('https://app.supabase.com/project/ezqhprxxojhnmiypxjtl/editor')

    return true

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return false
  }
}

testConnection()
