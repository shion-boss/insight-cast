'use client'

import { useState } from 'react'
import { createProject } from '@/lib/actions/projects'
import { getCharacter } from '@/lib/characters'
import { CharacterAvatar, FieldLabel, InterviewerSpeech, PrimaryButton, TextInput } from '@/components/ui'

type CompetitorSuggestion = {
  name: string
  url: string
  summary: string
}

const MAX_COMPETITORS = 3
const MANUAL_INPUT_COUNT = 3

function normalizeUrl(raw: string) {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export default function NewProjectForm() {
  const claus = getCharacter('claus')
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [industryMemo, setIndustryMemo] = useState('')
  const [location, setLocation] = useState('')
  const [suggesting, setSuggesting] = useState(false)
  const [suggestError, setSuggestError] = useState<string | null>(null)
  const [didSuggest, setDidSuggest] = useState(false)
  const [suggestions, setSuggestions] = useState<CompetitorSuggestion[]>([])
  const [selectedUrls, setSelectedUrls] = useState<string[]>([])
  const [manualUrls, setManualUrls] = useState(Array.from({ length: MANUAL_INPUT_COUNT }, () => ''))

  const normalizedManualUrls = manualUrls.map(normalizeUrl).filter(Boolean)
  const chosenUrls = [...selectedUrls, ...normalizedManualUrls]
    .filter((value, index, array) => array.indexOf(value) === index)
    .slice(0, MAX_COMPETITORS)

  const canSuggest = Boolean(url.trim() && industryMemo.trim())
  const reachedMax = chosenUrls.length >= MAX_COMPETITORS

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
          url: url.trim(),
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
    setSelectedUrls((prev) => {
      if (prev.includes(nextUrl)) return prev.filter((url) => url !== nextUrl)
      if (chosenUrls.length >= MAX_COMPETITORS) return prev
      return [...prev, nextUrl]
    })
  }

  function updateManualUrl(index: number, value: string) {
    setManualUrls((prev) => prev.map((item, itemIndex) => itemIndex === index ? value : item))
  }

  return (
    <form action={createProject} className="space-y-6">
      <section className="bg-white rounded-2xl border border-stone-100 p-6 space-y-4">
        <div>
          <FieldLabel required>取材先名</FieldLabel>
          <TextInput
            type="text"
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: 山田工務店"
          />
        </div>
        <div>
          <FieldLabel required>自社HP URL</FieldLabel>
          <TextInput
            type="text"
            name="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
          />
          <p className="mt-1 text-xs text-stone-400">https:// がなくても大丈夫です</p>
        </div>
        <div>
          <FieldLabel>業界情報</FieldLabel>
          <TextInput
            type="text"
            value={industryMemo}
            onChange={(e) => setIndustryMemo(e.target.value)}
            placeholder="例: 地域密着の工務店、住宅リフォーム"
          />
          <p className="mt-1 text-xs text-stone-400">競合候補を探すときの手がかりに使います。</p>
        </div>
        <div>
          <FieldLabel>地域・商圏（任意）</FieldLabel>
          <TextInput
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="例: 大阪府吹田市"
          />
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-stone-100 p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-medium text-stone-700">競合HPのおすすめ</h2>
            <p className="mt-1 text-xs leading-relaxed text-stone-400">
              自社HPと業界情報をもとに、似た相手を5件ほど探します。気になる相手だけ選べば大丈夫です。
            </p>
          </div>
          <button
            type="button"
            onClick={handleSuggestCompetitors}
            disabled={suggesting || !canSuggest}
            className="shrink-0 rounded-lg border border-stone-200 px-3 py-2 text-xs text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 transition-colors cursor-pointer"
          >
            {suggesting ? '候補を探しています...' : '✨ おすすめを見る'}
          </button>
        </div>

        <div className="rounded-xl bg-stone-50 px-4 py-3 text-xs text-stone-500">
          おすすめと手入力を合わせて最大3件までです。あとから取材先の管理画面でも見直せます。
        </div>

        {!canSuggest && (
          <p className="text-xs text-stone-400">
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
              const selected = selectedUrls.includes(suggestion.url)
              const disabled = !selected && reachedMax

              return (
                <button
                  type="button"
                  key={suggestion.url}
                  onClick={() => toggleSelectedUrl(suggestion.url)}
                  disabled={disabled}
                  className={`w-full rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 ${
                    selected
                      ? 'border-stone-800 bg-stone-800 text-white'
                      : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`text-sm font-medium ${selected ? 'text-white' : 'text-stone-800'}`}>
                        {suggestion.name}
                      </p>
                      <p className={`mt-1 truncate text-xs ${selected ? 'text-stone-200' : 'text-stone-400'}`}>
                        {suggestion.url}
                      </p>
                      <p className={`mt-3 text-sm leading-relaxed ${selected ? 'text-stone-100' : 'text-stone-500'}`}>
                        {suggestion.summary}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs ${selected ? 'bg-white text-stone-800' : 'bg-stone-100 text-stone-500'}`}>
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
            <h3 className="text-xs font-medium text-stone-500">自分で追加する競合HP</h3>
            <p className="mt-1 text-xs text-stone-400">おすすめを使わず、手入力だけで3件まで登録しても大丈夫です。</p>
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

        {chosenUrls.map((urlValue) => (
          <input key={urlValue} type="hidden" name="competitor_urls" value={urlValue} />
        ))}
      </section>

      <PrimaryButton
        type="submit"
        className="w-full py-3 text-sm"
      >
        取材先を登録する
      </PrimaryButton>
    </form>
  )
}
