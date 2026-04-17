'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getCharacter } from '@/lib/characters'
import { useRouter } from 'next/navigation'
import { CharacterAvatar, InterviewerSpeech, PageHeader, PrimaryButton } from '@/components/ui'

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

type SettingsForm = {
  name: string
  url: string
  industryMemo: string
  location: string
  competitorUrls: string[]
}

const EMPTY_FORM: SettingsForm = {
  name: '',
  url: '',
  industryMemo: '',
  location: '',
  competitorUrls: ['', '', ''],
}

function normalizeForm(form: SettingsForm) {
  return {
    name: form.name.trim(),
    url: form.url.trim(),
    industryMemo: form.industryMemo.trim(),
    location: form.location.trim(),
    competitorUrls: form.competitorUrls.map((item) => item.trim()),
  }
}

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const mint = getCharacter('mint')
  const claus = getCharacter('claus')

  const [userId, setUserId] = useState('')
  const [form, setForm] = useState<SettingsForm>(EMPTY_FORM)
  const [initialForm, setInitialForm] = useState<SettingsForm>(EMPTY_FORM)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)
  const [savedProfile, setSavedProfile] = useState(false)

  const [audit, setAudit] = useState<AuditResult | null>(null)
  const [competitorAudit, setCompetitorAudit] = useState<CompetitorAuditItem[] | null>(null)
  const [auditUpdatedAt, setAuditUpdatedAt] = useState<string | null>(null)

  const [savingProfile, setSavingProfile] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])

  useEffect(() => {
    async function load() {
      setLoadingProfile(true)
      setLoadError(null)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }

      setUserId(user.id)

      const { data, error } = await supabase
        .from('profiles')
        .select('name, url, industry_memo, location, competitor_urls, hp_audit_result, competitor_audit_result, audit_updated_at')
        .eq('id', user.id)
        .single()

      if (error) {
        setLoadError('設定を読み込めませんでした。少し待ってからもう一度お試しください。')
        setLoadingProfile(false)
        return
      }

      if (data) {
        const nextForm = {
          name: data.name ?? '',
          url: data.url ?? '',
          industryMemo: data.industry_memo ?? '',
          location: data.location ?? '',
          competitorUrls: [
            data.competitor_urls?.[0] ?? '',
            data.competitor_urls?.[1] ?? '',
            data.competitor_urls?.[2] ?? '',
          ],
        }

        setForm(nextForm)
        setInitialForm(nextForm)
        setAudit(data.hp_audit_result ?? null)
        setCompetitorAudit(data.competitor_audit_result ?? null)
        setAuditUpdatedAt(data.audit_updated_at ?? null)
      }

      setLoadingProfile(false)
    }

    load()
  }, [router, supabase])

  const normalizedForm = normalizeForm(form)
  const hasUnsavedChanges = JSON.stringify(normalizeForm(initialForm)) !== JSON.stringify(normalizedForm)

  async function handleSaveProfile() {
    setSaveError(null)
    setSavingProfile(true)

    const validCompetitors = normalizedForm.competitorUrls.filter(Boolean)
    const { error } = await supabase
      .from('profiles')
      .update({
        name: normalizedForm.name,
        url: normalizedForm.url,
        industry_memo: normalizedForm.industryMemo,
        location: normalizedForm.location,
        competitor_urls: validCompetitors,
      })
      .eq('id', userId)

    if (error) {
      setSaveError('保存できませんでした。通信状況を確認して、もう一度お試しください。')
      setSavingProfile(false)
      return
    }

    setSavingProfile(false)
    setInitialForm({
      ...normalizedForm,
      competitorUrls: [
        normalizedForm.competitorUrls[0] ?? '',
        normalizedForm.competitorUrls[1] ?? '',
        normalizedForm.competitorUrls[2] ?? '',
      ],
    })
    setSavedProfile(true)
    setTimeout(() => setSavedProfile(false), 2000)
  }

  async function handleAnalyze() {
    setAnalyzeError(null)
    setAnalyzing(true)
    const res = await fetch('/api/account/analyze', { method: 'POST' })
    if (res.ok) {
      const json = await res.json()
      setAudit(json.audit ?? null)
      setCompetitorAudit(json.competitorResults?.length ? json.competitorResults : null)
      setAuditUpdatedAt(new Date().toISOString())
    } else {
      setAnalyzeError('調査を始められませんでした。保存内容を確認してから、もう一度お試しください。')
    }
    setAnalyzing(false)
  }

  async function handleSuggestCompetitors() {
    if (!form.url && !form.industryMemo) return
    setSuggesting(true)
    const res = await fetch('/api/profile/competitor-suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ industry: form.industryMemo, location: form.location, url: form.url }),
    })
    const { urls } = await res.json()
    setSuggestions(urls ?? [])
    setSuggesting(false)
  }

  function addSuggestion(sugUrl: string) {
    const empty = form.competitorUrls.findIndex((u) => !u.trim())
    if (empty === -1) return

    const next = [...form.competitorUrls]
    next[empty] = sugUrl
    setForm((prev) => ({ ...prev, competitorUrls: next }))
    setSuggestions((prev) => prev.filter((u) => u !== sugUrl))
  }

  function updateCompetitor(i: number, val: string) {
    const next = [...form.competitorUrls]
    next[i] = val
    setForm((prev) => ({ ...prev, competitorUrls: next }))
  }

  function updateField<K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-stone-50">
        <PageHeader title="設定" backHref="/dashboard" backLabel="← ダッシュボード" />

        <div className="max-w-lg mx-auto px-6 py-10">
          <InterviewerSpeech
            icon={(
              <CharacterAvatar
                src={mint?.icon48}
                alt={`${mint?.name ?? 'インタビュアー'}のアイコン`}
                emoji={mint?.emoji}
                size={48}
              />
            )}
            name={mint?.name ?? 'インタビュアー'}
            title="いまのお願いごとを確認しています。"
            description="開き終わると、このまま内容を見直せます。"
            tone="soft"
          />
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-stone-50">
        <PageHeader title="設定" backHref="/dashboard" backLabel="← ダッシュボード" />

        <div className="max-w-lg mx-auto px-6 py-10">
          <InterviewerSpeech
            icon={(
              <CharacterAvatar
                src={mint?.icon48}
                alt={`${mint?.name ?? 'インタビュアー'}のアイコン`}
                emoji={mint?.emoji}
                size={48}
              />
            )}
            name={mint?.name ?? 'インタビュアー'}
            title="設定をまだ開けません。"
            description={loadError}
            tone="soft"
          />
          <div className="mt-4">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-stone-800 text-white text-sm hover:bg-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 transition-colors cursor-pointer"
            >
              もう一度開く
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <PageHeader title="設定" backHref="/dashboard" backLabel="← ダッシュボード" />

      <div className="max-w-lg mx-auto px-6 py-8 space-y-8">
        <InterviewerSpeech
          icon={(
            <CharacterAvatar
              src={mint?.icon48}
              alt={`${mint?.name ?? 'インタビュアー'}のアイコン`}
              emoji={mint?.emoji}
              size={48}
            />
          )}
          name={mint?.name ?? 'インタビュアー'}
          title="あとからでも直せるので、いま分かる範囲で大丈夫です。"
          description="ここで整えた内容をもとに、取材班や調査班が動きやすくなります。"
          tone="soft"
        />

        <section className="bg-white rounded-xl border border-stone-100 p-4 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-stone-700">アカウント情報</p>
              <p className="text-xs text-stone-400 mt-1">
                {hasUnsavedChanges
                  ? 'いまの変更は、まだ取材班に共有されていません。'
                  : savedProfile
                    ? '保存した内容を、これからの取材に反映します。'
                    : 'いま共有されている内容を表示しています。'}
              </p>
            </div>
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
              hasUnsavedChanges
                ? 'bg-amber-50 text-amber-700'
                : savedProfile
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-stone-100 text-stone-500'
            }`}>
              {hasUnsavedChanges ? '編集中' : savedProfile ? '保存済み' : '確認中'}
            </span>
          </div>
          {saveError && <p className="text-sm text-red-500">{saveError}</p>}
        </section>

        {/* 基本情報 */}
        <section className="bg-white rounded-xl border border-stone-100 p-5 space-y-4">
          <h2 className="text-sm font-medium text-stone-700">基本情報</h2>
          {[
            { label: '店舗・企業名', key: 'name', placeholder: '例: 山田工務店' },
            { label: '自社HP URL', key: 'url', placeholder: 'https://example.com' },
            { label: '業種', key: 'industryMemo', placeholder: '例: 地域の工務店' },
            { label: '地域', key: 'location', placeholder: '例: 大阪府吹田市' },
          ].map(({ label, key, placeholder }) => (
            <div key={label}>
              <label className="block text-xs text-stone-500 mb-1">{label}</label>
              <input
                type="text"
                value={form[key as keyof SettingsForm] as string}
                onChange={(e) => updateField(key as keyof SettingsForm, e.target.value)}
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
              disabled={suggesting || (!form.url && !form.industryMemo)}
              className="text-xs px-3 py-1.5 border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 cursor-pointer transition-colors"
            >
              {suggesting ? '検索中...' : '✨ おすすめを取得'}
            </button>
          </div>
          <p className="text-xs text-stone-400">
            分かる相手だけで大丈夫です。空欄があっても、そのまま進められます。
          </p>

          <div className="space-y-2">
            {form.competitorUrls.map((u, i) => (
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
                    type="button"
                    onClick={() => updateCompetitor(i, '')}
                    className="text-stone-300 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 rounded-md cursor-pointer transition-colors"
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
                  type="button"
                  key={sugUrl}
                  onClick={() => addSuggestion(sugUrl)}
                  disabled={!form.competitorUrls.some((u) => !u.trim())}
                  className="w-full text-left px-3 py-2 border border-dashed border-stone-200 rounded-lg text-xs text-stone-500 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 cursor-pointer transition-colors truncate"
                >
                  + {sugUrl}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* 保存ボタン */}
        <PrimaryButton
          onClick={handleSaveProfile}
          disabled={savingProfile || !hasUnsavedChanges}
          className="w-full py-3 text-sm"
        >
          {savingProfile ? '保存中...' : hasUnsavedChanges ? '設定を保存する' : 'この内容で保存されています'}
        </PrimaryButton>

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
              disabled={analyzing || !form.url || hasUnsavedChanges}
              className="text-xs px-3 py-1.5 bg-stone-800 text-white rounded-lg hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 cursor-pointer transition-colors"
            >
              {analyzing ? '調査中...' : audit ? '再調査する ✨' : '調査を開始する ✨'}
            </button>
          </div>

          {analyzeError && <p className="text-sm text-red-500">{analyzeError}</p>}

          {analyzing && (
            <InterviewerSpeech
              icon={(
                <CharacterAvatar
                  src={claus?.icon48}
                  alt={`${claus?.name ?? 'インタビュアー'}のアイコン`}
                  emoji={claus?.emoji}
                  size={48}
                  className="animate-pulse"
                />
              )}
              name={claus?.name ?? 'インタビュアー'}
              title="クラウスがホームページを確認しています。"
              description="伝わっていることと、まだ出し切れていないことを整理しています。"
              tone="soft"
            />
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
              {hasUnsavedChanges
                ? '先に保存すると、その内容で調査を始められます。'
                : form.url
                ? '準備ができたら「調査を開始する」を押してください。'
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
