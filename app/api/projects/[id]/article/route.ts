import { z } from 'zod'
import Anthropic from '@anthropic-ai/sdk'
import { formatConversationForPrompt, normalizeUniqueStringList } from '@/lib/ai-quality'
import { logApiUsage, checkRateLimit } from '@/lib/api-usage'
import { generateArticleSuggestions } from '@/lib/article-suggestions'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCharacter, getPublicCastIconUrl } from '@/lib/characters'
import { getStoredSiteBlogPosts, selectRelevantBlogPosts } from '@/lib/site-blog-support'
import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { syncProjectContentStatus } from '@/lib/project-content-status'
import { isFreePlanLocked, checkMonthlyArticleLimit } from '@/lib/plans'
import { getMemberRole } from '@/lib/project-members'
import { buildDraftBody, buildIntroEmbed, ensureConversationClosingByInterviewer } from '@/lib/conversation-bubble-html'
import { generateSlugFromTitle } from '@/lib/blog-slug'
import { runDeterministicCheck, type ArticleType, type ArticleVolume } from '@/lib/article-quality-check'
import { generateArticleSelfReview } from '@/lib/article-self-review'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 120_000 })

const VOLUME_MAP = {
  short: '600〜800',
  medium: '1200〜1500',
  long: '2000〜2500',
  pillar: '5000〜8000',
}
const STYLE_MAP = { desu: 'ですます体', 'de-aru': 'である体', 'da-na': 'だ・な体（口語的）' }

const AUDIENCE_DESCRIPTIONS: Record<'new' | 'existing' | 'considering' | 'peer', string> = {
  new: '初めてこの事業者を知る読者（HPに偶然たどり着いた見込み客）。専門用語を避け、信頼してもらえる入口を作る',
  existing: 'すでにこの事業者を知っている既存顧客。次回利用や紹介につながる温度で書く',
  considering: '比較検討中の読者（複数候補のうちの1つとして見ている）。判断材料を具体的に出す',
  peer: '同業者・関係者（業界向けの読み物）。業界の文脈を共有した上で、自社の立場を語る',
}

const PILLAR_REQUIREMENTS = {
  minSummaryItems: 5,
  minThemes: 3,
} as const

function revalidateArticlePaths(projectId: string, articleId?: string | null) {
  revalidatePath('/dashboard')
  revalidatePath('/projects')
  revalidatePath('/articles')
  revalidatePath('/interviews')
  revalidatePath(`/projects/${projectId}`)
  revalidatePath(`/projects/${projectId}/summary`)
  revalidatePath(`/projects/${projectId}/article`)
  if (articleId) {
    revalidatePath(`/projects/${projectId}/articles/${articleId}`)
  }
}

async function markArticleGenerationStarted(input: {
  supabase: Awaited<ReturnType<typeof createClient>>
  projectId: string
  interviewId: string
}) {
  const now = new Date().toISOString()

  await Promise.all([
    input.supabase
      .from('interviews')
      .update({
        article_status: 'generating',
        article_requested_at: now,
        article_completed_at: null,
        article_error: null,
      })
      .eq('id', input.interviewId),
    input.supabase
      .from('projects')
      .update({ status: 'article_generating' })
      .eq('id', input.projectId),
  ])

  revalidateArticlePaths(input.projectId)
}

async function markArticleGenerationFailed(input: {
  supabase: Awaited<ReturnType<typeof createClient>>
  projectId: string
  interviewId: string
  message?: string
}) {
  await input.supabase
    .from('interviews')
    .update({
      article_status: 'failed',
      article_error: input.message ?? '記事を作成できませんでした。',
      article_completed_at: null,
    })
    .eq('id', input.interviewId)

  await syncProjectContentStatus(input.supabase, input.projectId)
  revalidateArticlePaths(input.projectId)
}

async function generateBlogSlug(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  title: string,
  today: string,
): Promise<string> {
  const baseSlug = (await generateSlugFromTitle(title, 'article/slug')) ?? ''
  const candidate = baseSlug || `${today}-article`
  const { data: existing } = await supabase
    .from('blog_posts')
    .select('slug')
    .eq('slug', candidate)
    .maybeSingle()
  if (!existing) return candidate

  // 衝突時は日付サフィックスを付ける
  const withDate = `${candidate}-${today}`
  const { data: existing2 } = await supabase
    .from('blog_posts')
    .select('slug')
    .eq('slug', withDate)
    .maybeSingle()
  return existing2 ? `${candidate}-${today}-${crypto.randomUUID().slice(0, 6)}` : withDate
}

