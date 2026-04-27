export default function InterviewLoading() {
  return (
    <div className="bg-[var(--bg)] h-dvh flex items-center justify-center px-6">
      <div className="w-full max-w-[520px] space-y-4">
        <div className="flex items-start gap-4 animate-pulse">
          {/* キャラアイコンのスケルトン */}
          <div className="w-12 h-12 rounded-full bg-[var(--bg2)] flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-5 w-48 rounded bg-[var(--bg2)]" />
            <div className="h-4 w-full rounded bg-[var(--bg2)]" />
            <div className="h-4 w-3/4 rounded bg-[var(--bg2)]" />
          </div>
        </div>
      </div>
    </div>
  )
}
