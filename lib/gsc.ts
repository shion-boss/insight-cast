import type { SupabaseClient } from '@supabase/supabase-js'

// ----------------------------------------------------------------
// 型定義
// ----------------------------------------------------------------

export type GscSearchData = {
  topQueries: Array<{
    query: string
    clicks: number
    impressions: number
    ctr: number
    position: number
  }>
  topPages: Array<{
    page: string
    clicks: number
    impressions: number
  }>
}

type GoogleTokenResponse = {
  access_token: string
  expires_in: number
  refresh_token?: string
  token_type: string
}

type GoogleSiteEntry = {
  siteUrl: string
  permissionLevel?: string
}

type GscRow = {
  access_token: string
  refresh_token: string
  expires_at: string
  site_url: string
  user_id: string
}

// ----------------------------------------------------------------
// トークンリフレッシュ
// ----------------------------------------------------------------

/**
 * refresh_token を使って新しい access_token を取得する。
 * 成功時は access_token と新しい expires_at を返す。
 */
export async function refreshGscToken(
  refreshToken: string,
): Promise<{ access_token: string; expires_at: Date }> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID または GOOGLE_CLIENT_SECRET が未設定です')
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  })

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Google token refresh failed: ${res.status} ${text}`)
  }

  const data = (await res.json()) as GoogleTokenResponse
  const expiresAt = new Date(Date.now() + data.expires_in * 1000)

  return { access_token: data.access_token, expires_at: expiresAt }
}

// ----------------------------------------------------------------
// GSC 検索データ取得
// ----------------------------------------------------------------

/**
 * GSC Search Analytics から直近90日・上位20クエリと上位10ページを取得する。
 * 取得失敗時は null を返す（呼び出し元で .catch(() => null) しても可）。
 */
export async function fetchGscSearchData(
  accessToken: string,
  siteUrl: string,
): Promise<GscSearchData | null> {
  const endDate = new Date()
  const startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)

  const baseBody = {
    startDate: fmt(startDate),
    endDate: fmt(endDate),
    rowLimit: 20,
  }

  // クエリ次元と ページ次元を並列取得
  const [queryRes, pageRes] = await Promise.all([
    fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...baseBody, dimensions: ['query'] }),
      },
    ),
    fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...baseBody, dimensions: ['page'] }),
      },
    ),
  ])

  if (!queryRes.ok || !pageRes.ok) {
    const errText = !queryRes.ok
      ? await queryRes.text().catch(() => '')
      : await pageRes.text().catch(() => '')
    console.error('[gsc] searchAnalytics API error:', errText)
    return null
  }

  const [queryData, pageData] = await Promise.all([
    queryRes.json() as Promise<{ rows?: Array<{ keys: string[]; clicks: number; impressions: number; ctr: number; position: number }> }>,
    pageRes.json() as Promise<{ rows?: Array<{ keys: string[]; clicks: number; impressions: number; ctr: number; position: number }> }>,
  ])

  const topQueries = (queryData.rows ?? []).slice(0, 20).map((row) => ({
    query: row.keys[0] ?? '',
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    position: row.position,
  }))

  const topPages = (pageData.rows ?? []).slice(0, 10).map((row) => ({
    page: row.keys[0] ?? '',
    clicks: row.clicks,
    impressions: row.impressions,
  }))

  return { topQueries, topPages }
}

// ----------------------------------------------------------------
// Supabase から有効なトークンを取得
// ----------------------------------------------------------------

/**
 * Supabase の gsc_connections からプロジェクトの接続情報を取得し、
 * トークンの有効期限が近い場合は自動でリフレッシュする。
 * 接続がなければ null を返す。
 */
export async function getValidGscToken(
  supabase: SupabaseClient,
  projectId: string,
): Promise<{ accessToken: string; siteUrl: string } | null> {
  const { data, error } = await supabase
    .from('gsc_connections')
    .select('access_token, refresh_token, expires_at, site_url, user_id')
    .eq('project_id', projectId)
    .maybeSingle()

  if (error) {
    console.error('[gsc] getValidGscToken select error:', error.message)
    return null
  }

  if (!data) return null

  const row = data as GscRow
  const expiresAt = new Date(row.expires_at)
  const nowPlusFiveMin = new Date(Date.now() + 5 * 60 * 1000)

  // 5分以内に期限切れになるならリフレッシュ
  if (expiresAt <= nowPlusFiveMin) {
    try {
      const { access_token, expires_at } = await refreshGscToken(row.refresh_token)

      const { error: updateError } = await supabase
        .from('gsc_connections')
        .update({
          access_token,
          expires_at: expires_at.toISOString(),
        })
        .eq('project_id', projectId)

      if (updateError) {
        console.error('[gsc] failed to update refreshed token:', updateError.message)
      }

      return { accessToken: access_token, siteUrl: row.site_url }
    } catch (err) {
      console.error('[gsc] token refresh failed:', err)
      return null
    }
  }

  return { accessToken: row.access_token, siteUrl: row.site_url }
}

// ----------------------------------------------------------------
// OAuth ヘルパー: code → token 交換
// ----------------------------------------------------------------

/**
 * OAuth authorization code を access_token / refresh_token に交換する。
 */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string,
): Promise<{ access_token: string; refresh_token: string; expires_at: Date }> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID または GOOGLE_CLIENT_SECRET が未設定です')
  }

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  })

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Google token exchange failed: ${res.status} ${text}`)
  }

  const data = (await res.json()) as GoogleTokenResponse

  if (!data.refresh_token) {
    throw new Error('Google からリフレッシュトークンが返されませんでした。access_type=offline が必要です。')
  }

  const expiresAt = new Date(Date.now() + data.expires_in * 1000)

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: expiresAt,
  }
}

