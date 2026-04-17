import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic()

const OUTPUT_PROMPTS: Record<string, { title: string; prompt: string }> = {
  raw: {
    title: 'インタビュー記録',
    prompt: 'このインタビューの会話をそのまま整理してください。発言者を「事業者」「ミント」として読みやすく整形するだけで、内容は変えないでください。',
  },
  polished: {
    title: 'インタビューまとめ',
    prompt: 'このインタビューの内容を読みやすくまとめてください。事業者の言葉のニュアンスを活かしながら、伝わりやすい文章に整えてください。見出しをつけて構造化してください。',
  },
  qa: {
    title: 'Q&A形式',
    prompt: 'このインタビューの内容をQ&A形式に整理してください。質問と回答が明確になるよう、会話から本質的なQ&Aを抽出してください。',
  },
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { sessionId, type } = await req.json()

  const outputConfig = OUTPUT_PROMPTS[type]
  if (!outputConfig) return new Response('Invalid type', { status: 400 })

  // セッション確認
  const { data: session } = await supabase
    .from('interview_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session) return new Response('Not found', { status: 404 })

  // 会話ログ取得
  const { data: messages } = await supabase
    .from('interview_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (!messages || messages.length === 0) {
    return new Response('No messages', { status: 400 })
  }

  const conversation = messages
    .map((m) => `${m.role === 'user' ? '事業者' : 'ミント'}: ${m.content}`)
    .join('\n\n')

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `以下のインタビュー記録を処理してください。\n\n${outputConfig.prompt}\n\n---\n\n${conversation}`,
      },
    ],
  })

  const content = response.content[0].type === 'text' ? response.content[0].text : ''

  // 出力を保存
  const { data: output } = await supabase
    .from('interview_outputs')
    .insert({
      session_id: sessionId,
      user_id: user.id,
      type,
      title: outputConfig.title,
      content,
    })
    .select('id')
    .single()

  return Response.json({ id: output?.id, content })
}
