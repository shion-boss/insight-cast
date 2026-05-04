import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getMemberRole } from '@/lib/project-members'
import ArticleClient from './ArticleClient'

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
  const { data: interview } = await supabase
    .from('interviews')
    .select('interviewer_type')
    .eq('id', interviewId)
    .eq('project_id', id)
    .is('deleted_at', null)
    .single()
  const interviewerType = interview?.interviewer_type ?? null

  return (
    <ArticleClient
      projectId={id}
      interviewId={interviewId}
      initialTheme={initialTheme}
      projectName={projectName}
      from={from}
      interviewerType={interviewerType}
    />
  )
}
