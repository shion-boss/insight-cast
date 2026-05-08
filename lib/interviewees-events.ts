// 取材先の追加・編集・削除を兄弟クライアントコンポーネントに通知するためのイベント名。
// プロジェクトハブで IntervieweeSection と ExternalInterviewLinkSection が同時に表示されているとき、
// 片方の変更をもう片方の取材先プルダウンに反映させる用途。

export const INTERVIEWEES_CHANGED_EVENT = 'insight-cast:interviewees-changed'

export type IntervieweesChangedDetail = {
  projectId: string
}

export function dispatchIntervieweesChanged(projectId: string) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<IntervieweesChangedDetail>(INTERVIEWEES_CHANGED_EVENT, {
      detail: { projectId },
    }),
  )
}
