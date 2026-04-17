import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { SYSTEM_PROMPTS } from '@/lib/characters'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic()

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { sessionId, userMessage } = await req.json()

  // セッション確認
  const { data: session } = await supabase
    .from('interview_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session) return new Response('Not found', { status: 404 })

  const isGreeting = userMessage === '__GREETING__'

  // グリーティング以外はユーザーメッセージを保存
  if (!isGreeting) {
    await supabase.from('interview_messages').insert({
      session_id: sessionId,
      role: 'user',
      content: userMessage,
    })
  }

  // 過去のメッセージを取得
  const { data: history } = await supabase
    .from('interview_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  // グリーティング時は自己紹介を促すメッセージをセット
  const messages = isGreeting
    ? [{ role: 'user' as const, content: 'はじめまして。よろしくお願いします。' }]
    : (history ?? []).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

  const systemPrompt = SYSTEM_PROMPTS[session.character_id] ?? SYSTEM_PROMPTS['mint']

  // ユーザープロフィールを取得してコンテキストに追加
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, url, industry_memo')
    .eq('id', user.id)
    .single()

  const contextPrompt = profile
    ? `\n\n【取材先の情報】\n店舗・企業名: ${profile.name ?? '未設定'}\nHP URL: ${profile.url ?? '未設定'}\n業種: ${profile.industry_memo ?? '未設定'}`
    : ''

  // ストリーミングレスポンス
  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt + contextPrompt,
    messages,
  })

  let fullText = ''
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          const text = chunk.delta.text
          fullText += text
          controller.enqueue(new TextEncoder().encode(text))
        }
      }
      controller.close()

      // アシスタントのメッセージを保存
      await supabase.from('interview_messages').insert({
        session_id: sessionId,
        role: 'assistant',
        content: fullText,
      })
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
