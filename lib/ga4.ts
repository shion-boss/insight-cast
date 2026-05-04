// ----------------------------------------------------------------
// GA4 Data API: 今月の PV / セッション / ユーザーを取得する
//
// 認証は GSC OAuth と同じトークン（scope: analytics.readonly）を流用する。
// admin ダッシュボードからのみ呼ぶ前提。
// ----------------------------------------------------------------

export type Ga4MonthlyStats = {
  pageViews: number
  sessions: number
  users: number
}

type Ga4ReportResponse = {
  rows?: Array<{ metricValues?: Array<{ value?: string }> }>
}

/**
 * GA4 Data API runReport を呼び、今月（月初〜今日）の合計値を取得する。
 * 失敗時は null を返す。
 */
export async function fetchGa4MonthlyStats(
  accessToken: string,
  propertyId: string,
): Promise<Ga4MonthlyStats | null> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)

  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(propertyId)}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: fmt(startOfMonth), endDate: fmt(now) }],
        metrics: [
          { name: 'screenPageViews' },
          { name: 'sessions' },
          { name: 'totalUsers' },
        ],
      }),
      signal: AbortSignal.timeout(10000),
    },
  )

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error('[ga4] runReport error:', res.status, text)
    return null
  }

  const data = (await res.json()) as Ga4ReportResponse
  const row = data.rows?.[0]
  if (!row) return { pageViews: 0, sessions: 0, users: 0 }

  const values = row.metricValues ?? []
  return {
    pageViews: Number(values[0]?.value ?? 0),
    sessions: Number(values[1]?.value ?? 0),
    users: Number(values[2]?.value ?? 0),
  }
}

// ----------------------------------------------------------------
// 比較取得: 直近 N 日 vs その前 N 日 / 上位ページ
// ----------------------------------------------------------------

export type Ga4Comparison = {
  current: Ga4MonthlyStats
  previous: Ga4MonthlyStats
  topPages: Array<{ path: string; pageViews: number; sessions: number }>
}

/**
 * GA4 で「直近N日」+「その前N日」+「上位ページTOP10」をまとめて取得する。
 * 失敗時は null を返す。
 */
export async function fetchGa4Comparison(
  accessToken: string,
  propertyId: string,
  days = 30,
): Promise<Ga4Comparison | null> {
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  const today = new Date()
  const oneDay = 24 * 60 * 60 * 1000

  const currentEnd = today
  const currentStart = new Date(today.getTime() - days * oneDay)
  const previousEnd = new Date(currentStart.getTime() - oneDay)
  const previousStart = new Date(previousEnd.getTime() - days * oneDay)

  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(propertyId)}:runReport`
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  }

  const [comparisonRes, topPagesRes] = await Promise.all([
    // current + previous をまとめて要求
    fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        dateRanges: [
          { startDate: fmt(currentStart), endDate: fmt(currentEnd), name: 'current' },
          { startDate: fmt(previousStart), endDate: fmt(previousEnd), name: 'previous' },
        ],
        metrics: [
          { name: 'screenPageViews' },
          { name: 'sessions' },
          { name: 'totalUsers' },
        ],
      }),
      signal: AbortSignal.timeout(10000),
    }),
    // 上位ページ TOP10（直近30日）
    fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        dateRanges: [{ startDate: fmt(currentStart), endDate: fmt(currentEnd) }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }, { name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 10,
      }),
      signal: AbortSignal.timeout(10000),
    }),
  ])

  if (!comparisonRes.ok || !topPagesRes.ok) {
    const errRes = !comparisonRes.ok ? comparisonRes : topPagesRes
    const text = await errRes.text().catch(() => '')
    console.error('[ga4] comparison error:', errRes.status, text)
    return null
  }

  type ReportResp = {
    rows?: Array<{
      dimensionValues?: Array<{ value?: string }>
      metricValues?: Array<{ value?: string }>
    }>
  }

  const [comparisonData, topPagesData] = await Promise.all([
    comparisonRes.json() as Promise<ReportResp>,
    topPagesRes.json() as Promise<ReportResp>,
  ])

  // dateRange が複数あるとき、各 row の最後の dimensionValues に dateRange 名が入る
  const parseDateRangeRows = (rows: ReportResp['rows']) => {
    const result: Record<string, Ga4MonthlyStats> = {
      current: { pageViews: 0, sessions: 0, users: 0 },
      previous: { pageViews: 0, sessions: 0, users: 0 },
    }
    for (const row of rows ?? []) {
      const rangeName = row.dimensionValues?.[0]?.value ?? 'current'
      const v = row.metricValues ?? []
      if (rangeName === 'current' || rangeName === 'previous') {
        result[rangeName] = {
          pageViews: Number(v[0]?.value ?? 0),
          sessions: Number(v[1]?.value ?? 0),
          users: Number(v[2]?.value ?? 0),
        }
      }
    }
    return result
  }

  const ranges = parseDateRangeRows(comparisonData.rows)

  const topPages = (topPagesData.rows ?? []).map((row) => ({
    path: row.dimensionValues?.[0]?.value ?? '',
    pageViews: Number(row.metricValues?.[0]?.value ?? 0),
    sessions: Number(row.metricValues?.[1]?.value ?? 0),
  }))

  return {
    current: ranges.current,
    previous: ranges.previous,
    topPages,
  }
}
