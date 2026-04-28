import { ImageResponse } from 'next/og'
import { getBlogPostFromDB } from '@/lib/blog-posts.server'

export const runtime = 'edge'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getBlogPostFromDB(slug)
  const title = post?.title ?? 'Insight Cast ブログ'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          padding: '64px',
          background: 'linear-gradient(140deg, #fdf8f2 0%, #f6e9d8 55%, #ede0cc 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* ブランドバッジ */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '24px',
            background: 'rgba(194, 114, 42, 0.12)',
            borderRadius: '100px',
            padding: '6px 18px',
            border: '1px solid rgba(194, 114, 42, 0.3)',
          }}
        >
          <span
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: '#c2722a',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Insight Cast Blog
          </span>
        </div>

        {/* タイトル */}
        <div
          style={{
            fontSize: title.length > 30 ? '40px' : '48px',
            fontWeight: 700,
            color: '#2d2018',
            lineHeight: 1.3,
            maxWidth: '900px',
            marginBottom: '32px',
          }}
        >
          {title}
        </div>

        {/* サイト名 */}
        <div
          style={{
            fontSize: '18px',
            color: '#7c6b5a',
            fontWeight: 500,
          }}
        >
          insight-cast.jp
        </div>
      </div>
    ),
    { ...size },
  )
}
