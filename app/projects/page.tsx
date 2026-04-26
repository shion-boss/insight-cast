export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'

import StartAnalysisButton from '@/components/start-analysis-button'
import { StatusPill, getButtonClass, CharacterAvatar } from '@/components/ui'
import { getCharacter } from '@/lib/characters'
import { AppShell, checkIsAdmin } from '@/components/app-shell'
import { isProjectAnalysisReady } from '@/lib/analysis/project-readiness'
import { buildArticleCountByInterview, type InterviewArticleRef } from '@/lib/interview-state'
import { getProjectAnalysisBadge, getProjectContentBadge } from '@/lib/project-badges'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan, getPlanLimits } from '@/lib/plans'

type Project = {
  id: string
  name: string | null
  hp_url: string
  status: string
  updated_at: string
}

type Interview = {
  id: string
  project_id: string
  created_at: string
}

function AddProjectCard({ isLocked }: { isLocked: boolean }) {
  return (
    <Link
      href={isLocked ? '/pricing?reason=project_limit' : '/projects/new'}
      className="relative bg-[var(--bg2)] border-2 border-dashed border-[var(--border)] rounded-[var(--r-lg)] p-8 flex flex-col items-center justify-center gap-3 transition-all hover:border-[var(--accent)] hover:bg-[var(--accent-l)] min-h-[200px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
    >
      {isLocked ? (
        <>
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--text3)]/20">
            <svg width="18" height="22" viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[var(--text3)]">
              <rect x="2" y="9" width="14" height="13" rx="3" fill="currentColor"/>
              <path d="M5 9V6.5a4 4 0 0 1 8 0V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
            </svg>
          </div>
          <div className="text-[14px] font-semibold text-[var(--text3)]">新しい取材先を追加する</div>
          <div className="text-[12px] text-[var(--accent)] font-semibold">プランをアップグレードする →</div>
        </>
      ) : (
        <>
          <div className="text-[36px] text-[var(--text3)]">＋</div>
          <div className="text-[14px] font-semibold text-[var(--text2)]">新しい取材先を追加する</div>
          <div className="text-[12px] text-[var(--text3)]">名前とURLを登録して、調査の準備へ</div>
        </>
      )}
    </Link>
  )
}

