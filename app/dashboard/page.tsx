import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from './logout-button'
import { PageHeader } from '@/components/ui'

type Project = {
  id: string
  name: string | null
  hp_url: string
  status: string
  updated_at: string
}

const STATUS_LABEL: Record<string, string> = {
  analyzing:       '調査中',
  report_ready:    'インタビュー待ち',
  interview_ready: 'インタビュー待ち',
  interview_done:  'インタビュー済み',
  article_ready:   '記事生成済み',
}

const STATUS_COLOR: Record<string, string> = {
  analyzing:       'bg-amber-50 text-amber-600',
  report_ready:    'bg-blue-50 text-blue-600',
  interview_ready: 'bg-blue-50 text-blue-600',
  interview_done:  'bg-stone-100 text-stone-500',
  article_ready:   'bg-green-50 text-green-600',
}

function nextHref(project: Project, latestInterviewId: string | null): string {
  const base = `/projects/${project.id}`
  switch (project.status) {
    case 'analyzing':       return `${base}/report`
    case 'report_ready':
    case 'interview_ready': return `${base}/interviewer`
    case 'interview_done':  return latestInterviewId ? `${base}/summary?interviewId=${latestInterviewId}` : `${base}/interviewer`
    case 'article_ready':   return latestInterviewId ? `${base}/article?interviewId=${latestInterviewId}` : `${base}/summary`
    default:                return `${base}/report`
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, onboarded')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarded) redirect('/onboarding')

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, hp_url, status, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  // interview_done / article_ready のプロジェクトの最新 interview を取得
  const projectsNeedingInterview = (projects ?? []).filter(
    p => p.status === 'interview_done' || p.status === 'article_ready'
  )
  const interviewMap: Record<string, string> = {}
  if (projectsNeedingInterview.length > 0) {
    const { data: interviews } = await supabase
      .from('interviews')
      .select('id, project_id')
      .in('project_id', projectsNeedingInterview.map(p => p.id))
      .order('created_at', { ascending: false })

    for (const iv of interviews ?? []) {
      if (!interviewMap[iv.project_id]) interviewMap[iv.project_id] = iv.id
    }
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <PageHeader
        title="Insight Cast"
        right={(
          <div className="flex items-center gap-4">
            <Link href="/settings" className="rounded-md text-sm text-stone-500 hover:text-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 transition-colors">
              {profile?.name ?? user.email}
            </Link>
            <form action={signOut}>
              <LogoutButton />
            </form>
          </div>
        )}
      />

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link
            href="/projects/new"
            className="w-full flex items-center justify-center gap-2 py-4 bg-stone-800 text-white rounded-xl hover:bg-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 transition-colors text-sm"
          >
            <span className="text-lg">+</span>
            新しいプロジェクトを始める
          </Link>
        </div>

        {!projects || projects.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">🐱</div>
            <p className="text-stone-500 text-sm">まだプロジェクトがありません。</p>
            <p className="text-stone-400 text-sm mt-1">最初の取材を始めてみましょう。</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {(projects as Project[]).map((p) => (
              <li key={p.id}>
                <Link
                  href={nextHref(p, interviewMap[p.id] ?? null)}
                  className="flex items-center justify-between p-4 bg-white rounded-xl border border-stone-100 hover:border-stone-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-stone-800">{p.name || p.hp_url}</p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {new Date(p.updated_at).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLOR[p.status] ?? 'bg-stone-100 text-stone-500'}`}>
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                    <span className="text-sm text-stone-300">→</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
