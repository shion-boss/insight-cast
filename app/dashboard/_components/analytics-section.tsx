'use client'

import { useState } from 'react'
import Link from 'next/link'

export type ThemeDataPoint = { label: string; count: number; color: string }
export type MonthlyPoint   = { m: string; n: number }
export type HeatmapEntry   = { date: string; count: number }

type Props = {
  themeDistribution: ThemeDataPoint[]
  monthlyArticles:   MonthlyPoint[]
  heatmapData:       HeatmapEntry[]
  continuityScore:   number
  nextProjectId:     string | null
}

/* ─── Donut chart ─────────────────────────────── */
function DonutChart({ data }: { data: ThemeDataPoint[] }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const total = data.reduce((s, d) => s + d.count, 0)
  if (total === 0) return (
    <div className="flex items-center justify-center h-[140px] text-[13px]" style={{ color: 'var(--text3)' }}>
      テーマデータがありません
    </div>
  )

  const R = 60, cx = 70, cy = 70, sw = 22
  const circ = 2 * Math.PI * R
  let offset = 0
  const slices = data.map((d) => {
    const dash = (d.count / total) * circ
    const s = { ...d, dash, offset }
    offset += dash
    return s
  })
  const active = hovered !== null ? data[hovered] : null

  return (
    <div className="flex items-center gap-6">
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg width={140} height={140}>
          <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--bg2)" strokeWidth={sw} />
          {slices.map((s, i) => (
            <circle key={i} cx={cx} cy={cy} r={R} fill="none"
              stroke={s.color}
              strokeWidth={hovered === i ? sw + 4 : sw}
              strokeDasharray={`${s.dash} ${circ - s.dash}`}
              strokeDashoffset={circ / 4 - s.offset}
              style={{ cursor: 'pointer', transition: 'stroke-width .15s' }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
          <text x={cx} y={cy - 8} textAnchor="middle"
            style={{ fontFamily: 'var(--font-noto-serif-jp,serif)', fontSize: 22, fontWeight: 700, fill: 'var(--text)' }}>
            {active ? active.count : total}
          </text>
          <text x={cx} y={cy + 11} textAnchor="middle"
            style={{ fontFamily: 'sans-serif', fontSize: 10, fill: 'var(--text3)' }}>
            {active ? '件' : '記事合計'}
          </text>
        </svg>
      </div>
      <div className="flex flex-col gap-2 flex-1">
        {data.map((d, i) => (
          <div key={i}
            className="flex items-center gap-2 text-[12px] cursor-default"
            style={{ color: 'var(--text2)', opacity: hovered !== null && hovered !== i ? 0.45 : 1, transition: 'opacity .15s' }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
            <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{d.label}</span>
            <span className="font-bold text-[13px]" style={{ color: 'var(--text)' }}>{d.count}</span>
            <span className="text-[11px]" style={{ color: 'var(--text3)' }}>{Math.round(d.count / total * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Bar chart ───────────────────────────────── */
function BarChart({ data }: { data: MonthlyPoint[] }) {
  const [hov, setHov] = useState<number | null>(null)
  const max = Math.max(...data.map((d) => d.n), 1)
  const W = 340, H = 80, BAR = 28, GAP = 16, PAD = 20

  return (
    <svg width={W} height={H + 30} style={{ overflow: 'visible' }}>
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

function buildHeatmapGrid(data: HeatmapEntry[]) {
  const countMap = new Map(data.map((e) => [e.date, e.count]))
  const today = new Date()
  const start = new Date(today)
  start.setDate(start.getDate() - 167)
  start.setDate(start.getDate() - start.getDay()) // back to Sunday

  const cols: Array<Array<{ label: string; count: number } | null>> = []
  for (let w = 0; w < 25; w++) {
    const col: Array<{ label: string; count: number } | null> = []
    for (let d = 0; d < 7; d++) {
      const dt = new Date(start)
      dt.setDate(start.getDate() + w * 7 + d)
      if (dt > today) { col.push(null); continue }
      const key = dt.toISOString().slice(0, 10)
      col.push({ label: `${dt.getMonth() + 1}/${dt.getDate()}`, count: countMap.get(key) ?? 0 })
    }
    cols.push(col)
  }
  return cols
}

function Heatmap({ data }: { data: HeatmapEntry[] }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null)
  const DAY_LABELS = ['', '月', '', '水', '', '金', '']
  const cols = buildHeatmapGrid(data)

  const monthLabels: Array<{ wi: number; label: string }> = []
  cols.forEach((col, wi) => {
    const first = col.find((c) => c !== null)
    if (!first) return
    const dt = new Date()
    dt.setDate(dt.getDate() - 167 - dt.getDay() + wi * 7)
    if (dt.getDate() <= 7 || wi === 0) {
      monthLabels.push({ wi, label: `${dt.getMonth() + 1}月` })
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
                  if (cell) setTooltip({ x: e.clientX, y: e.clientY, text: `${cell.label} · ${cell.count === 0 ? '更新なし' : cell.count + '本更新'}` })
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
      <svg width={64} height={64} viewBox="0 0 64 64">
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
export function AnalyticsSection({ themeDistribution, monthlyArticles, heatmapData, continuityScore, nextProjectId }: Props) {
  const scoreDesc = continuityScore >= 80
    ? '月4本以上のペースで更新できています。この調子で続けましょう！'
    : continuityScore >= 50
      ? '月2〜3本のペースで更新できています。月4本以上を目指すとスコアが上がります。'
      : '更新頻度を上げると継続スコアが伸びます。まずは月2本を目標にしましょう。'

  return (
    <div className="grid gap-5 mb-6" style={{ gridTemplateColumns: '320px 1fr' }}>
      {/* Left: Donut */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] p-6">
        <div className="font-[family-name:var(--font-noto-serif-jp)] text-[15px] font-bold text-[var(--text)] mb-1">記事テーマの分布</div>
        <div className="text-[12px] mb-5" style={{ color: 'var(--text3)' }}>取材で引き出されたテーマの内訳</div>
        <DonutChart data={themeDistribution} />
      </div>

      {/* Right: Bar + Heatmap + Score */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="font-[family-name:var(--font-noto-serif-jp)] text-[15px] font-bold text-[var(--text)] mb-1">ホームページの更新状況</div>
            <div className="text-[12px]" style={{ color: 'var(--text3)' }}>記事素材の生成・投稿の継続性</div>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold" style={{ background: '#fef3c7', color: '#92400e' }}>過去6ヶ月</span>
        </div>

        <div className="mb-5">
          <BarChart data={monthlyArticles} />
        </div>

        <div className="pt-4 border-t border-[var(--border)] mb-4">
          <div className="text-[12px] font-semibold mb-3" style={{ color: 'var(--text2)' }}>週次更新カレンダー（過去25週）</div>
          <Heatmap data={heatmapData} />
        </div>

        <div className="flex items-center gap-5 pt-4 border-t border-[var(--border)]">
          <ScoreRing score={continuityScore} />
          <div className="flex-1">
            <div className="text-[13px] font-bold mb-1" style={{ color: 'var(--text)' }}>継続スコア：{continuityScore} / 100</div>
            <div className="text-[12px] leading-relaxed" style={{ color: 'var(--text2)' }}>{scoreDesc}</div>
          </div>
          <Link
            href={nextProjectId ? `/projects/${nextProjectId}/interviewer` : '/projects/new'}
            className="text-[13px] font-semibold text-white px-4 py-2 rounded-[var(--r-sm)] transition-colors flex-shrink-0"
            style={{ background: 'var(--accent)' }}
          >
            取材する →
          </Link>
        </div>
      </div>
    </div>
  )
}
