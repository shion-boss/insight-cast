import { redirect } from 'next/navigation'

import { ArticlesServerFilter } from '@/components/articles-server-filter'
import { ButtonLink, CharacterAvatar, InterviewerSpeech } from '@/components/ui'
import { getCharacter, getCastName } from '@/lib/characters'
import { createClient } from '@/lib/supabase/server'

const PAGE_SIZE = 20

const ARTICLE_TYPE_LABEL: Record<string, string> = {
  client: 'ブログ記事',
  interviewer: 'インタビュー形式',
  conversation: '会話込み',
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

type ProjectRow = { id: string; name: string | null; hp_url: string }
type InterviewRow = { id: string; interviewer_type: string; created_at: string }

function formatDate(value: string) {
  const d = new Date(value)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    projectId?: string
    articleType?: string
    interviewId?: string
    q?: string
  }>
}) {
  const {
    page: pageStr,
    projectId: projectIdParam = 'all',
    articleType: articleTypeParam = 'all',
    interviewId: interviewIdParam = 'all',
    q = '',
  } = await searchParams

  const page = Math.max(1, Number(pageStr ?? '1'))
  const start = (page - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE - 1

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const [{ data: projectRows }] = await Promise.all([
    supabase.from('projects').select('id, name, hp_url').eq('user_id', user.id).is('deleted_at', null),
  ])

  const projects = (projectRows ?? []) as ProjectRow[]
  const projectIds = projects.map((p) => p.id)

  if (projectIds.length === 0) {
    const rain = getCharacter('rain')
    return (
      <>
        <h1 className="mb-6 font-serif text-xl font-bold text-[var(--text)]">記事一覧</h1>
        <InterviewerSpeech
          icon={<CharacterAvatar src={rain?.icon48} alt={`${rain?.name ?? 'インタビュアー'}のアイコン`} emoji={rain?.emoji} size={48} />}
          name={rain?.name ?? 'インタビュアー'}
          title="記事がまだありません。"
          description="取材メモから記事を作ると、ここに一覧で並びます。まずは取材を始めてみましょう。"
          tone="soft"
        />
        <div className="mt-4">
          <ButtonLink href="/dashboard">取材先を確認する <span aria-hidden="true">→</span></ButtonLink>
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
  if (q) articlesQuery = articlesQuery.or(`title.ilike.%${q}%,content.ilike.%${q}%`)

  // フィルター済みページネーション記事 / インタビュアードロップダウン用全件 / 全記事件数 を並列取得
  const [
    { data: articleRows, count: filteredCount },
    { data: allInterviewIdRows },
    { count: totalArticleCount },
  ] = await Promise.all([
    articlesQuery.range(start, end),
    supabase.from('articles').select('interview_id').in('project_id', projectIds).not('interview_id', 'is', null).is('deleted_at', null),
    supabase.from('articles').select('id', { count: 'exact', head: true }).in('project_id', projectIds).is('deleted_at', null),
  ])

  const articles = (articleRows ?? []) as ArticleRow[]
  const totalCount = filteredCount ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  // 表示中の記事に紐づく project / interview を取得（表示用）
  const displayProjectIds = [...new Set(articles.map((a) => a.project_id))]
  const displayInterviewIds = [...new Set(articles.map((a) => a.interview_id).filter((id): id is string => Boolean(id)))]

  // インタビュアードロップダウン用の全 interview ID（重複排除）
  const allInterviewIds = [...new Set(
    (allInterviewIdRows ?? []).map((r) => r.interview_id).filter((id): id is string => Boolean(id))
  )]

  const [{ data: displayProjectRows }, { data: displayInterviewRows }, { data: dropdownInterviewRows }] = await Promise.all([
    displayProjectIds.length > 0
      ? supabase.from('projects').select('id, name, hp_url').in('id', displayProjectIds).is('deleted_at', null)
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

    return {
      id: article.id,
      title: article.title || '記事',
      excerpt,
      articleTypeLabel: ARTICLE_TYPE_LABEL[article.article_type ?? ''] ?? '記事',
      createdAtLabel: formatDate(article.created_at),
      detailHref: `/projects/${article.project_id}/articles/${article.id}`,
      projectLabel: project?.name || project?.hp_url || '—',
      interviewerLabel: interview
        ? `${formatDate(interview.created_at)} · ${getCastName(interview.interviewer_type)}`
        : '—',
    }
  })

  // ドロップダウン選択肢
  const projectOptions = projects.map((p) => ({ id: p.id, label: p.name || p.hp_url }))
  const interviewerOptions = (dropdownInterviewRows ?? [])
    .map((i) => ({
      id: i.id,
      label: `${formatDate(i.created_at)} · ${getCastName(i.interviewer_type)}`,
    }))
    .sort((a, b) => b.label.localeCompare(a.label, 'ja'))

  if (totalCount === 0 && !q && projectIdParam === 'all' && articleTypeParam === 'all' && interviewIdParam === 'all') {
    const rain = getCharacter('rain')
    return (
      <>
        <h1 className="mb-6 font-serif text-xl font-bold text-[var(--text)]">記事一覧</h1>
        <InterviewerSpeech
          icon={<CharacterAvatar src={rain?.icon48} alt={`${rain?.name ?? 'インタビュアー'}のアイコン`} emoji={rain?.emoji} size={48} />}
          name={rain?.name ?? 'インタビュアー'}
          title="記事がまだありません。"
          description="取材メモから記事を作ると、ここに一覧で並びます。まずは取材を始めてみましょう。"
          tone="soft"
        />
        <div className="mt-4">
          <ButtonLink href="/dashboard">取材先を確認する <span aria-hidden="true">→</span></ButtonLink>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-xl font-bold text-[var(--text)]">記事一覧</h1>
        <span className="rounded-full bg-[var(--surface)] border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text2)]">
          全 {totalArticleCount ?? 0} 件
        </span>
      </div>

      <ArticlesServerFilter
        items={articleItems}
        totalCount={totalCount}
        currentPage={page}
        totalPages={totalPages}
        projectOptions={projectOptions}
        interviewerOptions={interviewerOptions}
        showProjectColumn={true}
        showInterviewerColumn={true}
        searchPlaceholder="タイトル・本文で検索"
        noResultsTitle="条件に合う記事が見つかりません。"
        noResultsDescription="キーワードや絞り込み条件を変えると、記事が表示されます。"
      />
    </>
  )
}
