import type { StaticImageData } from 'next/image'

import mintIcon48 from '@/assets/characters/mint/icons/icon-48.png'
import mintIcon96 from '@/assets/characters/mint/icons/icon-96.png'
import mintPortrait from '@/assets/characters/mint/portraits/portrait-half.png'
import clausIcon48 from '@/assets/characters/claus/icons/icon-48.png'
import clausIcon96 from '@/assets/characters/claus/icons/icon-96.png'
import clausPortrait from '@/assets/characters/claus/portraits/portrait-half.png'
import rainIcon48 from '@/assets/characters/rain/icons/icon-48.png'
import rainIcon96 from '@/assets/characters/rain/icons/icon-96.png'
import rainPortrait from '@/assets/characters/rain/portraits/portrait-half.png'
import halIcon48 from '@/assets/characters/hal/icons/icon-48.png'
import halIcon96 from '@/assets/characters/hal/icons/icon-96.png'
import halPortrait from '@/assets/characters/hal/portraits/portrait-half.png'
import mogroIcon48 from '@/assets/characters/mogro/icons/icon-48.png'
import mogroIcon96 from '@/assets/characters/mogro/icons/icon-96.png'
import mogroPortrait from '@/assets/characters/mogro/portraits/portrait-half.png'
import coccoIcon48 from '@/assets/characters/cocco/icons/icon-48.png'
import coccoIcon96 from '@/assets/characters/cocco/icons/icon-96.png'
import coccoPortrait from '@/assets/characters/cocco/portraits/portrait-half.png'

export type Character = {
  id: string
  name: string
  species: string
  emoji: string
  label: string
  description: string
  specialty: string
  available: boolean
  icon48: StaticImageData
  icon96: StaticImageData
  portrait: StaticImageData
}

export const CHARACTERS: Character[] = [
  {
    id: 'mint',
    name: 'ミント',
    species: 'ネコ',
    emoji: '🐱',
    label: 'Customer Perspective',
    description: 'お客様の気持ちに寄り添いながら、事業者さんが「当たり前」と思っていることの中から、まだ伝わっていない魅力を引き出します。',
    specialty: 'お客様目線の安心感・気づかい・使う人が感じる価値',
    available: true,
    icon48: mintIcon48,
    icon96: mintIcon96,
    portrait: mintPortrait,
  },
  {
    id: 'claus',
    name: 'クラウス',
    species: 'フクロウ',
    emoji: '🦉',
    label: 'Industry Insight',
    description: '業種への深い知識をもとに、普段は説明しない技術的なこだわりや、他との判断基準の違いを掘り起こします。',
    specialty: '専門知識・技術的な違い・他社との差を言葉にする',
    available: true,
    icon48: clausIcon48,
    icon96: clausIcon96,
    portrait: clausPortrait,
  },
  {
    id: 'rain',
    name: 'レイン',
    species: 'キツネ',
    emoji: '🦊',
    label: 'Marketing Strategy',
    description: '「なぜ選ばれているのか」をお客様目線で一緒に考えながら、まだうまく言葉にできていない選ばれる理由を引き出します。',
    specialty: '選ばれる理由・伝え方・競合との違いを言葉にする',
    available: true,
    icon48: rainIcon48,
    icon96: rainIcon96,
    portrait: rainPortrait,
  },
  {
    id: 'hal',
    name: 'ハル',
    species: 'コーギー',
    emoji: '🐕',
    label: 'Story & Picture',
    description: '人柄・雰囲気・魅力を引き出します',
    specialty: '人柄・ストーリー・雰囲気',
    available: false,
    icon48: halIcon48,
    icon96: halIcon96,
    portrait: halPortrait,
  },
  {
    id: 'mogro',
    name: 'モグロ',
    species: 'モグラ',
    emoji: '🐾',
    label: 'Yes / No Deep Dive',
    description: 'はい / いいえで答えられる質問から、まだ言葉になっていない価値を掘り起こします',
    specialty: '二択での深掘り・価値の言語化',
    available: false,
    icon48: mogroIcon48,
    icon96: mogroIcon96,
    portrait: mogroPortrait,
  },
  {
    id: 'cocco',
    name: 'コッコ',
    species: 'ニワトリ',
    emoji: '🐔',
    label: 'Promotion & Campaign',
    description: '告知・キャンペーンの素材を引き出します',
    specialty: 'プロモーション・キャンペーン',
    available: false,
    icon48: coccoIcon48,
    icon96: coccoIcon96,
    portrait: coccoPortrait,
  },
]

export function getCharacter(id: string): Character | undefined {
  return CHARACTERS.find((c) => c.id === id)
}

export function getCastName(id: string): string {
  return getCharacter(id)?.name ?? id
}

/**
 * 取材リンク（外部取材）導入画面で使う、キャラ別の自己紹介文。
 * 「はじめまして」の温度感を保ちつつ、自分が何の専門かをひと言だけ添える。
 * 全文 60 文字以内。
 */
const CHARACTER_INTROS: Record<string, string> = {
  mint: 'こんにちは！ミントといいます。気軽にお話しください。',
  claus: 'クラウスです。業種の観点からお話を聞かせていただきます。',
  rain: 'レインといいます。マーケティングの視点でお話を聞きます。',
  hal: 'ハルです。写真を起点に、お仕事の雰囲気をお聞きします。',
  mogro: 'モグロです。「はい / いいえ」で答えていける質問をしていきます。',
  cocco: 'コッコです。お知らせしたいこと・宣伝したいことを聞かせてください。',
}

export function getCharacterIntro(castId: string): string {
  return CHARACTER_INTROS[castId] ?? 'インタビュアーが話を聞かせていただきます。'
}

/**
 * 埋め込みHTML（ブログ下書き等の永続記録）で使う、安定した公開アイコンURL。
 *
 * 注意: Next.js の StaticImageData (`char.icon48.src`) は
 * `/_next/static/media/icon-48.<hash>.png` のフィンガープリント付きURLになる。
 * これをDBに保存すると、リビルドでハッシュが変わった時に古いURLが 404 になる。
 *
 * このヘルパーは `/public/characters/<id>-48.png` という**ハッシュ無しの安定URL**を返す。
 * 公開画像は `/public/characters/{mint,claus,rain,hal,mogro,cocco}-48.png` に置いてある。
 *
 * 用途:
 * - admin ブログ下書きの埋め込みHTMLに含めるアイコンURL
 * - 取材記事の export 時に使う avatar URL
 *
 * UI 上の表示（CharacterAvatar など）は、引き続き `char.icon48` の StaticImageData を使う
 * （Next.js Image での最適化が効くため）。
 */
export function getPublicCastIconUrl(castId: string, baseUrl?: string): string | null {
  const c = getCharacter(castId)
  if (!c) return null
  const path = `/characters/${castId}-48.png`
  if (!baseUrl) return path
  return `${baseUrl.replace(/\/$/, '')}${path}`
}
