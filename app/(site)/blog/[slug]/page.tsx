import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'

import { CharacterAvatar, Breadcrumb } from '@/components/ui'
import { getCharacter, CHARACTERS } from '@/lib/characters'
import { CATEGORY_LABELS, CATEGORY_COLOR_MAP, getRelatedPostsFromList } from '@/lib/blog-posts'
import { getBlogPostFromDB, getBlogPostsFromDB } from '@/lib/blog-posts.server'
import type { NormalSection } from '@/lib/blog-contents'
import { MarkdownArticleBody } from '@/lib/blog-markdown'
import { ShareButtons } from './ShareButtons'

export async function generateStaticParams() {
  const posts = await getBlogPostsFromDB()
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPostFromDB(slug)
  if (!post) return {}
  const postUrl = `${(process.env.NEXT_PUBLIC_APP_URL ?? 'https://insight-cast.jp').replace(/\/$/, '')}/blog/${slug}`
  return {
    title: `${post.title} | Insight Cast`,
    description: post.excerpt,
    alternates: { canonical: postUrl },
    openGraph: {
      title: `${post.title} | Insight Cast`,
      description: post.excerpt ?? undefined,
      url: postUrl,
      siteName: 'Insight Cast',
      locale: 'ja_JP',
      type: 'article',
      publishedTime: post.date ? new Date(post.date).toISOString() : undefined,
      authors: ['Insight Cast'],
      images: [{ url: '/logo.jpg', width: 1116, height: 350, alt: 'Insight Cast' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${post.title} | Insight Cast`,
      description: post.excerpt ?? undefined,
      images: ['/logo.jpg'],
    },
  }
}

function NormalBodySection({ section }: { section: NormalSection }) {
  switch (section.type) {
    case 'h2':
      return (
        <h2 className="mt-10 mb-4 text-xl font-bold text-[var(--text)] first:mt-0">{section.text}</h2>
      )
    case 'h3':
      return <h3 className="mt-8 mb-3 text-lg font-semibold text-[var(--text)]">{section.text}</h3>
    case 'p':
      return <p className="mb-5 leading-8 text-[var(--text2)]">{section.text}</p>
    case 'ul':
      return (
        <ul className="mb-5 space-y-2 pl-4">
          {section.items.map((item, i) => (
            <li key={i} className="relative pl-4 leading-7 text-[var(--text2)] before:absolute before:left-0 before:top-3 before:h-1.5 before:w-1.5 before:rounded-full before:bg-[var(--text3)]">
              {item}
            </li>
          ))}
        </ul>
      )
  }
}

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://insight-cast.jp').replace(/\/$/, '')

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getBlogPostFromDB(slug)
  if (!post) notFound()

  const body = post.body ?? null
  const allPosts = await getBlogPostsFromDB()
  const relatedPosts = getRelatedPostsFromList(allPosts, post, 3)
  const interviewer = post.interviewer ? CHARACTERS.find((c) => c.id === post.interviewer) : undefined

  // 日付降順で並んでいる前提で prev/next を求める（新しい記事が前）
  const currentIdx = allPosts.findIndex((p) => p.slug === slug)
  const prevPost = currentIdx > 0 ? allPosts[currentIdx - 1] : null
  const nextPost = currentIdx >= 0 && currentIdx < allPosts.length - 1 ? allPosts[currentIdx + 1] : null

  const bodyTextLength = (() => {
    const b = post.body
    if (!b) return 0
    if (b.kind === 'markdown') return b.content.replace(/\s+/g, '').length
    if (b.kind === 'normal') return b.sections.map((s) => ('text' in s ? s.text : s.items.join(''))).join('').replace(/\s+/g, '').length
    if (b.kind === 'interview') return b.conversation.map((t) => t.text).join('').replace(/\s+/g, '').length
    return 0
  })()
  const readingTimeMin = Math.max(1, Math.ceil(bodyTextLength / 500))

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt ?? undefined,
    datePublished: post.date,
    dateModified: post.date,
    url: `${APP_URL}/blog/${slug}`,
    publisher: {
      '@type': 'Organization',
      name: 'Insight Cast',
      url: APP_URL,
    },
    author: interviewer
      ? { '@type': 'Person', name: `${interviewer.name}（Insight Cast AIキャスト）` }
      : { '@type': 'Organization', name: 'Insight Cast' },
    inLanguage: 'ja',
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: APP_URL },
      { '@type': 'ListItem', position: 2, name: 'ブログ', item: `${APP_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: `${APP_URL}/blog/${slug}` },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <main id="main-content" className="relative z-10 mx-auto max-w-6xl px-6 py-12">
        <Breadcrumb items={[
          { label: 'ブログ', href: '/blog' },
          { label: post.title },
        ]} />

        {/* 記事ヘッダー */}
        {(() => {
          const themeColor = CATEGORY_COLOR_MAP[post.category]
          const headerChar = interviewer
          return (
            <div className="mb-14">
              {/* バッジ */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold" style={{ background: `${themeColor}1a`, color: themeColor }}>
                  {CATEGORY_LABELS[post.category]}
                </span>
                <span className="text-[11px] text-[var(--text3)]">約{readingTimeMin}分で読めます</span>
                <span className="text-[11px] text-[var(--text3)]"><span aria-hidden="true">· </span>{post.date}</span>
              </div>

              {headerChar && (
                <div className="mt-5 flex items-center gap-3">
                  <CharacterAvatar
                    src={headerChar.icon48}
                    alt={`${headerChar.name}のアイコン`}
                    emoji={headerChar.emoji}
                    size={40}
                  />
                  <div>
                    <p className="text-[11px] text-[var(--text3)]">取材担当</p>
                    <p className="text-sm font-semibold text-[var(--text)]">
                      {headerChar.name}
                      <span className="ml-1.5 font-normal text-[var(--text3)]">（{headerChar.species}）</span>
                    </p>
                    <p className="text-[11px] leading-relaxed text-[var(--text3)]">{headerChar.specialty}</p>
                  </div>
                </div>
              )}

              {/* アクセントライン */}
              <div className="mt-6 h-[2px] w-full rounded-full" style={{ background: `linear-gradient(90deg, ${themeColor}, transparent)` }} />
            </div>
          )
        })()}

        {/* タイトル */}
        <div className="mx-auto mb-10 max-w-2xl">
          <h1 className="font-[family-name:var(--font-noto-serif-jp)] text-2xl font-bold leading-snug tracking-tight text-[var(--text)] sm:text-3xl">
            {post.title}
          </h1>
        </div>

        {/* 本文エリア */}
        <div className="mx-auto max-w-2xl">
          {body?.kind === 'markdown' && <MarkdownArticleBody markdown={body.content} />}

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
                <p className="mb-8 leading-8 text-[var(--text2)]">{body.intro}</p>

                {/* この記事でわかること */}
                <div className="mb-8 rounded-[var(--r-lg)] border border-[var(--border)]/80 bg-[rgba(255,253,249,0.94)] px-6 py-5 backdrop-blur-sm">
                  <p className="mb-3 text-sm font-semibold text-[var(--text2)]">この記事でわかること</p>
                  <ul className="space-y-2">
                    {body.highlights.map((item, i) => (
                      <li
                        key={i}
                        className="relative pl-4 text-sm leading-7 text-[var(--text2)] before:absolute before:left-0 before:top-3 before:h-1.5 before:w-1.5 before:rounded-full before:bg-[var(--accent)]"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* インタビュアー紹介 */}
                {interviewerChar && (
                  <div className="mb-8 flex items-start gap-3 rounded-[var(--r-lg)] border border-[var(--border)]/80 bg-[rgba(255,253,249,0.94)] px-5 py-4 backdrop-blur-sm">
                    <CharacterAvatar
                      src={interviewerChar.icon96}
                      alt={`${interviewerChar.name}のアイコン`}
                      emoji={interviewerChar.emoji}
                      size={48}
                    />
                    <div>
                      <p className="text-sm font-semibold text-[var(--text2)]">
                        担当: {interviewerChar.name}（{interviewerChar.species}）
                      </p>
                      <p className="mt-1 text-sm text-[var(--text3)]">{body.interviewerIntro}</p>
                    </div>
                  </div>
                )}

                {/* 会話ブロック */}
                <div className="mb-8 space-y-4">
                  {body.conversation.map((turn, i) => {
                    if (turn.role === 'owner') {
                      return (
                        <div key={i} className="flex gap-3">
                          <div className="flex-1 rounded-2xl border border-[var(--border)]/80 bg-[rgba(255,253,249,0.94)] px-5 py-4 text-sm leading-7 text-[var(--text2)] backdrop-blur-sm">
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
                        <div className="flex-1 rounded-2xl border border-[var(--accent-l)] bg-[var(--accent-l)] px-5 py-4 text-sm leading-7 text-[var(--text2)]">
                          {turn.text}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* まとめ */}
                <div className="rounded-[var(--r-lg)] border border-[var(--accent-l)] bg-[linear-gradient(145deg,rgba(255,247,230,0.98),rgba(255,253,249,0.95))] px-6 py-5">
                  <p className="mb-2 text-sm font-semibold text-[var(--text2)]">取材のまとめ</p>
                  <p className="text-sm leading-7 text-[var(--text2)]">{body.summary}</p>
                </div>
              </div>
            )
          })()}

          {!body && (
            <p className="text-[var(--text3)]">本文を準備中です。</p>
          )}

          {/* Made with Insight Cast バッジ */}
          {interviewer && (() => {
            const castChar = CHARACTERS.find((c) => c.id === post.interviewer)
            return (
              <div className="mt-10 rounded-[var(--r-lg)] border border-[var(--accent)]/25 bg-[var(--accent-l)] px-5 py-4">
                <div className="flex items-start gap-3">
                  {castChar && (
                    <CharacterAvatar
                      src={castChar.icon48}
                      alt={`${castChar.name}のアイコン`}
                      emoji={castChar.emoji}
                      size={36}
                      className="flex-shrink-0 mt-0.5"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-[var(--accent)] mb-1">Made with Insight Cast</p>
                    <p className="text-sm leading-[1.7] text-[var(--text2)]">
                      この記事は、Insight Cast の AI取材を実際に使って作成しました。
                    </p>
                    {(post.interviewDurationMin || post.interviewQuestionCount) && (
                      <p className="mt-1 text-[12px] text-[var(--text3)]">
                        {post.interviewDurationMin && `取材時間：${post.interviewDurationMin}分`}
                        {post.interviewDurationMin && post.interviewQuestionCount && '　／　'}
                        {post.interviewQuestionCount && `質問数：${post.interviewQuestionCount}問`}
                        {castChar && `　／　キャスト：${castChar.name}`}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 pl-[48px]">
                  <Link
                    href="/auth/signup"
                    className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                  >
                    あなたも試してみる <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            )
          })()}

          {/* SNS シェアボタン */}
          <ShareButtons title={post.title} url={`${APP_URL}/blog/${slug}`} />

          {/* 前後記事ナビゲーション */}
          {(prevPost ?? nextPost) && (
            <nav aria-label="前後の記事" className="mt-14 grid gap-3 sm:grid-cols-2">
              {prevPost ? (
                <Link
                  href={`/blog/${prevPost.slug}`}
                  className="group flex flex-col gap-1 rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] px-5 py-4 transition-colors hover:border-[var(--accent)] hover:bg-[var(--bg2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text3)]">← 新しい記事</span>
                  <span className="mt-1 text-sm font-semibold leading-snug text-[var(--text)] line-clamp-2 group-hover:text-[var(--accent)] transition-colors">{prevPost.title}</span>
                </Link>
              ) : <div />}
              {nextPost ? (
                <Link
                  href={`/blog/${nextPost.slug}`}
                  className="group flex flex-col gap-1 rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] px-5 py-4 text-right transition-colors hover:border-[var(--accent)] hover:bg-[var(--bg2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text3)]">過去の記事 <span aria-hidden="true">→</span></span>
                  <span className="mt-1 text-sm font-semibold leading-snug text-[var(--text)] line-clamp-2 group-hover:text-[var(--accent)] transition-colors">{nextPost.title}</span>
                </Link>
              ) : <div />}
            </nav>
          )}

        </div>

        {/* 関連記事 */}
        {relatedPosts.length > 0 && (
          <div className="mx-auto mt-16 max-w-2xl">
            <h2 className="mb-5 text-[11px] font-semibold tracking-[0.14em] text-[var(--accent)] uppercase">Related</h2>
            <div className="flex flex-col divide-y divide-[var(--border)] rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
              {relatedPosts.map((related) => {
                const relatedInterviewer = related.interviewer
                  ? CHARACTERS.find((c) => c.id === related.interviewer)
                  : undefined
                const relChar = relatedInterviewer ?? undefined
                const relColor = CATEGORY_COLOR_MAP[related.category]
                return (
                  <Link
                    key={related.slug}
                    href={`/blog/${related.slug}`}
                    className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--bg2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]/40"
                  >
                    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-[var(--border)]" style={{ background: `${relColor}18` }}>
                      {relChar && <Image src={relChar.icon48} alt={relChar.name} fill sizes="40px" className="object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: `${relColor}1a`, color: relColor }}>
                          {CATEGORY_LABELS[related.category]}
                        </span>
                        <span className="text-[11px] text-[var(--text3)]">{related.date}</span>
                      </div>
                      <p className="font-[family-name:var(--font-noto-serif-jp)] text-[15px] font-bold leading-snug text-[var(--text)] line-clamp-1 group-hover:text-[var(--accent)] transition-colors">
                        {related.title}
                      </p>
                    </div>
                    <span aria-hidden="true" className="flex-shrink-0 text-[11px] font-bold text-[var(--text3)] group-hover:text-[var(--accent)] transition-colors">→</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

      </main>


    </>
  )
}
