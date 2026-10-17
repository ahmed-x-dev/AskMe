# PWA and offline support: currently deferred

This lesson records the PWA approach that was prototyped in AskMe. Install and offline-cache behavior is currently disabled; AskMe runs as a regular web app.

## Why we need it

A service worker can keep an old version of a page or JavaScript asset after deployment. During development, this made it harder to tell whether the browser was showing the newest code. The owner chose to remove PWA behavior for now.

## The concept, simply

A PWA uses a web manifest for install metadata and can use a service worker to intercept requests, cache assets, and provide offline responses. A registered service worker can remain active in browsers after its registration code is removed, so disabling the feature also requires unregistering the old worker and removing its named cache.

## In our code

`src/components/AppShell.tsx` now looks for the previous `/sw.js` registration, unregisters it, removes the `askme-next-v1` cache, and reloads once when it successfully removes the worker. This is cleanup only; it does not register a service worker. `src/app/layout.tsx` no longer links a web manifest. `public/icon.svg` remains the browser tab icon.

## ❌ / ✅ examples

- ❌ Removing the service-worker registration code and assuming all existing browser registrations disappeared.
- ✅ Explicitly unregistering the app's old worker and deleting its named cache.
- ❌ Treating this app as installable or offline-capable while PWA support is paused.
- ✅ Use AskMe online as a regular web app until PWA support is intentionally reintroduced.

## Try it yourself

1. Open DevTools and confirm AskMe has no `/sw.js` service-worker registration after loading the app.
2. Check that the old `askme-next-v1` cache is removed.

## Quick Reference

- Service workers can outlive the JavaScript that originally registered them.
- `registration.unregister()` removes a service-worker registration.
- `caches.delete(name)` removes a specific Cache Storage cache.

## Key Takeaways

- PWA install and offline behavior are currently deferred.
- Removing a worker requires cleaning up registrations that browsers already stored.
- Local quiz data in IndexedDB is separate from the service-worker cache and is preserved.

## Links to related files

- `src/components/AppShell.tsx`
- `src/app/layout.tsx`