async function saveArticle(input: {
  supabase: Awaited<ReturnType<typeof createClient>>
  projectId: string
  interviewId: string
  articleType: string
  interviewerType?: string | null
  content: string
  userEmail?: string | null
  theme?: string | null
  clientName?: string | null
  clientAvatarUrl?: string | null
  interviewerDisplayName?: string | null
  audience?: string | null
  qualityReview?: Record<string, unknown> | null
}) {
  const titleMatch = input.content.match(/^#\s+(.+)/m)
  const title = titleMatch?.[1]?.trim() ?? '記事'

  const lines = input.content.split('\n')
  const lastExcerptIdx = (() => {
    for (let i = lines.length - 1; i >= 0; i--) {
      if (/^抜粋[:：]\s*.+$/.test(lines[i])) return i
    }
    return -1
  })()
  const excerptLineMatch = lastExcerptIdx >= 0 ? lines[lastExcerptIdx].match(/^抜粋[:：]\s*(.+)$/) : null
  const cleanContent = excerptLineMatch
    ? lines.slice(0, lastExcerptIdx).join('\n').trimEnd()
    : input.content

  const excerpt = excerptLineMatch
    ? excerptLineMatch[1].trim().slice(0, 150)
    : cleanContent
        .replace(/^#{1,6}\s+.+$/gm, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[*_`~>#-]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 150)

  const { data: savedArticle, error: articleInsertError } = await input.supabase
    .from('articles')
    .insert({
      project_id: input.projectId,
      interview_id: input.interviewId,
      article_type: input.articleType,
      title,
      excerpt,
      content: cleanContent,
      source_theme: input.theme ?? null,
      audience: input.audience ?? null,
      quality_review: input.qualityReview ?? null,
    })
    .select('id')
    .single()

  if (articleInsertError || !savedArticle) {
    console.error('[article/saveArticle] failed to insert article:', articleInsertError?.message)
    return null
  }

  // blog_posts に下書き保存（管理者のみ）
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim()).filter(Boolean)
  const isAdmin = !!input.userEmail && adminEmails.includes(input.userEmail)
  if (isAdmin) {
    const today = new Date().toISOString().slice(0, 10)
    const slug = await generateBlogSlug(input.supabase, title, today)
    const isInterviewStyle = input.articleType === 'interviewer'
    const blogCategory = isInterviewStyle ? 'interview' : 'insight-cast'

    const blogBodyRaw = cleanContent.replace(/^#\s+[^\n]*\n?/, '').trimStart()
    const isConversationType = input.articleType === 'conversation'
    // インタビュアー紹介は AIキャスト視点（conversation / interviewer）のみ。ユーザー視点（client）は不要。
    const isCastPerspective = isConversationType || isInterviewStyle
    const interviewerChar = input.interviewerType ? getCharacter(input.interviewerType) : null
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')
    // 永続記録（blog_posts の下書きHTML）に保存するURLは Next.js のフィンガープリント
    // 付きURLを使わず、`/public/characters/<id>-48.png` の安定URLを使う。
    const interviewerAvatarUrl = input.interviewerType && appUrl
      ? getPublicCastIconUrl(input.interviewerType, appUrl)
      : null
    const introEmbed = isCastPerspective
      ? buildIntroEmbed({
          interviewerDisplayName: input.interviewerDisplayName ?? 'インタビュアー',
          interviewerLabel: interviewerChar?.label ?? null,
          interviewerAvatarUrl,
        })
      : ''
    // 会話記事は紹介ブロックを会話本文の直前に差し込む。
    // レポート記事（interviewer）は会話ブロックが存在しないため、本文の先頭に置く。
    const blogBody = isConversationType
      ? buildDraftBody({
          content: blogBodyRaw,
          interviewerName: input.interviewerDisplayName ?? 'インタビュアー',
          interviewerDisplayName: input.interviewerDisplayName ?? 'インタビュアー',
          interviewerLabel: interviewerChar?.label ?? null,
          interviewerAvatarUrl,
          clientName: input.clientName ?? '事業者',
          clientDisplayName: input.clientName ?? '事業者',
          userAvatarUrl: input.clientAvatarUrl ?? null,
          introEmbed: introEmbed || undefined,
        })
      : introEmbed
        ? `${introEmbed}\n\n${blogBodyRaw}`
        : blogBodyRaw
    await input.supabase
      .from('blog_posts')
      .insert({
        slug,
        title,
        excerpt,
        category: blogCategory,
        type: isInterviewStyle ? 'interview' : 'normal',
        interviewer: input.interviewerType ?? null,
        cover_color: 'bg-gradient-to-br from-stone-200 to-stone-300',
        date: today,
        published: false,
        body: { kind: 'markdown', content: blogBody },
      })
      .then(({ error }) => {
        if (error) console.warn('[article/saveArticle] blog_posts 下書き保存失敗:', error.message)
      })
  }

  await input.supabase
    .from('interviews')
    .update({
      article_status: 'ready',
      article_completed_at: new Date().toISOString(),
      article_error: null,
    })
    .eq('id', input.interviewId)

  await syncProjectContentStatus(input.supabase, input.projectId)
  revalidateArticlePaths(input.projectId, savedArticle.id)

  return savedArticle
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
  if (!(await checkRateLimit(user.id, '/api/projects/[id]/article')).allowed) {
    return NextResponse.json({ error: 'rate_limit_exceeded' }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  const parsed = z.object({
    interviewId: z.string().uuid(),
    articleType: z.enum(['client', 'interviewer', 'conversation']),
    style: z.enum(['desu', 'de-aru', 'da-na']).optional(),
    volume: z.enum(['short', 'medium', 'long', 'pillar']).optional(),
    audience: z.enum(['new', 'existing', 'considering', 'peer']).optional(),
    theme: z.string().max(200).optional(),
    polishAnswers: z.boolean().optional(),
  }).safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  const { interviewId, articleType, style, volume, audience, theme, polishAnswers } = parsed.data
  const audienceKey = audience ?? 'new'
  const resolvedVolume: ArticleVolume = (volume ?? 'medium') as ArticleVolume

  // ピラー記事は会話バブル形式と相性が悪い（5,000〜8,000字を会話バブルで埋めると不自然）
  if (resolvedVolume === 'pillar' && articleType === 'conversation') {
    return NextResponse.json(
      {
        error: 'pillar_not_supported_for_conversation',
        message: 'ピラー記事はブログ記事 / レポート記事のみで作成できます。会話形式は2000字までに収まる尺で出してください。',
      },
      { status: 400 },
    )
  }

  const { data: interview } = await supabase
    .from('interviews')
    .select('id, interviewer_type, summary, themes, project_id, article_status')
    .eq('id', interviewId)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .single()

  if (!interview) return new Response('Not found', { status: 404 })

  const interviewerType = interview.interviewer_type

  // モグロは Yes/No 取材のため「会話記事」を作れない（FACT_INTEGRITY と整合：Yes/No だけの発言を AI が肉付けしない）
  if (articleType === 'conversation' && interviewerType === 'mogro') {
    return NextResponse.json(
      {
        error: 'conversation_not_supported_for_cast',
        message: 'モグロの取材メモは Yes/No が中心のため、会話記事への書き出しに対応していません。ブログ記事 / レポート記事をお選びください。',
      },
      { status: 400 },
    )
  }

  if (interview.article_status === 'generating') {
    return NextResponse.json({ ok: true, status: 'article_generating' }, { status: 202 })
  }

  // プロジェクト取得（RLSでオーナー・メンバー両方がアクセス可）
  const { data: projectWithOwner } = await supabase
    .from('projects')
    .select('name, hp_url, user_id')
    .eq('id', projectId)
    .is('deleted_at', null)
    .single()

  if (!projectWithOwner) return new Response('Not found', { status: 404 })

  // role-based アクセスチェック: オーナーまたはeditorのみ記事生成可
  const isOwner = projectWithOwner.user_id === user.id
  if (!isOwner) {
    const memberRole = await getMemberRole(supabase, projectId, user.id)
    if (memberRole !== 'editor') {
      return new Response('Forbidden', { status: 403 })
    }
  }

  // 月次上限チェックはオーナーのuser_idで判定
  const ownerUserId = projectWithOwner.user_id

  // 月次上限チェックは adminSupabase で実行し、将来の RLS 変更による無音の緩みを防ぐ
  const adminForLimitCheck = createAdminClient()
  if (await isFreePlanLocked(adminForLimitCheck, ownerUserId)) {
    return NextResponse.json({ error: 'free_plan_locked' }, { status: 403 })
  }

  const monthlyCheck = await checkMonthlyArticleLimit(adminForLimitCheck, ownerUserId)
  if (!monthlyCheck.allowed) {
    return NextResponse.json({ error: 'monthly_article_limit_reached', limit: monthlyCheck.limit, count: monthlyCheck.count }, { status: 403 })
  }

  const project = projectWithOwner

  const { data: messages } = await supabase
    .from('interview_messages')
    .select('role, content, meta')
    .eq('interview_id', interviewId)
    .order('created_at', { ascending: true })

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, avatar_url')
    .eq('id', user.id)
    .single()

  // 一人称は「取材メモを作成したユーザー（= プロジェクトオーナー）」のものを使う。
  // 共同編集者が記事生成した場合でも、語り手は事業者本人なので owner で揃える。
  // RLS により他人の profile は読めないため、admin client で読む。
  const { data: ownerProfile } = await adminForLimitCheck
    .from('profiles')
    .select('first_person')
    .eq('id', ownerUserId)
    .maybeSingle()
  const ownerFirstPerson = (ownerProfile?.first_person ?? '').trim() || null

  const { data: auditRow } = await supabase
    .from('hp_audits')
    .select('raw_data')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const char = getCharacter(interviewerType)
  const charName = char?.name ?? 'インタビュアー'
  const bizName = project?.name ?? project?.hp_url ?? '取材先'
  const clientName = profile?.name ?? '事業者'

  const conversation = formatConversationForPrompt(
    (messages ?? []).map((message) => ({
      role: message.role === 'user' ? 'user' : 'interviewer',
      content: message.content,
    })),
    {
      userLabel: clientName,
      assistantLabel: charName,
      maxMessageLength: 1100,
    },
  )

  const bizContext = [
    project?.name ? `取材先名: ${project.name}` : null,
    project?.hp_url ? `HP URL: ${project.hp_url}` : null,
    profile?.name ? `話し手: ${profile.name}` : null,
  ].filter(Boolean).join('\n')

  const summaryValues = normalizeUniqueStringList(interview.summary, { maxItems: 8, maxLength: 120 })
  const extractedThemes = normalizeUniqueStringList(interview.themes, { maxItems: 8, maxLength: 120 })
  const summaryContext = summaryValues.length > 0
    ? `\n\n## インタビュー要約\n${summaryValues.map((value) => `- ${value}`).join('\n')}`
    : ''
  const extractedThemesContext = extractedThemes.length > 0
    ? `\n\n## 抽出済みテーマ\n${extractedThemes.map((value) => `- ${value}`).join('\n')}`
    : ''

  // ピラー記事は取材内容が薄いと薄まるので、要約とテーマの最低数を満たすことを要求する。
  if (resolvedVolume === 'pillar') {
    if (
      summaryValues.length < PILLAR_REQUIREMENTS.minSummaryItems
      || extractedThemes.length < PILLAR_REQUIREMENTS.minThemes
    ) {
      return NextResponse.json(
        {
          error: 'pillar_requirements_not_met',
          message: `ピラー記事を作るには、インタビュー要約${PILLAR_REQUIREMENTS.minSummaryItems}項目以上 + 抽出テーマ${PILLAR_REQUIREMENTS.minThemes}項目以上が必要です。取材を進めてからもう一度お試しください。`,
          details: {
            summary: { current: summaryValues.length, required: PILLAR_REQUIREMENTS.minSummaryItems },
            themes: { current: extractedThemes.length, required: PILLAR_REQUIREMENTS.minThemes },
          },
        },
        { status: 400 },
      )
    }
  }

  const themeInstruction = theme ? `\n\n## テーマ\n特に「${theme}」という観点で書いてください。` : ''
  const ownBlogPosts = getStoredSiteBlogPosts((auditRow?.raw_data as Record<string, unknown> | null | undefined) ?? null)
  const relevantOwnBlogPosts = ownBlogPosts.length > 0
    ? (await selectRelevantBlogPosts({
        query: [
          theme ? `テーマ: ${theme}` : null,
          interview.summary ? `インタビュー要約: ${interview.summary}` : null,
          conversation.slice(0, 3000),
        ].filter(Boolean).join('\n\n'),
        ownPosts: ownBlogPosts,
        maxOwnPosts: 3,
        maxCompetitorPosts: 0,
      })).ownPosts
    : []

  const internalLinkInstruction = relevantOwnBlogPosts.length > 0
    ? `\n\n## 内部リンク候補
${relevantOwnBlogPosts.map((post) => `- [${post.title}](${post.url}) : ${post.summary}`).join('\n')}

## 内部リンクの使い方
- 上の候補は自社HPの過去ブログです
- 本文内で自然につながる箇所に、1〜3件のMarkdownリンクとして入れてください
- インタビューで直接触れていなくても、読者の理解が深まるなら積極的に使ってください
- 候補にないURLは作らないでください`
    : ''

  const polishInstruction = polishAnswers
    ? `\n\n## 回答の整頓について\n事業者の回答に含まれる誤字・脱字・言い間違い・話し言葉の崩れは自然な表現に直してください。ただし意味・ニュアンス・その人らしい言い回しは変えないでください。`
    : ''

  const editorialGuardrail = `あなたは Insight Cast の編集者です。事業者本人へのインタビュー一次情報をもとに、ホームページに公開される記事を書きます。

【一次情報の優先順位】
- 会話・要約にない事実・数字・価格・実績・地名・肩書きは絶対に足さない
- 断定しすぎず、根拠が会話にある内容だけを書く
- もっともらしい言い換えで事実を膨らませない
- 一般論より、事業者本人の言葉・場面・判断を優先して使う
- 抽象語（丁寧・安心・信頼・こだわり）が出るときは必ず具体例を伴わせる

【発信者の実体化】
- 主語が「我々は」「一般的に」のような匿名にならない。事業者本人または取材者として明確に語る
- 誰が・どんな立場で語っているかが、読み始めて1段落以内で伝わる

【構造の明快さ】
- 見出しは「問い」または「結論」になっており、配下の段落と内容が一致する
- 結論を先に書き、その後に理由・具体・場面を続ける
- 一段落一論点を守る

【タイトル設計】
- 30字以内
- 検索意図か感情フックを含む
- 「〇〇のこだわり」「私たちの想い」のような汎用語で終わらせない
- 事業者の特徴か視点が透けるタイトルにする

【抜粋設計】
- 「抜粋: 」で始まる行を本文の最後に1行空けて1つだけ置く（Markdown外のプレーンテキスト）
- 150字以内
- 「誰の・何の話・読むと何が分かるか」の3要素を入れる
- 本文先頭の機械切り出しのような書き方をしない

【CTA・次の行動】
- 記事末尾の段落で、押し売りでない自然な次の行動への橋渡しを置く（問い合わせ・予約・来店など、事業者の文脈に合うもの）
- 「ぜひお問い合わせください」のような空虚な定型文だけで終わらせない
- 煽りや「今すぐ」のような表現は使わない。事業者の温度感に合わせる

【表現】
- 読みやすく整えてよいが、事業者の温度感や言い回しはできるだけ残す
- 情報が足りない点は無理に埋めず、省くか控えめに表現する
- 抽象的な美辞麗句だけで終わらせず、行動・判断・お客様の反応が見える形で書く

【記号の使い方】
- ダッシュ記号「—」「——」「──」「―」「ー（伸ばし棒以外の用途）」をタイトル・見出し・本文で絶対に使わない（日本語ブログで実際にはほぼ使われない記号で、AI生成の典型サイン）
- タイトル・見出しに副題を続けたい時は「：」「、」「。」「（）」「改行」のいずれかを使う
  - 悪い例: 「パフォーマンス50から91へ——スコアではなく『使い心地』を目指した改善の記録」
  - 良い例: 「パフォーマンス50から91へ。スコアではなく『使い心地』を目指して」
  - 良い例: 「パフォーマンス50から91へ：スコアより使い心地を優先した改善メモ」
- 半角ハイフン「-」は型番・URL・日付など必要な場面でのみ使う
- 「・」は箇条書きの代わりではなく、語の並列にとどめる

【半角スペースの扱い（重要）】
- 日本語と英単語・英略語・数字の間に半角スペース・全角スペースを入れない（AI生成の典型サイン。日本語ブログでは詰めて書くのが普通）
  - 悪い例: 「Insight Cast は AI を使った 30 文字以内の タイトル を作ります」
  - 悪い例: 「Web サイト の デザイン を 改善 する」
  - 良い例: 「Insight CastはAIを使った30文字以内のタイトルを作ります」
  - 良い例: 「Webサイトのデザインを改善する」
- 例外: 英語フレーズ内のスペース（「Insight Cast」「Cast Talk」のような単語内）はそのまま維持
- 例外: コードブロック内・URLパス内・引用された原文の中はそのまま維持`

  // 同一インタビューから複数の記事を作る場合にキャッシュが効くよう、
  // インタビューデータ（大きいブロック）と指示（小さいブロック）を分ける
  const contextBlock = `## 事業者情報\n${bizContext}\n\n## インタビュー記録\n${conversation}${summaryContext}${extractedThemesContext}`

  let instructionBlock: string

  // 事業者本人が語る記事（client）で使う一人称。
  // ユーザーが設定画面で指定していればそれを使い、未設定なら従来どおり「私」または「弊社」。
  const firstPersonRule = ownerFirstPerson
    ? `一人称は「${ownerFirstPerson}」で統一する（事業者本人が日常的に使う一人称。インタビュー記録の口調に関わらず、記事内では必ずこの一人称で書く）`
    : '一人称は「私」または「弊社」'

  // 想定読者（audience）に合わせた語りかけ方を全 articleType に注入する
  const audienceInstruction = `\n\n## 想定読者\n- ${AUDIENCE_DESCRIPTIONS[audienceKey]}\n- この読者像に合わせて語彙・温度感・前提知識のレベルを調整する`

  // ピラー記事用の構造指示（client / interviewer 共通。conversation はピラー対応外）
  const pillarStructureInstruction = resolvedVolume === 'pillar'
    ? `\n\n## ピラー記事の構造（必須）
- H2 を 5〜7個立てる。それぞれ「結論」または「問い」になる見出しにする
- 各 H2 配下に H3 を 2〜3個置き、それぞれが独立して読めるようにする
- 各 H2 の冒頭で結論を先に書き、その後に具体エピソード・判断・お客様の反応を並べる
- 最後の H2 を「まとめ」または「読者へ」に近い役割にし、自然な次の行動への橋渡しを置く
- 読者が目次を見ただけで内容の流れが分かる構造にする`
    : ''

  // 通常の見出し数指示（pillar の時は上のピラー構造指示で上書き）
  const normalHeadingInstruction = resolvedVolume === 'pillar'
    ? ''
    : `\n- 見出し（##）を2〜3個つけて構造化する`

  // ストーリーアーク（client / interviewer 共通）
  const storyArcInstruction = `\n\n## 構成のアーク
- 導入: 事業者の背景・きっかけ・人物像で読者を引き込む
- 中盤: 具体エピソード・判断・お客様の反応を順に見せる
- 結び: 読者にとっての意味と、押し売りにならない自然な次の行動への橋渡し`

  if (articleType === 'client') {
    const styleLabel = STYLE_MAP[style as keyof typeof STYLE_MAP] ?? 'ですます体'
    const volumeLabel = VOLUME_MAP[resolvedVolume]

    instructionBlock = `上の事業者情報とインタビュー記録をもとに、事業者（${bizName}）の視点・言葉で語る読み物記事を書いてください。${themeInstruction}${audienceInstruction}${storyArcInstruction}${pillarStructureInstruction}${internalLinkInstruction}

## 執筆ルール
- ${firstPersonRule}
- 語尾スタイル: **${styleLabel}で全文を統一すること**（インタビュー記録の話し言葉に引きずられないこと）
- 文字数: ${volumeLabel}文字程度${normalHeadingInstruction}
- お客様に読んでもらう想定で、温かみのある文体で
- タイトルを最初に書く（# タイトル）。タイトルは30字以内・汎用語で終わらせない（editorialガイド参照）
- 本文の最後に1行空けて「抜粋: 」で始まる150字以内の紹介文を書く（Markdown外のプレーンテキスト）
- Markdown形式で出力
- 【視点の一貫性】「〜というのです」「〜と話してくれました」「〜とのこと」「〜だそうです」など、第三者が伝える語尾・表現は使わない。事業者本人の言葉として一貫して書く
- 【エピソードの一人称化】インタビューで語られたエピソードや発言も、「〜しました」「〜と思いました」「〜と感じました」のように事業者本人が一人称で語る形に書き直す${polishInstruction}`
  } else if (articleType === 'interviewer') {
    const volumeLabel = VOLUME_MAP[resolvedVolume]

    instructionBlock = `上の事業者情報とインタビュー記録をもとに、インタビュアー（${charName}）の視点で${bizName}を紹介する記事を書いてください。${themeInstruction}${audienceInstruction}${storyArcInstruction}${pillarStructureInstruction}${internalLinkInstruction}

## 執筆ルール
- インタビュアーが「取材して発見した魅力」を語るスタイル
- 「〜だということがわかりました」「〜が印象的でした」などの表現を自然に使う
- **全文をですます体で統一すること**（インタビュー記録の話し言葉に引きずられないこと）
- 文字数: ${volumeLabel}文字程度${normalHeadingInstruction}
- タイトルを最初に書く（# タイトル）。タイトルは30字以内・汎用語で終わらせない（editorialガイド参照）
- 本文の最後に1行空けて「抜粋: 」で始まる150字以内の紹介文を書く（Markdown外のプレーンテキスト）
- Markdown形式で出力${polishInstruction}
- **取材を受けた方（${clientName}）の名前を本文中で呼ぶときは、必ず「${clientName}さん」とさん付けにすること**。呼び捨て・役職のみの呼称は不可。法人名・屋号として登場する場合（例: 「${clientName}の店舗では」など事業体を指す文脈）はこの限りではない`
  } else {
    const volumeLabel = VOLUME_MAP[resolvedVolume]

    instructionBlock = `上の事業者情報とインタビュー記録をもとに、Q&A形式のインタビュー記事を書いてください。${themeInstruction}${audienceInstruction}${internalLinkInstruction}

## 執筆ルール
- タイトルを最初に書く（# タイトル）。タイトルは30字以内・汎用語で終わらせない（editorialガイド参照）
- 最初に導入文（2〜3行）
- 「## この記事でわかること」の見出しをつけて箇条書き3点
- 会話形式で本文: **${charName}**: 発言内容 / **${clientName}**: 発言内容
- 実際のインタビューから自然な流れで5〜8往復を選んで構成
- 会話の後に「## まとめ」の見出しをつけ、インタビューを通じて感じた事業者の強みや印象を3〜4行でまとめる。まとめの末尾には押し売りでない自然な次の行動への橋渡しを1〜2文置く
- 全体の文字数: ${volumeLabel}文字程度（まとめを含む）
- 本文の最後に1行空けて「抜粋: 」で始まる150字以内の紹介文を書く（Markdown外のプレーンテキスト）
- Markdown形式で出力${polishInstruction}
- **全文をですます体で統一すること**（会話バブル内のインタビュアー発言・散文すべて。インタビュー記録の話し言葉に引きずられないこと）
- インタビュアー（${charName}）の発言は、インタビュー記録の口調に関わらず、**常に丁寧な敬語・ですます体を維持すること**。ため口・省略形・絵文字は使わない
- **取材を受けた方（${clientName}）の名前を会話バブル内・導入文・まとめなどで呼ぶときは、必ず「${clientName}さん」とさん付けにすること**。呼び捨て・役職のみの呼称は不可。発言者ラベルとしての \`**${clientName}**:\` 表記はこの限りではない（フォーマット維持のためそのまま）。法人名・屋号として事業体を指す文脈もこの限りではない

## 【厳守】会話フォーマットについて
- 発言者名は必ず \`**${charName}**\` か \`**${clientName}**\` のみを使うこと。括弧・役職・説明を付け加えた変形は不可
- 導入文・「この記事でわかること」などの導入部に **太字フィールド名**: 値 の形式（例: **取材先**: XXX、**インタビュアー**: YYY）を使わないこと
- 会話開始前にインタビュアーの紹介文・自己紹介行を独立して書かない（誰が話を聞いたかは導入文と会話バブル直前のインタビュアーカードで伝わる。重複させない）
- 会話バブルとして表示されるのは \`**${charName}**:\` か \`**${clientName}**:\` で始まる行のみ
- **会話バブルの最後の行は必ず \`**${charName}**:\` で始めること**。\`**${clientName}**:\` で会話を終わらせない
- 最後のインタビュアー発言は、直前の${clientName}さんの回答を受けた感謝・所感・締めくくりの1〜2文にする。新たな質問で終わらせないこと

## 【重要】会話の最初のインタビュアー発言について
会話バブルとして表示されるとき、インタビュアーの1コメント目は読者にとって最初の接触になります。唐突に質問から入ると文脈がないため、**最初のインタビュアー発言だけ**以下の構造にしてください。

- 記事冒頭の導入文（事業者の背景・特徴）を1〜2文で要約したコメント
- そのまま自然につながる質問

例: **${charName}**: ${clientName}さんは[導入文から引き出した特徴を1文で]。そのきっかけを教えていただけますか？

2回目以降のインタビュアー発言は通常どおりの質問形式で構いません。`
  }

  await markArticleGenerationStarted({ supabase, projectId, interviewId })

  // adminSupabase を使う理由:
  // waitUntil で非同期実行する際、元の supabase セッションが切れる可能性がある。
  // RLS バイパスになるが、role チェック（getMemberRole）はこの下で実行済みであるため
  // API 側のチェックが主防壁として機能している。
  // articles テーブルの INSERT ポリシーは adminClient には効かないが、
  // ここに到達する前に isOwner または memberRole === 'editor' の検証が完了していることを保証する。
  const adminSupabase = createAdminClient()

  // ハル取材かつ会話記事以外の場合のみ、添付画像を vision に渡して描写を引き出す。
  // 画像本体は記事本文に埋め込まない（記事に画像URLが入らない＝コピペ運用が崩れない）。
  type SupportedImageMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
  type ImageBlock = { type: 'image'; source: { type: 'base64'; media_type: SupportedImageMediaType; data: string } }
  const isSupportedImageType = (v: string): v is SupportedImageMediaType =>
    v === 'image/jpeg' || v === 'image/png' || v === 'image/gif' || v === 'image/webp'

  type AttachmentMeta = { path?: string; content_type?: string }
  const collectedAttachmentPaths: Array<{ path: string; contentType: string }> = []
  if (interviewerType === 'hal' && articleType !== 'conversation') {
    for (const m of messages ?? []) {
      const meta = (m as { meta?: { attachments?: AttachmentMeta[] } | null }).meta ?? null
      const list = Array.isArray(meta?.attachments) ? meta!.attachments : []
      for (const a of list) {
        if (typeof a?.path === 'string' && typeof a?.content_type === 'string') {
          collectedAttachmentPaths.push({ path: a.path, contentType: a.content_type })
        }
      }
    }
  }

  // 画像 path を base64 ImageBlock に変換（最大 6 枚に制限してコストとレイテンシを抑える）
  async function loadImageBlocks(): Promise<ImageBlock[]> {
    const blocks: ImageBlock[] = []
    const limited = collectedAttachmentPaths.slice(0, 6)
    if (limited.length === 0) return blocks
    const adminClient = createAdminClient()
    for (const att of limited) {
      try {
        const { data: blob, error: dlErr } = await adminClient.storage
          .from('interview-attachments')
          .download(att.path)
        if (dlErr || !blob) continue
        const buf = Buffer.from(await blob.arrayBuffer())
        const mediaType: SupportedImageMediaType = isSupportedImageType(att.contentType) ? att.contentType : 'image/jpeg'
        blocks.push({
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: buf.toString('base64') },
        })
      } catch (err) {
        console.warn('[article] image load failed', { path: att.path, err })
      }
    }
    return blocks
  }

  async function generateAndSaveWithAdmin() {
    let fullText = ''
    try {
      const imageBlocks = await loadImageBlocks()
      const halImageInstruction = imageBlocks.length > 0
        ? `\n\n## 写真の活用（ハル取材）\nこの取材ではユーザーが ${imageBlocks.length} 枚の写真を共有しています。写真の中の場面・人・空気を「事業者が見ていた景色」として、記事本文の中に1〜2段落の描写として自然に組み込んでください。\n\n重要:\n- 画像URLや画像タグは本文に出さない（記事はテキストのみ）\n- 写真にない人物・物・場所を増やさない\n- 写真の中の人物の固有名詞は、事業者が会話で言及した名前のみ使う\n- 推測で「○○年前から」「毎日」などの時間情報を加えない（会話に出てきた範囲で）`
        : ''

      // contextBlock + instructionBlock の order を保ちつつ、画像を文末の text の前に配置
      type AnthropicTextBlock = { type: 'text'; text: string; cache_control?: { type: 'ephemeral' } }
      const userContent: Array<AnthropicTextBlock | ImageBlock> = [
        { type: 'text', text: contextBlock, cache_control: { type: 'ephemeral' } },
        ...imageBlocks,
        { type: 'text', text: instructionBlock + halImageInstruction },
      ]

      // 事実拘束を強く要求するタスクのため temperature を低めに固定。
      // 同一インタビューから複数記事を作る運用でも品質を揃えやすくする。
      // ピラー記事のみ max_tokens を広げる（5,000〜8,000字 ≒ 6,000〜10,000 tokens 必要）。
      const stream = await anthropic.messages.stream({
        model: 'claude-sonnet-4-6',
        max_tokens: resolvedVolume === 'pillar' ? 16000 : 4096,
        temperature: 0.4,
        system: editorialGuardrail,
        messages: [{
          role: 'user',
          content: userContent,
        }],
      })
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          fullText += chunk.delta.text
        }
      }
      const finalMsg = await stream.finalMessage().catch(() => null)
      if (finalMsg) {
        logApiUsage({
          userId: user?.id,
          projectId,
          route: 'article',
          model: 'claude-sonnet-4-6',
          inputTokens: finalMsg.usage.input_tokens,
          outputTokens: finalMsg.usage.output_tokens,
        }).catch(() => {})
      }
    } catch (err) {
      console.error('[article] background stream error:', err)
      await markArticleGenerationFailed({ supabase: adminSupabase, projectId, interviewId, message: '記事を仕上げきれませんでした。少し待ってから、もう一度お試しください。' })
      return
    }
    if (!fullText.trim()) {
      await markArticleGenerationFailed({ supabase: adminSupabase, projectId, interviewId, message: '記事を仕上げきれませんでした。少し待ってから、もう一度お試しください。' })
      return
    }
    if (articleType === 'conversation') {
      fullText = ensureConversationClosingByInterviewer({
        content: fullText,
        interviewerName: charName,
        clientName,
      })
    }

    // 生成直後の品質チェック。決定的チェックは即時、AI軽量採点は失敗しても記録のみで保存は止めない。
    // 詳細仕様: docs/review-log/article-evaluation.md
    const deterministicCheck = runDeterministicCheck({
      content: fullText,
      articleType: articleType as ArticleType,
      volume: resolvedVolume,
      ownerFirstPerson,
    })
    let aiSelfReview: Awaited<ReturnType<typeof generateArticleSelfReview>> = null
    try {
      aiSelfReview = await generateArticleSelfReview({
        client: anthropic,
        articleMarkdown: fullText,
        articleType: articleType as ArticleType,
        volume: resolvedVolume,
        audience: audienceKey,
        ownerFirstPerson,
        hasInternalLinkCandidates: relevantOwnBlogPosts.length > 0,
        projectId,
        userId: user?.id,
      })
    } catch (err) {
      console.warn('[article] self review failed (non-blocking):', err)
    }
    const qualityReview = { deterministic: deterministicCheck, ai_self: aiSelfReview }

    const saved = await saveArticle({
      supabase: adminSupabase,
      projectId,
      interviewId,
      articleType,
      interviewerType,
      content: fullText,
      userEmail: user?.email,
      theme: theme ?? null,
      clientName,
      clientAvatarUrl: profile?.avatar_url ?? null,
      interviewerDisplayName: char?.name ?? 'インタビュアー',
      audience: audienceKey,
      qualityReview,
    })
    if (!saved) {
      await markArticleGenerationFailed({ supabase: adminSupabase, projectId, interviewId, message: '記事を保存できませんでした。少し待ってから、もう一度お試しください。' })
      return
    }

    // 提案生成（失敗しても記事保存はブロックしない）
    try {
      const suggestionsResult = await generateArticleSuggestions({
        articleMarkdown: fullText,
        conversation,
        projectId,
        userId: user?.id,
      })
      if (suggestionsResult) {
        await adminSupabase
          .from('articles')
          .update({ suggestions: suggestionsResult })
          .eq('id', saved.id)
      }
    } catch (err) {
      console.warn('[article] suggestions generation failed (non-blocking):', err)
    }
  }

  waitUntil(generateAndSaveWithAdmin().catch(async (err) => {
    console.error('[article] unexpected error in generateAndSave:', err)
    await markArticleGenerationFailed({
      supabase: adminSupabase,
      projectId,
      interviewId,
      message: '記事を仕上げきれませんでした。少し待ってから、もう一度お試しください。',
    })
  }))
  return NextResponse.json({ ok: true, status: 'article_generating' }, { status: 202 })
}
