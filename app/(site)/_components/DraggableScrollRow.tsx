'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * 横スクロール領域の下に、カスタムのオレンジ色スクロールバーを表示するラッパー。
 * つまみをドラッグして横スクロールできる（grab/grabbing カーソル付き）。
 * モバイルは通常のタッチスクロールに任せる。
 */
export function DraggableScrollRow({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const thumbStateRef = useRef<{ startX: number; startScroll: number } | null>(null)
  const [thumbDragging, setThumbDragging] = useState(false)
  const [thumb, setThumb] = useState({ width: 0, left: 0, visible: false })

  const updateThumb = useCallback(() => {
    const sc = scrollRef.current
    const tr = trackRef.current
    if (!sc || !tr) return
    const scrollWidth = sc.scrollWidth
    const clientWidth = sc.clientWidth
    if (scrollWidth <= clientWidth + 1) {
      setThumb({ width: 0, left: 0, visible: false })
      return
    }
    const trackWidth = tr.clientWidth
    const ratio = clientWidth / scrollWidth
    const thumbWidth = Math.min(trackWidth, Math.max(64, trackWidth * ratio))
    const maxScroll = scrollWidth - clientWidth
    const maxThumbLeft = Math.max(0, trackWidth - thumbWidth)
    const thumbLeft = maxScroll > 0 ? (sc.scrollLeft / maxScroll) * maxThumbLeft : 0
    setThumb({ width: thumbWidth, left: thumbLeft, visible: true })
  }, [])

  useEffect(() => {
    const sc = scrollRef.current
    const tr = trackRef.current
    if (!sc || !tr) return
    updateThumb()
    const onScroll = () => updateThumb()
    sc.addEventListener('scroll', onScroll, { passive: true })
    const ro = new ResizeObserver(updateThumb)
    ro.observe(sc)
    ro.observe(tr)
    return () => {
      sc.removeEventListener('scroll', onScroll)
      ro.disconnect()
    }
  }, [updateThumb])

  const onThumbPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    const sc = scrollRef.current
    const tr = trackRef.current
    if (!sc || !tr) return
    thumbStateRef.current = { startX: e.clientX, startScroll: sc.scrollLeft }
    setThumbDragging(true)
    const target = e.currentTarget
    target.setPointerCapture(e.pointerId)
    const onMove = (ev: PointerEvent) => {
      const s = thumbStateRef.current
      if (!s || !sc || !tr) return
      const trackWidth = tr.clientWidth
      const ratio = sc.clientWidth / sc.scrollWidth
      const thumbWidth = Math.min(trackWidth, Math.max(64, trackWidth * ratio))
      const maxThumbLeft = Math.max(1, trackWidth - thumbWidth)
      const maxScroll = sc.scrollWidth - sc.clientWidth
      const dx = ev.clientX - s.startX
      sc.scrollLeft = s.startScroll + (dx / maxThumbLeft) * maxScroll
    }
    const onUp = (ev: PointerEvent) => {
      setThumbDragging(false)
      thumbStateRef.current = null
      if (target.hasPointerCapture(ev.pointerId)) target.releasePointerCapture(ev.pointerId)
      target.removeEventListener('pointermove', onMove)
      target.removeEventListener('pointerup', onUp)
      target.removeEventListener('pointercancel', onUp)
    }
    target.addEventListener('pointermove', onMove)
    target.addEventListener('pointerup', onUp)
    target.addEventListener('pointercancel', onUp)
  }

  const onTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    if (e.target !== e.currentTarget) return
    const sc = scrollRef.current
    const tr = trackRef.current
    if (!sc || !tr) return
    const rect = tr.getBoundingClientRect()
    const trackWidth = tr.clientWidth
    const ratio = sc.clientWidth / sc.scrollWidth
    const thumbWidth = Math.min(trackWidth, Math.max(64, trackWidth * ratio))
    const maxThumbLeft = Math.max(1, trackWidth - thumbWidth)
    const maxScroll = sc.scrollWidth - sc.clientWidth
    const desiredLeft = e.clientX - rect.left - thumbWidth / 2
    const clamped = Math.max(0, Math.min(maxThumbLeft, desiredLeft))
    sc.scrollTo({ left: (clamped / maxThumbLeft) * maxScroll, behavior: 'smooth' })
  }

  return (
    <div>
      <div
        ref={scrollRef}
        className={`${className} [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
      >
        {children}
      </div>
      <div
        ref={trackRef}
        onPointerDown={onTrackPointerDown}
        className={`relative mx-1 mt-3 h-3.5 rounded-[4px] bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] ${
          thumb.visible ? '' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      >
        <div
          onPointerDown={onThumbPointerDown}
          className={`absolute top-0 h-full rounded-[4px] bg-[var(--accent)] hover:bg-[var(--accent-h)] active:bg-[var(--accent-h)] transition-colors ${
            thumbDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
          }`}
          style={{ width: thumb.width, transform: `translateX(${thumb.left}px)`, touchAction: 'none' }}
        />
      </div>
    </div>
  )
}
