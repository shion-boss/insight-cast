import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ButtonLink, CharacterAvatar } from '@/components/ui'
import { CHARACTERS } from '@/lib/characters'
import { PublicHeader, PublicFooter, PublicPageFrame } from '@/components/public-layout'
import { POSTS, CATEGORY_LABELS, getRelatedPosts, getBlogPostFromDB } from '@/lib/blog-posts'
import type { NormalSection } from '@/lib/blog-contents'

export async function generateStaticParams() {
  return POSTS.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPostFromDB(slug)
  if (!post) return {}
  return {
    title: `${post.title} | Insight Cast`,
    description: post.excerpt,
  }
}

function formatDate(date: string): string {
  const d = new Date(date)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

function NormalBodySection({ section }: { section: NormalSection }) {
  switch (section.type) {
    case 'h2':
      return (
        <h2 className="mt-10 mb-4 text-xl font-bold text-stone-800 first:mt-0">{section.text}</h2>
      )
    case 'h3':
      return <h3 className="mt-8 mb-3 text-lg font-semibold text-stone-800">{section.text}</h3>
    case 'p':
      return <p className="mb-5 leading-8 text-stone-600">{section.text}</p>
    case 'ul':
      return (
        <ul className="mb-5 space-y-2 pl-4">
          {section.items.map((item, i) => (
            <li key={i} className="relative pl-4 leading-7 text-stone-600 before:absolute before:left-0 before:top-3 before:h-1.5 before:w-1.5 before:rounded-full before:bg-stone-400">
              {item}
            </li>
          ))}
        </ul>
      )
  }
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getBlogPostFromDB(slug)
  if (!post) notFound()

  const body = post.body ?? null
  const relatedPosts = getRelatedPosts(post, 3)
  const interviewer = post.interviewer ? CHARACTERS.find((c) => c.id === post.interviewer) : undefined

  return (
    <PublicPageFrame>
      <PublicHeader />

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-12">
        {/* パンくず */}
        <nav aria-label="パンくず" className="mb-8 flex items-center gap-2 text-sm text-stone-400">
          <Link href="/blog" className="rounded transition-colors hover:text-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40">
            ブログ
          </Link>
          <span>›</span>
          <span className="text-stone-500">{CATEGORY_LABELS[post.category]}</span>
        </nav>

        {/* 記事ヘッダー */}
        <div className="mb-12 max-w-2xl">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-stone-200 bg-white/90 px-3 py-1 text-xs font-medium text-stone-500">
              {CATEGORY_LABELS[post.category]}
            </span>
            {post.type === 'interview' && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                インタビュー記事
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold leading-snug tracking-tight text-stone-950 sm:text-3xl">
            {post.title}
          </h1>

          <div className="mt-4 flex items-center gap-3">
            <time className="text-sm text-stone-400" dateTime={post.date}>
              {formatDate(post.date)}
            </time>
            {interviewer && (
              <span className="flex items-center gap-1.5 text-sm text-stone-500">
                <CharacterAvatar
                  src={interviewer.icon48}
                  alt={`${interviewer.name}のアイコン`}
                  emoji={interviewer.emoji}
                  size={24}
                />
                {interviewer.name}取材
              </span>
            )}
          </div>
        </div>

        {/* 本文エリア */}
        <div className="mx-auto max-w-2xl">
          {body?.kind === 'normal' && (
            <div>
              {body.sections.map((section, i) => (
                <NormalBodySection key={i} section={section} />
              ))}
            </div>
          )}

          {body?.kind === 'interview' && (() => {
            const interviewerChar = post.interviewer
              ? CHARACTERS.find((c) => c.id === post.interviewer)
              : undefined
            return (
              <div>
                {/* 導入文 */}
                <p className="mb-8 leading-8 text-stone-600">{body.intro}</p>

                {/* この記事でわかること */}
                <div className="mb-8 rounded-[1.5rem] border border-stone-200/80 bg-[rgba(255,253,249,0.94)] px-6 py-5 backdrop-blur-sm">
                  <p className="mb-3 text-sm font-semibold text-stone-700">この記事でわかること</p>
                  <ul className="space-y-2">
                    {body.highlights.map((item, i) => (
                      <li
                        key={i}
                        className="relative pl-4 text-sm leading-7 text-stone-600 before:absolute before:left-0 before:top-3 before:h-1.5 before:w-1.5 before:rounded-full before:bg-amber-400"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* インタビュアー紹介 */}
                {interviewerChar && (
                  <div className="mb-8 flex items-start gap-3 rounded-[1.5rem] border border-stone-200/80 bg-[rgba(255,253,249,0.94)] px-5 py-4 backdrop-blur-sm">
                    <CharacterAvatar
                      src={interviewerChar.icon96}
                      alt={`${interviewerChar.name}のアイコン`}
                      emoji={interviewerChar.emoji}
                      size={48}
                    />
                    <div>
                      <p className="text-sm font-semibold text-stone-700">
                        担当: {interviewerChar.name}（{interviewerChar.species}）
                      </p>
                      <p className="mt-1 text-sm text-stone-500">{body.interviewerIntro}</p>
                    </div>
                  </div>
                )}

                {/* 会話ブロック */}
                <div className="mb-8 space-y-4">
                  {body.conversation.map((turn, i) => {
                    if (turn.role === 'owner') {
                      return (
                        <div key={i} className="flex gap-3">
                          <div className="flex-1 rounded-2xl border border-stone-200/80 bg-[rgba(255,253,249,0.94)] px-5 py-4 text-sm leading-7 text-stone-700 backdrop-blur-sm">
                            {turn.text}
                          </div>
                          <div className="w-10 flex-shrink-0" aria-hidden="true" />
                        </div>
                      )
                    }
                    return (
                      <div key={i} className="flex flex-row-reverse gap-3">
                        {interviewerChar && (
                          <CharacterAvatar
                            src={interviewerChar.icon48}
                            alt={`${interviewerChar.name}のアイコン`}
                            emoji={interviewerChar.emoji}
                            size={40}
                            className="flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 rounded-2xl border border-amber-200/60 bg-amber-50/70 px-5 py-4 text-sm leading-7 text-stone-700">
                          {turn.text}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* まとめ */}
                <div className="rounded-[1.5rem] border border-amber-200/60 bg-[linear-gradient(145deg,rgba(255,247,230,0.98),rgba(255,253,249,0.95))] px-6 py-5">
                  <p className="mb-2 text-sm font-semibold text-stone-700">取材のまとめ</p>
                  <p className="text-sm leading-7 text-stone-600">{body.summary}</p>
                </div>
              </div>
            )
          })()}

          {!body && (
            <p className="text-stone-500">本文を準備中です。</p>
          )}

          {/* 記事末尾 */}
          <div className="mt-14 flex flex-col gap-8">
            <Link
              href="/blog"
              className="inline-flex items-center rounded text-sm text-stone-500 transition-colors hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40"
            >
              ← ブログ一覧へ
            </Link>

            {/* CTA */}
            <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-[linear-gradient(135deg,_#1f2937_0%,_#292524_58%,_#7c5a31_100%)] px-7 py-10 text-center text-white">
              <p className="text-xs font-medium tracking-[0.22em] text-amber-200 uppercase">Start Free</p>
              <p className="mt-4 text-xl font-semibold tracking-tight sm:text-2xl">
                あなたのホームページでも試してみませんか
              </p>
              <p className="mt-3 text-sm leading-7 text-stone-200">
                登録無料。クレジットカード不要でインタビューを体験できます。
              </p>
              <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <ButtonLink href="/auth/signup" className="bg-white text-stone-900 hover:bg-stone-100">
                  無料で取材を始める
                </ButtonLink>
                <ButtonLink href="/cast" tone="ghost" className="border-white/70 text-white hover:border-white/40 hover:bg-white/10">
                  キャストを見る
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>

        {/* 関連記事 */}
        {relatedPosts.length > 0 && (
          <div className="mx-auto mt-16 max-w-2xl">
            <h2 className="mb-6 text-base font-semibold tracking-[0.12em] text-stone-400 uppercase">Related</h2>
            <div className="flex flex-col gap-3">
              {relatedPosts.map((related) => {
                const relatedInterviewer = related.interviewer
                  ? CHARACTERS.find((c) => c.id === related.interviewer)
                  : undefined
                return (
                  <Link
                    key={related.slug}
                    href={`/blog/${related.slug}`}
                    className="card-interactive flex items-start gap-4 rounded-[1.6rem] border border-stone-200/80 bg-[rgba(255,253,249,0.94)] p-5 backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40"
                  >
                    <div
                      className={`h-14 w-14 flex-shrink-0 rounded-xl ${related.coverColor}`}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        {related.type === 'interview' && relatedInterviewer && (
                          <span className="flex items-center gap-1 text-xs text-amber-600">
                            <CharacterAvatar
                              src={relatedInterviewer.icon48}
                              alt={`${relatedInterviewer.name}のアイコン`}
                              emoji={relatedInterviewer.emoji}
                              size={16}
                            />
                            {relatedInterviewer.name}取材
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium leading-snug text-stone-800 line-clamp-2">
                        {related.title}
                      </p>
                      <time className="mt-1 text-xs text-stone-400" dateTime={related.date}>
                        {formatDate(related.date)}
                      </time>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </main>

      <PublicFooter />
    </PublicPageFrame>
  )
}
