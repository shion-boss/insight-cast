'use client'

import { useState } from 'react'

const EXCHANGE_RATE = 150

export function CostValue({ usd, className }: { usd: number; className?: string }) {
  const [hovered, setHovered] = useState(false)

  return (
    <span
      className={`cursor-default tabular-nums transition-colors ${className ?? ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered
        ? `¥${Math.round(usd * EXCHANGE_RATE).toLocaleString()}`
        : `$${usd.toFixed(4)}`}
    </span>
  )
}
