'use client'

import Image from 'next/image'
import groupPhoto from '@/assets/loading/all_insight_cast600.jpg'

export function FullPageLoading() {
  return (
    <div role="status" aria-label="ページを読み込んでいます" className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 bg-[var(--bg)] px-6">
      <div className="w-full max-w-[320px] overflow-hidden rounded-2xl shadow-md">
        <Image
          src={groupPhoto}
          alt="Insight Cast の全メンバー集合写真"
          width={600}
          height={500}
          className="w-full h-auto object-cover"
          priority
        />
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <p className="font-serif text-2xl font-bold tracking-wide text-[var(--text)]">
          Insight <span className="text-[var(--accent)]">Cast</span>
        </p>
        <p className="text-sm text-[var(--text3)]">会話から、記事へ。あなたの当たり前を言葉に。</p>
      </div>

      <div className="w-36 h-[3px] overflow-hidden rounded-full bg-[var(--border)]">
        <div className="h-full rounded-full animate-[page-load_1s_ease-in-out_infinite] bg-[var(--accent)]" />
      </div>
    </div>
  )
}
