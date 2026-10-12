# PWA and offline support: install once, use anywhere

The web app behaves like a lightweight app by installing a manifest and caching its shell for offline use.

## Why we need it

A revision app is most useful when users can open it without a network connection, especially during study sessions on the move.

## The concept, simply

A PWA is a web app with install metadata and a service worker. The service worker caches the app shell so the user can still open it after the first successful load.

AskMe's platform plan uses this PWA for mobile access instead of a native Capacitor app. The web app comes first; desktop packaging is the next delivery target.

## In our code

The production app registers the service worker in `src/components/AppShell.tsx`, and the cache logic lives in `public/sw.js`. The worker uses network-first navigation and caches each successful URL, then falls back to that exact page or `/offline`. Next.js static chunks and browser assets use cache-first after their first successful request. RSC requests are not cached. Failed scripts and styles are never replaced with HTML, which would cause parsing errors. Increment the cache version when changing the service-worker behavior so older caches are removed on activation.

```ts
if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
  void navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
    console.error('Could not register the offline service worker.', error)
  })
}
```

The manifest in `public/manifest.webmanifest` adds the install metadata, and the app icon is served from `public/icon.svg`. The offline page at `app/offline/page.tsx` is cached during installation.

## ❌ / ✅ examples

- ❌ Assuming the app works offline before it has ever been loaded.
- ✅ The first visit caches its route; later visits check the network first and use the matching route offline.
- ❌ Forgetting to register the service worker.
- ✅ A registered worker makes the app behave like a package.
- ❌ Returning an HTML document for a failed JavaScript or CSS request.
- ✅ Only navigation requests use the offline page fallback; static assets keep their own response types.

## Try it yourself

1. Build and start the production app, then open it once in a browser.
2. Install the app, open a route, go offline, and verify that visited routes still load.
3. Open an unvisited route while offline and confirm the offline page appears.

## Quick Reference

- `manifest.webmanifest` defines the app metadata.
- `sw.js` caches essential assets for offline use.
- `navigator.serviceWorker.register` is the browser handshake that activates the worker.

## Key Takeaways

- PWA support is a user-experience feature as much as a technical one.
- Offline fallback starts after the first successful load.
- A minimal shell keeps the install light and dependable.

## Links to related files

- `public/sw.js`
- `public/manifest.webmanifest`
- `src/components/AppShell.tsx`
- `app/offline/page.tsx`
