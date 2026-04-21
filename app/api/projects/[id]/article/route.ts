import Anthropic from '@anthropic-ai/sdk'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCharacter } from '@/lib/characters'
import { getStoredSiteBlogPosts, selectRelevantBlogPosts } from '@/lib/site-blog-support'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 60_000 })

const VOLUME_MAP = { short: '600〜800', medium: '1200〜1500', long: '2000〜2500' }
const STYLE_MAP  = { desu: 'ですます体', 'de-aru': 'である体', 'da-na': 'だ・な体（口語的）' }

async function saveArticle(input: {
  supabase: Awaited<ReturnType<typeof createClient>>
  projectId: string
  interviewId: string
  articleType: string
  content: string
}) {
  const titleMatch = input.content.match(/^#\s+(.+)/m)
  const title = titleMatch?.[1]?.trim() ?? '記事'

  const { data: savedArticle, error: articleInsertError } = await input.supabase
    .from('articles')
    .insert({
      project_id: input.projectId,
      interview_id: input.interviewId,
      article_type: input.articleType,
      title,
      content: input.content,
    })
    .select('id')
    .single()

  if (articleInsertError) {
    console.error('[article/saveArticle] failed to insert article:', articleInsertError.message)
  }

  await input.supabase.from('projects').update({ status: 'article_ready' }).eq('id', input.projectId)
  revalidatePath('/dashboard')
  revalidatePath('/projects')
  revalidatePath('/articles')
  revalidatePath('/interviews')
  revalidatePath(`/projects/${input.projectId}`)
  revalidatePath(`/projects/${input.projectId}/summary`)
  revalidatePath(`/projects/${input.projectId}/article`)
  if (savedArticle?.id) {
    revalidatePath(`/projects/${input.projectId}/articles/${savedArticle.id}`)
  }

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

  const {
    interviewId,
    articleType,
    style,
    volume,
    theme,
    polishAnswers,
    background,
  } = await req.json()

  const { data: interview } = await supabase
    .from('interviews')
    .select('id, interviewer_type, summary, themes, project_id')
    .eq('id', interviewId)
    .eq('project_id', projectId)
    .single()

  if (!interview) return new Response('Not found', { status: 404 })

  const { data: project } = await supabase
    .from('projects')
    .select('name, hp_url')
    .eq('id', projectId)
    .single()

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

  const char = getCharacter(interview.interviewer_type)
  const charName = char?.name ?? 'インタビュアー'
  const bizName = project?.name ?? project?.hp_url ?? '取材先'
  const clientName = profile?.name ?? '事業者'

  const conversation = (messages ?? [])
    .map(m => `${m.role === 'user' ? clientName : charName}: ${m.content}`)
    .join('\n\n')

  const bizContext = [
    project?.name ? `取材先名: ${project.name}` : null,
    project?.hp_url ? `HP URL: ${project.hp_url}` : null,
    profile?.name ? `話し手: ${profile.name}` : null,
  ].filter(Boolean).join('\n')

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

  let prompt: string

  if (articleType === 'client') {
    const styleLabel  = STYLE_MAP[style as keyof typeof STYLE_MAP]   ?? 'ですます体'
    const volumeLabel = VOLUME_MAP[volume as keyof typeof VOLUME_MAP] ?? '1200〜1500'

    prompt = `以下のインタビュー内容をもとに、事業者（${bizName}）の視点・言葉で語る読み物記事を書いてください。

## 事業者情報
${bizContext}

## インタビュー記録
${conversation}
${themeInstruction}${internalLinkInstruction}

## 執筆ルール
- 一人称は「私」または「弊社」
- 語尾スタイル: ${styleLabel}
- 文字数: ${volumeLabel}文字程度
- 見出し（##）を2〜3個つけて構造化する
- お客様に読んでもらう想定で、温かみのある文体で
- タイトルを最初に書く（# タイトル）
- Markdown形式で出力${polishInstruction}`

  } else if (articleType === 'interviewer') {
    const volumeLabel = VOLUME_MAP[volume as keyof typeof VOLUME_MAP] ?? '1200〜1500'

    prompt = `以下のインタビュー内容をもとに、インタビュアー（${charName}）の視点で${bizName}を紹介する記事を書いてください。

## 事業者情報
${bizContext}

## インタビュー記録
${conversation}
${themeInstruction}${internalLinkInstruction}

## 執筆ルール
- インタビュアーが「取材して発見した魅力」を語るスタイル
- 「〜だということがわかりました」「〜が印象的でした」などの表現を自然に使う
- 文字数: ${volumeLabel}文字程度
- 見出し（##）を2〜3個つけて構造化する
- タイトルを最初に書く（# タイトル）
- Markdown形式で出力${polishInstruction}`

  } else {
    // conversation (Q&A形式)
    const volumeLabel = VOLUME_MAP[volume as keyof typeof VOLUME_MAP] ?? '1200〜1500'

    prompt = `以下のインタビュー内容をもとに、Q&A形式のインタビュー記事を書いてください。

## 事業者情報
${bizContext}

## インタビュー記録
${conversation}
${themeInstruction}${internalLinkInstruction}

## 執筆ルール
- 最初に導入文（2〜3行）
- 「この記事でわかること」（箇条書き3点）
- インタビュアー紹介（${charName}の紹介を1行）
- 会話形式で本文: **${charName}**: 発言内容 / **${bizName}**: 発言内容
- 実際のインタビューから自然な流れで5〜8往復を選んで構成
- 全体の文字数: ${volumeLabel}文字程度
- タイトルを最初に書く（# タイトル）
- Markdown形式で出力${polishInstruction}`
  }

  let stream: Awaited<ReturnType<typeof anthropic.messages.stream>>
  try {
    stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })
  } catch (err) {
    const isTimeout = err instanceof Error && (err.message.includes('timeout') || err.constructor.name === 'APIConnectionTimeoutError')
    console.error('[article] Anthropic API error:', err)
    return Response.json(
      { code: isTimeout ? 'TIMEOUT' : 'AI_ERROR', message: 'もう一度お試しください。' },
      { status: 503 },
    )
  }

  if (background) {
    let fullText = ''
    try {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          fullText += chunk.delta.text
        }
      }
    } catch (err) {
      console.error('[article] background stream error:', err)
      return Response.json({ code: 'STREAM_ERROR', message: 'もう一度お試しください。' }, { status: 503 })
    }

    const savedArticle = await saveArticle({
      supabase,
      projectId,
      interviewId,
      articleType,
      content: fullText,
    })

    return Response.json({ ok: true, articleId: savedArticle?.id ?? null })
  }

  let fullText = ''
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            fullText += chunk.delta.text
            controller.enqueue(new TextEncoder().encode(chunk.delta.text))
          }
        }
      } catch (err) {
        console.error('[article] stream error:', err)
        controller.error(err)
        return
      }
      await saveArticle({
        supabase,
        projectId,
        interviewId,
        articleType,
        content: fullText,
      })
      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
