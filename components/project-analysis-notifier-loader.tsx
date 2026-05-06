'use client'

import dynamic from 'next/dynamic'

// ProjectAnalysisNotifier は @supabase/ssr (createBrowserClient) を内部で
// 静的 import しているため、(tool)/layout の chunk graph に Supabase JS
// (chunk 5281, 178 KB raw / 50 KiB gzip) が乗ってしまう。Next.js は
// marketing pages の HTML にも (tool)/layout の chunk への <script async>
// 参照を含める仕様のため、LP でも Supabase JS が download + parse される
// （Lighthouse「使用していない JS」の主因）。
//
// この Client Component で next/dynamic + ssr: false を使い、
// ProjectAnalysisNotifier を遅延 import 化することで Supabase JS を
// 専用の遅延 chunk に分離する。LP HTML には Notifier 用の最小スタブだけが
// 含まれ、Supabase JS は実際に Notifier がマウントされた時にだけロードされる。
//
// next/dynamic で ssr: false を使うには Client Component から呼ぶ必要が
// あるため、この薄いラッパーを介す。
const ProjectAnalysisNotifier = dynamic(
  () => import('@/components/project-analysis-notifier'),
  { ssr: false },
)

export default function ProjectAnalysisNotifierLoader() {
  return <ProjectAnalysisNotifier />
}
