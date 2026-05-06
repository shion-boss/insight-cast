import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Edge Runtime でのタイミングセーフな文字列比較（タイミングアタック対策）
function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder()
  const aBytes = encoder.encode(a)
  const bBytes = encoder.encode(b)
  const len = Math.max(aBytes.length, bBytes.length)
  let result = aBytes.length === bBytes.length ? 0 : 1
  for (let i = 0; i < len; i++) {
    result |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0)
  }
  return result === 0
}

/* ─── IP-based rate limit ─────────────────────────────────────
 * インスタンス内メモリの best-effort 実装。Vercel の各 lambda
 * インスタンス内でのみ有効で、cold start でリセットされる。
 * スケールアウト時には事実上のリミットがインスタンス数倍になる。
 * 「明らかな乱用を弾く」ことを目的にし、厳密な制限は per-user の
 * `lib/api-usage.ts` checkRateLimit (Supabase 永続) に任せる。
 *
 * 将来 Upstash Redis 等の外部ストアに置き換える前提。
 * ─────────────────────────────────────────────────────────── */

type IpBucket = { count: number; resetAt: number }
const ipBuckets = new Map<string, IpBucket>()
const IP_RATE_LIMITS: Array<{ pattern: RegExp; limit: number; windowMs: number; label: string }> = [
  // 認証なしで叩ける mutation 系は厳しめ
  { pattern: /^\/api\/contact(\/|$)/,                limit: 5,  windowMs: 60_000,  label: 'contact' },
  { pattern: /^\/api\/stripe\/(checkout|portal)/,    limit: 10, windowMs: 60_000,  label: 'stripe' },
  { pattern: /^\/api\/auth\//,                       limit: 30, windowMs: 60_000,  label: 'auth' },
  { pattern: /^\/api\/interview-links\/[^/]+/,       limit: 60, windowMs: 60_000,  label: 'interview-links' },
  // それ以外の API 全般のフォールバック
  { pattern: /^\/api\//,                             limit: 120, windowMs: 60_000, label: 'api-default' },
]

function getIpKey(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]?.trim() ?? 'unknown'
  return request.headers.get('x-real-ip') ?? 'unknown'
}

function checkIpRateLimit(request: NextRequest, pathname: string): { allowed: boolean; label?: string } {
  const rule = IP_RATE_LIMITS.find((r) => r.pattern.test(pathname))
  if (!rule) return { allowed: true }

  const ip = getIpKey(request)
  const key = `${rule.label}:${ip}`
  const now = Date.now()
  const bucket = ipBuckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    ipBuckets.set(key, { count: 1, resetAt: now + rule.windowMs })
    // 簡易 GC: 100 エントリを超えたら期限切れを掃除
    if (ipBuckets.size > 200) {
      for (const [k, v] of ipBuckets) {
        if (v.resetAt <= now) ipBuckets.delete(k)
      }
    }
    return { allowed: true }
  }

  bucket.count += 1
  if (bucket.count > rule.limit) {
    return { allowed: false, label: rule.label }
  }
  return { allowed: true }
}

// Auth 状態を読まずにそのまま通せるパス。
// `getUser()` は Supabase Auth API への往復が発生するため、redirect 判定が
// 不要な完全 public path ではスキップして TTFB を削る。
// 注意: ここに含めるパスでは middleware による cookie refresh も走らないが、
// 認証が必要な画面（/dashboard 等）に遷移した時点で再 refresh されるので
// 通常ユーザー体験への影響はない。
function isFullyPublicSkippableAuth(pathname: string): boolean {
  if (pathname === '/' || pathname === '/about' || pathname === '/cast' || pathname === '/philosophy'
      || pathname === '/faq' || pathname === '/pricing' || pathname === '/service'
      || pathname === '/privacy' || pathname === '/terms' || pathname === '/tokushoho'
      || pathname === '/contact' || pathname === '/sitemap.xml' || pathname === '/robots.txt') {
    return true
  }
  if (pathname.startsWith('/blog') || pathname.startsWith('/cast-talk')
      || pathname.startsWith('/invite/') || pathname.startsWith('/interview/ext/')) {
    return true
  }
  // /api/* は middleware で auth state を使わない（各ルートが内部で getUser する）。
  // 認可は API ルート側で行うため、ここで Supabase Auth に往復する必要はない。
  if (pathname.startsWith('/api/')) {
    return true
  }
  // public/ 配下の静的 JS / 設定ファイル。matcher で除外できない拡張子の
  // ものを明示的に通す（`/sw.js` を redirect すると Service Worker 登録時
  // に "script resource is behind a redirect" として Lighthouse から
  // 警告が出る + SW が登録できない）。
  if (pathname === '/sw.js' || pathname === '/manifest.webmanifest') {
    return true
  }
  return false
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // IP-based rate limit（API ルートのみ。最初に判定して abuse を弾く）
  if (pathname.startsWith('/api/')) {
    const rl = checkIpRateLimit(request, pathname)
    if (!rl.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please slow down.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
          },
        }
      )
    }
  }

  // 完全 public path は auth 状態を読まずに通す（最大の TTFB 短縮）
  if (isFullyPublicSkippableAuth(pathname)) {
    return NextResponse.next({ request })
  }

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

  // /auth/* はログイン済み時に dashboard へリダイレクトする分岐があるため、
  // auth state が必要。それ以外（/dashboard 等）は未ログイン時に /auth/login へ。
  const isPublicPath = pathname.startsWith('/auth/')

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
      // RFC 7617: パスワードに ':' が含まれる場合を正しく扱うため indexOf で分割
      const decoded = atob(authorization.slice(6))
      const colonIdx = decoded.indexOf(':')
      const credUser = decoded.slice(0, colonIdx)
      const credPass = decoded.slice(colonIdx + 1)
      if (!timingSafeEqual(credUser, basicUser) || !timingSafeEqual(credPass, basicPass)) {
        return new NextResponse('Authentication required', {
          status: 401,
          headers: { 'WWW-Authenticate': 'Basic realm="Admin"' },
        })
      }
    }

    if (!user) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('next', pathname + request.nextUrl.search)
      return NextResponse.redirect(loginUrl)
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
    const loginUrl = new URL('/auth/login', request.url)
    const search = request.nextUrl.search
    loginUrl.searchParams.set('next', pathname + search)
    return NextResponse.redirect(loginUrl)
  }

  if (user && (pathname === '/auth/login' || pathname === '/auth/signup')) {
    const inviteToken = request.nextUrl.searchParams.get('invite_token')
    if (inviteToken) {
      return NextResponse.redirect(new URL(`/invite/${inviteToken}`, request.url))
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp|.*\\.ico).*)'],
}
