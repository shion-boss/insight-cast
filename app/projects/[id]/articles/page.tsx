export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'

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
              className={getButtonClass('secondary', 'px-3 py-2 text-sm')}
            >
              取材メモを見る
            </Link>
          )}
          <Link href={`/projects/${id}`} className={getButtonClass('secondary', 'px-3 py-2 text-sm')}>
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
          description={interview ? '取材メモから記事素材を生成すると、ここに一覧で並びます。' : '記事素材を生成すると、ここに一覧で並びます。'}
          align="left"
          action={(
            <ButtonLink href={interview ? `/projects/${id}/article?interviewId=${interview.id}` : `/projects/${id}`}>
              {interview ? 'この取材から記事を作る' : '取材先の管理へ戻る'}
            </ButtonLink>
          )}
        />
      ) : (
        <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg2)]">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold tracking-[0.10em] text-[var(--text3)] uppercase">タイトル</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-[0.10em] text-[var(--text3)] uppercase whitespace-nowrap">種別</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-[0.10em] text-[var(--text3)] uppercase whitespace-nowrap">作成日</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article, index) => (
                  <tr
                    key={article.id}
                    className={index < articles.length - 1 ? 'border-b border-[var(--border)] transition-colors hover:bg-[var(--bg2)]' : 'transition-colors hover:bg-[var(--bg2)]'}
                  >
                    <td className="max-w-[420px] px-5 py-4">
                      <p className="overflow-hidden text-ellipsis whitespace-nowrap font-semibold text-[var(--text)]">
                        {article.title || '記事'}
                      </p>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="rounded-full border border-[var(--border)] bg-[var(--bg2)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--text3)]">
                        {ARTICLE_TYPE_LABEL[article.article_type ?? ''] ?? '記事'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-xs text-[var(--text3)]">
                      {formatDate(article.created_at)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Link
                        href={`/projects/${id}/articles/${article.id}`}
                        className="text-xs font-medium text-[var(--text3)] transition-colors hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 rounded"
                      >
                        詳細
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppShell>
  )
}
