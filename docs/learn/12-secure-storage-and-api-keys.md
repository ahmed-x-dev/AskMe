# Browser storage and API keys

## Goal

Keep each AI provider key out of the local Dexie database and sync files, while being clear about browser-storage limits.

## Why we need it

The app can generate questions and grade essays, but API keys are secrets. If we save them in IndexedDB with set data, they could sync to Google Drive or appear in set exports.

## The concept, simply

The app uses a small platform wrapper instead of reaching directly into browser APIs. This keeps browser storage isolated and testable. Native secure storage is not currently planned because mobile access uses the PWA; reconsider it only if the platform strategy changes.

Keys are stored in `localStorage`. This keeps them out of the app database and sync files, but it does **not** encrypt them: same-origin scripts can read them. Do not describe browser `localStorage` as secure storage.

## In our code

```ts
// src/platform/secureStorage.ts
export function saveAiApiKey(provider: AiProvider, value: string): void {
  const trimmed = value.trim()

  if (!trimmed) {
    browserKeyStorage.removeItem(`askme-${provider}-key`)
    return
  }

  browserKeyStorage.setItem(`askme-${provider}-key`, trimmed)
}
```

The key is read only when a request for that provider is sent. The Settings screen warns that browser storage is not encrypted.

## ✅ / ❌ examples

✅ Good: keep the key in a setting that is never included in `QuizSet` or repository writes.
❌ Bad: store the API key in the same IndexedDB table as study sets.

## Try it yourself

1. Open Settings and save a fake key for a provider.
2. Check that it is hidden in the input by default.
3. Remove the key and confirm it disappears from storage.

## Quick Reference

- `localStorage` is persistent browser storage, not encrypted secure storage.
- The platform wrapper keeps the browser storage API isolated from the rest of the app.
- Keep secrets out of `src/data` and out of JSON exports.

## Key Takeaways

- Provider keys live outside the database and sync files by design.
- Browser scripts can still read keys in `localStorage`.
- A platform wrapper makes mobile later easier.
- Settings screens should hide values by default, explain storage limits, and provide a clear remove flow.

## Links to related files

- [src/platform/secureStorage.ts](../../src/platform/secureStorage.ts)
- [src/components/SettingsPage.tsx](../../src/components/SettingsPage.tsx)
