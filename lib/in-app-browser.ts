// SNS アプリ内蔵ブラウザ（in-app browser / WebView）の検出。
//
// 背景:
//   Google は 2021 年以降、OAuth リクエストの User-Agent を見て embedded
//   webview を弾くポリシーを取っている (`disallowed_useragent` / 403)。
//   LINE / Instagram / Facebook / X / TikTok などから新規登録ページへ
//   遷移したユーザーは、Google ログインを押すと Google のエラー画面で
//   詰まる。
//
//   完全に防ぐ方法はないが、UA で代表的な in-app browser を検出して、
//   事前に「外部ブラウザで開いてください」と案内できれば 8 割は救える。
//
// 注意:
//   - false negative は許容する（新しい SNS / マイナーアプリは漏れる）
//   - false positive は避ける（通常 Safari/Chrome を弾くと致命的）
//   - クライアント側専用。SSR では呼ばないこと（`navigator` 参照のため）

const IN_APP_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bLine\/[\d.]+/i, label: 'LINE' },
  { pattern: /\bFBAN|FBAV|FB_IAB|FBIOS|FBSS\b/i, label: 'Facebook' },
  { pattern: /\bInstagram\b/i, label: 'Instagram' },
  { pattern: /\bMessenger\b/i, label: 'Messenger' },
  { pattern: /\bTwitter\b/i, label: 'X (Twitter)' },
  { pattern: /\bTikTok\b|\bmusical_ly\b|\bByteFullSdk\b|\bByteLocale\b/i, label: 'TikTok' },
  { pattern: /\bKAKAOTALK\b/i, label: 'KakaoTalk' },
  { pattern: /\bNAVER\(inapp\b/i, label: 'NAVER' },
  { pattern: /\bSnapchat\b/i, label: 'Snapchat' },
  { pattern: /\bPinterest\b/i, label: 'Pinterest' },
  { pattern: /\bMicroMessenger\b/i, label: 'WeChat' },
  { pattern: /\bDouBan\b/i, label: 'Douban' },
  // 一般的な WebView マーカー（Android の WebView ベースアプリの多くが含む）
  { pattern: /\bwv\)\b/i, label: 'Android WebView' },
]

export type InAppBrowserDetection = {
  isInApp: boolean
  /** 検出した SNS / アプリ名。検出できない場合は null。 */
  appLabel: string | null
}

/**
 * 現在のブラウザが SNS 等の in-app browser かを判定する。
 * クライアント側でのみ呼ぶこと。SSR では常に `{ isInApp: false, appLabel: null }`。
 */
export function detectInAppBrowser(): InAppBrowserDetection {
  if (typeof navigator === 'undefined') return { isInApp: false, appLabel: null }
  const ua = navigator.userAgent
  for (const { pattern, label } of IN_APP_PATTERNS) {
    if (pattern.test(ua)) return { isInApp: true, appLabel: label }
  }
  return { isInApp: false, appLabel: null }
}
