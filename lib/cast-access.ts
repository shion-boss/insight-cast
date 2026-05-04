/**
 * AIキャストの利用可否を判定するモジュール。
 *
 * モデル:
 * - 標準フリーキャスト（mint / claus / rain）: 全ユーザーが常に利用可能
 * - 期間限定で全プラン込みのキャスト（hal / mogro / cocco）:
 *   - LIMITED_TIME_END より前に登録したユーザーは恒久的に利用可能（grandfathered）
 *   - LIMITED_TIME_END 以降に登録したユーザーは Phase 3 以降の買い切り商品を購入することで利用可能
 *   - LIMITED_TIME_END 自体は環境変数 NEXT_PUBLIC_LIMITED_CAST_END で上書き可能
 *
 * 設計意図:
 * - Phase 2 ドッグフーディング期間中は全員が 6キャスト使える
 * - Phase 3 で買い切り課金を導入する時点で、その時点までの登録ユーザーは「grandfathered」として無料継続
 * - 以降の新規ユーザーには買い切り購入を求める
 *
 * 課金制御は別途 Phase 3 で実装。今は「期間内なので全員 OK」「期間外なら登録日で判定」の2段階のみ。
 */

import { CHARACTERS, type Character } from '@/lib/characters'

/** 期間限定で全プラン込みになるキャスト（後日 Phase 3 で買い切り化される候補） */
export const LIMITED_TIME_CAST_IDS = ['hal', 'mogro', 'cocco'] as const

/** 期間限定モードの終了日（この日以前に登録したユーザーは grandfathered になる）。
 *  ISO 8601 string。デフォルトは未設定（=現在は期間限定中、全員アクセス可）。
 *  Phase 3 で確定したら NEXT_PUBLIC_LIMITED_CAST_END に値を入れる。
 */
function getLimitedTimeEndDate(): Date | null {
  const raw = process.env.NEXT_PUBLIC_LIMITED_CAST_END
  if (!raw) return null
  const d = new Date(raw)
  return isNaN(d.getTime()) ? null : d
}

/** 期間限定モードがまだ有効か（= 現在日時が end 日より前、または end が未設定） */
export function isLimitedTimePeriodActive(now: Date = new Date()): boolean {
  const end = getLimitedTimeEndDate()
  if (!end) return true
  return now < end
}

/**
 * 指定ユーザーが指定キャストを使えるかを判定する。
 * @param castId キャストの id
 * @param userCreatedAt ユーザーの auth.users.created_at（ISO string or Date）
 * @returns 使えるなら true
 */
export function canUseCast(
  castId: string,
  userCreatedAt: string | Date | null | undefined,
  now: Date = new Date(),
): boolean {
  // 標準フリーキャストは常に OK
  const c = CHARACTERS.find((x) => x.id === castId)
  if (!c) return false
  if (c.available) return true

  // 期間限定キャスト
  if (LIMITED_TIME_CAST_IDS.includes(castId as (typeof LIMITED_TIME_CAST_IDS)[number])) {
    if (isLimitedTimePeriodActive(now)) return true
    // 期間が終わっていたら、登録日で判定
    if (!userCreatedAt) return false
    const created = userCreatedAt instanceof Date ? userCreatedAt : new Date(userCreatedAt)
    if (isNaN(created.getTime())) return false
    const end = getLimitedTimeEndDate()
    return end ? created < end : true
  }

  // それ以外（将来追加される未公開キャスト）はデフォルト不可
  return false
}

/**
 * ユーザーが選択可能なキャラ一覧を返す。
 * 取材選択画面で `CHARACTERS.filter(c => c.available)` の代わりに使う。
 */
export function getAccessibleCharacters(
  userCreatedAt: string | Date | null | undefined,
  now: Date = new Date(),
): Character[] {
  return CHARACTERS.filter((c) => canUseCast(c.id, userCreatedAt, now))
}

/**
 * ユーザーがアクセスできない（買い切りで開放されるべき）キャラ一覧を返す。
 * 料金ページの Add-on Cast セクションで使う。
 */
export function getLockedCharacters(
  userCreatedAt: string | Date | null | undefined,
  now: Date = new Date(),
): Character[] {
  return CHARACTERS.filter((c) => !canUseCast(c.id, userCreatedAt, now))
}
