import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic()

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { industry, location, url } = await req.json()

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `以下の事業者の競合となりそうなウェブサイトのURLを3件提案してください。

業種: ${industry ?? '不明'}
地域: ${location ?? '不明'}
自社HP: ${url ?? '不明'}

条件:
- 実在する可能性が高い具体的なURLを提案する
- 同じ地域・同業種の競合を優先する
- 全国チェーンより地域密着の競合を優先する
- 必ずJSON配列形式のみで返す（説明文不要）

返答形式（このJSONのみ返す）:
["https://example1.com", "https://example2.com", "https://example3.com"]`,
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '[]'

  try {
    const urls = JSON.parse(text)
    return Response.json({ urls: Array.isArray(urls) ? urls.slice(0, 3) : [] })
  } catch {
    return Response.json({ urls: [] })
  }
}
