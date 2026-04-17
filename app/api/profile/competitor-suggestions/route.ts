import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic()

type Suggestion = {
  name: string
  url: string
  summary: string
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { industry, location, url } = await req.json()
  if (!url?.trim() || !industry?.trim()) {
    return Response.json({ suggestions: [] }, { status: 400 })
  }

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `以下の事業者の競合となりそうなウェブサイトを5件提案してください。

業種: ${industry ?? '不明'}
地域: ${location ?? '不明'}
自社HP: ${url ?? '不明'}

条件:
- 実在する可能性が高い具体的なURLを提案する
- 同じ地域・同業種の競合を優先する
- 全国チェーンより地域密着の競合を優先する
- 競合ごとに「何が特徴か」を1〜2文で簡潔に添える
- 必ずJSON配列形式のみで返す（説明文不要）

返答形式（このJSONのみ返す）:
[
  {
    "name": "競合名",
    "url": "https://example1.com",
    "summary": "地域密着で何を打ち出しているかの簡単な説明"
  }
]`,
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '[]'

  try {
    const jsonText = text.match(/\[[\s\S]*\]/)?.[0] ?? '[]'
    const raw = JSON.parse(jsonText)
    const suggestions = (Array.isArray(raw) ? raw : [])
      .map((item): Suggestion | null => {
        if (!item || typeof item !== 'object') return null
        const urlValue = typeof item.url === 'string' ? item.url.trim() : ''
        if (!urlValue) return null
        return {
          name: typeof item.name === 'string' && item.name.trim() ? item.name.trim() : urlValue.replace(/^https?:\/\//, ''),
          url: urlValue,
          summary: typeof item.summary === 'string' && item.summary.trim() ? item.summary.trim() : '自社HPとの違いを見比べやすそうな候補です。',
        }
      })
      .filter((item): item is Suggestion => item !== null)
      .slice(0, 5)

    return Response.json({ suggestions })
  } catch {
    return Response.json({ suggestions: [] })
  }
}
