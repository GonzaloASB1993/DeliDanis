import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Service-role client for bulk writes (bypasses RLS intentionally)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function POST(request: NextRequest) {
  // Guard: only authenticated admins may bulk-upload catalog items.
  // This route uses the service role key (bypasses RLS), so it MUST verify
  // the caller is an authenticated admin before processing anything.
  const sessionClient = await createServerSupabaseClient()
  const { data: { user } } = await sessionClient.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const { data: callerProfile } = await sessionClient
    .from('user_profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single()
  if (!callerProfile?.is_active || !['admin', 'owner'].includes(callerProfile.role)) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  try {
    const { productType, products, categories, subcategories } = await request.json()

    if (!productType || !products || !Array.isArray(products)) {
      return NextResponse.json(
        { error: 'Datos inválidos' },
        { status: 400 }
      )
    }

    let success = 0
    let failed = 0
    const errors: string[] = []

    // Mapear nombres a IDs
    const categoryMap = new Map(
      categories.map((c: any) => [c.name.toLowerCase(), c.id])
    )
    const subcategoryMap = new Map(
      subcategories.map((s: any) => [s.name.toLowerCase(), s.id])
    )

    for (const product of products) {
      try {
        const categoryId = categoryMap.get(product.categoria?.toLowerCase())
        const subcategoryId = product.subcategoria
          ? subcategoryMap.get(product.subcategoria?.toLowerCase())
          : null

        if (!categoryId && productType !== 'cocktail') {
          errors.push(`Categoría no encontrada para: ${product.nombre}`)
          failed++
          continue
        }

        // Para cocktail, necesitamos subcategory_id
        if (productType === 'cocktail' && !subcategoryId) {
          errors.push(`Subcategoría requerida para coctelería: ${product.nombre}`)
          failed++
          continue
        }

        const slug = generateSlug(product.nombre)

        if (productType === 'cake') {
          const { error } = await supabase
            .from('cake_products')
            .insert({
              category_id: categoryId,
              subcategory_id: subcategoryId,
              name: product.nombre,
              slug,
              description: product.descripcion || null,
              base_price: product.precio_base || 0,
              price_per_portion: product.precio_por_porcion || null,
              min_portions: product.min_porciones || 15,
              max_portions: product.max_porciones || 80,
              preparation_days: product.dias_preparacion || 3,
              is_customizable: product.personalizable ?? true,
              is_active: product.activo ?? true,
              is_featured: product.destacado ?? false,
            })

          if (error) {
            errors.push(`Error en ${product.nombre}: ${error.message}`)
            failed++
          } else {
            success++
          }
        } else if (productType === 'cocktail') {
          const { error } = await supabase
            .from('cocktail_products')
            .insert({
              subcategory_id: subcategoryId,
              name: product.nombre,
              slug,
              description: product.descripcion || null,
              price: product.precio || 0,
              min_order_quantity: product.cantidad_minima || 15,
              is_active: product.activo ?? true,
              is_featured: product.destacado ?? false,
            })

          if (error) {
            errors.push(`Error en ${product.nombre}: ${error.message}`)
            failed++
          } else {
            success++
          }
        } else if (productType === 'pastry') {
          const { error } = await supabase
            .from('pastry_products')
            .insert({
              category_id: categoryId,
              subcategory_id: subcategoryId,
              name: product.nombre,
              slug,
              description: product.descripcion || null,
              price: product.precio || 0,
              unit: product.unidad || 'unidad',
              min_order_quantity: product.cantidad_minima || 1,
              is_active: product.activo ?? true,
              is_featured: product.destacado ?? false,
            })

          if (error) {
            errors.push(`Error en ${product.nombre}: ${error.message}`)
            failed++
          } else {
            success++
          }
        }
      } catch (error: any) {
        errors.push(`Error procesando ${product.nombre}: ${error.message}`)
        failed++
      }
    }

    return NextResponse.json({
      success,
      failed,
      errors: errors.slice(0, 10), // Solo devolver primeros 10 errores
    })
  } catch (error: any) {
    console.error('Bulk upload error:', error)
    // Never expose raw error messages to the client — may leak DB/internal details
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
