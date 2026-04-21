import Link from 'next/link'
import { redirect } from 'next/navigation'

import { ButtonLink, StateCard } from '@/components/ui'
import { AppShell } from '@/components/app-shell'
import { createClient } from '@/lib/supabase/server'

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
  client: 'ブログ記事',
  interviewer: 'インタビュー形式',
  conversation: '会話込み',
}

const CHAR_LABEL: Record<string, string> = {
  mint: 'ミント',
  claus: 'クラウス',
  rain: 'レイン',
  hal: 'ハル',
  mogro: 'モグロ',
  cocco: 'コッコ',
}

function formatDate(value: string) {
  const d = new Date(value)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
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
    <AppShell
      title="記事一覧"
      active="articles"
      accountLabel={profile?.name ?? user.email ?? '設定'}
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-[var(--text3)] uppercase">Articles</p>
          <h1 className="mt-1 font-[family-name:var(--font-noto-serif-jp)] text-2xl font-bold text-[var(--text)]">記事一覧</h1>
        </div>
        <span className="text-sm text-[var(--text3)]">{articles.length} 件</span>
      </div>

      {articles.length === 0 ? (
        <StateCard
          icon="📝"
          title="まだ作成した記事はありません。"
          description="インタビューの取材メモから記事を作ると、ここに一覧で並びます。"
          align="left"
          action={<ButtonLink href="/dashboard">ダッシュボードへ戻る</ButtonLink>}
        />
      ) : (
        <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg2)]">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold tracking-[0.10em] text-[var(--text3)] uppercase">タイトル</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-[0.10em] text-[var(--text3)] uppercase whitespace-nowrap">取材先</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-[0.10em] text-[var(--text3)] uppercase whitespace-nowrap">種別</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-[0.10em] text-[var(--text3)] uppercase whitespace-nowrap">担当</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-[0.10em] text-[var(--text3)] uppercase whitespace-nowrap">作成日</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article, i) => {
                  const project = projects.get(article.project_id)
                  const interview = article.interview_id ? interviews.get(article.interview_id) : null
                  const excerpt = article.content.replace(/^#\s+.+$/m, '').trim().slice(0, 80)

                  return (
                    <tr
                      key={article.id}
                      className={`transition-colors hover:bg-[var(--bg2)] ${i < articles.length - 1 ? 'border-b border-[var(--border)]' : ''}`}
                    >
                      <td className="max-w-xs px-5 py-4">
                        <p className="font-semibold text-[var(--text)] overflow-hidden text-ellipsis whitespace-nowrap mb-1">
                          {article.title || '記事'}
                        </p>
                        <p className="text-xs text-[var(--text3)] overflow-hidden text-ellipsis whitespace-nowrap">{excerpt}</p>
                      </td>
                      <td className="px-4 py-4 text-[var(--text3)] whitespace-nowrap text-xs">
                        {project?.name || project?.hp_url || '—'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="bg-[var(--bg2)] text-[var(--text3)] text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-[var(--border)]">
                          {ARTICLE_TYPE_LABEL[article.article_type ?? ''] ?? '記事'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-[var(--text3)] whitespace-nowrap text-xs">
                        {interview ? (CHAR_LABEL[interview.interviewer_type] ?? interview.interviewer_type) : '—'}
                      </td>
                      <td className="px-4 py-4 text-[var(--text3)] whitespace-nowrap text-xs">
                        {formatDate(article.created_at)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Link
                          href={`/projects/${article.project_id}/articles/${article.id}`}
                          className="text-xs font-medium text-[var(--text3)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 rounded transition-colors"
                        >
                          詳細
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppShell>
  )
}
