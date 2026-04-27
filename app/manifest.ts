import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Insight Cast',
    short_name: 'Insight Cast',
    description: '動物AIインタビュアーが取材して、ホームページを継続的に強くするサービス。',
    start_url: '/',
    display: 'standalone',
    background_color: '#fdf7f0',
    theme_color: '#c2722a',
    icons: [
      {
        src: '/logo.jpg',
        sizes: '1116x350',
        type: 'image/jpeg',
      },
    ],
  }
}
