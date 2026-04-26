export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'

import { ArticleListTable } from '@/components/article-list-table'
import { ButtonLink, CharacterAvatar, InterviewerSpeech } from '@/components/ui'
import { AppShell, checkIsAdmin } from '@/components/app-shell'
import { getCharacter, getCastName } from '@/lib/characters'
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
    const excerpt = article.content
      .replace(/^#{1,6}\s+/gm, '')   // 見出し記号を除去
      .replace(/\*\*(.+?)\*\*/g, '$1') // bold
      .replace(/\*(.+?)\*/g, '$1')     // italic
      .replace(/`(.+?)`/g, '$1')       // inline code
      .replace(/^\s*[-*+]\s+/gm, '')   // リスト記号
      .replace(/^\s*\d+\.\s+/gm, '')   // 番号リスト
      .replace(/\[(.+?)\]\(.+?\)/g, '$1') // リンク
      .replace(/\n+/g, ' ')            // 改行をスペースに
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
      interviewerLabel: interview ? getCastName(interview.interviewer_type) : '—',
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
        <span className="text-sm text-[var(--text3)]">{articles.length} 件</span>
      </div>

      {articles.length === 0 ? (
        (() => {
          const rain = getCharacter('rain')
          return (
            <>
              <InterviewerSpeech
                icon={(
                  <CharacterAvatar
                    src={rain?.icon48}
                    alt={`${rain?.name ?? 'インタビュアー'}のアイコン`}
                    emoji={rain?.emoji}
                    size={48}
                  />
                )}
                name={rain?.name ?? 'インタビュアー'}
                title="記事素材がまだありません。"
                description="取材メモから記事を作ると、ここに一覧で並びます。まずは取材を始めてみましょう。"
                tone="soft"
              />
              <div className="mt-4">
                <ButtonLink href="/dashboard">取材先を確認する →</ButtonLink>
              </div>
            </>
          )
        })()
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
