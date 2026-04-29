export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: '記事一覧',
  robots: { index: false, follow: false },
}

import { ArticleListTable } from '@/components/article-list-table'
import { Breadcrumb, ButtonLink, CharacterAvatar, StateCard } from '@/components/ui'
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
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value)).replace(/\//g, '.')
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

  // project を取得
  const [{ data: project }] = await Promise.all([
    supabase.from('projects').select('id, name, hp_url').eq('id', id).eq('user_id', user.id).is('deleted_at', null).single(),
  ])

  if (!project) redirect('/dashboard')

  // interview と articles を並列取得
  let articlesQuery = supabase
    .from('articles')
    .select('id, title, article_type, created_at, interview_id')
    .eq('project_id', id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (interviewId) articlesQuery = articlesQuery.eq('interview_id', interviewId)

  const [{ data: interviewRow }, { data: articleRows }] = await Promise.all([
    interviewId
      ? supabase.from('interviews').select('id, interviewer_type, created_at').eq('id', interviewId).eq('project_id', id).is('deleted_at', null).maybeSingle()
      : Promise.resolve({ data: null }),
    articlesQuery,
  ])

  if (interviewId && !interviewRow) redirect(`/projects/${id}`)
  const interview = interviewRow as InterviewRow | null
  const articles = (articleRows ?? []) as ArticleRow[]
  const interviewer = interview ? getCharacter(interview.interviewer_type) : null
  const mintChar = getCharacter('mint')
  const articleItems = articles.map((article) => ({
    id: article.id,
    title: article.title || '記事',
    articleTypeLabel: ARTICLE_TYPE_LABEL[article.article_type ?? ''] ?? '記事',
    createdAtLabel: formatDate(article.created_at),
    detailHref: `/projects/${id}/articles/${article.id}?from=articles${interviewId ? `&interviewId=${interviewId}` : ''}`,
  }))

  return (
    <>
      <Breadcrumb items={[
        { label: '取材先一覧', href: '/projects' },
        { label: '取材先の管理', href: `/projects/${id}` },
        ...(interviewId ? [{ label: '取材メモ', href: `/projects/${id}/summary?interviewId=${interviewId}` }] : []),
        { label: interview ? 'この取材の記事一覧' : '記事一覧' },
      ]} />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-[var(--text3)] uppercase">Project Articles</p>
          <h2 className="mt-1 text-2xl font-bold text-[var(--text)]">
            {project.name || project.hp_url}
          </h2>
          <p className="mt-2 text-sm text-[var(--text3)]">
            {interview
              ? <>{interviewer?.name ?? 'AIキャスト'}<span aria-hidden="true"> · </span>{formatDate(interview.created_at)} の取材から作成した記事</>
              : 'この取材先から作成した記事をまとめて確認できます。'}
          </p>
        </div>
        <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--text2)]">
          {articles.length}件
        </span>
      </div>

      {articles.length === 0 ? (
        <StateCard
          icon={<CharacterAvatar src={mintChar?.icon48} alt={mintChar?.name ?? 'ミント'} emoji={mintChar?.emoji} size={48} />}
          title={interview ? 'この取材から作成した記事はまだありません。' : 'まだ記事はありません。'}
          description={interview ? '取材メモから記事を受け取ると、ここに一覧で並びます。' : '記事が届くと、ここに一覧で並びます。'}
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
    </>
  )
}
