'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import mintIcon96 from '@/assets/characters/mint/icons/icon-96.png'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])
  return (
    <html lang="ja">
      <body style={{ margin: 0, fontFamily: 'sans-serif', background: '#faf6f0' }}>
        <div
          style={{
            minHeight: '100dvh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
          }}
        >
          <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
            {/* ミントアイコン */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid #e5ddd4',
                  background: '#fff',
                }}
              >
                <Image src={mintIcon96} alt="ミントのアイコン" width={80} height={80} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>

            {/* メッセージ */}
            <p
              style={{
                fontSize: '1.125rem',
                fontWeight: 700,
                color: '#2d2018',
                marginBottom: '0.5rem',
              }}
            >
              うまく表示できませんでした。
            </p>
            <p
              style={{
                fontSize: '0.875rem',
                color: '#7c6b5a',
                marginBottom: '2rem',
                lineHeight: 1.7,
              }}
            >
              ページを再読み込みすると解決することがあります。
            </p>

            {/* リロードボタン */}
            <button
              type="button"
              onClick={reset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.75rem 2rem',
                borderRadius: 8,
                border: 'none',
                background: '#c47b3a',
                color: '#fff',
                fontSize: '0.9375rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              再読み込みする
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
