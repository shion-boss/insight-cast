// 取材UI（通常 + 取材リンク経由）で共有する型定義。

export type AttachmentRef = {
  path: string
  contentType: string
  previewUrl: string
}

export type InterviewMessage = {
  role: 'user' | 'interviewer'
  content: string
  attachments?: AttachmentRef[]
  yesno?: boolean
}
