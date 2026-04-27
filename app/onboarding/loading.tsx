export default function OnboardingLoading() {
  return (
    <div className="min-h-dvh bg-gradient-to-br from-[#fdf8f2] to-[#f0e5d0] flex items-center justify-center px-4 py-16">
      <div aria-busy="true" aria-label="読み込み中" className="w-full max-w-[480px] animate-pulse space-y-5">
        <div className="h-9 w-32 mx-auto rounded bg-[#e8d5b8]" />
        <div className="bg-white/70 rounded-[20px] p-8 shadow-sm space-y-4">
          <div className="h-6 w-48 rounded bg-[#e8d5b8]" />
          <div className="h-[72px] rounded-[var(--r-lg)] bg-[#e8d5b8]" />
          <div className="h-12 rounded-[var(--r-sm)] bg-[#e8d5b8]" />
        </div>
      </div>
    </div>
  )
}
