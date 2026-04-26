'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getButtonClass } from '@/components/ui'

export type MonthlyPoint   = { m: string; n: number }
export type HeatmapEntry   = { date: string; count: number }

type Props = {
  monthlyArticles:   MonthlyPoint[]
  heatmapData:       HeatmapEntry[]
  continuityScore:   number
  nextProjectId:     string | null
}

/* ─── Bar chart ───────────────────────────────── */
function BarChart({ data }: { data: MonthlyPoint[] }) {
  const [hov, setHov] = useState<number | null>(null)
  const max = Math.max(...data.map((d) => d.n), 1)
  const W = 340, H = 80, BAR = 28, GAP = 16, PAD = 20

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 30}`} style={{ overflow: 'visible', display: 'block' }}>
      {data.map((d, i) => {
        const x = PAD + i * (BAR + GAP)
        const barH = d.n === 0 ? 3 : Math.max(8, (d.n / max) * (H - 10))
        const y = H - barH
        const isHov = hov === i
        return (
          <g key={i} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} style={{ cursor: 'default' }}>
            <rect x={x} y={y} width={BAR} height={barH} rx={5}
              fill={d.n === 0 ? 'var(--bg2)' : isHov ? 'var(--accent-h,#b05a20)' : 'var(--accent)'}
              style={{ transition: 'fill .15s' }}
            />
            {isHov && d.n > 0 && (
              <text x={x + BAR / 2} y={y - 6} textAnchor="middle"
                style={{ fontSize: 11, fontWeight: 700, fill: 'var(--accent)', fontFamily: 'sans-serif' }}>
                {d.n}本
              </text>
            )}
            {d.n === 0 && (
              <text x={x + BAR / 2} y={H - 8} textAnchor="middle"
                style={{ fontSize: 9, fill: 'var(--text3)', fontFamily: 'sans-serif' }}>
                なし
              </text>
            )}
            <text x={x + BAR / 2} y={H + 18} textAnchor="middle"
              style={{ fontSize: 11, fill: 'var(--text3)', fontFamily: 'sans-serif' }}>
              {d.m}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/* ─── Heatmap ─────────────────────────────────── */
const HM_COLORS = ['var(--bg2)', '#fde8c8', '#f5c07a', '#e0893a', '#c2722a']

function cellColor(count: number) {
  if (count === 0) return HM_COLORS[0]
  if (count === 1) return HM_COLORS[2]
  return HM_COLORS[4]
}

function localDateKey(dt: Date): string {
  const y = dt.getFullYear()
  const m = String(dt.getMonth() + 1).padStart(2, '0')
  const d = String(dt.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function buildHeatmapGrid(data: HeatmapEntry[], weeks = 25) {
  const countMap = new Map(data.map((e) => [e.date, e.count]))
  const today = new Date()
  const start = new Date(today)
  start.setDate(start.getDate() - (weeks * 7 - 1))
  start.setDate(start.getDate() - start.getDay()) // back to Sunday

  const cols: Array<Array<{ label: string; count: number; key: string } | null>> = []
  for (let w = 0; w < weeks; w++) {
    const col: Array<{ label: string; count: number; key: string } | null> = []
    for (let d = 0; d < 7; d++) {
      const dt = new Date(start)
      dt.setDate(start.getDate() + w * 7 + d)
      if (dt > today) { col.push(null); continue }
      const key = localDateKey(dt)
      col.push({ label: `${dt.getMonth() + 1}/${dt.getDate()}`, count: countMap.get(key) ?? 0, key })
    }
    cols.push(col)
  }
  return cols
}

function Heatmap({ data, weeks = 25 }: { data: HeatmapEntry[]; weeks?: number }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null)
  const DAY_LABELS = ['', '月', '', '水', '', '金', '']
  const cols = buildHeatmapGrid(data, weeks)

  // Derive month labels from grid cells (avoids separate date calculation)
  const monthLabels: Array<{ wi: number; label: string }> = []
  cols.forEach((col, wi) => {
    const first = col.find((c) => c !== null)
    if (!first) return
    const [, m, d] = first.key.split('-').map(Number)
    if (d <= 7 || wi === 0) {
      monthLabels.push({ wi, label: `${m}月` })
    }
  })

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 3, paddingLeft: 22, marginBottom: 4 }}>
        {cols.map((_, wi) => {
          const ml = monthLabels.find((m) => m.wi === wi)
          return (
            <div key={wi} style={{ width: 14, flexShrink: 0, fontSize: 10, color: 'var(--text3)', fontWeight: 600, overflow: 'visible', whiteSpace: 'nowrap' }}>
              {ml ? ml.label : ''}
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 3 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {DAY_LABELS.map((l, i) => (
            <div key={i} style={{ height: 14, fontSize: 10, color: 'var(--text3)', width: 20, textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              {l}
            </div>
          ))}
        </div>
        {cols.map((col, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {col.map((cell, di) => (
              <div key={di}
                style={{
                  width: 14, height: 14, borderRadius: 3, flexShrink: 0, cursor: cell ? 'pointer' : 'default',
                  background: cell ? cellColor(cell.count) : 'transparent',
                  opacity: cell ? 1 : 0,
                  transition: 'transform .15s',
                }}
                onMouseEnter={(e) => {
                  if (cell) setTooltip({ x: e.clientX, y: e.clientY, text: `${cell.label} · ${cell.count === 0 ? '作成なし' : cell.count + '本作成'}` })
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 10, color: 'var(--text3)' }}>少ない</span>
        {HM_COLORS.map((c, i) => (
          <div key={i} style={{ width: 12, height: 12, borderRadius: 2, background: c, border: '1px solid var(--border)' }} />
        ))}
        <span style={{ fontSize: 10, color: 'var(--text3)' }}>多い</span>
      </div>
      {tooltip && (
        <div style={{
          position: 'fixed', background: 'var(--text)', color: '#fff', fontSize: 11,
          padding: '5px 10px', borderRadius: 6, pointerEvents: 'none', zIndex: 999,
          whiteSpace: 'nowrap', transform: 'translate(-50%,-130%)',
          left: tooltip.x, top: tooltip.y,
        }}>
          {tooltip.text}
        </div>
      )}
    </div>
  )
}

/* ─── Score ring ──────────────────────────────── */
function ScoreRing({ score }: { score: number }) {
  const R = 26, circ = 2 * Math.PI * R
  const dash = (score / 100) * circ
  return (
    <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
      <svg width={64} height={64} viewBox="0 0 64 64" aria-hidden="true">
        <circle cx={32} cy={32} r={R} fill="none" stroke="var(--bg2)" strokeWidth={7} />
        <circle cx={32} cy={32} r={R} fill="none" stroke="var(--accent)" strokeWidth={7}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-noto-serif-jp,serif)', fontSize: 14, fontWeight: 700, color: 'var(--accent)',
      }}>
        {score}
      </div>
    </div>
  )
}

/* ─── Analytics section (exported) ───────────── */
export function AnalyticsSection({ monthlyArticles, heatmapData, continuityScore, nextProjectId }: Props) {
  const scoreDesc = continuityScore >= 80
    ? '月4本以上のペースで記事素材を積み上げられています。この調子で続けましょう。'
    : continuityScore >= 50
      ? '月2〜3本のペースで記事素材を作れています。月4本以上を目指すとスコアが上がります。'
      : '記事づくりの頻度を上げると継続スコアが伸びます。まずは月2本を目標にしましょう。'

  return (
    <div className="mb-6">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-[15px] font-bold text-[var(--text)] mb-1">記事素材づくりの進み具合</div>
            <div className="text-[12px] text-[var(--text3)]">取材から作った記事素材の継続ペース</div>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-[var(--warn-l)] text-[var(--warn)]">過去6ヶ月</span>
        </div>

        <div className="mb-5">
          <BarChart data={monthlyArticles} />
        </div>

        <div className="pt-4 border-t border-[var(--border)] mb-4">
          <div className="text-[12px] font-semibold mb-3 text-[var(--text2)]">
            <span className="sm:hidden">週次作成カレンダー（過去13週）</span>
            <span className="hidden sm:inline">週次作成カレンダー（過去25週）</span>
          </div>
          <div className="sm:hidden">
            <Heatmap data={heatmapData} weeks={13} />
          </div>
          <div className="hidden sm:block">
            <Heatmap data={heatmapData} weeks={25} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-[var(--border)]">
          <ScoreRing score={continuityScore} />
          <div className="flex-1">
            <div className="text-sm font-bold mb-1 text-[var(--text)]">記事づくり継続スコア：{continuityScore} / 100</div>
            <div className="text-[12px] leading-relaxed text-[var(--text2)]">{scoreDesc}</div>
          </div>
          <Link
            href={nextProjectId ? `/projects/${nextProjectId}/interviewer` : '/projects/new'}
            className={getButtonClass('primary', 'flex-shrink-0 text-sm px-4 py-2')}
          >
            取材する →
          </Link>
        </div>
      </div>
    </div>
  )
}
