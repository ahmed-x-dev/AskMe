const CACHE_NAME = 'askme-v2'
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg']

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
            await cache.put('/index.html', networkResponse.clone())
          }
          return networkResponse
        })
        .catch(async () => {
          const cachedShell = await caches.match('/index.html')
          if (cachedShell) {
            return cachedShell
          }
          throw new Error('The app shell is not available offline.')
        }),
    )
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
