import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { getCharacter } from '@/lib/characters'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const VOLUME_MAP = { short: '600〜800', medium: '1200〜1500', long: '2000〜2500' }
const STYLE_MAP  = { desu: 'ですます体', 'de-aru': 'である体', 'da-na': 'だ・な体（口語的）' }

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { interviewId, articleType, style, volume, theme } = await req.json()

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

  let prompt: string

  if (articleType === 'client') {
    const styleLabel  = STYLE_MAP[style as keyof typeof STYLE_MAP]   ?? 'ですます体'
    const volumeLabel = VOLUME_MAP[volume as keyof typeof VOLUME_MAP] ?? '1200〜1500'

    prompt = `以下のインタビュー内容をもとに、事業者（${bizName}）の視点・言葉で語る読み物記事を書いてください。

## 事業者情報
${bizContext}

## インタビュー記録
${conversation}
${themeInstruction}

## 執筆ルール
- 一人称は「私」または「弊社」
- 語尾スタイル: ${styleLabel}
- 文字数: ${volumeLabel}文字程度
- 見出し（##）を2〜3個つけて構造化する
- お客様に読んでもらう想定で、温かみのある文体で
- タイトルを最初に書く（# タイトル）
- Markdown形式で出力`

  } else if (articleType === 'interviewer') {
    prompt = `以下のインタビュー内容をもとに、インタビュアー（${charName}）の視点で${bizName}を紹介する記事を書いてください。

## 事業者情報
${bizContext}

## インタビュー記録
${conversation}
${themeInstruction}

## 執筆ルール
- インタビュアーが「取材して発見した魅力」を語るスタイル
- 「〜だということがわかりました」「〜が印象的でした」などの表現を自然に使う
- 1200〜1600文字程度
- 見出し（##）を2〜3個つけて構造化する
- タイトルを最初に書く（# タイトル）
- Markdown形式で出力`

  } else {
    // conversation (Q&A形式)
    prompt = `以下のインタビュー内容をもとに、Q&A形式のインタビュー記事を書いてください。

## 事業者情報
${bizContext}

## インタビュー記録
${conversation}
${themeInstruction}

## 執筆ルール
- 最初に導入文（2〜3行）
- 「この記事でわかること」（箇条書き3点）
- インタビュアー紹介（${charName}の紹介を1行）
- 会話形式で本文: **${charName}**: 発言内容 / **${bizName}**: 発言内容
- 実際のインタビューから自然な流れで5〜8往復を選んで構成
- タイトルを最初に書く（# タイトル）
- Markdown形式で出力`
  }

  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  let fullText = ''
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          fullText += chunk.delta.text
          controller.enqueue(new TextEncoder().encode(chunk.delta.text))
        }
      }
      controller.close()

      const titleMatch = fullText.match(/^#\s+(.+)/m)
      const title = titleMatch?.[1]?.trim() ?? '記事'

      await supabase.from('articles').insert({
        project_id:   projectId,
        interview_id: interviewId,
        article_type: articleType,
        title,
        content: fullText,
      })

      await supabase.from('projects').update({ status: 'article_ready' }).eq('id', projectId)
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
