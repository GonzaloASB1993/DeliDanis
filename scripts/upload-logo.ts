import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function uploadLogo() {
  const logoPath = path.join(__dirname, '..', 'public', 'images', 'logo-email-white.png')
  const fileBuffer = fs.readFileSync(logoPath)

  // Create bucket if not exists
  const { error: bucketError } = await supabase.storage.createBucket('public-assets', {
    public: true,
  })
  if (bucketError && !bucketError.message.includes('already exists')) {
    console.error('Error creating bucket:', bucketError)
    return
  }

  // Upload logo
  const { data, error } = await supabase.storage
    .from('public-assets')
    .upload('email/logo-white.png', fileBuffer, {
      contentType: 'image/png',
      upsert: true,
    })

  if (error) {
    console.error('Error uploading:', error)
    return
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('public-assets')
    .getPublicUrl('email/logo-white.png')

  console.log('Logo subido exitosamente!')
  console.log('URL publica:', urlData.publicUrl)
}

uploadLogo()
