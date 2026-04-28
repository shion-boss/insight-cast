import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Insight Cast',
    short_name: 'Insight Cast',
    description: '動物AIインタビュアーが取材して、ホームページを継続的に強くするサービス。',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#fdf7f0',
    theme_color: '#c2722a',
    categories: ['business', 'productivity'],
    lang: 'ja',
    icons: [
      {
        src: '/logo.jpg',
        sizes: '192x192',
        type: 'image/jpeg',
        purpose: 'any',
      },
      {
        src: '/logo.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: 'ダッシュボード',
        url: '/dashboard',
        description: '取材一覧を見る',
      },
      {
        name: '新しい取材',
        url: '/projects/new',
        description: '取材先を登録する',
      },
    ],
  }
}
