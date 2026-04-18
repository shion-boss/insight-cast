import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCharacter } from '@/lib/characters'
import { CharacterAvatar, InterviewerSpeech, PageHeader } from '@/components/ui'
import StartAnalysisButton from '@/components/start-analysis-button'
import { isProjectAnalysisReady } from '@/lib/analysis/project-readiness'

type InterviewRow = {
  id: string
  interviewer_type: string
  status: string | null
  summary: string | null
  created_at: string
}

type ArticleRow = {
  id: string
  interview_id: string | null
  article_type: string | null
  title: string | null
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

function getInterviewHref(projectId: string, interview: InterviewRow, hasArticles: boolean) {
  if (hasArticles) return null
  if (interview.summary || interview.status === 'completed') return `/projects/${projectId}/summary?interviewId=${interview.id}`
  return `/projects/${projectId}/interview?interviewId=${interview.id}`
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: project } = await supabase
    .from('projects')
    .select('id, name, hp_url, status, updated_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!project) redirect('/dashboard')

  const { data: interviewRows } = await supabase
    .from('interviews')
    .select('id, interviewer_type, status, summary, created_at')
    .eq('project_id', id)
    .order('created_at', { ascending: false })

  const { data: auditRow } = await supabase
    .from('hp_audits')
    .select('id, raw_data')
    .eq('project_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: competitors } = await supabase
    .from('competitors')
    .select('id, url')
    .eq('project_id', id)

  const { data: competitorAnalyses } = await supabase
    .from('competitor_analyses')
    .select('competitor_id, raw_data')
    .eq('project_id', id)

  const interviews = (interviewRows ?? []) as InterviewRow[]
  const analysisReady = isProjectAnalysisReady({
    project,
    competitors: competitors ?? [],
    audit: auditRow,
    competitorAnalyses: competitorAnalyses ?? [],
  }).isReady

  let articles: ArticleRow[] = []
  if (interviews.length > 0) {
    const { data: articleRows } = await supabase
      .from('articles')
      .select('id, interview_id, article_type, title, created_at')
      .in('interview_id', interviews.map((interview) => interview.id))
      .order('created_at', { ascending: false })

    articles = (articleRows ?? []) as ArticleRow[]
  }

  const articlesByInterview = new Map<string, ArticleRow[]>()
  for (const article of articles) {
    if (!article.interview_id) continue
    const current = articlesByInterview.get(article.interview_id) ?? []
    current.push(article)
    articlesByInterview.set(article.interview_id, current)
  }
  const mint = getCharacter('mint')

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.2),transparent_24%),radial-gradient(circle_at_82%_10%,rgba(15,118,110,0.12),transparent_22%),linear-gradient(180deg,_#efe4d3_0%,_#f6eee2_28%,_#fbf8f2_100%)]">
      <PageHeader title="Insight Cast" backHref="/dashboard" backLabel="← ダッシュボード" />

      <main className="mx-auto max-w-3xl px-6 py-8 space-y-6">
        <section className="rounded-2xl border border-stone-100 bg-white p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs text-stone-400">取材先</p>
              <h1 className="mt-1 text-lg font-semibold text-stone-800">{project.name || project.hp_url}</h1>
              <p className="mt-2 truncate text-sm text-stone-500">{project.hp_url}</p>
              <p className="mt-1 text-xs text-stone-400">更新日: {formatDateTime(project.updated_at)}</p>
            </div>
            <div className="flex flex-col gap-2 sm:min-w-52">
              <Link
                href={`/projects/${id}/interviewer`}
                className="inline-flex items-center justify-center rounded-xl bg-stone-800 px-4 py-3 text-sm text-white hover:bg-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 transition-colors"
              >
                新しいインタビュー
              </Link>
              {!analysisReady || project.status === 'analysis_pending' ? (
                <StartAnalysisButton
                  projectId={id}
                  projectName={project.name || project.hp_url}
                  className="inline-flex items-center justify-center rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 transition-colors"
                />
              ) : project.status === 'analyzing' ? (
                <div className="inline-flex items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  調査中
                </div>
              ) : (
                <>
                  <Link
                    href={`/projects/${id}/report`}
                    prefetch={false}
                    className="inline-flex items-center justify-center rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 transition-colors"
                  >
                    この取材先の調査結果を見る
                  </Link>
                  <StartAnalysisButton
                    projectId={id}
                    projectName={project.name || project.hp_url}
                    force
                    className="inline-flex items-center justify-center rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 transition-colors"
                  />
                </>
              )}
            </div>
          </div>
        </section>

        {interviews.length === 0 ? (
          <>
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
              title="まだこの取材先のインタビューはありません。"
              description="必要なタイミングで取材班を呼べば、ここに実施履歴と記事がまとまっていきます。"
              tone="soft"
            />
            <div className="mt-4">
              <Link
                href={`/projects/${id}/interviewer`}
                className="inline-flex items-center justify-center rounded-xl bg-stone-800 px-5 py-3 text-sm text-white hover:bg-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 transition-colors"
              >
                最初のインタビューを始める
              </Link>
            </div>
          </>
        ) : (
          <section className="space-y-4">
            <div>
              <h2 className="text-sm font-medium text-stone-800">インタビュー一覧</h2>
              <p className="mt-1 text-xs text-stone-400">各インタビューに、その取材から作った記事をひもづけて見られます。</p>
            </div>

            <div className="space-y-4">
              {interviews.map((interview) => {
                const interviewArticles = articlesByInterview.get(interview.id) ?? []
                const char = getCharacter(interview.interviewer_type)
                    const latestArticle = interviewArticles[0] ?? null
                    const primaryHref = latestArticle
                      ? `/projects/${id}/articles/${latestArticle.id}`
                      : getInterviewHref(id, interview, interviewArticles.length > 0)

                return (
                  <details key={interview.id} className="group rounded-2xl border border-stone-100 bg-white" open={false}>
                    <summary className="list-none p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3 min-w-0">
                          <CharacterAvatar
                            src={char?.icon48}
                            alt={`${char?.name ?? 'インタビュアー'}のアイコン`}
                            emoji={char?.emoji}
                            size={44}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-stone-800">{formatDateTime(interview.created_at)}</p>
                            <p className="mt-1 text-xs text-stone-500">{char?.name ?? 'インタビュアー'} が担当</p>
                            <p className="mt-1 text-xs text-stone-400">
                              {interviewArticles.length > 0 ? `作成した記事 ${interviewArticles.length} 本` : 'まだ記事は作っていません'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3 sm:justify-end">
                          <span className="text-xs text-stone-400">
                            {interview.summary ? '取材メモあり' : '進行中のインタビュー'}
                          </span>
                          <span className="rounded-full border border-stone-200 px-3 py-1 text-xs text-stone-500 transition group-open:bg-stone-800 group-open:text-white group-open:border-stone-800">
                            <span className="group-open:hidden">開く</span>
                            <span className="hidden group-open:inline">閉じる</span>
                          </span>
                        </div>
                      </div>
                    </summary>

                    <div className="border-t border-stone-100 p-5 space-y-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <Link
                          href={primaryHref}
                          className="inline-flex items-center justify-center rounded-xl border border-stone-200 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 transition-colors"
                        >
                          {latestArticle ? '作成済み記事を見る' : interview.summary || interview.status === 'completed' ? '取材メモを見る' : 'インタビューを開く'}
                        </Link>
                        <Link
                          href={`/projects/${id}/article?interviewId=${interview.id}`}
                          className="inline-flex items-center justify-center rounded-xl bg-stone-800 px-4 py-2 text-sm text-white hover:bg-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 transition-colors"
                        >
                          この取材から記事を作る
                        </Link>
                      </div>

                      {interview.summary && (
                        <div className="rounded-xl bg-stone-50 p-4">
                          <p className="text-xs text-stone-400">取材メモ</p>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-stone-600">
                            {interview.summary}
                          </p>
                        </div>
                      )}

                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-sm font-medium text-stone-700">このインタビューから作った記事</h3>
                        </div>

                        {interviewArticles.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-stone-200 px-4 py-5 text-sm text-stone-400">
                            まだ記事はありません。この取材から必要な記事を作れます。
                          </div>
                        ) : (
                          <ul className="space-y-3">
                            {interviewArticles.map((article) => (
                              <li key={article.id}>
                                <Link
                                  href={`/projects/${id}/articles/${article.id}`}
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
                      </div>
                    </div>
                  </details>
                )
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
