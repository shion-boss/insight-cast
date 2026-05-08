import type { Metadata } from 'next'
import type { ReactNode } from 'react'
// 取材ログ・タイピング表示などのアニメーション CSS を共有
import '../../tool.css'

// 取材リンク経由の外部取材専用画面。
// - PublicHeader / PublicFooter を持たない（インタビューに専念させる）
// - インデックス禁止（リンクを知っている人だけがアクセスできる前提）
export const metadata: Metadata = {
  title: '取材',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

export default function ExternalInterviewLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-[var(--bg)] text-[var(--text)]">
      {children}
    </div>
  )
}
