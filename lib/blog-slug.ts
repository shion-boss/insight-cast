import 'server-only'

import Anthropic from '@anthropic-ai/sdk'
import { logApiUsage } from '@/lib/api-usage'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 30_000 })

/**
 * 記事タイトルから英語のケバブケーススラッグを Claude Haiku で生成する。
 * 失敗時や空結果のときは null を返す。呼び出し元でフォールバック判断する。
 */
export async function generateSlugFromTitle(title: string, route: string): Promise<string | null> {
  if (!title.trim()) return null

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 30,
      messages: [{
        role: 'user',
        content: `次の記事タイトルを英語のケバブケーススラッグ（3〜5単語、小文字英数字とハイフンのみ）に変換してください。スラッグだけを返してください。\n\nタイトル: ${title}`,
      }],
    })
    const raw = msg.content[0]?.type === 'text' ? msg.content[0].text.trim() : ''
    const slug = raw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
    logApiUsage({
      route,
      model: 'claude-haiku-4-5-20251001',
      inputTokens: msg.usage.input_tokens,
      outputTokens: msg.usage.output_tokens,
    }).catch(() => {})
    return slug || null
  } catch {
    return null
  }
}
