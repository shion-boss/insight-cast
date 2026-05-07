import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getMemberRole } from '@/lib/project-members'
import { normalizeUniqueStringList } from '@/lib/ai-quality'
import ArticleClient from './ArticleClient'

// ピラー記事の必要条件。lib/article 側 (PILLAR_REQUIREMENTS) と同じ値を保つこと。
// 値を変更する場合は app/api/projects/[id]/article/route.ts も合わせる。
const PILLAR_REQUIREMENTS = {
  minSummaryItems: 5,
  minThemes: 3,
} as const

export const metadata: Metadata = {
  title: '記事を作る',
  robots: { index: false, follow: false },
}

export default async function ArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ interviewId?: string; theme?: string; projectName?: string; from?: string }>
}) {
  const { id } = await params
  const query = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: project } = await supabase
    .from('projects')
    .select('user_id')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!project) redirect('/dashboard')

  const isOwner = project.user_id === user.id
  if (!isOwner) {
    const memberRole = await getMemberRole(supabase, id, user.id)
    if (!memberRole) redirect('/dashboard')
    if (memberRole !== 'editor') redirect(`/projects/${id}`)
  }

  const interviewId = query.interviewId ?? ''
  if (!interviewId) redirect(`/projects/${id}`)
  const initialTheme = query.theme ?? ''
  const projectName = query.projectName ?? 'このプロジェクト'
  const from = query.from ?? ''

  // 取材で使われたキャストを取得（モグロは「会話記事」を作れないため UI で隠す）
  // 同時に summary / themes を取得し、ピラー記事の事前判定に使う。
  const { data: interview } = await supabase
    .from('interviews')
    .select('interviewer_type, summary, themes')
    .eq('id', interviewId)
    .eq('project_id', id)
    .is('deleted_at', null)
    .single()
  const interviewerType = interview?.interviewer_type ?? null

  // サーバー側 (route.ts) と同じ normalize ロジックで件数を計算する。
  // ここで算出した件数が UI のピラー判定とサーバーの 400 判定で一致する必要がある。
  const summaryCount = normalizeUniqueStringList(interview?.summary, { maxItems: 8, maxLength: 120 }).length
  const themesCount = normalizeUniqueStringList(interview?.themes, { maxItems: 8, maxLength: 120 }).length

  return (
    <ArticleClient
      projectId={id}
      interviewId={interviewId}
      initialTheme={initialTheme}
      projectName={projectName}
      from={from}
      interviewerType={interviewerType}
      summaryCount={summaryCount}
      themesCount={themesCount}
      pillarRequirements={PILLAR_REQUIREMENTS}
    />
  )
}
