export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'

import { ArticleListTable } from '@/components/article-list-table'
import { ButtonLink, StateCard } from '@/components/ui'
import { AppShell, checkIsAdmin } from '@/components/app-shell'
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

  // profile と articles を並列取得
  const [{ data: profile }, { data: articleRows }] = await Promise.all([
    supabase.from('profiles').select('name').eq('id', user.id).maybeSingle(),
    supabase
      .from('articles')
      .select('id, title, content, article_type, created_at, project_id, interview_id')
      .order('created_at', { ascending: false }),
  ])

  const articles = (articleRows ?? []) as ArticleRow[]
  const projectIds = [...new Set(articles.map((article) => article.project_id))]
  const interviewIds = [...new Set(articles.map((article) => article.interview_id).filter((id): id is string => Boolean(id)))]

  // projects と interviews は articles に依存するが互いに独立 → 並列取得
  const [{ data: projectRows }, { data: interviewRows }] = await Promise.all([
    projectIds.length > 0
      ? supabase.from('projects').select('id, name, hp_url').in('id', projectIds)
      : Promise.resolve({ data: [] }),
    interviewIds.length > 0
      ? supabase.from('interviews').select('id, interviewer_type').in('id', interviewIds)
      : Promise.resolve({ data: [] }),
  ])

  const projects = new Map((projectRows ?? []).map((project) => [project.id, project as ProjectRow]))
  const interviews = new Map((interviewRows ?? []).map((interview) => [interview.id, interview as InterviewRow]))
  const articleItems = articles.map((article) => {
    const project = projects.get(article.project_id)
    const interview = article.interview_id ? interviews.get(article.interview_id) : null
    const excerpt = article.content.replace(/^#\s+.+$/m, '').trim().slice(0, 80)

    return {
      id: article.id,
      title: article.title || '記事',
      excerpt,
      articleTypeLabel: ARTICLE_TYPE_LABEL[article.article_type ?? ''] ?? '記事',
      createdAtLabel: formatDate(article.created_at),
      detailHref: `/projects/${article.project_id}/articles/${article.id}`,
      projectLabel: project?.name || project?.hp_url || '—',
      interviewerLabel: interview ? (CHAR_LABEL[interview.interviewer_type] ?? interview.interviewer_type) : '—',
    }
  })

  return (
    <AppShell
      title="記事一覧"
      active="articles"
      accountLabel={profile?.name ?? user.email ?? '設定'}
      isAdmin={checkIsAdmin(user.email)}
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
        <ArticleListTable
          items={articleItems}
          showProjectColumn
          showInterviewerColumn
          searchPlaceholder="タイトル・取材先・本文で検索"
          noResultsTitle="条件に合う記事が見つかりません。"
          noResultsDescription="キーワードや絞り込み条件を変えると、記事が表示されます。"
        />
      )}
    </AppShell>
  )
}