// ----------------------------------------------------------------
// GSC サイト一覧取得とHP URLとの自動マッチング
// ----------------------------------------------------------------

/**
 * GSC のプロパティ一覧を取得して、hpUrl に最も近いものを返す（前方一致）。
 * マッチしない場合は最初のプロパティを返す。プロパティ自体がなければ null を返す。
 */
export async function findMatchingSiteUrl(
  accessToken: string,
  hpUrl: string,
): Promise<{ siteUrl: string | null; sitesRaw: GoogleSiteEntry[]; apiError?: boolean }> {
  const res = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error('[gsc] sites.list error:', res.status, text)
    return { siteUrl: null, sitesRaw: [], apiError: true }
  }

  const data = (await res.json()) as { siteEntry?: GoogleSiteEntry[] }
  const sites = data.siteEntry ?? []

  if (sites.length === 0) return { siteUrl: null, sitesRaw: [] }

  // 正規化: trailing slash を除いた形で比較
  // sc-domain: プロパティはドメイン全体をカバーするため、ドメイン部分で照合する
  const normalizedHp = hpUrl.replace(/\/$/, '').toLowerCase()
  const hpHostname = (() => { try { return new URL(hpUrl).hostname } catch { return '' } })()

  const matched = sites.find((s) => {
    const normalized = s.siteUrl.replace(/\/$/, '').toLowerCase()
    // sc-domain: 形式（ドメインプロパティ）
    if (normalized.startsWith('sc-domain:')) {
      const domain = normalized.replace('sc-domain:', '')
      return hpHostname === domain || hpHostname.endsWith('.' + domain)
    }
    return normalizedHp.startsWith(normalized) || normalized.startsWith(normalizedHp)
  })

  return { siteUrl: matched?.siteUrl ?? sites[0]?.siteUrl ?? null, sitesRaw: sites }
}

// ----------------------------------------------------------------
// プロンプト用テキスト生成
// ----------------------------------------------------------------

/**
 * GSC データを分析プロンプトに組み込むためのテキストを生成する。
 * AIデザイナーが管理するプロンプト文字列はここで組み立てる。
 */
export function buildGscPromptSection(gscData: GscSearchData | null): string {
  if (!gscData) {
    return '## Google Search Console データ\n（Google Search Console 未連携）\n'
  }

  const queryLines = gscData.topQueries
    .map(
      (q, i) =>
        `${i + 1}. "${q.query}" — クリック:${q.clicks}, 表示:${q.impressions}, CTR:${(q.ctr * 100).toFixed(1)}%, 平均順位:${q.position.toFixed(1)}位`,
    )
    .join('\n')

  const pageLines = gscData.topPages
    .map((p, i) => `${i + 1}. ${p.page} — クリック:${p.clicks}, 表示:${p.impressions}`)
    .join('\n')

  return `## Google Search Console データ（直近90日）
検索クエリ上位${gscData.topQueries.length}件:
${queryLines}

流入ページ上位${gscData.topPages.length}件:
${pageLines}

GSCの示唆: 上記データを踏まえ、「検索で見つかっているが伝えきれていないテーマ」「CTRが低くて機会損失しているクエリ」「ブログで強化すべき検索意図」を分析に含めてください。
`
}
