import Anthropic from '@anthropic-ai/sdk'
import { logApiUsage } from '@/lib/api-usage'

export type ArticleSuggestion = {
  type: 'image' | 'content'
  anchor: string
  text: string
}

export type ArticleSuggestions = {
  items: ArticleSuggestion[]
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 60_000 })

export async function generateArticleSuggestions(input: {
  articleMarkdown: string
  conversation: string
  projectId: string
  userId?: string | null
}): Promise<ArticleSuggestions | null> {
  const { articleMarkdown, conversation, projectId, userId } = input

  // ## 見出しを抽出
  const anchorMatches = [...articleMarkdown.matchAll(/^## (.+)$/gm)]
  const anchors = anchorMatches.map((m) => m[1].trim())

  const anchorListText = anchors.length > 0
    ? anchors.map((a) => `- ${a}`).join('\n')
    : '（見出しなし）'

  const userPrompt = `以下の記事とインタビュー記録をもとに、クオリティアップの改善提案を3〜6件作成してください。

## 記事本文
${articleMarkdown}

## インタビュー記録
${conversation}

## 見出し一覧（anchor に使う文字列）
${anchorListText}
（イントロ部分は "intro" を使ってください）

## ルール
- type: "image"（写真・図の追加）または "content"（情報・数字・エピソードの追加）
- anchor: 上記見出し一覧か "intro" の中から選ぶ
- text: 何を追加するか＋なぜ効果的か を1〜2文で。40〜60代の事業者が理解できる言葉で（専門用語なし）

## 出力（このJSONのみ返す）
[{"type": "image", "anchor": "見出しテキスト", "text": "提案内容"}, ...]`

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: 'あなたはウェブ記事の品質改善アドバイザーです。事業者が自分で素材を追加して記事を強化できるよう、具体的で実行しやすい提案をします。',
    messages: [{ role: 'user', content: userPrompt }],
  })

  logApiUsage({
    userId: userId ?? undefined,
    projectId,
    route: 'article/suggestions',
    model: 'claude-haiku-4-5-20251001',
    inputTokens: msg.usage.input_tokens,
    outputTokens: msg.usage.output_tokens,
  }).catch(() => {})

  const rawText = msg.content[0].type === 'text' ? msg.content[0].text : ''

  // JSON配列を抽出
  const arrayMatch = rawText.match(/\[[\s\S]*\]/)
  if (!arrayMatch) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(arrayMatch[0])
  } catch {
    return null
  }
  if (!Array.isArray(parsed)) return null

  const validTypes = new Set<string>(['image', 'content'])
  const validAnchors = new Set<string>([...anchors, 'intro'])

  const items: ArticleSuggestion[] = parsed
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .filter((item) => {
      const type = item['type']
      const anchor = item['anchor']
      const text = item['text']
      return (
        typeof type === 'string' && validTypes.has(type) &&
        typeof anchor === 'string' && validAnchors.has(anchor) &&
        typeof text === 'string' && text.length >= 10
      )
    })
    .map((item) => ({
      type: item['type'] as 'image' | 'content',
      anchor: item['anchor'] as string,
      text: item['text'] as string,
    }))
    .slice(0, 6)

  return { items }
}
