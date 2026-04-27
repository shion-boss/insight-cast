'use client'

import { type ReactNode, useEffect, useMemo, useState } from 'react'

import { CharacterAvatar } from '@/components/ui'
import { getCharacter } from '@/lib/characters'

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function AiBadge({ label }: { label: ReactNode }) {
  return (
    <span className="ic-loading-badge">
      <span className="ic-loading-badge-dot" aria-hidden="true" />
      {label}
    </span>
  )
}

export function AnalysisLoadingScene({
  projectName,
}: {
  projectName: string
}) {
  const [tick, setTick] = useState(0)
  const steps = useMemo(() => ([
    { label: 'URLを取得中', subLabel: 'ページ構造を読み込んでいます' },
    { label: 'コンテンツを解析中', subLabel: '情報量と訴求の強さを見ています' },
    { label: '競合サイトと比較中', subLabel: '競合候補との違いを整理しています' },
    { label: '取材テーマを提案中', subLabel: 'インタビューの切り口を整えています' },
  ]), [])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTick((current) => (current + 1) % steps.length)
    }, 1400)

    return () => window.clearInterval(intervalId)
  }, [steps.length])

  return (
    <div className="ic-loading-card w-full max-w-[520px]">
      <div className="ic-loading-card-header">
        <AiBadge label="調査中" />
        <div className="min-w-0 flex-1">
          <p className="font-serif text-[15px] font-bold text-[var(--text)]">ホームページを分析しています</p>
          <p className="mt-0.5 truncate text-xs text-[var(--text3)]">{projectName}</p>
        </div>
      </div>
      <div className="ic-loading-card-body">
        <div className="ic-scan-shell">
          <div className="ic-scan-beam" />
          <div className="ic-scan-highlight" />
          <div className="space-y-2 p-4 opacity-60">
            <div className="ic-mock-bar ic-mock-bar-title" />
            <div className="ic-mock-bar w-full" />
            <div className="ic-mock-bar w-3/4" />
            <div className="flex gap-2 pt-1">
              <div className="ic-mock-bar w-[30%]" />
              <div className="ic-mock-bar w-[30%]" />
            </div>
            <div className="ic-mock-bar mt-2 w-full" />
            <div className="ic-mock-bar w-1/2" />
          </div>
        </div>

        <div className="mt-5 space-y-2.5">
          {steps.map((step, index) => {
            const state = index < tick ? 'done' : index === tick ? 'active' : 'idle'
            return (
              <div key={step.label} className={cx('ic-progress-step', `ic-progress-step-${state}`)}>
                <div aria-hidden="true" className={cx('ic-progress-icon', `ic-progress-icon-${state}`)}>
                  {state === 'done'
                    ? '✓'
                    : state === 'active'
                      ? <span className="ic-progress-spinner">◌</span>
                      : index + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold">{step.label}</p>
                  {state === 'active' && <p className="mt-0.5 text-[11px] opacity-80">{step.subLabel}</p>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function InterviewLoadingScene({
  characterId = 'mint',
  title = 'AIキャストを呼んでいます',
  subtitle = '席につけたら、そのまま聞き取りを始めます。',
}: {
  characterId?: string
  title?: string
  subtitle?: string
}) {
  const character = getCharacter(characterId)
  const [tick, setTick] = useState(0)
  const castRole = useMemo(() => {
    if (characterId === 'claus') return 'Industry Editor'
    if (characterId === 'rain') return 'Message Strategist'
    return 'Story Listener'
  }, [characterId])

  const steps = useMemo(() => {
    if (characterId === 'claus') {
      return [
        'HP調査レポートを読み込んでいます',
        '業種の専門知識を確認しています',
        '聞きたい切り口を整えています',
        '取材の準備が整いました',
      ]
    }
    if (characterId === 'rain') {
      return [
        'HP調査レポートを読み込んでいます',
        '競合サイトとの違いを整理しています',
        '引き出したい切り口を整えています',
        '取材の準備が整いました',
      ]
    }

    return [
      'HP調査レポートを読み込んでいます',
      'お客様目線の話題を整理しています',
      'お話を聞く準備をしています',
      '取材の準備が整いました',
    ]
  }, [characterId])

  useEffect(() => {
    setTick(0)
  }, [characterId])

  useEffect(() => {
    const isComplete = tick >= steps.length
    const timeoutId = window.setTimeout(() => {
      setTick((current) => {
        if (current >= steps.length) return 0
        return current + 1
      })
    }, isComplete ? 900 : tick === 0 ? 500 : 950)

    return () => window.clearTimeout(timeoutId)
  }, [steps.length, tick])

  const progress = Math.round((Math.min(tick, steps.length) / steps.length) * 100)
  const complete = tick >= steps.length

  return (
    <div className="ic-loading-card ic-prep-card w-full max-w-[480px]">
      <div className="ic-prep-avatar-stage">
        <span className="ic-prep-ring ic-prep-ring-1" aria-hidden="true" />
        <span className="ic-prep-ring ic-prep-ring-2" aria-hidden="true" />
        <span className="ic-prep-ring ic-prep-ring-3" aria-hidden="true" />
        <CharacterAvatar
          src={character?.icon96 ?? character?.icon48}
          alt={`${character?.name ?? 'キャスト'}のアイコン`}
          emoji={character?.emoji}
          size={128}
          className="ic-prep-avatar border-[3px] border-[var(--accent)]"
        />
      </div>

      <div className="text-center">
        <p className="font-serif text-[26px] font-bold text-[var(--text)]">{character?.name ?? 'AIキャスト'}</p>
        <div className="mt-1 inline-flex">
          <AiBadge label={<>{castRole}<span aria-hidden="true"> · </span>準備中</>} />
        </div>
      </div>

      <div className="mt-7">
        <p className="text-center text-sm font-semibold text-[var(--text)]">{title}</p>
        <p className="mt-1 text-center text-xs text-[var(--text2)]">{subtitle}</p>
      </div>

      <div className="mt-7">
        <div className="mb-2 flex items-center justify-between text-[11px] text-[var(--text3)]">
          <span>取材準備</span>
          <span className="font-semibold text-[var(--accent)]">{progress}%</span>
        </div>
        <div className="h-[5px] overflow-hidden rounded-full bg-[var(--bg2)]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent),#e8943a)] transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {steps.map((step, index) => {
          const state = index < tick ? 'done' : index === tick ? 'active' : 'idle'
          return (
            <div key={step} className={cx('ic-prep-step', `ic-prep-step-${state}`)}>
              <div aria-hidden="true" className={cx('ic-prep-step-icon', `ic-prep-step-icon-${state}`)}>
                {state === 'done'
                  ? '✓'
                  : state === 'active'
                    ? <span className="ic-progress-spinner">◌</span>
                    : index + 1}
              </div>
              <span>{step}</span>
            </div>
          )
        })}
      </div>

      {complete && (
        <div className="ic-prep-complete">
          <CharacterAvatar
            src={character?.icon96 ?? character?.icon48}
            alt={`${character?.name ?? 'キャスト'}のアイコン`}
            emoji={character?.emoji}
            size={56}
            className="border-2 border-[var(--accent)]"
          />
          <p className="mt-3 font-serif text-lg font-bold text-[var(--text)]">取材を開始しています…</p>
          <p className="mt-2 text-sm text-[var(--text2)]">最初の話しかけを整えています。</p>
        </div>
      )}
    </div>
  )
}

export function WritingLoadingScene({
  title,
  description,
  previewText,
}: {
  title: string
  description: string
  previewText?: string
}) {
  const mint = getCharacter('mint')
  const [progress, setProgress] = useState(8)
  const phases = ['取材メモを整理中', '構成を作成中', '文章を整えています']

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 94) return 94
        return Math.min(current + 6, 94)
      })
    }, 900)

    return () => window.clearInterval(intervalId)
  }, [])

  const phaseIndex = progress < 34 ? 0 : progress < 68 ? 1 : 2

  return (
    <div className="ic-loading-card w-full max-w-[560px]">
      <div className="ic-loading-card-header">
        <CharacterAvatar
          src={mint?.icon48}
          alt="ミントのアイコン"
          emoji={mint?.emoji}
          size={40}
          className="border-2 border-[var(--accent)]"
        />
        <div className="min-w-0">
          <p className="font-serif text-[15px] font-bold text-[var(--text)]">{title}</p>
          <p className="mt-0.5 text-xs text-[var(--text3)]">{description}</p>
        </div>
        <div className="ml-auto">
          <AiBadge label="作成中" />
        </div>
      </div>
      <div className="ic-loading-card-body">
        <div className="mx-auto mb-5 flex h-[72px] w-[72px] items-center justify-center">
          <div className="ic-orbit">
            <div className="ic-orbit-ring ic-orbit-ring-1" />
            <div className="ic-orbit-ring ic-orbit-ring-2" />
            <div className="ic-orbit-ring ic-orbit-ring-3" />
            <div aria-hidden="true" className="ic-orbit-center">✦</div>
          </div>
        </div>

        <div className="mb-5 text-center">
          <p className="text-sm font-semibold text-[var(--text)]">{phases[phaseIndex]}</p>
          <p className="mt-1 text-xs text-[var(--text3)]">取材内容をもとに、読みやすい形へまとめています。</p>
        </div>

        <div className="mb-5 h-[5px] overflow-hidden rounded-full bg-[var(--bg2)]">
          <div className="h-full rounded-full bg-[var(--accent)] transition-all duration-700" style={{ width: `${progress}%` }} />
        </div>

        <div className="ic-writing-doc">
          <div className="ic-writing-line ic-writing-line-heading">
            <div className="ic-writing-shimmer" />
          </div>
          {['100%', '84%', '95%', '62%', '100%', '88%'].map((width, index) => (
            <div key={`${width}-${index}`} className="ic-writing-line" style={{ width }}>
              <div className="ic-writing-shimmer" />
            </div>
          ))}
        </div>

        {previewText && (
          <pre className="mt-4 max-h-[32vh] overflow-y-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-[var(--text2)]">
            {previewText}
          </pre>
        )}
      </div>
    </div>
  )
}
