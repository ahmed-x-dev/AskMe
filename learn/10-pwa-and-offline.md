# PWA and offline support: install once, use anywhere

The web app behaves like a lightweight app by installing a manifest and caching its shell for offline use.

## Why we need it

A revision app is most useful when users can open it without a network connection, especially during study sessions on the move.

## The concept, simply

A PWA is a web app with install metadata and a service worker. The service worker caches the app shell so the user can still open it after the first successful load.

## In our code

The app registers a service worker in `src/main.tsx`, and the cache logic lives in `public/sw.js`. The worker uses network-first navigation so deployments can deliver the latest HTML, then falls back to the cached shell offline. Other same-origin assets use cache-first when previously cached. Failed assets are not replaced with HTML, which would otherwise cause confusing JavaScript parse errors and a blank page. Increment the cache version when changing the service-worker behavior so older caches are removed on activation.

```ts
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined)
  })
}
```

The manifest in `public/manifest.webmanifest` adds the install metadata, and the app icon is served from `public/icon.svg`.

## ❌ / ✅ examples

- ❌ Assuming the app works offline before it has ever been loaded.
- ✅ First load caches the shell; later navigation checks the network first and uses the cache offline.
- ❌ Forgetting to register the service worker.
- ✅ A registered worker makes the app behave like a package.
- ❌ Returning `index.html` for a failed JavaScript or CSS request.
- ✅ Only navigation requests use the offline HTML fallback.

## Try it yourself

1. Run the app in a browser and load the page once.
2. Open the browser's install flow and install it as an app.
3. Go offline and confirm the home screen still loads.

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
- `src/main.tsx`
