import Anthropic from '@anthropic-ai/sdk'
import { buildInterviewQualityContext } from '@/lib/ai-quality'
import { createClient } from '@/lib/supabase/server'
import { SYSTEM_PROMPTS } from '@/lib/characters'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 30_000 })
const PASS_QUESTION_TOKEN = '__PASS_QUESTION__'

const BodySchema = z.object({
  interviewId: z.string().uuid().optional(),
  userMessage: z.string().min(1).max(2000),
  respondentName: z.string().max(100).optional(),
  respondentIndustry: z.string().max(100).optional(),
})

type Params = { params: Promise<{ token: string }> }

export async function POST(
  req: NextRequest,
  { params }: Params,
) {
  const { token } = await params
  const supabase = await createClient()

  // リンクの有効性確認
  const { data: link } = await supabase
    .from('external_interview_links')
    .select('id, project_id, interviewer_type, theme, target_name, target_industry, is_active, use_count, max_use_count, created_by')
    .eq('token', token)
    .single()

  if (!link || !link.is_active || link.use_count >= link.max_use_count) {
    return NextResponse.json({ error: 'link_invalid' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  const { interviewId, userMessage, respondentName, respondentIndustry } = parsed.data
  const isGreeting = userMessage === '__GREETING__'
  const isPassQuestion = userMessage === PASS_QUESTION_TOKEN

  let resolvedInterviewId = interviewId

  // interviewId がなければ新規インタビューレコードを作成
  if (!resolvedInterviewId) {
    const { data: newInterview, error: insertError } = await supabase
      .from('interviews')
      .insert({
        project_id: link.project_id,
        interviewer_type: link.interviewer_type,
        // 外部取材: オーナーのuser_idが必要なため created_by を使用
        source: 'external',
        external_link_id: link.id,
        external_respondent_name: respondentName ?? link.target_name ?? null,
        external_respondent_industry: respondentIndustry ?? link.target_industry ?? null,
        focus_theme_mode: 'custom',
        focus_theme: link.theme,
        status: 'in_progress',
      })
      .select('id')
      .single()

    if (insertError || !newInterview) {
      console.error('[ext chat] interview insert error:', insertError?.message)
      return NextResponse.json({ error: 'db_error' }, { status: 500 })
    }
    resolvedInterviewId = newInterview.id
  }

  // 既存インタビューの確認（同一リンクのもののみ許可）
  const { data: interview } = await supabase
    .from('interviews')
    .select('id, interviewer_type, project_id, focus_theme, external_link_id')
    .eq('id', resolvedInterviewId)
    .is('deleted_at', null)
    .single()

  if (!interview || interview.external_link_id !== link.id) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  // ユーザーメッセージ保存
  if (!isGreeting && !isPassQuestion) {
    const { error: msgInsertError } = await supabase.from('interview_messages').insert({
      interview_id: resolvedInterviewId,
      role: 'user',
      content: userMessage,
    })
    if (msgInsertError) {
      console.error('[ext chat] user message insert error:', msgInsertError.message)
      return NextResponse.json({ error: 'db_error' }, { status: 500 })
    }
  }

  // 会話履歴取得（最新100件）
  const { data: history } = await supabase
    .from('interview_messages')
    .select('role, content')
    .eq('interview_id', resolvedInterviewId)
    .order('created_at', { ascending: true })
    .limit(100)

  if (isGreeting && history && history.length > 0) {
    return new Response(JSON.stringify({ interviewId: resolvedInterviewId }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const userTurnCount = (history ?? []).filter(m => m.role === 'user').length

  const messages = isGreeting
    ? [{ role: 'user' as const, content: 'はじめまして。よろしくお願いします。' }]
    : [
        ...(history ?? []).map((m) => ({
          role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: m.content,
        })),
        ...(isPassQuestion
          ? [{
              role: 'user' as const,
              content: '今の質問はパスしたいです。無理に同じ問いを続けず、これまでの話を踏まえて別の切り口から短く1つだけ質問してください。',
            }]
          : []),
      ]

  // コンテキスト構築（外部取材のため、プロジェクト情報は最低限）
  const contextParts: string[] = []

  // テーマ
  if (link.theme) {
    contextParts.push(`【取材テーマ】\n${link.theme}`)
  }

  // 回答者情報
  const respondentNameValue = respondentName ?? link.target_name
  const respondentIndustryValue = respondentIndustry ?? link.target_industry
  if (respondentNameValue || respondentIndustryValue) {
    const parts: string[] = []
    if (respondentNameValue) parts.push(`お名前: ${respondentNameValue}`)
    if (respondentIndustryValue) parts.push(`業種: ${respondentIndustryValue}`)
    contextParts.push(`【話し相手】\n${parts.join('\n')}`)
  }

  // 外部取材であることの注意
  contextParts.push(`【外部取材について】
このインタビューは外部リンクを通じて行われています。
相手はInsight Castに登録していない方で、初めてインタビューを受けてもらいます。
最初に自己紹介をしてから、テーマに沿って話を聞いてください。
「プロジェクト名」「HP URL」などプロジェクト固有の情報は一切共有しないでください。`)

  // 品質コンテキスト
  const interviewQualityContext = buildInterviewQualityContext({
    messages: (history ?? []).map((message) => ({
      role: message.role === 'user' ? 'user' : 'interviewer',
      content: message.content,
    })),
    userTurnCount,
    isGreeting,
    isPassQuestion,
    focusTheme: link.theme,
  })
  if (interviewQualityContext) {
    contextParts.push(interviewQualityContext)
  }

  if (userTurnCount >= 7) {
    contextParts.push(`【現在の状況】ユーザーは${userTurnCount}回返答しました。`)
  }

  const systemPrompt = (SYSTEM_PROMPTS[interview.interviewer_type] ?? SYSTEM_PROMPTS['mint'])
    + (contextParts.length ? '\n\n' + contextParts.join('\n\n') : '')

  let stream: Awaited<ReturnType<typeof anthropic.messages.stream>>
  try {
    stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: systemPrompt,
      messages,
    })
  } catch (err) {
    const isTimeout = err instanceof Error && (err.message.includes('timeout') || err.constructor.name === 'APIConnectionTimeoutError')
    console.error('[ext chat] Anthropic API error:', err)
    return Response.json(
      { code: isTimeout ? 'TIMEOUT' : 'AI_ERROR', message: 'もう一度お試しください。' },
      { status: 503 },
    )
  }

  let fullText = ''
  const readable = new ReadableStream({
    async start(controller) {
      // インタビューIDをヘッダーに埋め込むためにストリームの先頭にJSONを流す
      // フォーマット: "INTERVIEW_ID:<id>\n" の後にストリームテキスト
      controller.enqueue(new TextEncoder().encode(`INTERVIEW_ID:${resolvedInterviewId}\n`))

      try {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            fullText += chunk.delta.text
            controller.enqueue(new TextEncoder().encode(chunk.delta.text))
          }
        }
      } catch (err) {
        console.error('[ext chat] stream error:', err)
        controller.error(err)
        return
      }

      // AIメッセージ保存
      const cleanText = fullText.replace(/\[INTERVIEW_COMPLETE\]\s*$/m, '').trim()
      if (cleanText) {
        const { error } = await supabase.from('interview_messages').insert({
          interview_id: resolvedInterviewId,
          role: 'interviewer',
          content: cleanText,
        })
        if (error) console.error('[ext chat] failed to save message:', error.message)
      }

      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
