'use client'

// 取材進捗バー。userTurns / standardTurns で進捗率を表示。
export function InterviewProgressBar({
  userTurns,
  standardTurns,
  label,
}: {
  userTurns: number
  standardTurns: number
  label: string
}) {
  return (
    <div className="bg-[var(--surface)] border-b border-[var(--border)] flex-shrink-0">
      <div className="mx-auto max-w-6xl px-3 sm:px-6 py-2 sm:py-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-[13px] text-[var(--text2)]">{label}</span>
            <span className="text-[13px] text-[var(--text2)]">{userTurns}/{standardTurns}</span>
          </div>
          <div
            role="progressbar"
            aria-label="インタビューの進行状況"
            aria-valuenow={userTurns}
            aria-valuemin={0}
            aria-valuemax={standardTurns}
            className="bg-[var(--border)] h-1 rounded-full overflow-hidden"
          >
            <div
              className={`h-full bg-[var(--accent)] rounded-full transition-all duration-300 ${userTurns >= standardTurns ? 'ic-progress-bar-full' : ''}`}
              style={{ width: `${Math.min((userTurns / standardTurns) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
