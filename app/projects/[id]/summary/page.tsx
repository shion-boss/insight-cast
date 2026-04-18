'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getCharacter } from '@/lib/characters'
import Link from 'next/link'
import { CharacterAvatar, InterviewerSpeech, PageHeader, StateCard, getButtonClass } from '@/components/ui'

type SummaryData = {
  values: string[]
  themes: string[]
  messages: { role: string; content: string }[]
  interviewerType: string
}

type ArticleRow = {
  id: string
  title: string | null
  article_type: string | null
  created_at: string
}

const ARTICLE_TYPE_LABEL: Record<string, string> = {
  client: 'クライアント視点',
  interviewer: 'インタビュアー視点',
  conversation: '会話込み',
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export default function SummaryPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const interviewId = searchParams.get('interviewId') ?? ''
  const from = searchParams.get('from')
  const router = useRouter()
  const supabase = createClient()
  const backHref = from === 'dashboard' ? '/dashboard' : `/projects/${projectId}`
  const backLabel = from === 'dashboard' ? '← ダッシュボード' : '← 取材先の管理'

  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showMessages, setShowMessages] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [articles, setArticles] = useState<ArticleRow[]>([])

  useEffect(() => {
    if (!interviewId) { router.push(`/projects/${projectId}/interviewer`); return }

    async function load() {
      try {
        setLoadError(null)

        const res = await fetch(`/api/projects/${projectId}/interview/summarize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ interviewId }),
        })
        if (!res.ok) {
          throw new Error('summary failed')
        }
        const json = await res.json()

        const { data: interview } = await supabase
          .from('interviews')
          .select('interviewer_type')
          .eq('id', interviewId)
          .single()

        const { data: messages } = await supabase
          .from('interview_messages')
          .select('role, content')
          .eq('interview_id', interviewId)
          .order('created_at', { ascending: true })

        const { data: articleRows } = await supabase
          .from('articles')
          .select('id, title, article_type, created_at')
          .eq('interview_id', interviewId)
          .order('created_at', { ascending: false })

        setData({
          values: Array.isArray(json.summary) ? json.summary : [],
          themes: Array.isArray(json.themes) ? json.themes : [],
          messages: messages ?? [],
          interviewerType: interview?.interviewer_type ?? 'mint',
        })
        setArticles((articleRows ?? []) as ArticleRow[])
      } catch {
        setLoadError('取材メモをまとめられませんでした。少し待ってから、もう一度開いてください。')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [interviewId, projectId, router, supabase])

  const char = data ? getCharacter(data.interviewerType) : null

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.2),transparent_24%),radial-gradient(circle_at_82%_10%,rgba(15,118,110,0.12),transparent_22%),linear-gradient(180deg,_#efe4d3_0%,_#f6eee2_28%,_#fbf8f2_100%)]">
        <div className="w-full max-w-md px-6">
          <StateCard
            icon={<span className="animate-pulse">📝</span>}
            title="取材メモを整理しています"
            description="まとまり次第、このまま続きを確認できます。"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.2),transparent_24%),radial-gradient(circle_at_82%_10%,rgba(15,118,110,0.12),transparent_22%),linear-gradient(180deg,_#efe4d3_0%,_#f6eee2_28%,_#fbf8f2_100%)]">
      <PageHeader title="取材メモ" backHref={backHref} backLabel={backLabel} />

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {loadError && (
          <StateCard
            icon="📝"
            title="取材メモをまだ開けません。"
            description={loadError}
            tone="warning"
            action={(
              <button
                type="button"
                onClick={() => window.location.reload()}
                className={getButtonClass('primary')}
              >
                もう一度開く
              </button>
            )}
          />
        )}

        <InterviewerSpeech
          icon={(
            <CharacterAvatar
              src={char?.icon48}
              alt={`${char?.name ?? 'インタビュアー'}のアイコン`}
              emoji={char?.emoji ?? '📝'}
              size={48}
            />
          )}
          name={char?.name ?? 'インタビュアー'}
          title={char?.name ? `${char.name}からメモが届きました` : '取材メモが届きました'}
          description="インタビューで引き出せた内容を、このまま記事づくりに使えます。"
        />

        {/* 引き出せた価値 */}
        <section className="bg-white rounded-xl border border-stone-100 p-5">
          <h2 className="text-sm font-medium text-stone-600 mb-3">引き出せた価値</h2>
          {data?.values && data.values.length > 0 ? (
            <ul className="space-y-2">
              {data.values.map((v, i) => (
                <li key={i} className="text-sm text-stone-700 flex gap-2">
                  <span className="text-amber-400 flex-shrink-0 mt-0.5">●</span>
                  {v}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-stone-400">もう少し話を重ねると、ここに整理した内容が並びます。</p>
          )}
        </section>

        {/* 記事テーマ（各テーマから記事生成可能） */}
        {data?.themes && data.themes.length > 0 && (
          <section className="bg-white rounded-xl border border-stone-100 p-5">
            <h2 className="text-sm font-medium text-stone-600 mb-3">記事にできそうなテーマ</h2>
            <ul className="space-y-3">
              {data.themes.map((t, i) => (
                <li key={i} className="flex items-center justify-between gap-3">
                  <div className="text-sm text-stone-700 flex gap-2 min-w-0">
                    <span className="text-stone-300 flex-shrink-0">💬</span>
                    <span className="truncate">{t}</span>
                  </div>
                  <Link
                    href={`/projects/${projectId}/article?interviewId=${interviewId}${from === 'dashboard' ? '&from=dashboard' : ''}&theme=${encodeURIComponent(t)}`}
                    className="text-xs px-3 py-1.5 border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 flex-shrink-0 transition-colors"
                  >
                    記事を作る
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* やり取りの折りたたみ */}
        <section className="bg-white rounded-xl border border-stone-100 p-5">
          <button
            onClick={() => setShowMessages(!showMessages)}
            className="flex items-center justify-between w-full text-sm font-medium text-stone-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 rounded-md cursor-pointer"
          >
            やり取りを見る
            <span className="text-stone-300">{showMessages ? '▲' : '▼'}</span>
          </button>
          {showMessages && (
            <div className="mt-4 space-y-3 max-h-80 overflow-y-auto">
              {data?.messages.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role !== 'user' && (
                    <CharacterAvatar
                      src={char?.icon48}
                      alt={`${char?.name ?? 'インタビュアー'}のアイコン`}
                      emoji={char?.emoji}
                      size={36}
                      className="mt-1"
                    />
                  )}
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-stone-100 text-stone-600'
                      : 'bg-amber-50 text-stone-700 border border-amber-100 rounded-tl-sm'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl border border-stone-100 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-medium text-stone-600">このインタビューから作った記事</h2>
              <p className="mt-1 text-xs text-stone-400">過去に作成した記事もここから開けます。</p>
            </div>
            <Link
              href="/articles"
              className="text-xs text-stone-500 hover:text-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 rounded-md transition-colors"
            >
              記事一覧へ
            </Link>
          </div>

          {articles.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-stone-200 px-4 py-5 text-sm text-stone-400">
              まだ記事はありません。この取材内容から最初の記事を作れます。
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {articles.map((article) => (
                <li key={article.id}>
                  <Link
                    href={`/projects/${projectId}/articles/${article.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-stone-100 bg-stone-50 px-4 py-3 hover:border-stone-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-stone-800">{article.title || '記事'}</p>
                      <p className="mt-1 text-xs text-stone-400">
                        {ARTICLE_TYPE_LABEL[article.article_type ?? ''] ?? '記事'} ・ {formatDateTime(article.created_at)}
                      </p>
                    </div>
                    <span className="text-sm text-stone-300">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* アクション */}
        <div className="space-y-3">
          <Link
            href={`/projects/${projectId}/article?interviewId=${interviewId}${from === 'dashboard' ? '&from=dashboard' : ''}`}
            className="block w-full py-4 bg-stone-800 text-white rounded-xl hover:bg-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 transition-colors text-sm text-center"
          >
            この内容で記事を作る →
          </Link>
          <Link
            href={`/projects/${projectId}/interview?interviewId=${interviewId}${from === 'dashboard' ? '&from=dashboard' : ''}`}
            className="block w-full py-2 text-sm text-stone-400 hover:text-stone-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 rounded-md text-center transition-colors"
          >
            もう少し話す
          </Link>
          <Link
            href={backHref}
            className="block w-full py-2 text-sm text-stone-300 hover:text-stone-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 rounded-md text-center transition-colors"
          >
            いったんここまでにする
          </Link>
        </div>
      </div>
    </div>
  )
}
