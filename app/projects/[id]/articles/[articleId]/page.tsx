import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader, StateCard } from '@/components/ui'

const ARTICLE_TYPE_LABEL: Record<string, string> = {
  client: 'クライアント視点',
  interviewer: 'インタビュアー視点',
  conversation: '会話込み',
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
}: {
  params: Promise<{ id: string; articleId: string }>
}) {
  const { id, articleId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: article } = await supabase
    .from('articles')
    .select('id, title, content, article_type, created_at, project_id, interview_id')
    .eq('id', articleId)
    .eq('project_id', id)
    .single()

  if (!article) redirect(`/projects/${id}`)

  const { data: project } = await supabase
    .from('projects')
    .select('id, user_id, name, hp_url')
    .eq('id', id)
    .single()

  if (!project || project.user_id !== user.id) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-stone-50">
      <PageHeader title="Insight Cast" backHref={`/projects/${id}`} backLabel="← 取材先の管理に戻る" />

      <main className="mx-auto max-w-3xl px-6 py-8 space-y-6">
        <section className="rounded-2xl border border-stone-100 bg-white p-6">
          <p className="text-xs text-stone-400">{project.name || project.hp_url}</p>
          <h1 className="mt-2 text-xl font-semibold text-stone-800">{article.title || '記事'}</h1>
          <p className="mt-2 text-sm text-stone-400">
            {ARTICLE_TYPE_LABEL[article.article_type ?? ''] ?? '記事'} ・ {formatDateTime(article.created_at)}
          </p>
          {article.interview_id && (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Link
                href={`/projects/${id}/summary?interviewId=${article.interview_id}`}
                className="inline-flex items-center justify-center rounded-xl border border-stone-200 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 transition-colors"
              >
                元の取材メモを見る
              </Link>
              <Link
                href={`/projects/${id}/article?interviewId=${article.interview_id}`}
                className="inline-flex items-center justify-center rounded-xl bg-stone-800 px-4 py-2 text-sm text-white hover:bg-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 transition-colors"
              >
                この取材から記事を作り直す
              </Link>
            </div>
          )}
        </section>

        {!article.content ? (
          <StateCard
            icon="📝"
            title="まだ記事の本文が見つかりませんでした。"
            description="少し待ってから開き直すと見られることがあります。"
            tone="warning"
          />
        ) : (
          <section className="rounded-2xl border border-stone-100 bg-white p-6">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-stone-700">
              {article.content}
            </pre>
          </section>
        )}
      </main>
    </div>
  )
}
