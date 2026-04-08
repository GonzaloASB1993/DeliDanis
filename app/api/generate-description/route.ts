import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  // Guard: only authenticated admins may call the AI generation endpoint.
  // Unauthenticated access would drain Anthropic API credits freely.
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single()
  if (!profile?.is_active || !['admin', 'owner', 'sales'].includes(profile.role)) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'API key de Anthropic no configurada. Agrega ANTHROPIC_API_KEY en las variables de entorno.' },
        { status: 503 }
      )
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const { productName, productType, category } = await request.json()

    if (!productName) {
      return NextResponse.json(
        { error: 'El nombre del producto es requerido' },
        { status: 400 }
      )
    }

    const typeLabels: Record<string, string> = {
      cake: 'torta',
      cocktail: 'producto de coctelería',
      pastry: 'producto de pastelería',
    }

    const prompt = `Genera una descripción corta y atractiva (máximo 2-3 oraciones) para un ${typeLabels[productType] || 'producto'} llamado "${productName}"${category ? ` de la categoría "${category}"` : ''}.

La descripción debe:
- Ser persuasiva y apetitosa
- Destacar ingredientes o características típicas
- Usar un tono cálido y profesional
- Estar en español chileno (sin modismos exagerados)
- NO incluir precios ni información de pedidos

Solo responde con la descripción, sin comillas ni explicaciones adicionales.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const description = message.content[0].type === 'text'
      ? message.content[0].text.trim()
      : ''

    return NextResponse.json({ description })
  } catch (error: any) {
    console.error('Error generating description:', error)
    // Never expose raw error messages (may include API details) to the client
    return NextResponse.json(
      { error: 'Error al generar descripción' },
      { status: 500 }
    )
  }
}
