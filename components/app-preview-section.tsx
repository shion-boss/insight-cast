'use client'

import { useState } from 'react'

const TABS = ['ダッシュボード', '取材チャット', '記事素材'] as const
type Tab = (typeof TABS)[number]

const URLS: Record<Tab, string> = {
  'ダッシュボード': 'app.insightcast.jp/dashboard',
  '取材チャット': 'app.insightcast.jp/projects/1/interview',
  '記事素材': 'app.insightcast.jp/projects/1/article',
}

function DashboardTab() {
  return (
    <div className="flex h-[380px] w-full">
      <div className="flex w-[168px] flex-shrink-0 flex-col gap-0.5 border-r border-[var(--border)] bg-[rgba(255,253,249,0.98)] p-3">
        <div className="mb-2 border-b border-[var(--border)] pb-3 pl-2 font-serif text-[11px] font-bold text-[var(--text)]">
          Insight <span className="text-amber-700">Cast</span>
        </div>
        {[
          { label: '⊡ ダッシュボード', active: true },
          { label: '◫ 取材先一覧', active: false },
          { label: '◎ インタビュー', active: false },
          { label: '≡ 記事一覧', active: false },
        ].map((item) => (
          <div
            key={item.label}
            className={`rounded-md px-2 py-1.5 text-[10px] font-medium ${item.active ? 'bg-amber-50 font-semibold text-amber-700' : 'text-[var(--text3)]'}`}
          >
            {item.label}
          </div>
        ))}
      </div>
      <div className="flex-1 overflow-hidden bg-[#faf6f0] p-5">
        <div className="mb-4 font-serif text-[13px] font-bold text-[var(--text)]">おかえりなさい 👋</div>
        <div className="mb-4 grid grid-cols-2 gap-2">
          {[
            ['取材先', '4件'],
            ['完了した取材', '12件'],
            ['生成済み記事', '8件'],
            ['今月の残り', '2回'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-[var(--border)] bg-white p-2.5">
              <div className="text-[10px] text-[var(--text3)]">{label}</div>
              <div className="mt-0.5 font-serif text-[18px] font-bold text-[var(--text)]">{value}</div>
            </div>
          ))}
        </div>
        <div className="mb-2 text-[11px] font-semibold text-[var(--text2)]">最近の取材先</div>
        {[
          { name: '田中建設株式会社', sub: '最終取材 2日前', badge: '取材済み', color: 'bg-teal-50 text-teal-700' },
          { name: 'やまと整骨院', sub: '調査依頼 1週間前', badge: '分析中', color: 'bg-amber-50 text-amber-700' },
        ].map((item) => (
          <div key={item.name} className="mb-2 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-3 py-2">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-amber-50 text-sm">🏢</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[11px] font-semibold text-[var(--text)]">{item.name}</div>
              <div className="text-[10px] text-[var(--text3)]">{item.sub}</div>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.color}`}>{item.badge}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function InterviewTab() {
  return (
    <div className="flex h-[380px] w-full flex-col">
      <div className="flex h-11 items-center gap-2 border-b border-[var(--border)] bg-white px-4">
        <div className="h-6 w-6 overflow-hidden rounded-full border border-[var(--border)]">
          <div className="h-full w-full bg-amber-100 text-center text-[10px] leading-6">🐱</div>
        </div>
        <div>
          <div className="text-[11px] font-semibold text-[var(--text)]">ミント</div>
          <div className="text-[9px] text-teal-600">Story Listener · 取材中</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Q 4/10</span>
          <span className="rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">終了</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 overflow-hidden bg-[#faf6f0] p-4">
        <div className="max-w-[78%] rounded-xl rounded-tl-sm border border-[var(--border)] bg-white p-2.5 text-[11px] leading-relaxed text-[var(--text2)]">
          お客様に一番喜んでもらえた仕事を、一つ思い出してもらえますか？どんな小さなことでも大丈夫です。
        </div>
        <div className="ml-auto max-w-[78%] rounded-xl rounded-tr-sm bg-amber-700 p-2.5 text-[11px] leading-relaxed text-white">
          去年、外壁塗装した老夫婦に「ここに住み続けられる気がした」と言ってもらえたのがうれしかったです。
        </div>
        <div className="max-w-[78%] rounded-xl rounded-tl-sm border border-[var(--border)] bg-white p-2.5 text-[11px] leading-relaxed text-[var(--text2)]">
          素敵なエピソードですね。その工事でこだわったことは何かありましたか？
        </div>
      </div>
      <div className="flex h-11 items-center gap-2 border-t border-[var(--border)] bg-white px-3">
        <div className="flex-1 rounded-md border border-[var(--border)] bg-[var(--bg2)] px-2 py-1 text-[10px] text-[var(--text3)]">返答を入力…</div>
        <button className="rounded-md bg-amber-700 px-3 py-1 text-[10px] font-semibold text-white">送信</button>
      </div>
    </div>
  )
}

function ArticleTab() {
  return (
    <div className="flex h-[380px] w-full">
      <div className="flex w-[168px] flex-shrink-0 flex-col gap-0.5 border-r border-[var(--border)] bg-[rgba(255,253,249,0.98)] p-3">
        <div className="mb-2 border-b border-[var(--border)] pb-3 pl-2 font-serif text-[11px] font-bold text-[var(--text)]">
          Insight <span className="text-amber-700">Cast</span>
        </div>
        {[
          { label: '◫ 取材メモ', active: false },
          { label: '≡ 記事素材', active: true },
          { label: '← 一覧へ戻る', active: false },
        ].map((item) => (
          <div
            key={item.label}
            className={`rounded-md px-2 py-1.5 text-[10px] font-medium ${item.active ? 'bg-amber-50 font-semibold text-amber-700' : 'text-[var(--text3)]'}`}
          >
            {item.label}
          </div>
        ))}
      </div>
      <div className="flex-1 overflow-hidden bg-[#faf6f0] p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700">ブログ記事</span>
          <span className="rounded-full bg-[var(--bg2)] px-2 py-0.5 text-[10px] text-[var(--text3)]">2026.04.10 生成</span>
          <button className="ml-auto rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">📋 コピー</button>
        </div>
        <div className="mb-2 font-serif text-[13px] font-bold leading-snug text-[var(--text)]">
          「ここに住み続けられる気がした」── 外壁塗装が届けた安心感の話
        </div>
        <div className="text-[11px] leading-relaxed text-[var(--text2)]">
          外壁塗装というと、見た目を新しくする工事というイメージが強いかもしれません。でも田中建設が大切にしているのは、塗り替えた後に「また長く住める」という気持ちを届けることです。
        </div>
        <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[10px] font-semibold text-amber-700">
          ✦ 取材から生成された記事素材です
        </div>
      </div>
    </div>
  )
}

export default function AppPreviewSection() {
  const [activeTab, setActiveTab] = useState<Tab>('ダッシュボード')

  return (
    <section className="px-6 py-14 sm:py-18">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold tracking-[0.18em] text-[var(--text3)] uppercase">App Preview</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">実際の操作画面</h2>
        <p className="mt-3 max-w-lg text-base leading-8 text-[var(--text2)]">
          ブラウザ上で完結します。インストール不要で、今すぐ始められます。
        </p>

        <div className="mt-8 flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg2)]/80 p-1" style={{ width: 'fit-content' }}>
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-[0.6rem] px-4 py-2 text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 ${
                activeTab === tab
                  ? 'bg-white text-amber-700 shadow-sm'
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
            <div className="mx-2 flex h-5 flex-1 items-center rounded px-2.5 text-[10px] text-[var(--text3)] bg-white border border-[var(--border)]">
              {URLS[activeTab]}
            </div>
          </div>
          {/* Content */}
          {activeTab === 'ダッシュボード' && <DashboardTab />}
          {activeTab === '取材チャット' && <InterviewTab />}
          {activeTab === '記事素材' && <ArticleTab />}
        </div>
      </div>
    </section>
  )
}
