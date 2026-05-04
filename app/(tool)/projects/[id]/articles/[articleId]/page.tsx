import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Breadcrumb, CharacterAvatar, StateCard, getButtonClass, getPanelClass } from '@/components/ui'
import { ArticleExportPanel } from './ArticleExportPanel'
import { DeleteArticleButton } from './DeleteArticleButton'
import { getCharacter } from '@/lib/characters'
import type { ArticleSuggestions } from '@/lib/article-suggestions'
import { getMemberRole } from '@/lib/project-members'

export const metadata: Metadata = {
  title: '記事の詳細',
  robots: { index: false, follow: false },
}

const ARTICLE_TYPE_LABEL: Record<string, string> = {
  client: 'ブログ記事',
  interviewer: 'レポート記事',
  conversation: '会話記事',
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
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

  // article と project を並列取得
  const [{ data: article }, { data: project }] = await Promise.all([
    supabase
      .from('articles')
      .select('id, title, content, article_type, created_at, project_id, interview_id, suggestions')
      .eq('id', articleId)
      .eq('project_id', id)
      .is('deleted_at', null)
      .single(),
    supabase.from('projects').select('id, user_id, name, hp_url').eq('id', id).is('deleted_at', null).single(),
  ])

  if (!article) redirect(`/projects/${id}`)
  if (!project) redirect('/dashboard')

  const isOwner = project.user_id === user.id
  const memberRole = isOwner ? null : await getMemberRole(supabase, id, user.id)
  if (!isOwner && !memberRole) redirect('/dashboard')
  const canEdit = isOwner || memberRole === 'editor'

  // 会話記事の「取材先」デフォルトは取材を受けたユーザーの名前・アイコンを使う。
  // profiles RLS は own profile only なので、admin client で取得する。
  // 1) 取材を受けたユーザー（interviewee_user_id）の profile を最優先
  // 2) 既存の取材で interviewee_user_id が NULL の場合は project owner にフォールバック
  // 3) 外部取材は external_respondent_name のみ（avatar なし）
  const adminSupabase = createAdminClient()
  const { data: interview } = article.interview_id
    ? await supabase.from('interviews').select('interviewer_type, external_respondent_name, interviewee_user_id').eq('id', article.interview_id).single()
    : { data: null as { interviewer_type: string | null; external_respondent_name: string | null; interviewee_user_id: string | null } | null }

  const intervieweeUserId = interview?.interviewee_user_id ?? project.user_id
  const { data: intervieweeProfile } = await adminSupabase
    .from('profiles')
    .select('avatar_url, name')
    .eq('id', intervieweeUserId)
    .maybeSingle()

  const interviewer = interview?.interviewer_type ? getCharacter(interview.interviewer_type) : null
  const fallbackChar = getCharacter('mint')
  const displayChar = interviewer ?? fallbackChar

  // ハル取材の場合のみ、添付画像のサムネイル一覧を取得して記事下部に表示する。
  // 画像本体は記事 HTML には埋め込まれず、ここで「使った写真」として参照できる。
  type AttachmentMeta = { path?: string; content_type?: string }
  type AttachmentRef = { path: string; signedUrl: string }
  const attachmentRefs: AttachmentRef[] = []
  if (interview?.interviewer_type === 'hal' && article.interview_id) {
    const { data: msgs } = await adminSupabase
      .from('interview_messages')
      .select('meta')
      .eq('interview_id', article.interview_id)
      .order('created_at', { ascending: true })
    const paths: string[] = []
    for (const m of msgs ?? []) {
      const meta = (m as { meta?: { attachments?: AttachmentMeta[] } | null }).meta ?? null
      const list = Array.isArray(meta?.attachments) ? meta!.attachments : []
      for (const a of list) {
        if (typeof a?.path === 'string') paths.push(a.path)
      }
    }
    if (paths.length > 0) {
      const { data: signed } = await adminSupabase.storage
        .from('interview-attachments')
        .createSignedUrls(paths.slice(0, 12), 60 * 60)
      for (const item of signed ?? []) {
        if (item.path && item.signedUrl) {
          attachmentRefs.push({ path: item.path, signedUrl: item.signedUrl })
        }
      }
    }
  }

  const backHref = from === 'articles'
    ? fromInterviewId ? `/articles?interviewId=${fromInterviewId}&projectId=${id}` : `/articles`
    : `/projects/${id}`
  const backLabel = from === 'articles' ? '← 記事一覧に戻る' : '← プロジェクトの管理に戻る'

  return (
    <div className="max-w-3xl space-y-6">
      <div className="space-y-6">
        <Breadcrumb items={[
          { label: 'プロジェクト一覧', href: '/projects' },
          { label: project.name || project.hp_url, href: `/projects/${id}` },
          ...(article.interview_id ? [{ label: '取材メモ', href: `/projects/${id}/summary?interviewId=${article.interview_id}` }] : []),
          { label: '記事詳細' },
        ]} />
        <section className={getPanelClass('rounded-[var(--r-xl)] p-6')}>
          <div>
            <p className="text-xs text-[var(--text3)]">{project.name || project.hp_url}</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--text)]">{article.title || '記事'}</h2>
            <p className="mt-2 text-sm text-[var(--text3)]">
              {ARTICLE_TYPE_LABEL[article.article_type ?? ''] ?? '記事'} ・ {formatDateTime(article.created_at)}
            </p>
          </div>
          <div className="mt-4 flex items-center gap-3">
            {article.interview_id && (
              <Link
                href={`/projects/${id}/summary?interviewId=${article.interview_id}`}
                className={getButtonClass('secondary')}
              >
                元の取材メモを見る
              </Link>
            )}
            {isOwner && (
              <div className="ml-auto">
                <DeleteArticleButton
                  articleId={article.id}
                  projectId={id}
                  articleTitle={article.title ?? '記事'}
                  backHref={backHref}
                />
              </div>
            )}
          </div>
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
              interviewerId={interview?.interviewer_type ?? null}
              interviewerName={interviewer?.name ?? null}
              interviewerLabel={interviewer?.label ?? null}
              clientName={interview?.external_respondent_name ?? intervieweeProfile?.name ?? '事業者'}
              userAvatarUrl={intervieweeProfile?.avatar_url ?? null}
              articleId={article.id}
              projectId={id}
              suggestions={article.suggestions as ArticleSuggestions | null}
              canEdit={canEdit}
            />
            {attachmentRefs.length > 0 && (
              <section className="rounded-[var(--r-xl)] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
                <header className="mb-3">
                  <h2 className="text-base font-semibold text-[var(--text)]">この取材で添付された写真</h2>
                  <p className="mt-1 text-xs text-[var(--text3)]">
                    記事本文には画像は含まれていません。HP に投稿する際、必要な写真をここから選んでお手元のブログ等に貼り付けてください。
                  </p>
                </header>
                <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {attachmentRefs.map((ref) => (
                    <li key={ref.path}>
                      <a
                        href={ref.signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block aspect-square overflow-hidden rounded-md border border-[var(--border)] bg-[var(--bg2)] hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                        aria-label="添付画像を新しいタブで開く"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={ref.signedUrl}
                          alt="取材で添付された写真"
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
