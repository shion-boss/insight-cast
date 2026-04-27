import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell, checkIsAdmin } from '@/components/app-shell'
import { Breadcrumb, CharacterAvatar, StateCard, getButtonClass, getPanelClass } from '@/components/ui'
import { ArticleExportPanel } from './ArticleExportPanel'
import { getCharacter } from '@/lib/characters'

const ARTICLE_TYPE_LABEL: Record<string, string> = {
  client: '解説・まとめ形式',
  interviewer: 'インタビュアー視点',
  conversation: 'インタビュー形式',
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

export default async function ArticleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; articleId: string }>
  searchParams: Promise<{ from?: string; interviewId?: string }>
}) {
  const { id, articleId } = await params
  const { from, interviewId: fromInterviewId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // profile と article を並列取得
  const [{ data: profile }, { data: article }] = await Promise.all([
    supabase.from('profiles').select('name, avatar_url').eq('id', user.id).maybeSingle(),
    supabase
      .from('articles')
      .select('id, title, content, article_type, created_at, project_id, interview_id')
      .eq('id', articleId)
      .eq('project_id', id)
      .single(),
  ])

  if (!article) redirect(`/projects/${id}`)

  // article が取れてから project と interview を並列取得
  const [{ data: project }, { data: interview }] = await Promise.all([
    supabase.from('projects').select('id, user_id, name, hp_url').eq('id', id).single(),
    article.interview_id
      ? supabase.from('interviews').select('interviewer_type').eq('id', article.interview_id).single()
      : Promise.resolve({ data: null }),
  ])

  if (!project || project.user_id !== user.id) redirect('/dashboard')

  const interviewer = interview?.interviewer_type ? getCharacter(interview.interviewer_type) : null
  const fallbackChar = getCharacter('mint')
  const displayChar = interviewer ?? fallbackChar

  const backHref = from === 'articles'
    ? fromInterviewId ? `/articles?interviewId=${fromInterviewId}&projectId=${id}` : `/articles`
    : `/projects/${id}`
  const backLabel = from === 'articles' ? '← 記事一覧に戻る' : '← 取材先の管理に戻る'

  return (
    <AppShell
      title="記事詳細"
      active="projects"
      accountLabel={profile?.name ?? user.email ?? '設定'}
      isAdmin={checkIsAdmin(user.email)}
      contentClassName="max-w-3xl space-y-6"
      headerRight={(
        <Link href={backHref} className={getButtonClass('secondary', 'px-4 py-2 text-sm')}>
          {backLabel}
        </Link>
      )}
    >
      <div className="space-y-6">
        <Breadcrumb items={[
          { label: '取材先一覧', href: '/projects' },
          { label: '取材先の管理', href: `/projects/${id}` },
          ...(article.interview_id ? [{ label: '取材メモ', href: `/projects/${id}/summary?interviewId=${article.interview_id}` }] : []),
          { label: '記事詳細' },
        ]} />
        <section className={getPanelClass('rounded-[var(--r-xl)] p-6')}>
          <p className="text-xs text-[var(--text3)]">{project.name || project.hp_url}</p>
          <h1 className="mt-2 text-xl font-semibold text-[var(--text)]">{article.title || '記事'}</h1>
          <p className="mt-2 text-sm text-[var(--text3)]">
            {ARTICLE_TYPE_LABEL[article.article_type ?? ''] ?? '記事'} ・ {formatDateTime(article.created_at)}
          </p>
          {article.interview_id && (
            <div className="mt-4">
              <Link
                href={`/projects/${id}/summary?interviewId=${article.interview_id}`}
                className={getButtonClass('secondary')}
              >
                元の取材メモを見る
              </Link>
            </div>
          )}
        </section>

        {!article.content ? (
          <div className="space-y-4">
            <StateCard
              icon={
                <CharacterAvatar
                  src={displayChar?.icon48}
                  alt={`${displayChar?.name ?? 'インタビュアー'}のアイコン`}
                  emoji={displayChar?.emoji}
                  size={48}
                />
              }
              title="まだ記事の本文が見つかりませんでした。"
              description="少し待ってから開き直すと見られることがあります。"
              tone="warning"
            />
            <div className="flex gap-3">
              <Link
                href={backHref}
                className={getButtonClass('secondary', 'text-sm px-4 py-2.5')}
              >
                {backLabel}
              </Link>
            </div>
          </div>
        ) : (
          <>
            <ArticleExportPanel
              content={article.content}
              title={article.title ?? '記事'}
              articleType={article.article_type ?? 'client'}
              date={article.created_at}
              interviewerId={interview?.interviewer_type ?? null}
              interviewerName={interviewer?.name ?? null}
              interviewerLabel={interviewer?.label ?? null}
              clientName={project.name ?? project.hp_url ?? null}
              userAvatarUrl={profile?.avatar_url ?? null}
              articleId={article.id}
              projectId={id}
            />
          </>
        )}
      </div>
    </AppShell>
  )
}
