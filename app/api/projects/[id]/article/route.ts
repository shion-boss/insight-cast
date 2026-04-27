import { z } from 'zod'
import Anthropic from '@anthropic-ai/sdk'
import { formatConversationForPrompt, normalizeUniqueStringList } from '@/lib/ai-quality'
import { logApiUsage, checkRateLimit } from '@/lib/api-usage'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCharacter } from '@/lib/characters'
import { getStoredSiteBlogPosts, selectRelevantBlogPosts } from '@/lib/site-blog-support'
import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { syncProjectContentStatus } from '@/lib/project-content-status'
import { isFreePlanLocked, checkMonthlyArticleLimit } from '@/lib/plans'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 120_000 })

const VOLUME_MAP = { short: '600〜800', medium: '1200〜1500', long: '2000〜2500' }
const STYLE_MAP = { desu: 'ですます体', 'de-aru': 'である体', 'da-na': 'だ・な体（口語的）' }

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
      article_error: input.message ?? '記事素材を作成できませんでした。',
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
  let baseSlug = ''
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 30,
      messages: [{
        role: 'user',
        content: `次の記事タイトルを英語のケバブケーススラッグ（3〜5単語、小文字英数字とハイフンのみ）に変換してください。スラッグだけを返してください。\n\nタイトル: ${title}`,
      }],
    })
    const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''
    baseSlug = raw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
    logApiUsage({ route: 'article/slug', model: 'claude-haiku-4-5-20251001', inputTokens: msg.usage.input_tokens, outputTokens: msg.usage.output_tokens }).catch(() => {})
  } catch {
    // fallback to date-only slug on LLM error
  }

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

    const blogBody = cleanContent.replace(/^#\s+[^\n]*\n?/, '').trimStart()
    await input.supabase
      .from('blog_posts')
      .insert({
        slug,
        title,
        excerpt,
        category: blogCategory,
        type: isInterviewStyle ? 'interview' : 'normal',
        interviewer: isInterviewStyle ? (input.interviewerType ?? null) : null,
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
    volume: z.enum(['short', 'medium', 'long']).optional(),
    theme: z.string().max(200).optional(),
    polishAnswers: z.boolean().optional(),
  }).safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  const { interviewId, articleType, style, volume, theme, polishAnswers } = parsed.data

  const { data: interview } = await supabase
    .from('interviews')
    .select('id, interviewer_type, summary, themes, project_id, article_status')
    .eq('id', interviewId)
    .eq('project_id', projectId)
    .single()

  if (!interview) return new Response('Not found', { status: 404 })

  const interviewerType = interview.interviewer_type

  if (interview.article_status === 'generating') {
    return NextResponse.json({ ok: true, status: 'article_generating' }, { status: 202 })
  }

  if (await isFreePlanLocked(supabase, user.id)) {
    return NextResponse.json({ error: 'free_plan_locked' }, { status: 403 })
  }

  const monthlyCheck = await checkMonthlyArticleLimit(supabase, user.id)
  if (!monthlyCheck.allowed) {
    return NextResponse.json({ error: 'monthly_article_limit_reached', limit: monthlyCheck.limit, count: monthlyCheck.count }, { status: 403 })
  }

  const { data: project } = await supabase
    .from('projects')
    .select('name, hp_url')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project) return new Response('Forbidden', { status: 403 })

  const { data: messages } = await supabase
    .from('interview_messages')
    .select('role, content')
    .eq('interview_id', interviewId)
    .order('created_at', { ascending: true })

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

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

  const summaryValues = normalizeUniqueStringList(interview.summary, { maxItems: 5, maxLength: 120 })
  const extractedThemes = normalizeUniqueStringList(interview.themes, { maxItems: 5, maxLength: 120 })
  const summaryContext = summaryValues.length > 0
    ? `\n\n## インタビュー要約\n${summaryValues.map((value) => `- ${value}`).join('\n')}`
    : ''
  const extractedThemesContext = extractedThemes.length > 0
    ? `\n\n## 抽出済みテーマ\n${extractedThemes.map((value) => `- ${value}`).join('\n')}`
    : ''

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

  const editorialGuardrail = `あなたは、一次情報をもとにホームページ向けの記事を書く編集者です。

- 会話や要約にない事実・数字・価格・実績・地名・肩書きは足さない
- 断定しすぎず、根拠が会話にある内容だけを書く
- もっともらしい言い換えで事実を膨らませない
- 抽象的な美辞麗句だけで終わらせず、行動・判断・お客様の反応が見える形で書く
- 情報が足りない点は無理に埋めず、省くか控えめに表現する
- 読みやすく整えてよいが、事業者の温度感や言い回しはできるだけ残す`

  // 同一インタビューから複数の記事を作る場合にキャッシュが効くよう、
  // インタビューデータ（大きいブロック）と指示（小さいブロック）を分ける
  const contextBlock = `## 事業者情報\n${bizContext}\n\n## インタビュー記録\n${conversation}${summaryContext}${extractedThemesContext}`

  let instructionBlock: string

  if (articleType === 'client') {
    const styleLabel = STYLE_MAP[style as keyof typeof STYLE_MAP] ?? 'ですます体'
    const volumeLabel = VOLUME_MAP[volume as keyof typeof VOLUME_MAP] ?? '1200〜1500'

    instructionBlock = `上の事業者情報とインタビュー記録をもとに、事業者（${bizName}）の視点・言葉で語る読み物記事を書いてください。${themeInstruction}${internalLinkInstruction}

## 執筆ルール
- 一人称は「私」または「弊社」
- 語尾スタイル: ${styleLabel}
- 文字数: ${volumeLabel}文字程度
- 見出し（##）を2〜3個つけて構造化する
- お客様に読んでもらう想定で、温かみのある文体で
- タイトルを最初に書く（# タイトル）
- 本文の最後に1行空けて「抜粋: 」で始まる150字以内の紹介文を書く（Markdown外のプレーンテキスト）
- Markdown形式で出力
- 【視点の一貫性】「〜というのです」「〜と話してくれました」「〜とのこと」「〜だそうです」など、第三者が伝える語尾・表現は使わない。事業者本人の言葉として一貫して書く
- 【エピソードの一人称化】インタビューで語られたエピソードや発言も、「〜しました」「〜と思いました」「〜と感じました」のように事業者本人が一人称で語る形に書き直す${polishInstruction}`
  } else if (articleType === 'interviewer') {
    const volumeLabel = VOLUME_MAP[volume as keyof typeof VOLUME_MAP] ?? '1200〜1500'

    instructionBlock = `上の事業者情報とインタビュー記録をもとに、インタビュアー（${charName}）の視点で${bizName}を紹介する記事を書いてください。${themeInstruction}${internalLinkInstruction}

## 執筆ルール
- インタビュアーが「取材して発見した魅力」を語るスタイル
- 「〜だということがわかりました」「〜が印象的でした」などの表現を自然に使う
- 文字数: ${volumeLabel}文字程度
- 見出し（##）を2〜3個つけて構造化する
- タイトルを最初に書く（# タイトル）
- 本文の最後に1行空けて「抜粋: 」で始まる150字以内の紹介文を書く（Markdown外のプレーンテキスト）
- Markdown形式で出力${polishInstruction}`
  } else {
    const volumeLabel = VOLUME_MAP[volume as keyof typeof VOLUME_MAP] ?? '1200〜1500'

    instructionBlock = `上の事業者情報とインタビュー記録をもとに、Q&A形式のインタビュー記事を書いてください。${themeInstruction}${internalLinkInstruction}

## 執筆ルール
- 最初に導入文（2〜3行）
- 「この記事でわかること」（箇条書き3点）
- インタビュアー紹介（${charName}の紹介を1行）
- 会話形式で本文: **${charName}**: 発言内容 / **${bizName}**: 発言内容
- 実際のインタビューから自然な流れで5〜8往復を選んで構成
- 全体の文字数: ${volumeLabel}文字程度
- タイトルを最初に書く（# タイトル）
- 本文の最後に1行空けて「抜粋: 」で始まる150字以内の紹介文を書く（Markdown外のプレーンテキスト）
- Markdown形式で出力${polishInstruction}

## 【重要】会話の最初のインタビュアー発言について
会話バブルとして表示されるとき、インタビュアーの1コメント目は読者にとって最初の接触になります。唐突に質問から入ると文脈がないため、**最初のインタビュアー発言だけ**以下の構造にしてください。

- 記事冒頭の導入文（事業者の背景・特徴）を1〜2文で要約したコメント
- そのまま自然につながる質問

例: **${charName}**: ${bizName}さんは[導入文から引き出した特徴を1文で]。そのきっかけを教えていただけますか？

2回目以降のインタビュアー発言は通常どおりの質問形式で構いません。`
  }

  await markArticleGenerationStarted({ supabase, projectId, interviewId })

  const adminSupabase = createAdminClient()

  async function generateAndSaveWithAdmin() {
    let fullText = ''
    try {
      const stream = await anthropic.messages.stream({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: editorialGuardrail,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: contextBlock, cache_control: { type: 'ephemeral' } },
            { type: 'text', text: instructionBlock },
          ],
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
      await markArticleGenerationFailed({ supabase: adminSupabase, projectId, interviewId, message: '記事素材を仕上げきれませんでした。少し待ってから、もう一度お試しください。' })
      return
    }
    if (!fullText.trim()) {
      await markArticleGenerationFailed({ supabase: adminSupabase, projectId, interviewId, message: '記事素材を仕上げきれませんでした。少し待ってから、もう一度お試しください。' })
      return
    }
    const saved = await saveArticle({ supabase: adminSupabase, projectId, interviewId, articleType, interviewerType, content: fullText, userEmail: user?.email, theme: theme ?? null })
    if (!saved) {
      await markArticleGenerationFailed({ supabase: adminSupabase, projectId, interviewId, message: '記事素材を保存できませんでした。少し待ってから、もう一度お試しください。' })
    }
  }

  waitUntil(generateAndSaveWithAdmin().catch(async (err) => {
    console.error('[article] unexpected error in generateAndSave:', err)
    await markArticleGenerationFailed({
      supabase: adminSupabase,
      projectId,
      interviewId,
      message: '記事素材を仕上げきれませんでした。少し待ってから、もう一度お試しください。',
    })
  }))
  return NextResponse.json({ ok: true, status: 'article_generating' }, { status: 202 })
}
