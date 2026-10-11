# PWA and offline support: install once, use anywhere

The web app behaves like a lightweight app by installing a manifest and caching its shell for offline use.

## Why we need it

A revision app is most useful when users can open it without a network connection, especially during study sessions on the move.

## The concept, simply

A PWA is a web app with install metadata and a service worker. The service worker caches the app shell so the user can still open it after the first successful load.

## In our code

The app registers a service worker in `src/main.tsx`, and the cache logic lives in `public/sw.js`.

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
- ✅ First load caches the shell and future sessions can work without a connection.
- ❌ Forgetting to register the service worker.
- ✅ A registered worker makes the app behave like a package.

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
