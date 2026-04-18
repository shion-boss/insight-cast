import Link from 'next/link'
import { redirect } from 'next/navigation'

import { PageHeader, StateCard } from '@/components/ui'
import { signOut } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/app/dashboard/logout-button'

type ArticleRow = {
  id: string
  title: string | null
  content: string
  article_type: string | null
  created_at: string
  project_id: string
  interview_id: string | null
}

type ProjectRow = {
  id: string
  name: string | null
  hp_url: string
}

type InterviewRow = {
  id: string
  interviewer_type: string
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

export default async function ArticlesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .maybeSingle()

  const { data: articleRows } = await supabase
    .from('articles')
    .select('id, title, content, article_type, created_at, project_id, interview_id')
    .order('created_at', { ascending: false })

  const articles = (articleRows ?? []) as ArticleRow[]
  const projectIds = [...new Set(articles.map((article) => article.project_id))]
  const interviewIds = [...new Set(articles.map((article) => article.interview_id).filter((id): id is string => Boolean(id)))]

  const { data: projectRows } = projectIds.length > 0
    ? await supabase
      .from('projects')
      .select('id, name, hp_url')
      .in('id', projectIds)
    : { data: [] }

  const { data: interviewRows } = interviewIds.length > 0
    ? await supabase
      .from('interviews')
      .select('id, interviewer_type')
      .in('id', interviewIds)
    : { data: [] }

  const projects = new Map((projectRows ?? []).map((project) => [project.id, project as ProjectRow]))
  const interviews = new Map((interviewRows ?? []).map((interview) => [interview.id, interview as InterviewRow]))

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#faf7f2_0%,_#f7f3ea_100%)]">
      <PageHeader
        title="記事一覧"
        backHref="/dashboard"
        backLabel="← ダッシュボード"
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

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        <section className="rounded-[2rem] border border-stone-200 bg-white/92 p-6">
          <p className="text-xs font-medium tracking-[0.18em] text-stone-400 uppercase">Articles</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">作成した記事一覧</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-500">
            これまで作成した記事をまとめて確認できます。気になる記事から開いて、元のインタビューや取材メモにも戻れます。
          </p>
        </section>

        {articles.length === 0 ? (
          <StateCard
            icon="📝"
            title="まだ作成した記事はありません。"
            description="インタビューの取材メモから記事を作ると、ここに一覧で並びます。"
            align="left"
            action={(
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-xl bg-stone-800 px-5 py-3 text-sm text-white hover:bg-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 transition-colors"
              >
                ダッシュボードへ戻る
              </Link>
            )}
          />
        ) : (
          <ul className="space-y-4">
            {articles.map((article) => {
              const project = projects.get(article.project_id)
              const interview = article.interview_id ? interviews.get(article.interview_id) : null

              return (
                <li key={article.id}>
                  <Link
                    href={`/projects/${article.project_id}/articles/${article.id}`}
                    className="block rounded-[1.8rem] border border-stone-200 bg-white/95 p-5 transition-colors hover:border-stone-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs text-stone-400">
                          {project?.name || project?.hp_url || '取材先'}{interview ? ` ・ ${interview.interviewer_type}` : ''}
                        </p>
                        <h2 className="mt-2 text-lg font-semibold text-stone-900">{article.title || '記事'}</h2>
                        <p className="mt-2 text-xs text-stone-400">
                          {ARTICLE_TYPE_LABEL[article.article_type ?? ''] ?? '記事'} ・ {formatDateTime(article.created_at)}
                        </p>
                        <p className="mt-4 line-clamp-3 text-sm leading-7 text-stone-500">
                          {article.content.replace(/^#\s+.+$/m, '').trim()}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-500">
                          {ARTICLE_TYPE_LABEL[article.article_type ?? ''] ?? '記事'}
                        </span>
                        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-500">
                          開く
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </main>
    </div>
  )
}
