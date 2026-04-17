'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Audit = {
  current_content:  string[] | null
  strengths:        string[] | null
  gaps:             string[] | null
  suggested_themes: string[] | null
}

type CompetitorAnalysis = {
  gaps:          string[] | null
  advantages:    string[] | null
  competitor_id: string
  competitors:   { url: string } | null
}

type Props = {
  projectId:          string
  initialStatus:      string
  audit:              Audit | null
  competitorAnalyses: CompetitorAnalysis[]
  interviewerPath:    string
}

export default function ReportClient({
  projectId, initialStatus, audit, competitorAnalyses, interviewerPath,
}: Props) {
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)
  const [started, setStarted] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (status !== 'analyzing') return

    async function startAnalysis() {
      if (started) return
      setStarted(true)
      await fetch(`/api/projects/${projectId}/analyze`, { method: 'POST' })
    }

    startAnalysis()

    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/projects/${projectId}/analyze`)
      if (res.ok) {
        const json = await res.json()
        if (json.status === 'report_ready') {
          clearInterval(pollRef.current!)
          router.refresh()
        }
      }
    }, 5000)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [projectId, status, started, router])

  if (status === 'analyzing' || !audit) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <div className="text-4xl mb-6 animate-pulse">🦉</div>
        <h2 className="text-lg font-semibold text-stone-800 mb-2">クラウスが調査しています</h2>
        <p className="text-sm text-stone-500 mb-8">
          完了したらこのページが自動的に更新されます。
        </p>
        <div className="bg-white rounded-xl border border-stone-100 p-4 text-left space-y-3 text-sm text-stone-400">
          <p className="flex items-center gap-2">
            <span className="animate-spin inline-block">⏳</span>
            自社HPを読み込んでいます...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🦉</span>
        <p className="text-stone-700 font-medium">調査が完了しました。結果をご覧ください。</p>
      </div>

      {/* 自社HP現状 */}
      <section className="bg-white rounded-xl border border-stone-100 p-5 space-y-4">
        <h2 className="text-sm font-medium text-stone-600">あなたのHPの現状</h2>

        {audit.current_content && audit.current_content.length > 0 && (
          <div>
            <p className="text-xs text-stone-400 mb-2">現在伝えていること</p>
            <ul className="space-y-1">
              {audit.current_content.map((item, i) => (
                <li key={i} className="text-sm text-stone-600 flex gap-2">
                  <span className="text-stone-300 flex-shrink-0">・</span>{item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {audit.strengths && audit.strengths.length > 0 && (
          <div>
            <p className="text-xs text-stone-400 mb-2">強みとして見えるもの</p>
            <ul className="space-y-1">
              {audit.strengths.map((item, i) => (
                <li key={i} className="text-sm text-stone-600 flex gap-2">
                  <span className="text-green-400 flex-shrink-0">✓</span>{item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {audit.gaps && audit.gaps.length > 0 && (
          <div>
            <p className="text-xs text-stone-400 mb-2">伝えきれていないこと</p>
            <ul className="space-y-1">
              {audit.gaps.map((item, i) => (
                <li key={i} className="text-sm text-stone-600 flex gap-2">
                  <span className="text-amber-400 flex-shrink-0">△</span>{item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* 競合比較 */}
      {competitorAnalyses.length > 0 && (
        <section className="bg-white rounded-xl border border-stone-100 p-5 space-y-4">
          <h2 className="text-sm font-medium text-stone-600">競合との比較</h2>
          {competitorAnalyses.map((ca, i) => (
            <div key={i} className="space-y-3">
              {ca.competitors?.url && (
                <p className="text-xs text-stone-400 truncate">{ca.competitors.url}</p>
              )}
              {ca.gaps && ca.gaps.length > 0 && (
                <div>
                  <p className="text-xs text-stone-400 mb-1">競合が伝えていてあなたのHPにないこと</p>
                  <ul className="space-y-1">
                    {ca.gaps.map((item, j) => (
                      <li key={j} className="text-sm text-stone-600 flex gap-2">
                        <span className="text-red-300 flex-shrink-0">▲</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {ca.advantages && ca.advantages.length > 0 && (
                <div>
                  <p className="text-xs text-stone-400 mb-1">あなたのHPが競合より詳しいこと</p>
                  <ul className="space-y-1">
                    {ca.advantages.map((item, j) => (
                      <li key={j} className="text-sm text-stone-600 flex gap-2">
                        <span className="text-green-400 flex-shrink-0">◎</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* インタビューテーマ */}
      {audit.suggested_themes && audit.suggested_themes.length > 0 && (
        <section className="bg-white rounded-xl border border-stone-100 p-5 space-y-3">
          <h2 className="text-sm font-medium text-stone-600">インタビューで深めたいテーマ</h2>
          <ul className="space-y-2">
            {audit.suggested_themes.map((theme, i) => (
              <li key={i} className="text-sm text-stone-600 flex gap-2">
                <span className="text-stone-300 flex-shrink-0">💬</span>{theme}
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link
        href={interviewerPath}
        className="block w-full py-4 bg-stone-800 text-white rounded-xl hover:bg-stone-700 transition-colors text-sm text-center"
      >
        インタビューを始める →
      </Link>
    </div>
  )
}
