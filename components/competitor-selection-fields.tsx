'use client'

import { useEffect, useState } from 'react'
import { getCharacter } from '@/lib/characters'
import { CharacterAvatar, DevAiLabel, FieldLabel, InterviewerSpeech, TextInput } from '@/components/ui'

type CompetitorSuggestion = {
  name: string
  url: string
  summary: string
}

type Props = {
  siteUrl: string
  initialUrls?: string[]
  initialIndustryMemo?: string
  initialLocation?: string
  inputName?: string
  helperText?: string
  maxCompetitors?: number
  onSelectionStateChange?: (state: {
    urls: string[]
    canSubmit: boolean
    issue: string | null
  }) => void
}

const MANUAL_INPUT_COUNT = 3

function normalizeUrl(raw: string) {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function normalizeComparableUrl(raw: string) {
  const normalized = normalizeUrl(raw)
  if (!normalized) return ''

  try {
    const url = new URL(normalized)
    url.hash = ''
    url.search = ''
    if (url.pathname !== '/') {
      url.pathname = url.pathname.replace(/\/+$/, '')
    }
    return url.toString().replace(/\/+$/, '').toLowerCase()
  } catch {
    return normalized.replace(/\/+$/, '').toLowerCase()
  }
}

function buildInitialManualUrls(initialUrls: string[]) {
  return Array.from({ length: MANUAL_INPUT_COUNT }, (_, index) => initialUrls[index] ?? '')
}

export default function CompetitorSelectionFields({
  siteUrl,
  initialUrls = [],
  initialIndustryMemo = '',
  initialLocation = '',
  inputName = 'competitor_urls',
  helperText,
  maxCompetitors = 3,
  onSelectionStateChange,
}: Props) {
  const MAX_COMPETITORS = maxCompetitors
  const defaultHelperText = `おすすめと手入力を合わせて最大${MAX_COMPETITORS}件までです。あとから取材先の管理画面でも見直せます。`
  const resolvedHelperText = helperText ?? defaultHelperText
  const claus = getCharacter('claus')
  const [industryMemo, setIndustryMemo] = useState(initialIndustryMemo)
  const [location, setLocation] = useState(initialLocation)
  const [suggesting, setSuggesting] = useState(false)
  const [suggestError, setSuggestError] = useState<string | null>(null)
  const [didSuggest, setDidSuggest] = useState(false)
  const [suggestions, setSuggestions] = useState<CompetitorSuggestion[]>([])
  const [selectedUrls, setSelectedUrls] = useState<string[]>([])
  const [manualUrls, setManualUrls] = useState(() => buildInitialManualUrls(initialUrls))

  const normalizedManualUrls = manualUrls.map(normalizeUrl).filter(Boolean)
  const chosenUrls = [...selectedUrls, ...normalizedManualUrls]
    .filter((value, index, array) => array.indexOf(value) === index)

  const normalizedSiteUrl = normalizeComparableUrl(siteUrl)
  const includesOwnSite = normalizedSiteUrl
    ? chosenUrls.some((urlValue) => normalizeComparableUrl(urlValue) === normalizedSiteUrl)
    : false
  const overLimit = chosenUrls.length > MAX_COMPETITORS
  const validationIssue = includesOwnSite
    ? '自社HPと同じURLは参考HPに入れられません。別の参考HPに差し替えてください。'
    : overLimit
      ? `参考HPは最大${MAX_COMPETITORS}件までです。${chosenUrls.length}件入っているので、1件以上外してください。`
      : null
  const canSubmit = validationIssue === null

  const canSuggest = Boolean(siteUrl.trim() && industryMemo.trim())
  const reachedMax = chosenUrls.length >= MAX_COMPETITORS

  useEffect(() => {
    onSelectionStateChange?.({
      urls: chosenUrls,
      canSubmit,
      issue: validationIssue,
    })
  }, [canSubmit, chosenUrls, onSelectionStateChange, validationIssue])

  async function handleSuggestCompetitors() {
    if (!canSuggest) return

    setSuggesting(true)
    setSuggestError(null)
    setDidSuggest(false)

    try {
      const res = await fetch('/api/profile/competitor-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: siteUrl.trim(),
          industry: industryMemo.trim(),
          location: location.trim(),
        }),
      })

      if (!res.ok) throw new Error('request failed')

      const json = await res.json()
      setSuggestions(Array.isArray(json.suggestions) ? json.suggestions : [])
      setDidSuggest(true)
    } catch {
      setSuggestError('おすすめ候補をまだ探せませんでした。少し待ってから、もう一度お試しください。')
      setSuggestions([])
      setDidSuggest(false)
    } finally {
      setSuggesting(false)
    }
  }

  function toggleSelectedUrl(nextUrl: string) {
    const normalized = normalizeUrl(nextUrl)

    setSelectedUrls((prev) => {
      if (prev.includes(normalized)) return prev.filter((url) => url !== normalized)
      if (chosenUrls.length >= MAX_COMPETITORS) return prev
      return [...prev, normalized]
    })
  }

  function updateManualUrl(index: number, value: string) {
    setManualUrls((prev) => prev.map((item, itemIndex) => itemIndex === index ? value : item))
  }

  function removeChosenUrl(targetUrl: string) {
    const comparable = normalizeComparableUrl(targetUrl)

    setSelectedUrls((prev) =>
      prev.filter((value) => normalizeComparableUrl(value) !== comparable),
    )
    setManualUrls((prev) =>
      prev.map((value) =>
        normalizeComparableUrl(value) === comparable ? '' : value,
      ),
    )
  }

  return (
    <section className="bg-white rounded-2xl border border-[var(--border)] p-6 space-y-4">
      <div className="space-y-4">
        <div>
          <FieldLabel htmlFor="competitor-industry">業界情報</FieldLabel>
          <TextInput
            id="competitor-industry"
            type="text"
            name="industry_memo"
            value={industryMemo}
            onChange={(e) => setIndustryMemo(e.target.value)}
            placeholder="例: 地域密着の工務店、住宅リフォーム"
          />
          <p className="mt-1 text-xs text-[var(--text3)]">競合候補を探すときの手がかりに使います。</p>
        </div>
        <div>
          <FieldLabel htmlFor="competitor-location">地域・商圏（任意）</FieldLabel>
          <TextInput
            id="competitor-location"
            type="text"
            name="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="例: 大阪府吹田市"
          />
        </div>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium text-[var(--text2)]">参考にするHPのおすすめ</h2>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text3)]">
            自社HPと業界情報をもとに、似た相手のHPを5件ほど探します。比較することで、テーマの提案に役立てます。
          </p>
        </div>
        <button
          type="button"
          onClick={handleSuggestCompetitors}
          disabled={suggesting || !canSuggest}
          className="shrink-0 rounded-lg border border-[var(--border)] px-3 py-2 text-xs text-[var(--text2)] hover:bg-[var(--bg2)] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 transition-colors cursor-pointer"
        >
          {suggesting ? '候補を探しています...' : <DevAiLabel>おすすめを見る</DevAiLabel>}
        </button>
      </div>

      <div className="rounded-xl bg-[var(--bg2)] px-4 py-3 text-xs text-[var(--text3)]">
        <div className="flex items-center justify-between gap-3">
          <span>{resolvedHelperText}</span>
          <span className="whitespace-nowrap font-medium text-[var(--text2)]">{chosenUrls.length}/{MAX_COMPETITORS}件</span>
        </div>
      </div>

      {reachedMax && !overLimit && (
        <p className="text-xs text-[var(--warn)]">
          競合は3件までです。別の候補を選ぶには、いま入っているURLを1件外してください。
        </p>
      )}

      {validationIssue && (
        <p className="rounded-lg bg-[var(--err-l)] px-3 py-2 text-xs leading-relaxed text-[var(--err)]">
          {validationIssue}
        </p>
      )}

      {!canSuggest && (
        <p className="text-xs text-[var(--text3)]">
          おすすめを見るには、自社HP URL と業界情報の両方を入力してください。
        </p>
      )}

      {suggestError && (
        <InterviewerSpeech
          icon={(
            <CharacterAvatar
              src={claus?.icon48}
              alt={`${claus?.name ?? 'インタビュアー'}のアイコン`}
              emoji={claus?.emoji}
              size={44}
            />
          )}
          name={claus?.name ?? 'インタビュアー'}
          title="おすすめ候補をまだ出せません。"
          description={suggestError}
          tone="soft"
        />
      )}

      {didSuggest && suggestions.length === 0 && !suggestError && (
        <InterviewerSpeech
          icon={(
            <CharacterAvatar
              src={claus?.icon48}
              alt={`${claus?.name ?? 'インタビュアー'}のアイコン`}
              emoji={claus?.emoji}
              size={44}
            />
          )}
          name={claus?.name ?? 'インタビュアー'}
          title="似た競合候補をまだ見つけられませんでした。"
          description="業界情報をもう少し具体的にすると、候補が出やすくなります。手入力で進めても大丈夫です。"
          tone="soft"
        />
      )}

      {suggestions.length > 0 && (
        <div className="space-y-3">
          {suggestions.map((suggestion) => {
            const normalizedUrl = normalizeUrl(suggestion.url)
            const selected = selectedUrls.includes(normalizedUrl)
            const disabled = !selected && reachedMax

            return (
              <button
                type="button"
                key={suggestion.url}
                onClick={() => toggleSelectedUrl(suggestion.url)}
                disabled={disabled}
                className={`w-full rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 ${
                  selected
                    ? 'border-[var(--text)] bg-[var(--text)] text-white'
                    : 'border-[var(--border)] bg-white text-[var(--text2)] hover:border-[var(--border2)]'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${selected ? 'text-white' : 'text-[var(--text)]'}`}>
                      {suggestion.name}
                    </p>
                    <p className={`mt-1 truncate text-xs ${selected ? 'text-[rgba(255,255,255,0.7)]' : 'text-[var(--text3)]'}`}>
                      {normalizedUrl}
                    </p>
                    <p className={`mt-3 text-sm leading-relaxed ${selected ? 'text-[rgba(255,255,255,0.55)]' : 'text-[var(--text3)]'}`}>
                      {suggestion.summary}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs ${selected ? 'bg-white text-[var(--text)]' : 'bg-[var(--bg2)] text-[var(--text3)]'}`}>
                    {selected ? '選択中' : '選ぶ'}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <div className="space-y-3 pt-2">
        <div>
          <h3 className="text-xs font-medium text-[var(--text3)]">URLを直接入力する</h3>
          <p className="mt-1 text-xs text-[var(--text3)]">参考にしたいHPのURLを知っていれば、そのまま入力できます。{MAX_COMPETITORS}件まで登録できます。</p>
        </div>
        {Array.from({ length: MANUAL_INPUT_COUNT }).map((_, index) => (
          <TextInput
            key={index}
            type="text"
            value={manualUrls[index] ?? ''}
            onChange={(e) => updateManualUrl(index, e.target.value)}
            placeholder="https://competitor.com"
            disabled={reachedMax && !(manualUrls[index] ?? '').trim()}
          />
        ))}
      </div>

      {chosenUrls.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-[var(--text3)]">いま登録されるHP</p>
          <div className="flex flex-wrap gap-2">
            {chosenUrls.map((urlValue) => (
              <button
                type="button"
                key={urlValue}
                onClick={() => removeChosenUrl(urlValue)}
                className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1 text-xs ${
                  normalizeComparableUrl(urlValue) === normalizedSiteUrl
                    ? 'border-[var(--err)]/30 bg-[var(--err-l)] text-[var(--err)]'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text2)]'
                }`}
                title={urlValue}
              >
                <span className="truncate">{urlValue}</span>
                <span className="font-semibold">×</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-[var(--text3)]">チップを押すと、そのURLを外せます。</p>
        </div>
      )}

      {canSubmit && chosenUrls.map((urlValue) => (
        <input key={urlValue} type="hidden" name={inputName} value={urlValue} />
      ))}
    </section>
  )
}
