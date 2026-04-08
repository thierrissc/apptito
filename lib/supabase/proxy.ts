import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { checkAccessStatus } from '@/lib/access-utils'

type ProfileCheck = {
  dias_acesso: number
  status_acesso: 'ativo' | 'expirado' | 'suspenso'
}

function checkProfileAccess(profile: ProfileCheck): 'expirado' | 'ok' {
  console.log('[v0] Validando acesso:', {
    dias_acesso: profile.dias_acesso,
    status_acesso: profile.status_acesso,
  })

  if (!profile.dias_acesso || profile.dias_acesso <= 0) {
    console.log('[v0] Sem dias de acesso')
    return 'expirado'
  }

  if (profile.status_acesso !== 'ativo') {
    console.log('[v0] Status não é ativo:', profile.status_acesso)
    return 'expirado'
  }

  console.log('[v0] Acesso válido')
  return 'ok'
}

async function getProfileForUser(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
): Promise<{ profile: ProfileCheck | null }> {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('dias_acesso, status_acesso')
    .eq('id', userId)
    .limit(1)

  if (error || !profiles || profiles.length === 0) {
    return { profile: null }
  }

  const profileData = profiles[0]
  const profile: ProfileCheck = {
    dias_acesso: profileData.dias_acesso ? Number(profileData.dias_acesso) : 0,
    status_acesso: profileData.status_acesso || 'expirado',
  }

  return { profile }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }

    const { data: subConta } = await supabase
      .from('sub_contas')
      .select('owner_id, ativo')
      .eq('user_id', user.id)
      .maybeSingle()

    if (subConta && !subConta.ativo) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/acesso-expirado'
      return NextResponse.redirect(url)
    }

    const effectiveUserId = subConta?.owner_id ?? user.id
    const { profile } = await getProfileForUser(supabase, effectiveUserId)

    if (!profile) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/acesso-expirado'
      return NextResponse.redirect(url)
    }

    const status = checkProfileAccess(profile)

    if (status === 'expirado') {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/acesso-expirado'
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  }

  if (pathname === '/auth/acesso-expirado') {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }

    const { profile } = await getProfileForUser(supabase, user.id)

    if (profile) {
      const status = checkProfileAccess(profile)

      if (status === 'ok') {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
    }

    return supabaseResponse
  }

  if (pathname === '/auth/login' || pathname === '/auth/sign-up') {
    if (user) {
      const { profile } = await getProfileForUser(supabase, user.id)

      if (!profile) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/acesso-expirado'
        return NextResponse.redirect(url)
      }

      const status = checkProfileAccess(profile)

      if (status === 'expirado') {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/acesso-expirado'
        return NextResponse.redirect(url)
      }

      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
