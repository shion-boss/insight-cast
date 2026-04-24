export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'

import { ArticleListTable } from '@/components/article-list-table'
import { AppShell, checkIsAdmin } from '@/components/app-shell'
import { ButtonLink, StateCard, getButtonClass } from '@/components/ui'
import { getCharacter } from '@/lib/characters'
import { createClient } from '@/lib/supabase/server'

type InterviewRow = {
  id: string
  interviewer_type: string
  created_at: string
}

type ArticleRow = {
  id: string
  title: string | null
  article_type: string | null
  created_at: string
  interview_id: string | null
}

const ARTICLE_TYPE_LABEL: Record<string, string> = {
  client: 'ブログ記事',
  interviewer: 'インタビュー形式',
  conversation: '会話込み',
}

function formatDate(value: string) {
  const d = new Date(value)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function getSingleSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function ProjectArticlesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ interviewId?: string | string[] }>
}) {
  const { id } = await params
  const resolvedSearchParams = await searchParams
  const interviewId = getSingleSearchParam(resolvedSearchParams.interviewId) ?? null

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

  const { data: project } = await supabase
    .from('projects')
    .select('id, name, hp_url')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!project) redirect('/dashboard')

  let interview: InterviewRow | null = null
  if (interviewId) {
    const { data: interviewRow } = await supabase
      .from('interviews')
      .select('id, interviewer_type, created_at')
      .eq('id', interviewId)
      .eq('project_id', id)
      .maybeSingle()

    if (!interviewRow) redirect(`/projects/${id}`)
    interview = interviewRow as InterviewRow
  }

  let articlesQuery = supabase
    .from('articles')
    .select('id, title, article_type, created_at, interview_id')
    .eq('project_id', id)
    .order('created_at', { ascending: false })

  if (interviewId) {
    articlesQuery = articlesQuery.eq('interview_id', interviewId)
  }

  const { data: articleRows } = await articlesQuery
  const articles = (articleRows ?? []) as ArticleRow[]
  const interviewer = interview ? getCharacter(interview.interviewer_type) : null
  const articleItems = articles.map((article) => ({
    id: article.id,
    title: article.title || '記事',
    articleTypeLabel: ARTICLE_TYPE_LABEL[article.article_type ?? ''] ?? '記事',
    createdAtLabel: formatDate(article.created_at),
    detailHref: `/projects/${id}/articles/${article.id}`,
  }))

  return (
    <AppShell
      title={interview ? 'この取材の記事一覧' : '記事一覧'}
      active="articles"
      accountLabel={profile?.name ?? user.email ?? '設定'}
      isAdmin={checkIsAdmin(user.email)}
      headerRight={(
        <div className="flex flex-wrap items-center justify-end gap-2">
          {interview && (
            <Link
              href={`/projects/${id}/summary?interviewId=${interview.id}`}
              className={getButtonClass('secondary', 'px-4 py-2 text-sm')}
            >
              取材メモを見る
            </Link>
          )}
          <Link href={`/projects/${id}`} className={getButtonClass('secondary', 'px-4 py-2 text-sm')}>
            ← 取材先の管理に戻る
          </Link>
        </div>
      )}
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-[var(--text3)] uppercase">Project Articles</p>
          <h1 className="mt-1 font-[family-name:var(--font-noto-serif-jp)] text-2xl font-bold text-[var(--text)]">
            {project.name || project.hp_url}
          </h1>
          <p className="mt-2 text-sm text-[var(--text3)]">
            {interview
              ? `${interviewer?.name ?? 'AIキャスト'} · ${formatDate(interview.created_at)} の取材から作成した記事`
              : 'この取材先から作成した記事をまとめて確認できます。'}
          </p>
        </div>
        <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--text2)]">
          {articles.length}件
        </span>
      </div>

      {articles.length === 0 ? (
        <StateCard
          icon="📝"
          title={interview ? 'この取材から作成した記事はまだありません。' : 'まだ記事はありません。'}
          description={interview ? '取材メモから記事素材を受け取ると、ここに一覧で並びます。' : '記事素材が届くと、ここに一覧で並びます。'}
          align="left"
          action={(
            <ButtonLink href={interview ? `/projects/${id}/article?interviewId=${interview.id}` : `/projects/${id}`}>
              {interview ? 'この取材から記事を作る' : '取材先の管理へ戻る'}
            </ButtonLink>
          )}
        />
      ) : (
        <ArticleListTable
          items={articleItems}
          searchPlaceholder="タイトルで検索"
          noResultsTitle="条件に合う記事が見つかりません。"
          noResultsDescription="キーワードや種別を変えると、この記事一覧を絞り込めます。"
        />
      )}
    </AppShell>
  )
}
