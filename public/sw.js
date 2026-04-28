// Insight Cast Service Worker
// public site のみキャッシュ。認証済みアプリ側（/dashboard 等）はキャッシュしない。
const CACHE_NAME = 'insight-cast-v1'
const OFFLINE_URL = '/offline'

const PRECACHE_URLS = ['/', '/offline', '/logo.jpg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(PRECACHE_URLS)
    )
  )
  // 新しい SW をすぐにアクティブにする
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  // 古いキャッシュを削除
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // 認証済みアプリ側（/dashboard, /projects, /settings, /admin 等）はキャッシュしない
  const privatePathPrefixes = ['/dashboard', '/projects', '/settings', '/admin', '/auth', '/api']
  if (privatePathPrefixes.some((prefix) => url.pathname.startsWith(prefix))) {
    return
  }

  // ナビゲーションリクエスト（ページ遷移）: ネットワーク失敗時にオフラインページを返す
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then((cached) => cached ?? new Response('Offline', { status: 503 }))
      )
    )
    return
  }

  // 静的アセット: キャッシュファースト
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        // 成功したレスポンスのみキャッシュ
        if (response.ok) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone))
        }
        return response
      }).catch(() => caches.match(OFFLINE_URL).then((cached) => cached ?? new Response('Offline', { status: 503 })))
    })
  )
})
