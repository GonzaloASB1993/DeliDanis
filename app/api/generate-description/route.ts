import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: NextRequest) {
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
    return NextResponse.json(
      { error: error.message || 'Error al generar descripción' },
      { status: 500 }
    )
  }
}
