import { isRecord } from '@/lib/utils'

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

export type ClassificationSummaryEntry<T extends string> = {
  key: T
  label: string
  count: number
}

function isGenreKey(v: unknown): v is GenreKey {
  return typeof v === 'string' && GENRES.some((g) => g.key === v)
}

function isEffectKey(v: unknown): v is EffectKey {
  return typeof v === 'string' && EFFECTS.some((e) => e.key === v)
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
  // 空配列は「未分類」として null 扱い（ボタンを再表示させる）
  return result.length > 0 ? result : null
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

export function buildClassificationSummary(posts: ClassifiedPost[]) {
  const byEffect: ClassificationSummaryEntry<EffectKey>[] = EFFECTS.map((effect) => ({
    key: effect.key,
    label: effect.label,
    count: posts.filter((post) => post.effect === effect.key).length,
  }))

  const byGenre: ClassificationSummaryEntry<GenreKey>[] = GENRES.map((genre) => ({
    key: genre.key,
    label: genre.label,
    count: posts.filter((post) => post.genre === genre.key).length,
  }))

  return {
    total: posts.length,
    byEffect: byEffect.filter((entry) => entry.count > 0).sort((left, right) => right.count - left.count),
    byGenre: byGenre.filter((entry) => entry.count > 0).sort((left, right) => right.count - left.count),
  }
}
