import Anthropic from '@anthropic-ai/sdk'
import { type ClassifiedPost, type GenreKey, type EffectKey, GENRES, EFFECTS } from './content-map'
import { logApiUsage } from '@/lib/api-usage'
import { isRecord, parseJsonObject } from '@/lib/utils'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function isGenreKey(v: unknown): v is GenreKey {
  return typeof v === 'string' && GENRES.some((g) => g.key === v)
}

function isEffectKey(v: unknown): v is EffectKey {
  return typeof v === 'string' && EFFECTS.some((e) => e.key === v)
}

export async function classifyBlogPosts(
  posts: Array<{ url: string; title: string; summary: string }>,
  logCtx?: { userId?: string; projectId?: string },
): Promise<ClassifiedPost[]> {
  if (posts.length === 0) return []

  const prompt = `以下のブログ記事リストを分析して、それぞれを2つの軸で分類してください。

## 分類軸1: ジャンル (genre)
- case_study   : 実績・事例（顧客事例、施工例、導入事例など）
- howto        : ノウハウ・解説（方法、手順、知識を教える記事）
- story        : 人物・ストーリー（代表・スタッフ紹介、創業話、思いなど）
- service      : サービス・商品（自社サービスや商品の説明・紹介）
- news         : お知らせ・イベント（更新情報、キャンペーン、イベント告知）
- industry     : 業界・トレンド（業界知識、市場動向、比較情報）

## 分類軸2: 期待効果 (effect)
- discovery    : 集客・発見（検索やSNSで新規読者に届くことを目的とした記事）
- trust        : 信頼・実績（専門性や実績を証明し信頼を高める記事）
- empathy      : 共感・ファン化（人柄・世界観・思想を伝えてファンを増やす記事）
- conversion   : 問い合わせ促進（読者が具体的な行動（問い合わせ・購入）に踏み出せる記事）

## 記事リスト
${posts.map((p, i) => `${i + 1}. title: ${p.title}\n   summary: ${p.summary}\n   url: ${p.url}`).join('\n\n')}

## 出力形式（JSONのみ）
{
  "classifications": [
    { "url": "...", "title": "記事タイトル", "genre": "case_study", "effect": "trust" }
  ]
}`

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: Math.min(4096, posts.length * 150 + 512),
    messages: [{ role: 'user', content: prompt }],
  })

  logApiUsage({ userId: logCtx?.userId, projectId: logCtx?.projectId, route: 'analyze/classify-blogs', model: 'claude-sonnet-4-6', inputTokens: msg.usage.input_tokens, outputTokens: msg.usage.output_tokens }).catch(() => {})

  const text = msg.content[0]?.type === 'text' ? msg.content[0].text : ''
  const parsed = parseJsonObject(text)
  if (!parsed || !Array.isArray(parsed.classifications)) return []

  return parsed.classifications
    .filter((item): item is ClassifiedPost => {
      if (!isRecord(item)) return false
      return (
        typeof item.url === 'string' &&
        isGenreKey(item.genre) &&
        isEffectKey(item.effect)
      )
    })
    .map((item) => ({
      url:   item.url,
      title: (typeof item.title === 'string' && item.title.trim())
        ? item.title.trim()
        : (posts.find((p) => p.url === item.url)?.title ?? ''),
      genre:  item.genre,
      effect: item.effect,
      source: 'existing' as const,
    }))
}
