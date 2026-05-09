// 取材中の進捗ラベル文言を、通常画面と外部リンク画面で共通化する。
//
// 通常側 InterviewClient と ext 側 ExternalInterviewPage はそれぞれ別実装で
// `getProgressLabel` を持っていたが、文言が片方だけ更新されて差異が出ていた。
// 共通モジュールに寄せて、進捗バーの文言が常に揃うようにする。

export const INTERVIEW_MAX_TURNS = 15
export const INTERVIEW_STANDARD_TURNS = 7

export function getInterviewProgressLabel(turns: number): string {
  if (turns < 3) return '話を聞かせてもらっています'
  if (turns < 5) return 'いろいろと教えてもらっています'
  if (turns < INTERVIEW_STANDARD_TURNS) {
    const remaining = INTERVIEW_STANDARD_TURNS - turns
    return `いい話が集まってきました（あと${remaining}問でひと区切り）`
  }
  if (turns < INTERVIEW_MAX_TURNS) return 'もう少し掘り下げています'
  return 'まとめに入ります'
}
