'use client'

import { useState } from 'react'
import { GENRES, EFFECTS, buildContentMatrix, type ClassifiedPost } from '@/lib/content-map'
import { CharacterAvatar, DevAiLabel } from '@/components/ui'
import type { StaticImageData } from 'next/image'

type Props = {
  projectId: string
  projectName: string
  initialClassifications: ClassifiedPost[] | null
  blogPostCount: number
  clausIcon?: StaticImageData
  clausEmoji?: string
}

export function ContentMapPanel({
  projectId,
  projectName,
  initialClassifications,
  blogPostCount,
  clausIcon,
  clausEmoji,
}: Props) {
  const [classifications, setClassifications] = useState<ClassifiedPost[] | null>(initialClassifications)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function runClassification() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/classify-content`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('failed')
      const json = await res.json() as { classifications: ClassifiedPost[] }
      setClassifications(json.classifications)
    } catch {
      setError('分析できませんでした。しばらく待ってからもう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  if (blogPostCount === 0) return null

  const matrix = classifications ? buildContentMatrix(classifications) : null
  const existingCount = classifications?.filter((p) => p.source === 'existing').length ?? 0
  const insightCastCount = classifications?.filter((p) => p.source === 'insight_cast').length ?? 0

  // Find empty cells (gaps)
  const gapCells: Array<{ genre: string; effect: string }> = []
  if (matrix) {
    for (const g of GENRES) {
      for (const e of EFFECTS) {
        if (matrix[g.key][e.key].length === 0) {
          gapCells.push({ genre: g.label, effect: e.label })
        }
      }
    }
  }

  const maxCellCount = matrix
    ? Math.max(...GENRES.flatMap((g) => EFFECTS.map((e) => matrix[g.key][e.key].length)), 1)
    : 1

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] p-7">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-[var(--border)]">
            <CharacterAvatar
              src={clausIcon}
              alt="クラウス"
              emoji={clausEmoji ?? '🦉'}
              size={40}
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div>
            <h2 className="text-[18px] font-bold text-[var(--text)]">
              コンテンツマップ
            </h2>
            <p className="text-[12px] text-[var(--text3)] mt-0.5">
              {projectName} · 既存記事 {blogPostCount} 件
            </p>
          </div>
        </div>

        {classifications === null && (
          <div className="flex flex-col items-end gap-1">
            <DevAiLabel className="text-xs opacity-60">記事分析</DevAiLabel>
            <button
              type="button"
              onClick={runClassification}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-[var(--r-sm)] text-sm font-semibold text-white bg-[var(--accent)] hover:bg-[var(--accent-h)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  分析中…
                </>
              ) : (
                <>記事を分析する</>
              )}
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-[var(--err)] mb-4">{error}</p>
      )}

      {/* Not yet classified */}
      {classifications === null && !loading && (
        <div className="border border-dashed border-[var(--border)] rounded-xl p-8 flex flex-col items-center gap-3 text-center">
          <div className="text-sm text-[var(--text2)] leading-relaxed">
            HPから見つかった <span className="font-semibold text-[var(--text)]">{blogPostCount} 件</span> の記事を分析すると、<br />
            どのジャンル・効果が不足しているか可視化できます。
          </div>
          <div className="text-[12px] text-[var(--text3)]">取材で補うべき空白が見えてきます</div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center gap-3 py-10">
          <div className="w-8 h-8 border-[3px] rounded-full animate-spin border-[var(--border)] border-t-[var(--accent)]" />
          <p className="text-sm text-[var(--text2)]">記事の内容を読んでいます…</p>
        </div>
      )}

      {/* Matrix */}
      {matrix && !loading && (
        <>
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mb-5 text-[11px] text-[var(--text3)]">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[var(--accent)]" />
              既存HP記事
            </div>
            {insightCastCount > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[var(--teal)]" />
                Insight Cast記事
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm border border-dashed border-[#fb923c] bg-[#fff7ed]" />
              不足ゾーン
            </div>
          </div>

          {/* Grid */}
          <div>
            <div className="min-w-0">
              {/* Column headers */}
              <div className="grid mb-1" style={{ gridTemplateColumns: '72px repeat(4, 1fr)' }}>
                <div />
                {EFFECTS.map((e) => (
                  <div key={e.key} className="text-center px-0.5">
                    <div className="text-xs font-semibold text-[var(--text)] leading-tight">{e.label}</div>
                    <div className="hidden sm:block text-xs text-[var(--text3)] leading-tight mt-0.5">{e.desc}</div>
                  </div>
                ))}
              </div>

              {/* Rows */}
              {GENRES.map((g) => (
                <div
                  key={g.key}
                  className="grid items-center mb-1.5"
                  style={{ gridTemplateColumns: '72px repeat(4, 1fr)', gap: '4px' }}
                >
                  <div className="text-[11px] font-medium text-[var(--text2)] pr-1 text-right leading-tight">
                    {g.label}
                  </div>
                  {EFFECTS.map((e) => {
                    const posts = matrix[g.key][e.key]
                    const insightCast = posts.filter((p) => p.source === 'insight_cast')
                    const isEmpty = posts.length === 0
                    const fillPct = Math.min(1, posts.length / maxCellCount)

                    return (
                      <div
                        key={e.key}
                        className="relative rounded-[6px] h-[44px] sm:h-[52px] flex flex-col items-center justify-center overflow-hidden border"
                        title={isEmpty ? `${g.label} × ${e.label} — 記事なし` : posts.map((p) => p.title).join('\n')}
                        style={
                          isEmpty
                            ? {
                                borderColor: '#fed7aa',
                                background: '#fff7ed',
                              }
                            : {
                                borderColor: 'var(--border)',
                                background: 'var(--bg2)',
                              }
                        }
                      >
                        {!isEmpty && (
                          <div
                            className="absolute inset-0 rounded-[5px] transition-all"
                            style={{
                              background: insightCast.length > 0
                                ? `linear-gradient(to top, color-mix(in srgb, var(--teal) ${Math.round(fillPct * 60)}%, transparent) ${Math.round(fillPct * 100)}%, transparent ${Math.round(fillPct * 100)}%)`
                                : `linear-gradient(to top, color-mix(in srgb, var(--accent) ${Math.round(fillPct * 60)}%, transparent) ${Math.round(fillPct * 100)}%, transparent ${Math.round(fillPct * 100)}%)`,
                            }}
                          />
                        )}
                        <div className="relative z-10 text-center">
                          {isEmpty ? (
                            <div className="text-xs font-medium text-[#fb923c]">不足</div>
                          ) : (
                            <>
                              <div
                                className="text-[16px] font-bold leading-none"
                                style={{ color: insightCast.length > 0 ? 'var(--teal)' : 'var(--accent)' }}
                              >
                                {posts.length}
                              </div>
                              <div className="text-[9px] mt-0.5 text-[var(--text3)]">記事</div>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="mt-5 pt-5 border-t border-[var(--border)] grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-[22px] font-bold text-[var(--accent)]">
                {existingCount}
              </div>
              <div className="text-[11px] text-[var(--text3)] mt-0.5">既存HP記事</div>
            </div>
            {insightCastCount > 0 && (
              <div className="text-center">
                <div className="text-[22px] font-bold text-[var(--teal)]">
                  {insightCastCount}
                </div>
                <div className="text-[11px] text-[var(--text3)] mt-0.5">Insight Cast記事</div>
              </div>
            )}
            <div className="text-center">
              <div className="text-[22px] font-bold text-[#fb923c]">
                {gapCells.length}
              </div>
              <div className="text-[11px] text-[var(--text3)] mt-0.5">不足ゾーン</div>
            </div>
          </div>

          {/* Gap hints */}
          {gapCells.length > 0 && (
            <div className="mt-4 bg-[var(--bg2)] rounded-xl p-4">
              <p className="text-[12px] font-semibold text-[var(--text)] mb-2">取材で補えるゾーン（上位3件）</p>
              <ul className="space-y-1">
                {gapCells.slice(0, 3).map((cell) => (
                  <li key={`${cell.genre}-${cell.effect}`} className="text-[12px] text-[var(--text2)] flex gap-2 items-center">
                    <span className="w-1 h-1 rounded-full flex-shrink-0 bg-[#fb923c]" />
                    <span className="font-medium">{cell.genre}</span>
                    <span className="text-[var(--text3)]">×</span>
                    <span>{cell.effect}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}
