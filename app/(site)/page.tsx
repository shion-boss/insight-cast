import type { Metadata } from 'next'

import { getBlogPostsFromDB } from '@/lib/blog-posts.server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

import { BlogPreview } from './_components/lp/BlogPreview'
import { CastTalkPreview } from './_components/lp/CastTalkPreview'
import { CompareCards } from './_components/lp/CompareCards'
import { EeatSection } from './_components/lp/EeatSection'
import { GrowthStep } from './_components/lp/GrowthStep'
import { Hero } from './_components/lp/Hero'
import { HpAnalysisStep } from './_components/lp/HpAnalysisStep'
import { InterviewStep } from './_components/lp/InterviewStep'
import { LpFaqSection } from './_components/lp/LpFaqSection'
import { OutputExample } from './_components/lp/OutputExample'
import { PainSection } from './_components/lp/PainSection'
import { PricingPreview } from './_components/lp/PricingPreview'
import { SolutionBridge } from './_components/lp/SolutionBridge'

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://insight-cast.jp').replace(/\/$/, '')

export const metadata: Metadata = {
  title: 'Insight Cast — 会話から、記事へ。あなたの当たり前を言葉に。',
  description: 'AIキャストが取材に来ます。答えるだけで、伝わっていない強みが記事になります。貼るだけで投稿できる状態で届くので、ホームページを会話で少しずつ育てられます。カード不要で無料体験できます。',
  alternates: { canonical: APP_URL },
  openGraph: {
    title: 'Insight Cast — 会話から、記事へ。あなたの当たり前を言葉に。',
    description: 'AIキャストが取材に来ます。答えるだけで、伝わっていない強みが記事になります。貼るだけで投稿できる状態でお届けします。',
    url: APP_URL,
    siteName: 'Insight Cast',
    locale: 'ja_JP',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Insight Cast — 動物AIインタビュアーチーム' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Insight Cast — 会話から、記事へ。あなたの当たり前を言葉に。',
    description: 'AIキャストが取材に来ます。答えるだけで、伝わっていない強みが記事になります。貼るだけで投稿できる状態でお届けします。',
    images: ['/og-image.jpg'],
  },
}

// TODO(P-1): LP の Suspense / Streaming 最適化
// latestPosts・latestTalks を別 async Server Component に切り出し Suspense でラップすることで
// TTFB を改善できる。Phase 3 以降で対応を検討。
export default async function LandingPage() {
  const supabaseAdmin = createAdminClient()

  const [authResult, latestPostsAll, talksResult] = await Promise.allSettled([
    (async () => {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      return Boolean(user)
    })(),
    getBlogPostsFromDB(),
    supabaseAdmin
      .from('cast_talks')
      .select('id, title, summary, interviewer_id, guest_id, slug, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(3),
  ])

  const isLoggedIn = authResult.status === 'fulfilled' ? authResult.value : false
  const latestPosts = (latestPostsAll.status === 'fulfilled' ? latestPostsAll.value : []).slice(0, 3)
  const latestTalks = talksResult.status === 'fulfilled' ? talksResult.value.data : []

  const priceIds = {
    lightning: process.env.STRIPE_PRICE_ID_LIGHTNING ?? '',
    personal: process.env.STRIPE_PRICE_ID_PERSONAL ?? '',
    business: process.env.STRIPE_PRICE_ID_BUSINESS ?? '',
  }

  return (
    <main id="main-content" className="relative z-10">
      <Hero isLoggedIn={isLoggedIn} />
      <PainSection />
      <SolutionBridge />
      <HpAnalysisStep />
      <InterviewStep />
      <GrowthStep />
      <OutputExample />
      <EeatSection />
      <CompareCards />
      <PricingPreview isLoggedIn={isLoggedIn} priceIds={priceIds} />
      <BlogPreview latestPosts={latestPosts} />
      <CastTalkPreview latestTalks={latestTalks} />
      <LpFaqSection />
    </main>
  )
}
