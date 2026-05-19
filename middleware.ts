import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isLoginPage = request.nextUrl.pathname === '/admin/login'

  // Si intenta acceder al admin sin estar autenticado
  if (isAdminRoute && !isLoginPage && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Si está autenticado e intenta acceder al login, redirigir al dashboard
  if (isLoginPage && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin'
    return NextResponse.redirect(url)
  }

  // Verificar que el usuario tenga perfil activo para rutas admin
  if (isAdminRoute && !isLoginPage && user) {
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('is_active, role')
      .eq('id', user.id)
      .single()

    // Si hay error de RLS o conexión, permitir pasar y dejar que el cliente maneje
    // IMPORTANTE: No desloguear por errores de red/RLS
    if (profileError) {
      console.error('[Middleware] Error fetching profile:', profileError.code, profileError.message)
      // Solo bloquear si es explícitamente un "no encontrado" (PGRST116)
      if (profileError.code === 'PGRST116') {
        // El perfil no existe - crear en el cliente o redirigir
        console.log('[Middleware] Profile not found for user:', user.id)
        // Permitir pasar - el hook useAuth creará el perfil
        return supabaseResponse
      }
      // Para otros errores (RLS, conexión), permitir pasar
      return supabaseResponse
    }

    // Si tiene perfil pero está desactivado
    if (profile && !profile.is_active) {
      console.log('[Middleware] User is inactive:', user.id)
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      url.searchParams.set('error', 'inactive')
      return NextResponse.redirect(url)
    }

    // Bloquear usuarios B2B del panel admin
    if (profile && profile.role === 'b2b_client') {
      const url = request.nextUrl.clone()
      url.pathname = '/b2b'
      return NextResponse.redirect(url)
    }
  }

  // --- B2B Routes ---
  const isB2BRoute = request.nextUrl.pathname.startsWith('/b2b')
  const isB2BLogin = request.nextUrl.pathname === '/b2b/login'

  if (isB2BRoute && !isB2BLogin && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/b2b/login'
    return NextResponse.redirect(url)
  }

  if (isB2BLogin && user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'b2b_client') {
      const url = request.nextUrl.clone()
      url.pathname = '/b2b'
      return NextResponse.redirect(url)
    }
  }

  if (isB2BRoute && !isB2BLogin && user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'b2b_client' || !profile.is_active) {
      const url = request.nextUrl.clone()
      url.pathname = '/b2b/login'
      url.searchParams.set('error', 'unauthorized')
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/b2b/:path*',
  ],
}
