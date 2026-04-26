import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isPublicPath =
    pathname === '/' ||
    pathname === '/about' ||
    pathname === '/cast' ||
    pathname === '/philosophy' ||
    pathname === '/faq' ||
    pathname === '/pricing' ||
    pathname === '/service' ||
    pathname.startsWith('/blog') ||
    pathname.startsWith('/cast-talk') ||
    pathname.startsWith('/api/') ||
    pathname === '/privacy' ||
    pathname === '/terms' ||
    pathname === '/tokushoho' ||
    pathname === '/contact' ||
    pathname.startsWith('/auth/') ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt'

  // /admin へのアクセス制御: ベーシック認証 + ADMIN_EMAILS チェック
  if (pathname.startsWith('/admin')) {
    // ベーシック認証（PCI DSS 要件: パスワード認証に加えた追加の制限）
    const basicUser = process.env.ADMIN_BASIC_AUTH_USER
    const basicPass = process.env.ADMIN_BASIC_AUTH_PASSWORD
    if (basicUser && basicPass) {
      const authorization = request.headers.get('authorization')
      if (!authorization || !authorization.startsWith('Basic ')) {
        return new NextResponse('Authentication required', {
          status: 401,
          headers: { 'WWW-Authenticate': 'Basic realm="Admin"' },
        })
      }
      const [credUser, credPass] = atob(authorization.slice(6)).split(':')
      if (credUser !== basicUser || credPass !== basicPass) {
        return new NextResponse('Authentication required', {
          status: 401,
          headers: { 'WWW-Authenticate': 'Basic realm="Admin"' },
        })
      }
    }

    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    const adminEmails = (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean)
    if (!adminEmails.includes(user.email ?? '')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return supabaseResponse
  }

  if (!user && !isPublicPath) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (user && (pathname === '/auth/login' || pathname === '/auth/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp|.*\\.ico).*)'],
}
