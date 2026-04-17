import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { SYSTEM_PROMPTS } from '@/lib/characters'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { interviewId, userMessage } = await req.json()
  const isGreeting = userMessage === '__GREETING__'

  // インタビュー確認（project所有確認も兼ねる）
  const { data: interview } = await supabase
    .from('interviews')
    .select('id, interviewer_type, project_id, interviews_project:projects(user_id, name, hp_url)')
    .eq('id', interviewId)
    .eq('project_id', projectId)
    .single()

  if (!interview) return new Response('Not found', { status: 404 })

  const projectData = interview.interviews_project as unknown as { user_id: string; name: string | null; hp_url: string } | null
  if (projectData?.user_id !== user.id) return new Response('Forbidden', { status: 403 })

  // ユーザーメッセージ保存
  if (!isGreeting) {
    await supabase.from('interview_messages').insert({
      interview_id: interviewId,
      role: 'user',
      content: userMessage,
    })
  }

  // 会話履歴取得
  const { data: history } = await supabase
    .from('interview_messages')
    .select('role, content')
    .eq('interview_id', interviewId)
    .order('created_at', { ascending: true })

  if (isGreeting && history && history.length > 0) {
    return new Response('', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  const userTurnCount = (history ?? []).filter(m => m.role === 'user').length

  const messages = isGreeting
    ? [{ role: 'user' as const, content: 'はじめまして。よろしくお願いします。' }]
    : (history ?? []).map((m) => ({
        role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content,
      }))

  // 取材先情報と調査結果をコンテキストに注入
  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  const { data: auditRow } = await supabase
    .from('hp_audits')
    .select('gaps, suggested_themes')
    .eq('project_id', projectId)
    .single()

  const auditResult = auditRow as { gaps?: string[]; suggested_themes?: string[] } | null
  const audit = auditResult ?? null

  const contextParts: string[] = []
  if (projectData) {
    contextParts.push(`【取材先】\n取材先名: ${projectData.name ?? '未設定'}\nHP URL: ${projectData.hp_url ?? '未設定'}`)
  }
  if (profile?.name) {
    contextParts.push(`【話し相手】\nお名前: ${profile.name}`)
  }
  if (audit) {
    if (audit.gaps?.length) contextParts.push(`【HPで伝えきれていないこと（調査結果）】\n${(audit.gaps as string[]).map((g: string) => `・${g}`).join('\n')}`)
    if (audit.suggested_themes?.length) contextParts.push(`【インタビューで深めたいテーマ（調査結果）】\n${(audit.suggested_themes as string[]).map((t: string) => `・${t}`).join('\n')}`)
  }
  if (userTurnCount >= 7) {
    contextParts.push(`【現在の状況】ユーザーは${userTurnCount}回返答しました。`)
  }

  const systemPrompt = (SYSTEM_PROMPTS[interview.interviewer_type] ?? SYSTEM_PROMPTS['mint'])
    + (contextParts.length ? '\n\n' + contextParts.join('\n\n') : '')

  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: systemPrompt,
    messages,
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

      // AIメッセージ保存（[INTERVIEW_COMPLETE]マーカーは除いて保存）
      const cleanText = fullText.replace(/\[INTERVIEW_COMPLETE\]\s*$/m, '').trim()
      if (cleanText) {
        await supabase.from('interview_messages').insert({
          interview_id: interviewId,
          role: 'interviewer',
          content: cleanText,
        })
      }

      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
