import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCharacter } from '@/lib/characters'
import AppHeaderActions from '@/components/app-header-actions'
import StartAnalysisButton from '@/components/start-analysis-button'
import { isProjectAnalysisReady } from '@/lib/analysis/project-readiness'
import { buildArticleCountByInterview, getInterviewFlags, getInterviewManagementHref, type InterviewArticleRef } from '@/lib/interview-state'
import { ButtonLink, CharacterAvatar, InterviewerSpeech, PageHeader, StatusPill, getButtonClass, getInteractivePanelClass, getPanelClass } from '@/components/ui'

type InterviewRow = {
  id: string
  project_id: string
  interviewer_type: string
  status: string | null
  summary: string | null
  themes: string[] | null
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

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .maybeSingle()

  const { data: project } = await supabase
    .from('projects')
    .select('id, name, hp_url, status, updated_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!project) redirect('/dashboard')

  const { data: interviewRows } = await supabase
    .from('interviews')
    .select('id, project_id, interviewer_type, status, summary, themes, created_at')
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

  const { articleCountByInterview } = buildArticleCountByInterview(articles as InterviewArticleRef[])
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
      <PageHeader
        title={project.name || project.hp_url}
        description={project.hp_url}
        backHref="/projects"
        backLabel="← 取材先一覧"
        right={(
          <AppHeaderActions active="projects" accountLabel={profile?.name ?? user.email ?? '設定'} />
        )}
      />

      <main className="mx-auto max-w-3xl px-6 py-8 space-y-6">
        <section className={getPanelClass('rounded-[2rem] p-6')}>
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
                className={getButtonClass('primary')}
              >
                新しいインタビュー
              </Link>
              {!analysisReady || project.status === 'analysis_pending' ? (
                <StartAnalysisButton
                  projectId={id}
                  projectName={project.name || project.hp_url}
                  className={getButtonClass('secondary')}
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
                    className={getButtonClass('secondary')}
                  >
                    この取材先の調査結果を見る
                  </Link>
                  <StartAnalysisButton
                    projectId={id}
                    projectName={project.name || project.hp_url}
                    force
                    className={getButtonClass('secondary')}
                  />
                </>
              )}
            </div>
          </div>
        </section>

        <section className={getPanelClass('rounded-[2rem] p-6')}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs text-stone-400">競合設定</p>
              <h2 className="mt-1 text-sm font-medium text-stone-800">
                {competitors && competitors.length > 0 ? `${competitors.length}件の競合HPを設定中` : 'まだ競合HPは設定していません'}
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-stone-500">
                登録時と同じように、おすすめから選ぶことも、URLを手入力することもできます。
              </p>

              {competitors && competitors.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {competitors.map((competitor) => (
                    <li
                      key={competitor.id}
                      className="truncate rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-500"
                    >
                      {competitor.url}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Link
              href={`/projects/${id}/competitors`}
              className={getButtonClass('secondary')}
            >
              競合設定を見直す
            </Link>
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
              <ButtonLink href={`/projects/${id}/interviewer`}>最初のインタビューを始める</ButtonLink>
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
                const { hasSummary, hasArticle, hasUncreatedThemes } = getInterviewFlags(interview, articleCountByInterview)
                const managementHref = getInterviewManagementHref(interview, articleCountByInterview, 'project')

                return (
                  <details key={interview.id} className={getPanelClass('group')} open={false}>
                    <summary className="list-none p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <CharacterAvatar
                            src={char?.icon48}
                            alt={`${char?.name ?? 'インタビュアー'}のアイコン`}
                            emoji={char?.emoji}
                            size={44}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-stone-800">{formatDateTime(interview.created_at)}</p>
                            <p className="mt-1 text-xs text-stone-500">{char?.name ?? 'インタビュアー'} が担当</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {hasSummary && <StatusPill tone="neutral">取材メモあり</StatusPill>}
                              {hasArticle && <StatusPill tone="success">記事あり</StatusPill>}
                              {hasUncreatedThemes && <StatusPill tone="warning">未作成テーマあり</StatusPill>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3 sm:justify-end">
                          <span className="text-xs text-stone-400">
                            {interviewArticles.length > 0 ? `作成した記事 ${interviewArticles.length} 本` : 'まだ記事は作っていません'}
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
                          href={managementHref}
                          className={getButtonClass('secondary')}
                        >
                          {hasSummary ? '取材メモを見る' : 'インタビューを開く'}
                        </Link>
                        <Link
                          href={`/projects/${id}/article?interviewId=${interview.id}`}
                          className={getButtonClass('primary')}
                        >
                          {hasArticle ? '追加で記事を作る' : 'この取材から記事を作る'}
                        </Link>
                      </div>

                      {interview.summary && (
                        <div className="rounded-xl border border-stone-200/80 bg-stone-50/80 p-4">
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
                                  className={getInteractivePanelClass('flex items-center justify-between gap-3 rounded-xl px-4 py-3')}
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
