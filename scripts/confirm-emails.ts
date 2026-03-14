// Script para confirmar emails de todos los usuarios
// Ejecutar con: npx tsx scripts/confirm-emails.ts

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function confirmEmails() {
  console.log('📧 Confirmando emails de todos los usuarios...\n')

  const { data: users, error } = await supabase.auth.admin.listUsers()

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  for (const user of users.users) {
    const isConfirmed = !!user.email_confirmed_at
    console.log(`${user.email}:`)
    console.log(`   Estado: ${isConfirmed ? '✅ Ya confirmado' : '⏳ Sin confirmar'}`)

    if (!isConfirmed) {
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { email_confirm: true }
      )

      if (updateError) {
        console.log(`   ❌ Error confirmando: ${updateError.message}`)
      } else {
        console.log(`   ✅ Email confirmado exitosamente`)
      }
    }
    console.log('')
  }

  console.log('✅ Proceso completado')
}

confirmEmails().catch(console.error)
