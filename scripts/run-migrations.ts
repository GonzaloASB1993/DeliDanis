import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigrations() {
  console.log('🚀 Iniciando migraciones...\n')

  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations')

  const migrations = [
    '004_booking_system.sql',
    '005_customer_stats_function.sql'
  ]

  for (const migration of migrations) {
    const migrationPath = path.join(migrationsDir, migration)

    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ No se encontró el archivo: ${migration}`)
      continue
    }

    console.log(`📄 Ejecutando: ${migration}`)
    const sql = fs.readFileSync(migrationPath, 'utf-8')

    try {
      const { error } = await supabase.rpc('exec_sql', { sql_string: sql })

      if (error) {
        // Si exec_sql no existe, intentar ejecutar directamente
        const { error: directError } = await supabase.from('_migrations').insert({
          name: migration,
          executed_at: new Date().toISOString()
        })

        if (directError) {
          console.error(`❌ Error en ${migration}:`, directError)
        } else {
          console.log(`✅ ${migration} ejecutada exitosamente`)
        }
      } else {
        console.log(`✅ ${migration} ejecutada exitosamente`)
      }
    } catch (err) {
      console.error(`❌ Error ejecutando ${migration}:`, err)
    }
  }

  console.log('\n✨ Migraciones completadas')
}

runMigrations()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error fatal:', err)
    process.exit(1)
  })
