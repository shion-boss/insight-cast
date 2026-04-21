import Link from 'next/link'
import { redirect } from 'next/navigation'

import StartAnalysisButton from '@/components/start-analysis-button'
import { StatusPill, getButtonClass } from '@/components/ui'
import { AppShell } from '@/components/app-shell'
import { isProjectAnalysisReady } from '@/lib/analysis/project-readiness'
import { buildArticleCountByInterview, type InterviewArticleRef } from '@/lib/interview-state'
import { getProjectAnalysisBadge, getProjectContentBadge } from '@/lib/project-badges'
import { createClient } from '@/lib/supabase/server'

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

function formatShortDateTime(value: string) {
  return new Intl.DateTimeFormat('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export default async function ProjectsPage() {
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
    .select('name, onboarded')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.onboarded) redirect('/onboarding')

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, hp_url, status, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  const projectList = (projects ?? []) as Project[]

  const { data: auditRows } = projectList.length > 0
    ? await supabase
      .from('hp_audits')
      .select('id, project_id, raw_data, created_at')
      .in('project_id', projectList.map((project) => project.id))
    : { data: [] }

  const { data: competitorRows } = projectList.length > 0
    ? await supabase
      .from('competitors')
      .select('id, project_id, url')
      .in('project_id', projectList.map((project) => project.id))
    : { data: [] }

  const { data: competitorAnalysisRows } = projectList.length > 0
    ? await supabase
      .from('competitor_analyses')
      .select('project_id, competitor_id, raw_data')
      .in('project_id', projectList.map((project) => project.id))
    : { data: [] }

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

  const { data: interviewRows } = projectList.length > 0
    ? await supabase
      .from('interviews')
      .select('id, project_id, created_at')
      .in('project_id', projectList.map((project) => project.id))
      .order('created_at', { ascending: false })
    : { data: [] }

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

  const { data: articleRows } = interviews.length > 0
    ? await supabase
      .from('articles')
      .select('interview_id')
      .in('interview_id', interviews.map((interview) => interview.id))
    : { data: [] }

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
      headerRight={(
        <Link href="/projects/new" className={getButtonClass('primary', 'px-4 py-2.5 text-sm')}>
          + 取材先を追加
        </Link>
      )}
    >
      {/* Summary */}
      <div className="flex gap-4 mb-7">
        {[
          { n: projectList.length, l: '取材先' },
          { n: interviews.length, l: '総インタビュー' },
        ].map((s) => (
          <div key={s.l} className="bg-[var(--surface)] border border-[var(--border)] rounded-[12px] px-6 py-4 flex gap-3 items-center">
            <span className="font-[family-name:var(--font-noto-serif-jp)] text-[28px] font-bold text-[var(--accent)]">{s.n}</span>
            <span className="text-[13px] text-[var(--text2)]">{s.l}</span>
          </div>
        ))}
      </div>

      {projectList.length === 0 ? (
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
          <Link
            href="/projects/new"
            className="bg-[var(--bg2)] border-2 border-dashed border-[var(--border)] rounded-[var(--r-lg)] p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:border-[var(--accent)] hover:bg-[var(--accent-l)] min-h-[200px]"
          >
            <div className="text-[36px] text-[var(--text3)]">＋</div>
            <div className="text-[14px] font-semibold text-[var(--text2)]">新しい取材先を追加する</div>
            <div className="text-[12px] text-[var(--text3)]">URLを入れるだけで分析開始</div>
          </Link>
        </div>
      ) : (
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
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
                  <div className="w-12 h-12 rounded-[12px] bg-[var(--accent-l)] flex items-center justify-center text-[22px] flex-shrink-0">🏢</div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/projects/${project.id}`} className="block">
                      <div className="font-[family-name:var(--font-noto-serif-jp)] text-[18px] font-bold text-[var(--text)] mb-1">{project.name || project.hp_url}</div>
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
                    <div key={s.l} className="bg-[var(--bg2)] rounded-[8px] p-2.5 text-center">
                      <div className="font-[family-name:var(--font-noto-serif-jp)] text-[20px] font-bold text-[var(--text)]" style={{ fontSize: String(s.n).length > 4 ? 14 : undefined }}>{s.n}</div>
                      <div className="text-[11px] text-[var(--text3)] mt-0.5">{s.l}</div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  <Link
                    href={`/projects/${project.id}/interviewer`}
                    className={getButtonClass('primary', 'text-xs px-3 py-1.5')}
                  >
                    取材する →
                  </Link>
                  <Link
                    href={`/projects/${project.id}`}
                    className={getButtonClass('secondary', 'text-xs px-3 py-1.5')}
                  >
                    管理
                  </Link>
                  {articleCount > 0 && (
                    <Link
                      href={`/projects/${project.id}#articles`}
                      className={getButtonClass('secondary', 'text-xs px-3 py-1.5')}
                    >
                      記事を見る
                    </Link>
                  )}
                  {project.status === 'analyzing' ? (
                    <span className="inline-flex items-center rounded-lg border border-[var(--warn)]/30 bg-[var(--warn-l)] px-3 py-1.5 text-xs text-[var(--warn)]">
                      調査中
                    </span>
                  ) : analysisReadyProjectIds.has(project.id) ? (
                    <Link
                      href={`/projects/${project.id}/report`}
                      className={getButtonClass('secondary', 'text-xs px-3 py-1.5')}
                    >
                      レポート
                    </Link>
                  ) : (
                    <StartAnalysisButton
                      projectId={project.id}
                      projectName={project.name || project.hp_url}
                      compact
                      className={getButtonClass('secondary', 'text-xs px-3 py-1.5')}
                    />
                  )}
                </div>
              </div>
            )
          })}

          <Link
            href="/projects/new"
            className="bg-[var(--bg2)] border-2 border-dashed border-[var(--border)] rounded-[var(--r-lg)] p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:border-[var(--accent)] hover:bg-[var(--accent-l)] min-h-[200px]"
          >
            <div className="text-[36px] text-[var(--text3)]">＋</div>
            <div className="text-[14px] font-semibold text-[var(--text2)]">新しい取材先を追加する</div>
            <div className="text-[12px] text-[var(--text3)]">URLを入れるだけで分析開始</div>
          </Link>
        </div>
      )}
    </AppShell>
  )
}
