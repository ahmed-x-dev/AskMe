# Next.js App Router

This note explains how AskMe uses Next.js routes while keeping its IndexedDB data in the browser.

## Why we need it

AskMe was built with Vite and React Router. The requested migration replaces those app-runtime tools with Next.js. Next.js also renders on a server, but AskMe's database and API keys must remain browser-only.

## The concept, simply

The `app/` folder describes URLs: `app/page.tsx` is `/`, while `app/set/[id]/page.tsx` matches `/set/<id>`. A layout wraps pages with shared document structure.

Pages are Server Components by default. A Client Component starts with `'use client'` and is needed for state, event handlers, browser APIs, and Dexie. A client component may still be pre-rendered, so browser-only reads belong in effects, not render-time state initializers.

Next.js serves the app; it does not mean AskMe has a business backend. Quiz data stays in Dexie and API keys stay in browser storage.

## In our code

The root layout owns document metadata and shared CSS:

```tsx
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { AppShell } from '../src/components/AppShell'
import './globals.css'

export const metadata: Metadata = {
  title: 'AskMe',
  manifest: '/manifest.webmanifest',
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" data-theme="light">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
```

The library route renders a client component because it reads and updates local data:

```tsx
import { SetsPage } from '../src/components/SetsPage'

export default function Page() {
  return <SetsPage />
}
```

Keep browser-only database reads inside client-side effects. Do not read `window.localStorage` while a component is rendering.

## ❌ / ✅ examples

### ❌ Bad

```tsx
'use client'
const [sets] = useState(() => window.localStorage.getItem('sets'))
```

Next.js can render the client component on the server, where `window` does not exist.

### ✅ Good

```tsx
useEffect(() => {
  void listSets().then(setSets).catch((error: unknown) => {
    setLoadError(error instanceof Error ? error.message : 'Could not load sets.')
  })
}, [])
```

The browser reads IndexedDB after mounting, and a failure is shown rather than hidden.

## Try it yourself

1. Add a route at `app/about/page.tsx` and open `/about`.
2. Inspect whether each import that accesses browser APIs is behind a Client Component.
3. Change the app title in the root layout metadata and inspect the browser tab.

## Quick Reference

- `app/page.tsx` → `/`
- `app/set/[id]/page.tsx` → `/set/<id>`
- `'use client'` enables hooks, handlers, and browser APIs.
- `Link` comes from `next/link`; imperative navigation comes from `next/navigation`.
- Read dynamic `params` and `searchParams` as promises in Next.js 16 pages.
- Keep Dexie and per-device keys client-side.
- `npm run dev`, `npm run build`, and `npm start` run the Next.js app.

## Key Takeaways

- File paths in `app/` define route paths.
- Server Components are the default; interactive and browser-dependent UI belongs in Client Components.
- Client Components may be pre-rendered, so browser APIs still need effect-time access.
- Next.js serving the UI does not require moving app data to a server.

## Links to related files

- [PLAN.md](../../PLAN.md)
- [app/layout.tsx](../../app/layout.tsx)
- [app/page.tsx](../../app/page.tsx)
- [src/hooks/useQuizSet.ts](../../src/hooks/useQuizSet.ts)
- [10-pwa-and-offline.md](./10-pwa-and-offline.md)
