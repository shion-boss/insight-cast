'use client'

import { useState } from 'react'
import Image from 'next/image'

import screenshotDashboard from '@/assets/screenshots/dashboard.png'
import screenshotInterview from '@/assets/screenshots/interview.png'
import screenshotMemo from '@/assets/screenshots/memo.png'
import screenshotArticle from '@/assets/screenshots/article.png'

const TABS = ['ダッシュボード', 'インタビュー', '取材メモ', '記事素材'] as const
type Tab = (typeof TABS)[number]

const SCREENSHOTS: Record<Tab, { src: typeof screenshotDashboard; alt: string; url: string }> = {
  'ダッシュボード': { src: screenshotDashboard, alt: 'ダッシュボード画面', url: 'app.insightcast.jp/dashboard' },
  'インタビュー':   { src: screenshotInterview, alt: 'インタビュー画面', url: 'app.insightcast.jp/projects/1/interview' },
  '取材メモ':       { src: screenshotMemo, alt: '取材メモ画面', url: 'app.insightcast.jp/projects/1/summary' },
  '記事素材':       { src: screenshotArticle, alt: '記事素材画面', url: 'app.insightcast.jp/projects/1/articles/1' },
}

export default function AppPreviewSection() {
  const [activeTab, setActiveTab] = useState<Tab>('ダッシュボード')
  const active = SCREENSHOTS[activeTab]

  return (
    <section className="px-6 py-14 sm:py-18">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold tracking-[0.18em] text-[var(--text3)] uppercase">App Preview</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">実際の操作画面</h2>
        <p className="mt-3 max-w-lg text-base leading-8 text-[var(--text2)]">
          ブラウザ上で完結します。インストール不要で、今すぐ始められます。
        </p>

        <div className="mt-8 flex w-fit gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg2)]/80 p-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-[0.6rem] px-4 py-2 text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 ${
                activeTab === tab
                  ? 'bg-white text-[var(--accent)] shadow-sm'
                  : 'text-[var(--text3)] hover:text-[var(--text)]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--border)] shadow-[0_24px_64px_rgba(0,0,0,0.09)]">
          {/* Browser chrome */}
          <div className="flex h-9 items-center gap-1.5 border-b border-[var(--border)] bg-[var(--bg2)] px-4">
            <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            <div className="mx-2 flex h-5 flex-1 items-center rounded px-2.5 text-xs text-[var(--text3)] bg-white border border-[var(--border)]">
              {active.url}
            </div>
          </div>
          <Image
            src={active.src}
            alt={active.alt}
            className="w-full h-auto block"
            priority
          />
        </div>
      </div>
    </section>
  )
}
