export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCharacter } from '@/lib/characters'
import InterviewStatusPills from '@/components/interview-status-pills'
import { isProjectAnalysisReady, resolveProjectAnalysisStatus } from '@/lib/analysis/project-readiness'
import { buildArticleCountByInterview, getInterviewFlags, getInterviewManagementHref, type InterviewArticleRef } from '@/lib/interview-state'
import { getProjectAnalysisBadge, getProjectContentBadge } from '@/lib/project-badges'
import { ButtonLink, CharacterAvatar, InterviewerSpeech, StatusPill, getButtonClass } from '@/components/ui'
import { AppShell, checkIsAdmin } from '@/components/app-shell'
import { getStoredClassifications } from '@/lib/content-map'
import { getStoredSiteBlogPosts } from '@/lib/site-blog-support'
import { ContentMapPanel } from '@/app/dashboard/_components/content-map-panel'
import { AnalyticsSection, type HeatmapEntry, type MonthlyPoint } from '@/app/dashboard/_components/analytics-section'
import AnalysisStatusPanel from './AnalysisStatusPanel'

type InterviewRow = {
  id: string
  project_id: string
  interviewer_type: string
  status: string | null
  summary: string | null
  themes: string[] | null
  article_status: string | null
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
  let supabase
  let user
  try {
    supabase = await createClient()
    const authResult = await supabase.auth.getUser()
    user = authResult.data.user
  } catch {
    redirect('/')
  }
  if (!supabase) redirect('/')
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
    .select('id, project_id, interviewer_type, status, summary, themes, article_status, created_at')
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
  const analysisStatus = resolveProjectAnalysisStatus(project.status, analysisReady)

  const reanalysisNextAvailableAt = (() => {
    if (process.env.NODE_ENV === 'development') return null
    const raw = auditRow?.raw_data as Record<string, unknown> | null
    const analyzedAt = typeof raw?.analyzed_at === 'string' ? new Date(raw.analyzed_at) : null
    if (!analyzedAt) return null
    const next = new Date(analyzedAt.getTime() + 30 * 24 * 60 * 60 * 1000)
    return next > new Date() ? next.toISOString() : null
  })()

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
  const analysisBadge = getProjectAnalysisBadge(analysisStatus, analysisReady)
  const contentBadge = getProjectContentBadge({
    status: project.status,
    interviewCount: interviews.length,
    articleCount: articles.length,
  })
  const mint = getCharacter('mint')
  const claus = getCharacter('claus')

  // Analytics
  const rawData = auditRow?.raw_data as Record<string, unknown> | null
  const classifications = getStoredClassifications(rawData)
  const blogPosts = getStoredSiteBlogPosts(rawData)

  const monthlyArticles: MonthlyPoint[] = (() => {
    const now = new Date()
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = new Intl.DateTimeFormat('ja-JP', { month: 'short' }).format(d)
      return { m: label, n: articles.filter((a) => a.created_at.slice(0, 7) === key).length }
    })
  })()

  const heatmapData: HeatmapEntry[] = (() => {
    const countMap = new Map<string, number>()
    for (const a of articles) {
      const d = new Date(a.created_at)
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      countMap.set(key, (countMap.get(key) ?? 0) + 1)
    }
    return [...countMap.entries()].map(([date, count]) => ({ date, count }))
  })()

  const continuityScore = (() => {
    const now = new Date()
    const thisSunday = new Date(now)
    thisSunday.setDate(now.getDate() - now.getDay())
    thisSunday.setHours(0, 0, 0, 0)
    let active = 0
    for (let w = 0; w < 12; w++) {
      const start = new Date(thisSunday)
      start.setDate(thisSunday.getDate() - w * 7)
      const end = new Date(start)
      end.setDate(start.getDate() + 7)
      if (articles.some((a) => { const d = new Date(a.created_at); return d >= start && d < end })) active++
    }
    return Math.min(100, Math.round((active / 12) * 100))
  })()

  return (
    <AppShell
      title={project.name || project.hp_url}
      active="projects"
      accountLabel={profile?.name ?? user.email ?? '設定'}
      isAdmin={checkIsAdmin(user.email)}
      headerRight={(
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link href="/projects" className={getButtonClass('secondary', 'px-4 py-2.5 text-sm')}>
            ← 一覧へ戻る
          </Link>
          <Link href={`/projects/${id}/interviewer`} className={getButtonClass('primary', 'px-4 py-2.5 text-sm')}>
            + 取材する
          </Link>
        </div>
      )}
      contentClassName="max-w-5xl"
    >
      {/* Overview panel */}
      <div
        className="rounded-[var(--r-lg)] border border-[var(--border)] p-7 mb-7"
        style={{ background: 'linear-gradient(135deg,var(--accent-l),var(--teal-l))' }}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="text-[32px]">🏢</div>
              <div>
                <div className="font-[family-name:var(--font-noto-serif-jp)] text-[22px] font-bold text-[var(--text)]">{project.name || project.hp_url}</div>
                <div className="text-[13px] text-[var(--text2)]">🔗 {project.hp_url}</div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <StatusPill tone={analysisBadge.tone} className="px-2.5 py-1 text-[11px] font-semibold">
                {analysisBadge.label}
              </StatusPill>
              {contentBadge && (
                <StatusPill tone={contentBadge.tone} className="px-2.5 py-1 text-[11px] font-semibold">
                  {contentBadge.label}
                </StatusPill>
              )}
              {competitors && competitors.length > 0 && (
                <span className="text-[11px] bg-[rgba(255,255,255,0.5)] text-[var(--text2)] px-2.5 py-1 rounded-full font-semibold">競合 {competitors.length}件</span>
              )}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[360px]">
            {[
              { n: interviews.length, l: '取材回数' },
              { n: articles.length, l: '記事素材' },
              { n: formatDateTime(project.updated_at), l: '最終更新', small: true },
            ].map((s) => (
              <div key={s.l} className="rounded-[10px] px-4 py-3 text-center" style={{ background: 'rgba(255,255,255,.6)' }}>
                <div
                  className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)]"
                  style={{ fontSize: s.small ? 11 : 22 }}
                >{s.n}</div>
                <div className="text-[11px] text-[var(--text2)] mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Analytics */}
      <div className="mt-8">
        <AnalyticsSection
          monthlyArticles={monthlyArticles}
          heatmapData={heatmapData}
          continuityScore={continuityScore}
          nextProjectId={id}
        />
      </div>

      {/* Content map */}
      {blogPosts.length > 0 && (
        <div className="mt-6">
          <ContentMapPanel
            projectId={id}
            projectName={project.name || project.hp_url}
            initialClassifications={classifications}
            blogPostCount={blogPosts.length}
            clausIcon={claus?.icon48}
            clausEmoji={claus?.emoji}
          />
        </div>
      )}

      {/* Analysis / competitors section */}
      <AnalysisStatusPanel
        projectId={id}
        projectName={project.name || project.hp_url}
        initialStatus={analysisStatus}
        competitorCount={competitors?.length ?? 0}
        hasAudit={!!auditRow}
        reanalysisNextAvailableAt={reanalysisNextAvailableAt}
      />

      {/* Interview history */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-[family-name:var(--font-noto-serif-jp)] text-[16px] font-bold text-[var(--text)]">取材履歴</h2>
          <Link href={`/projects/${id}/interviewer`} className={getButtonClass('primary', 'text-sm px-4 py-2')}>
            + 新しく取材する
          </Link>
        </div>

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
              description="必要なタイミングでAIキャストを呼べば、ここに実施履歴と記事がまとまっていきます。"
              tone="soft"
            />
            <div className="mt-4">
              <ButtonLink href={`/projects/${id}/interviewer`}>最初のインタビューを始める</ButtonLink>
            </div>
          </>
        ) : (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] px-5 py-1">
            {interviews.map((interview, i) => {
              const interviewArticles = articlesByInterview.get(interview.id) ?? []
              const latestInterviewArticle = interviewArticles[0] ?? null
              const char = getCharacter(interview.interviewer_type)
              const { hasSummary, hasArticle, hasUncreatedThemes } = getInterviewFlags(interview, articleCountByInterview)
              const managementHref = getInterviewManagementHref(interview, articleCountByInterview, 'project')

              return (
                <div
                  key={interview.id}
                  className={`flex items-center gap-[14px] py-4 ${i < interviews.length - 1 ? 'border-b border-[var(--border)]' : ''} -mx-5 px-5`}
                >
                  <div className="w-[38px] h-[38px] rounded-full overflow-hidden flex-shrink-0 border-[1.5px] border-[var(--border)]">
                    <CharacterAvatar
                      src={char?.icon48}
                      alt={`${char?.name ?? 'インタビュアー'}のアイコン`}
                      emoji={char?.emoji}
                      size={38}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-[var(--text)] mb-0.5">
                      {char?.name ?? 'インタビュアー'} · {formatDateTime(interview.created_at)}
                    </div>
                    <div className="text-[12px] text-[var(--text3)]">
                      {interview.themes && interview.themes.length > 0
                        ? interview.themes.join('、')
                        : 'テーマ未確定'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {interviewArticles.length > 0 && (
                      <span className="text-[11px] text-[var(--text3)]">記事 {interviewArticles.length}本</span>
                    )}
                    <InterviewStatusPills
                      interviewId={interview.id}
                      hasSummary={hasSummary}
                      hasArticle={hasArticle}
                      hasUncreatedThemes={hasUncreatedThemes}
                      articleStatus={interview.article_status}
                    />
                    {latestInterviewArticle && (
                      <Link href={`/projects/${id}/articles/${latestInterviewArticle.id}`} className={getButtonClass('secondary', 'text-xs px-3 py-1.5')}>
                        記事を見る
                      </Link>
                    )}
                    <Link href={managementHref} className={getButtonClass('secondary', 'text-xs px-3 py-1.5')}>
                      メモを見る
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Articles section */}
      {articles.length > 0 && (
        <div id="articles" className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] text-[16px] font-bold text-[var(--text)]">記事素材</h2>
          </div>
          <div className="overflow-x-auto rounded-[var(--r-lg)] border border-[var(--border)]">
            <table className="w-full">
              <thead className="bg-[var(--bg2)]">
                <tr>
                  <th className="text-left px-5 py-3 text-[12px] font-semibold text-[var(--text2)]">タイトル</th>
                  <th className="text-left px-5 py-3 text-[12px] font-semibold text-[var(--text2)]">種類</th>
                  <th className="text-left px-5 py-3 text-[12px] font-semibold text-[var(--text2)]">作成日</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-[var(--surface)]">
                {articles.map((article, i) => (
                  <tr key={article.id} className={i < articles.length - 1 ? 'border-b border-[var(--border)]' : ''}>
                    <td className="px-5 py-3 text-[14px] font-semibold text-[var(--text)] max-w-[320px]">
                      <div className="overflow-hidden text-ellipsis whitespace-nowrap">{article.title || '記事'}</div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[11px] bg-[var(--border)] text-[var(--text2)] px-2.5 py-1 rounded-full font-semibold">
                        {ARTICLE_TYPE_LABEL[article.article_type ?? ''] ?? '記事'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[12px] text-[var(--text3)]">{formatDateTime(article.created_at)}</td>
                    <td className="px-5 py-3">
                      <Link href={`/projects/${id}/articles/${article.id}`} className={getButtonClass('secondary', 'text-xs px-3 py-1.5')}>
                        詳細
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppShell>
  )
}
