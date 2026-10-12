const CACHE_NAME = 'askme-next-v1'
const APP_SHELL = ['/', '/offline', '/manifest.webmanifest', '/icon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return
  }

  const requestUrl = new URL(event.request.url)

  if (requestUrl.origin !== self.location.origin) {
    return
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(async (networkResponse) => {
          if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME)
            await cache.put(event.request, networkResponse.clone())
          }
          return networkResponse
        })
        .catch(async () => {
          return (await caches.match(event.request)) ?? (await caches.match('/offline')) ?? Response.error()
        }),
    )
    return
  }

  if (event.request.headers.has('RSC') || requestUrl.searchParams.has('_rsc')) {
    return
  }

  if (
    !requestUrl.pathname.startsWith('/_next/static/') &&
    !['script', 'style', 'image', 'font'].includes(event.request.destination)
  ) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(event.request).then(async (networkResponse) => {
        if (networkResponse.ok) {
          const cache = await caches.open(CACHE_NAME)
          await cache.put(event.request, networkResponse.clone())
        }
        return networkResponse
      })
    }),
  )
})
