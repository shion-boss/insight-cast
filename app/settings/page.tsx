'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type AuditResult = {
  current_content?: string[]
  strengths?: string[]
  gaps?: string[]
  suggested_themes?: string[]
}

type CompetitorAuditItem = {
  url: string
  gaps?: string[]
  advantages?: string[]
}

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [userId, setUserId] = useState('')
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [industryMemo, setIndustryMemo] = useState('')
  const [location, setLocation] = useState('')
  const [competitorUrls, setCompetitorUrls] = useState<string[]>(['', '', ''])
  const [competitorInput, setCompetitorInput] = useState('')

  const [audit, setAudit] = useState<AuditResult | null>(null)
  const [competitorAudit, setCompetitorAudit] = useState<CompetitorAuditItem[] | null>(null)
  const [auditUpdatedAt, setAuditUpdatedAt] = useState<string | null>(null)

  const [savingProfile, setSavingProfile] = useState(false)
  const [savedProfile, setSavedProfile] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/')
      setUserId(user.id)

      const { data } = await supabase
        .from('profiles')
        .select('name, url, industry_memo, location, competitor_urls, hp_audit_result, competitor_audit_result, audit_updated_at')
        .eq('id', user.id)
        .single()

      if (data) {
        setName(data.name ?? '')
        setUrl(data.url ?? '')
        setIndustryMemo(data.industry_memo ?? '')
        setLocation(data.location ?? '')
        const urls = data.competitor_urls ?? []
        setCompetitorUrls([urls[0] ?? '', urls[1] ?? '', urls[2] ?? ''])
        setAudit(data.hp_audit_result ?? null)
        setCompetitorAudit(data.competitor_audit_result ?? null)
        setAuditUpdatedAt(data.audit_updated_at ?? null)
      }
    }
    load()
  }, [])

  async function handleSaveProfile() {
    setSavingProfile(true)
    const validCompetitors = competitorUrls.map(u => u.trim()).filter(Boolean)
    await supabase
      .from('profiles')
      .update({
        name, url, industry_memo: industryMemo, location,
        competitor_urls: validCompetitors,
      })
      .eq('id', userId)
    setSavingProfile(false)
    setSavedProfile(true)
    setTimeout(() => setSavedProfile(false), 2000)
  }

  async function handleAnalyze() {
    setAnalyzing(true)
    const res = await fetch('/api/account/analyze', { method: 'POST' })
    if (res.ok) {
      const json = await res.json()
      setAudit(json.audit ?? null)
      setCompetitorAudit(json.competitorResults?.length ? json.competitorResults : null)
      setAuditUpdatedAt(new Date().toISOString())
    }
    setAnalyzing(false)
  }

  async function handleSuggestCompetitors() {
    if (!url && !industryMemo) return
    setSuggesting(true)
    const res = await fetch('/api/profile/competitor-suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ industry: industryMemo, location, url }),
    })
    const { urls } = await res.json()
    setSuggestions(urls ?? [])
    setSuggesting(false)
  }

  function addSuggestion(sugUrl: string) {
    const empty = competitorUrls.findIndex(u => !u.trim())
    if (empty === -1) return
    const next = [...competitorUrls]
    next[empty] = sugUrl
    setCompetitorUrls(next)
    setSuggestions(prev => prev.filter(u => u !== sugUrl))
  }

  function updateCompetitor(i: number, val: string) {
    const next = [...competitorUrls]
    next[i] = val
    setCompetitorUrls(next)
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-100 px-6 py-4 flex items-center justify-between">
        <h1 className="font-semibold text-stone-800">設定</h1>
        <Link href="/dashboard" className="text-sm text-stone-400 hover:text-stone-600 cursor-pointer">← ダッシュボード</Link>
      </header>

      <div className="max-w-lg mx-auto px-6 py-8 space-y-8">

        {/* 基本情報 */}
        <section className="bg-white rounded-xl border border-stone-100 p-5 space-y-4">
          <h2 className="text-sm font-medium text-stone-700">基本情報</h2>
          {[
            { label: '店舗・企業名', value: name, set: setName, placeholder: '例: 山田工務店' },
            { label: '自社HP URL', value: url, set: setUrl, placeholder: 'https://example.com' },
            { label: '業種', value: industryMemo, set: setIndustryMemo, placeholder: '例: 地域の工務店' },
            { label: '地域', value: location, set: setLocation, placeholder: '例: 大阪府吹田市' },
          ].map(({ label, value, set, placeholder }) => (
            <div key={label}>
              <label className="block text-xs text-stone-500 mb-1">{label}</label>
              <input
                type="text"
                value={value}
                onChange={(e) => set(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
              />
            </div>
          ))}
        </section>

        {/* 競合HP */}
        <section className="bg-white rounded-xl border border-stone-100 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-stone-700">競合HP（最大3件）</h2>
            <button
              onClick={handleSuggestCompetitors}
              disabled={suggesting || (!url && !industryMemo)}
              className="text-xs px-3 py-1.5 border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50 disabled:opacity-40 cursor-pointer transition-colors"
            >
              {suggesting ? '検索中...' : '✨ おすすめを取得'}
            </button>
          </div>

          <div className="space-y-2">
            {competitorUrls.map((u, i) => (
              <div key={i} className="flex gap-2 items-center">
                <span className="text-xs text-stone-400 w-5">{i + 1}.</span>
                <input
                  type="text"
                  value={u}
                  onChange={(e) => updateCompetitor(i, e.target.value)}
                  placeholder="https://competitor.com"
                  className="flex-1 px-3 py-2 border border-stone-200 rounded-lg text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
                />
                {u && (
                  <button
                    onClick={() => updateCompetitor(i, '')}
                    className="text-stone-300 hover:text-red-400 cursor-pointer transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* おすすめ候補 */}
          {suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-stone-400">おすすめ候補（クリックで追加）</p>
              {suggestions.map(sugUrl => (
                <button
                  key={sugUrl}
                  onClick={() => addSuggestion(sugUrl)}
                  disabled={!competitorUrls.some(u => !u.trim())}
                  className="w-full text-left px-3 py-2 border border-dashed border-stone-200 rounded-lg text-xs text-stone-500 hover:bg-stone-50 disabled:opacity-40 cursor-pointer transition-colors truncate"
                >
                  + {sugUrl}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* 保存ボタン */}
        <button
          onClick={handleSaveProfile}
          disabled={savingProfile}
          className="w-full py-3 bg-stone-800 text-white rounded-xl hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors text-sm"
        >
          {savingProfile ? '保存中...' : savedProfile ? '保存しました ✓' : '設定を保存する'}
        </button>

        {/* HP調査結果 */}
        <section className="bg-white rounded-xl border border-stone-100 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-stone-700">HP調査結果</h2>
              {auditUpdatedAt && (
                <p className="text-xs text-stone-400 mt-0.5">
                  最終更新: {new Date(auditUpdatedAt).toLocaleDateString('ja-JP')}
                </p>
              )}
            </div>
            <button
              onClick={handleAnalyze}
              disabled={analyzing || !url}
              className="text-xs px-3 py-1.5 bg-stone-800 text-white rounded-lg hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              {analyzing ? '調査中...' : audit ? '再調査する ✨' : '調査を開始する ✨'}
            </button>
          </div>

          {analyzing && (
            <div className="text-center py-6">
              <div className="text-3xl mb-2 animate-pulse">🦉</div>
              <p className="text-sm text-stone-400">クラウスが調査しています...</p>
            </div>
          )}

          {!analyzing && audit && (
            <div className="space-y-4">
              {audit.current_content?.length && (
                <div>
                  <p className="text-xs text-stone-400 mb-1">現在伝えていること</p>
                  <ul className="space-y-1">
                    {audit.current_content.map((item, i) => (
                      <li key={i} className="text-sm text-stone-600 flex gap-2">
                        <span className="text-stone-300 flex-shrink-0">・</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {audit.gaps?.length && (
                <div>
                  <p className="text-xs text-stone-400 mb-1">伝えきれていないこと</p>
                  <ul className="space-y-1">
                    {audit.gaps.map((item, i) => (
                      <li key={i} className="text-sm text-stone-600 flex gap-2">
                        <span className="text-amber-400 flex-shrink-0">△</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {audit.suggested_themes?.length && (
                <div>
                  <p className="text-xs text-stone-400 mb-1">インタビューで深めたいテーマ</p>
                  <ul className="space-y-1">
                    {audit.suggested_themes.map((item, i) => (
                      <li key={i} className="text-sm text-stone-600 flex gap-2">
                        <span className="text-stone-300 flex-shrink-0">💬</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {!analyzing && !audit && (
            <p className="text-sm text-stone-400">
              {url
                ? '「調査を開始する」を押すと、自社HPと競合HPを分析します。'
                : '先に自社HP URLを入力して保存してください。'}
            </p>
          )}

          {/* 競合調査結果 */}
          {!analyzing && competitorAudit && competitorAudit.length > 0 && (
            <div className="pt-4 border-t border-stone-100 space-y-3">
              <p className="text-xs text-stone-400">競合との比較</p>
              {competitorAudit.map((ca, i) => (
                <div key={i} className="space-y-2">
                  <p className="text-xs text-stone-400 truncate">{ca.url}</p>
                  {ca.gaps?.length && (
                    <ul className="space-y-1">
                      {ca.gaps.map((g, j) => (
                        <li key={j} className="text-sm text-stone-600 flex gap-2">
                          <span className="text-red-300 flex-shrink-0">▲</span>{g}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
