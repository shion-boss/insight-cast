import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const GENRES = [
  { key: 'case_study',   label: '実績・事例' },
  { key: 'howto',        label: 'ノウハウ・解説' },
  { key: 'story',        label: '人物・ストーリー' },
  { key: 'service',      label: 'サービス・商品' },
  { key: 'news',         label: 'お知らせ・イベント' },
  { key: 'industry',     label: '業界・トレンド' },
] as const

export const EFFECTS = [
  { key: 'discovery',  label: '集客・発見',    desc: 'SEOや紹介で新しい人に届く' },
  { key: 'trust',      label: '信頼・実績',    desc: '専門性や実績を証明する' },
  { key: 'empathy',    label: '共感・ファン化', desc: '人柄や思想を伝える' },
  { key: 'conversion', label: '問い合わせ促進', desc: '読んで行動につながる' },
] as const

export type GenreKey  = typeof GENRES[number]['key']
export type EffectKey = typeof EFFECTS[number]['key']

export type ClassifiedPost = {
  url:    string
  title:  string
  genre:  GenreKey
  effect: EffectKey
  source: 'existing' | 'insight_cast'
}

function isGenreKey(v: unknown): v is GenreKey {
  return typeof v === 'string' && GENRES.some((g) => g.key === v)
}

function isEffectKey(v: unknown): v is EffectKey {
  return typeof v === 'string' && EFFECTS.some((e) => e.key === v)
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function parseJsonObject(text: string) {
  const m = text.match(/\{[\s\S]*\}/)
  if (!m) return null
  try { return JSON.parse(m[0]) as Record<string, unknown> } catch { return null }
}

export async function classifyBlogPosts(
  posts: Array<{ url: string; title: string; summary: string }>,
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
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

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
      url:    item.url,
      // Prefer title from AI response; fall back to original posts list by URL
      title:  (typeof item.title === 'string' && item.title.trim())
        ? item.title.trim()
        : (posts.find((p) => p.url === item.url)?.title ?? ''),
      genre:  item.genre,
      effect: item.effect,
      source: 'existing' as const,
    }))
}

export function getStoredClassifications(
  rawData: Record<string, unknown> | null | undefined,
): ClassifiedPost[] | null {
  if (!rawData || !Array.isArray(rawData.blog_classifications)) return null

  const result: ClassifiedPost[] = []
  for (const item of rawData.blog_classifications) {
    if (!isRecord(item)) continue
    if (
      typeof item.url === 'string' &&
      typeof item.title === 'string' &&
      isGenreKey(item.genre) &&
      isEffectKey(item.effect) &&
      (item.source === 'existing' || item.source === 'insight_cast')
    ) {
      result.push(item as ClassifiedPost)
    }
  }
  return result
}

export function buildContentMatrix(posts: ClassifiedPost[]) {
  const matrix: Record<GenreKey, Record<EffectKey, ClassifiedPost[]>> = {} as never

  for (const g of GENRES) {
    matrix[g.key] = {} as Record<EffectKey, ClassifiedPost[]>
    for (const e of EFFECTS) {
      matrix[g.key][e.key] = []
    }
  }

  for (const post of posts) {
    matrix[post.genre]?.[post.effect]?.push(post)
  }

  return matrix
}
