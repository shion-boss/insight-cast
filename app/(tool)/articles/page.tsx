import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { ArticlesServerFilter } from '@/components/articles-server-filter'
import { ButtonLink, CharacterAvatar, InterviewerSpeech } from '@/components/ui'
import { getCharacter, getCastName } from '@/lib/characters'
import { createClient } from '@/lib/supabase/server'
import { ARTICLES_PAGE_SIZE } from './constants'

export const metadata: Metadata = {
  title: '記事一覧',
}

const ARTICLE_TYPE_LABEL: Record<string, string> = {
  client: 'ブログ記事',
  interviewer: 'レポート記事',
  conversation: '会話記事',
}

type ArticleRow = {
  id: string
  title: string | null
  content: string
  article_type: string | null
  created_at: string
  project_id: string
  interview_id: string | null
}

type ProjectRow = { id: string; name: string | null; hp_url: string; user_id: string }
type InterviewRow = { id: string; interviewer_type: string; created_at: string }

function formatDate(value: string) {
  const d = new Date(value)
  const datePart = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d).replace(/\//g, '.')
  const timePart = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d)
  return `${datePart} ${timePart}`
}

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{
    projectId?: string
    articleType?: string
    interviewId?: string
    cast?: string
  }>
}) {
  const {
    projectId: projectIdParam = 'all',
    articleType: articleTypeParam = 'all',
    interviewId: interviewIdParam = 'all',
    cast: castParam = 'all',
  } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const userId = user.id

  const [{ data: projectRows }] = await Promise.all([
    supabase.from('projects').select('id, name, hp_url, user_id').is('deleted_at', null),
  ])

  const projects = (projectRows ?? []) as ProjectRow[]
  const projectIds = projects.map((p) => p.id)

  if (projectIds.length === 0) {
    const rain = getCharacter('rain')
    return (
      <>
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-xl font-bold text-[var(--text)]">記事一覧</h1>
        </div>
        <InterviewerSpeech
          icon={<CharacterAvatar src={rain?.icon48} alt={`${rain?.name ?? 'インタビュアー'}のアイコン`} emoji={rain?.emoji} size={48} />}
          name={rain?.name ?? 'インタビュアー'}
          title="記事がまだありません。"
          description="取材メモから記事を作ると、ここに一覧で並びます。まずは取材を始めてみましょう。"
          tone="soft"
        />
        <div className="mt-4">
          <ButtonLink href="/dashboard">プロジェクトを確認する <span aria-hidden="true">→</span></ButtonLink>
        </div>
      </>
    )
  }

  // フィルタードロップダウン用の選択肢（全件から取得）と
  // フィルター済みページネーション済み記事 を並列取得
  let articlesQuery = supabase
    .from('articles')
    .select('id, title, content, article_type, created_at, project_id, interview_id', { count: 'exact' })
    .in('project_id', projectIds)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (projectIdParam !== 'all') articlesQuery = articlesQuery.eq('project_id', projectIdParam)
  if (articleTypeParam !== 'all') articlesQuery = articlesQuery.eq('article_type', articleTypeParam)
  if (interviewIdParam !== 'all') articlesQuery = articlesQuery.eq('interview_id', interviewIdParam)
  if (castParam !== 'all') {
    const { data: castInterviews } = await supabase
      .from('interviews')
      .select('id')
      .in('project_id', projectIds)
      .eq('interviewer_type', castParam)
      .is('deleted_at', null)
    const ids = (castInterviews ?? []).map((i) => i.id as string)
    if (ids.length === 0) {
      articlesQuery = articlesQuery.in('interview_id', ['__none__'])
    } else {
      articlesQuery = articlesQuery.in('interview_id', ids)
    }
  }

  // フィルター済みページネーション記事 / インタビュアードロップダウン用全件 / 全記事件数 を並列取得
  const [
    { data: articleRows, count: filteredCount },
    { data: allInterviewIdRows },
    { count: totalArticleCount },
  ] = await Promise.all([
    articlesQuery.range(0, ARTICLES_PAGE_SIZE - 1),
    supabase.from('articles').select('interview_id').in('project_id', projectIds).not('interview_id', 'is', null).is('deleted_at', null),
    supabase.from('articles').select('id', { count: 'exact', head: true }).in('project_id', projectIds).is('deleted_at', null),
  ])

  const articles = (articleRows ?? []) as ArticleRow[]
  const totalCount = filteredCount ?? 0
  const initialHasMore = totalCount > articles.length

  // 表示中の記事に紐づく project / interview を取得（表示用）
  const displayProjectIds = [...new Set(articles.map((a) => a.project_id))]
  const displayInterviewIds = [...new Set(articles.map((a) => a.interview_id).filter((id): id is string => Boolean(id)))]

  // インタビュアードロップダウン用の全 interview ID（重複排除）
  const allInterviewIds = [...new Set(
    (allInterviewIdRows ?? []).map((r) => r.interview_id).filter((id): id is string => Boolean(id))
  )]

  const [{ data: displayProjectRows }, { data: displayInterviewRows }, { data: dropdownInterviewRows }] = await Promise.all([
    displayProjectIds.length > 0
      ? supabase.from('projects').select('id, name, hp_url, user_id').in('id', displayProjectIds).is('deleted_at', null)
      : Promise.resolve({ data: [] }),
    displayInterviewIds.length > 0
      ? supabase.from('interviews').select('id, interviewer_type, created_at').in('id', displayInterviewIds).is('deleted_at', null)
      : Promise.resolve({ data: [] }),
    allInterviewIds.length > 0
      ? supabase.from('interviews').select('id, interviewer_type, created_at').in('id', allInterviewIds).is('deleted_at', null)
      : Promise.resolve({ data: [] }),
  ])

  const displayProjectMap = new Map((displayProjectRows ?? []).map((p) => [p.id, p as ProjectRow]))
  const displayInterviewMap = new Map((displayInterviewRows ?? []).map((i) => [i.id, i as InterviewRow]))

  const articleItems = articles.map((article) => {
    const project = displayProjectMap.get(article.project_id)
    const interview = article.interview_id ? displayInterviewMap.get(article.interview_id) : null
    const excerpt = article.content
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
      .replace(/\n+/g, ' ')
      .trim()
      .slice(0, 80)

    const interviewChar = interview ? getCharacter(interview.interviewer_type) : null
    return {
      id: article.id,
      title: article.title || '記事',
      excerpt,
      articleTypeLabel: ARTICLE_TYPE_LABEL[article.article_type ?? ''] ?? '記事',
      createdAtLabel: formatDate(article.created_at),
      detailHref: `/projects/${article.project_id}/articles/${article.id}`,
      projectLabel: project?.name || project?.hp_url || '—',
      interviewerLabel: interview ? getCastName(interview.interviewer_type) : '—',
      interviewerIcon48: interviewChar?.icon48,
      interviewerEmoji: interviewChar?.emoji,
      isShared: project?.user_id !== userId,
    }
  })

  // ドロップダウン選択肢
  const projectOptions = projects.map((p) => ({ id: p.id, label: p.name || p.hp_url }))
  // 取材メモ: 記事が紐づいている interview を、新しい順 + キャスト名つきで表示
  const interviewOptions = (dropdownInterviewRows ?? [])
    .map((i) => ({
      id: i.id,
      label: `${formatDate(i.created_at)} · ${getCastName(i.interviewer_type)}`,
      sortKey: i.created_at,
    }))
    .sort((a, b) => b.sortKey.localeCompare(a.sortKey))
    .map(({ id, label }) => ({ id, label }))
  // インタビュアー: 記事が紐づいているキャスト種別の重複排除
  const usedCastTypes = [...new Set((dropdownInterviewRows ?? []).map((i) => i.interviewer_type))]
  const castOptions = usedCastTypes
    .map((type) => ({ id: type, label: getCastName(type) }))
    .sort((a, b) => a.label.localeCompare(b.label, 'ja'))

  if (totalCount === 0 && projectIdParam === 'all' && articleTypeParam === 'all' && interviewIdParam === 'all' && castParam === 'all') {
    const rain = getCharacter('rain')
    return (
      <>
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-xl font-bold text-[var(--text)]">記事一覧</h1>
        </div>
        <InterviewerSpeech
          icon={<CharacterAvatar src={rain?.icon48} alt={`${rain?.name ?? 'インタビュアー'}のアイコン`} emoji={rain?.emoji} size={48} />}
          name={rain?.name ?? 'インタビュアー'}
          title="記事がまだありません。"
          description="取材メモから記事を作ると、ここに一覧で並びます。まずは取材を始めてみましょう。"
          tone="soft"
        />
        <div className="mt-4">
          <ButtonLink href="/dashboard">プロジェクトを確認する <span aria-hidden="true">→</span></ButtonLink>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-xl font-bold text-[var(--text)]">記事一覧</h1>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-[var(--surface)] border border-[var(--border)] px-3 py-1.5 text-[13px] font-medium text-[var(--text2)]">
          全 {totalArticleCount ?? 0} 件
        </span>
      </div>

      <ArticlesServerFilter
        key={`${projectIdParam}-${articleTypeParam}-${interviewIdParam}-${castParam}`}
        initialItems={articleItems}
        initialHasMore={initialHasMore}
        totalCount={totalCount}
        projectOptions={projectOptions}
        interviewOptions={interviewOptions}
        castOptions={castOptions}
        showProjectColumn={true}
        showInterviewColumn={true}
        showCastColumn={true}
        noResultsTitle="条件に合う記事が見つかりません。"
        noResultsDescription="絞り込み条件を変えると、記事が表示されます。"
      />
    </>
  )
}

