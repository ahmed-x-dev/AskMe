# PWA installation and offline support

## Goal

Learn how AskMe is installable and how its app shell and local study data remain usable after a successful visit.

## Why we need it

AskMe stores roadmaps, questions, attempts, and reviews in the browser. A service worker can cache the app code and previously visited routes so that losing the network does not automatically mean losing access to study. Browser storage can still be evicted, so users should keep using the backup feature.

## The concept, simply

A web app manifest tells a browser the app's name, icon, start page, and standalone display mode. A service worker is a small browser-managed program that can cache app files and navigation responses. Serwist builds and registers that worker for the Next.js App Router.

The worker caches application code, route responses, and eligible assets/GET requests, not Dexie records, provider keys, or AI request bodies. AskMe's AI requests use POST and are not cached. Dexie remains the source of local study data. The browser's `navigator.storage.persist()` API can request that the browser avoid automatic storage eviction, but the browser may deny the request and can still remove data in exceptional cases.

AskMe keeps its dynamic Next.js routes. The home page and previously visited/prefetched routes can work offline after their app files have been cached. An unvisited dynamic URL may need a network connection to receive its first Next.js response; the worker shows the offline page when it cannot.

## In our code

The App Router manifest lives in `src/app/manifest.ts`:

```ts
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AskMe",
    short_name: "AskMe",
    start_url: "/",
    display: "standalone",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
```

The service worker in `src/app/sw.ts` uses Serwist's Next.js-aware cache rules. `src/app/serwist/[path]/route.ts` creates the worker at `/serwist/sw.js`, and the root layout's `SerwistProvider` registers it. Its `/offline` fallback is precached so the worker can display it without a network.

In Settings, the local-data retention control calls `navigator.storage.persist()`. The result is reported to the user because storage persistence is a browser decision, not a guarantee made by the app.

## ✅ / ❌ examples

- ❌ Cache AI requests or API-key-bearing URLs in the service worker.
- ✅ Cache only app assets and same-origin route responses; keep secrets and study records in their existing browser storage layers.
- ❌ Assume installing the app or requesting persistent storage guarantees that every route and every record is available forever.
- ✅ Visit/prefetch a route while online, keep backups, and explain that unvisited dynamic routes may need a connection.
- ❌ Add a service worker without checking how its update behavior affects development.
- ✅ Register the worker only in production; use HTTPS or localhost when testing installation.

## Try it yourself

1. Build and run AskMe over localhost or HTTPS, then inspect the manifest and service-worker registration in browser DevTools.
2. Open a topic while online, switch DevTools to offline, reload that visited route, and confirm its data comes from IndexedDB.
3. Open Settings and request persistent storage; read the browser's result rather than assuming it was granted.

## Quick Reference

- Manifest: app identity, installation icon, start URL, and display mode.
- Service worker: cache/update and offline navigation behavior.
- Dexie: local question and progress records; not the service-worker cache.
- `navigator.storage.persist()`: best-effort request against automatic storage eviction.
- Service workers require a secure context (HTTPS in production; localhost is trusted for development).

## Key Takeaways

- Installing a PWA and enabling offline behavior are related but separate capabilities.
- Cache the application shell and route responses, not secrets or user-data API traffic.
- Dynamic routes are only reliably available offline after their route response and code have been cached.
- Browser storage remains best-effort; maintain and test backups.

## Links to related files

- [src/app/manifest.ts](../../src/app/manifest.ts)
- [src/app/sw.ts](../../src/app/sw.ts)
- [src/app/serwist/[path]/route.ts](../../src/app/serwist/[path]/route.ts)
- [src/components/settings/SettingsPage.tsx](../../src/components/settings/SettingsPage.tsx)
- [docs/learn/09-json-import-export.md](./09-json-import-export.md)