function formatShortDateTime(value: string) {
  return new Intl.DateTimeFormat('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export default async function ProjectsPage() {
  const mint = getCharacter('mint')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // profile, projects, userPlan を並列取得
  const [{ data: profile }, { data: projects }, userPlan] = await Promise.all([
    supabase.from('profiles').select('name').eq('id', user.id).maybeSingle(),
    supabase
      .from('projects')
      .select('id, name, hp_url, status, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }),
    getUserPlan(supabase, user.id),
  ])

  const projectList = (projects ?? []) as Project[]

  const planLimits = getPlanLimits(userPlan)
  const isProjectLimitReached = projectList.length >= planLimits.maxProjects

  // projects が取れてから audits, competitors, competitorAnalyses, interviews を並列取得
  const projectIds = projectList.map((project) => project.id)
  const [
    { data: auditRows },
    { data: competitorRows },
    { data: competitorAnalysisRows },
    { data: interviewRows },
    { data: articleRows },
  ] = await Promise.all([
    projectList.length > 0
      ? supabase.from('hp_audits').select('id, project_id, raw_data, created_at').in('project_id', projectIds)
      : Promise.resolve({ data: [] }),
    projectList.length > 0
      ? supabase.from('competitors').select('id, project_id, url').in('project_id', projectIds)
      : Promise.resolve({ data: [] }),
    projectList.length > 0
      ? supabase.from('competitor_analyses').select('project_id, competitor_id, raw_data').in('project_id', projectIds)
      : Promise.resolve({ data: [] }),
    projectList.length > 0
      ? supabase
          .from('interviews')
          .select('id, project_id, created_at')
          .in('project_id', projectIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    projectList.length > 0
      ? supabase.from('articles').select('interview_id').in('project_id', projectIds)
      : Promise.resolve({ data: [] }),
  ])

  const analysisReadyProjectIds = new Set(
    projectList
      .filter((project) => isProjectAnalysisReady({
        project,
        competitors: (competitorRows ?? []).filter((competitor) => competitor.project_id === project.id),
        audit: (auditRows ?? []).find((audit) => audit.project_id === project.id),
        competitorAnalyses: (competitorAnalysisRows ?? []).filter((row) => row.project_id === project.id),
      }).isReady)
      .map((project) => project.id),
  )

  const interviews = (interviewRows ?? []) as Interview[]
  const latestInterviewMap = new Map<string, Interview>()

  for (const interview of interviews) {
    if (!latestInterviewMap.has(interview.project_id)) {
      latestInterviewMap.set(interview.project_id, interview)
    }
  }

  const interviewCountByProject = new Map<string, number>()
  for (const interview of interviews) {
    interviewCountByProject.set(
      interview.project_id,
      (interviewCountByProject.get(interview.project_id) ?? 0) + 1,
    )
  }

  const { articleCountByInterview } = buildArticleCountByInterview((articleRows ?? []) as InterviewArticleRef[])
  const articleCountByProject = new Map<string, number>()
  for (const interview of interviews) {
    articleCountByProject.set(
      interview.project_id,
      (articleCountByProject.get(interview.project_id) ?? 0) + (articleCountByInterview.get(interview.id) ?? 0),
    )
  }

  return (
    <AppShell
      title="取材先一覧"
      active="projects"
      accountLabel={profile?.name ?? user.email ?? '設定'}
      isAdmin={checkIsAdmin(user.email)}
      headerRight={(
        <Link
          href={isProjectLimitReached ? '/pricing?reason=project_limit' : '/projects/new'}
          className={getButtonClass('primary', `px-4 py-2 text-sm${isProjectLimitReached ? ' opacity-60' : ''}`)}
        >
          {isProjectLimitReached ? (
            <span className="flex items-center gap-1.5">
              <svg width="12" height="14" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="6" width="10" height="8" rx="2" fill="currentColor"/>
                <path d="M3 6V4a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
              </svg>
              取材先を追加
            </span>
          ) : '+ 取材先を追加'}
        </Link>
      )}
    >
      {/* Summary */}
      <div className="flex gap-4 mb-7">
        {[
          { n: projectList.length, l: '取材先' },
          { n: interviews.length, l: '総インタビュー' },
        ].map((s) => (
          <div key={s.l} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] px-6 py-4 flex gap-3 items-center">
            <span className="text-[28px] font-bold text-[var(--accent)]">{s.n}</span>
            <span className="text-sm text-[var(--text2)]">{s.l}</span>
          </div>
        ))}
      </div>

      {projectList.length === 0 ? (
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2">
          <AddProjectCard isLocked={isProjectLimitReached} />
        </div>
      ) : (
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2">
          {projectList.map((project) => {
            const latestInterview = latestInterviewMap.get(project.id)
            const ivCount = interviewCountByProject.get(project.id) ?? 0
            const articleCount = articleCountByProject.get(project.id) ?? 0
            const analysisBadge = getProjectAnalysisBadge(project.status, analysisReadyProjectIds.has(project.id))
            const contentBadge = getProjectContentBadge({
              status: project.status,
              interviewCount: ivCount,
              articleCount,
            })

            return (
              <div
                key={project.id}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] p-6"
              >
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-[var(--r)] bg-[var(--accent-l)] flex items-center justify-center flex-shrink-0">
                    <CharacterAvatar src={mint?.icon48} alt={mint?.name ?? 'ミント'} emoji={mint?.emoji} size={36} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/projects/${project.id}`} className="block">
                      <div className="text-[18px] font-bold text-[var(--text)] mb-1">{project.name || project.hp_url}</div>
                      <div className="text-[12px] text-[var(--text3)] overflow-hidden text-ellipsis whitespace-nowrap">🔗 {project.hp_url}</div>
                    </Link>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="flex flex-wrap justify-end gap-2">
                      <StatusPill tone={analysisBadge.tone} className="px-2.5 py-1 text-[11px] font-semibold">
                        {analysisBadge.label}
                      </StatusPill>
                      {contentBadge && (
                        <StatusPill tone={contentBadge.tone} className="px-2.5 py-1 text-[11px] font-semibold">
                          {contentBadge.label}
                        </StatusPill>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { n: ivCount, l: '取材回数' },
                    { n: articleCount, l: '記事素材' },
                    { n: latestInterview ? formatShortDateTime(latestInterview.created_at) : '—', l: '最終取材' },
                  ].map((s) => (
                    <div key={s.l} className="bg-[var(--bg2)] rounded-[var(--r-sm)] p-2.5 text-center">
                      <div className={`font-bold text-[var(--text)] ${String(s.n).length > 4 ? 'text-[14px]' : 'text-[20px]'}`}>{s.n}</div>
                      <div className="text-[11px] text-[var(--text3)] mt-0.5">{s.l}</div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  <Link
                    href={`/projects/${project.id}/interviewer`}
                    className={getButtonClass('primary', 'text-xs px-3 min-h-[44px] flex items-center')}
                  >
                    取材する →
                  </Link>
                  <Link
                    href={`/projects/${project.id}`}
                    className={getButtonClass('secondary', 'text-xs px-3 min-h-[44px] flex items-center')}
                  >
                    管理
                  </Link>
                  {articleCount > 0 && (
                    <Link
                      href={`/projects/${project.id}#articles`}
                      className={getButtonClass('secondary', 'text-xs px-3 min-h-[44px] flex items-center')}
                    >
                      記事を見る
                    </Link>
                  )}
                  {project.status === 'analyzing' ? (
                    <span className="inline-flex items-center rounded-lg border border-[var(--warn)]/30 bg-[var(--warn-l)] px-3 min-h-[44px] text-xs text-[var(--warn)]">
                      調査中
                    </span>
                  ) : analysisReadyProjectIds.has(project.id) ? (
                    <Link
                      href={`/projects/${project.id}/report`}
                      className={getButtonClass('secondary', 'text-xs px-3 min-h-[44px] flex items-center')}
                    >
                      レポート
                    </Link>
                  ) : (
                    <StartAnalysisButton
                      projectId={project.id}
                      projectName={project.name || project.hp_url}
                      compact
                      className={getButtonClass('secondary', 'text-xs px-3 min-h-[44px] flex items-center')}
                    />
                  )}
                </div>
              </div>
            )
          })}

          <AddProjectCard isLocked={isProjectLimitReached} />
        </div>
      )}
    </AppShell>
  )
}
