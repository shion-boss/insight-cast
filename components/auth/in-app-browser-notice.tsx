'use client'

import { useEffect, useState } from 'react'
import { CharacterAvatar } from '@/components/ui'
import { getCharacter } from '@/lib/characters'

type Props = {
  /** 検出した SNS / アプリ名（例: "LINE"）。未指定時は汎用文言。 */
  appLabel?: string | null
}

/**
 * SNS in-app browser から開かれた時に Google ログインが使えないことを伝え、
 * 外部ブラウザで開き直す導線（URL コピー）を提供する案内 UI。
 *
 * Google の OAuth は embedded webview を `disallowed_useragent` (403) で
 * 弾くため、押せても Google 側でユーザーが詰まる。事前に検出して disable +
 * 案内するのが目的。auth/signup と auth/login で同じ見た目を共有する。
 */
export function InAppBrowserNotice({ appLabel }: Props) {
  const mint = getCharacter('mint')
  const [copied, setCopied] = useState(false)
  const [pageUrl, setPageUrl] = useState('')

  useEffect(() => {
    setPageUrl(window.location.href)
  }, [])

  async function handleCopy() {
    try {
      const url = pageUrl || window.location.href
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
      } else {
        // fallback: 古い iOS WebView 等でも動くよう textarea + execCommand
        const ta = document.createElement('textarea')
        ta.value = url
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2400)
    } catch {
      // クリップボードが使えない環境では URL を直接見せて手動コピーしてもらう
      setCopied(false)
    }
  }

  const intro = appLabel
    ? `${appLabel} のアプリ内ブラウザから開かれているようです。`
    : 'アプリ内ブラウザから開かれているようです。'

  return (
    <div
      role="alert"
      className="rounded-[var(--r-sm)] border border-[var(--warn)]/40 bg-[var(--warn-l)] px-4 py-3.5"
    >
      <div className="flex items-start gap-3">
        <CharacterAvatar
          src={mint?.icon48}
          alt={`${mint?.name ?? 'ミント'}のアイコン`}
          emoji={mint?.emoji}
          size={36}
          className="flex-shrink-0 mt-0.5"
        />
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-[var(--text)] leading-relaxed">
            Googleでの登録・ログインは、Safari や Chrome で開いてからお試しください。
          </p>
          <p className="mt-1.5 text-base text-[var(--text2)] leading-relaxed">
            {intro} Google の仕様で、このままだと Google 側でエラーになります。
            メニューから「ブラウザで開く」を選ぶか、下のボタンで URL をコピーして
            Safari・Chrome に貼り付けてください。
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2.5 text-base font-semibold text-white hover:bg-[var(--accent-h)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 cursor-pointer transition-colors min-h-[44px]"
            >
              {copied ? 'コピーしました' : 'このページのURLをコピー'}
            </button>
            {pageUrl && (
              <p
                className="break-all rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[13px] text-[var(--text2)] leading-relaxed"
                aria-label="このページのURL"
              >
                {pageUrl}
              </p>
            )}
            <p className="text-[13px] text-[var(--text3)] leading-relaxed">
              メールアドレスでの登録・ログインはこのままでもお使いいただけます。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
