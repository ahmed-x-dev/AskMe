# Next.js App Router

This note explains how AskMe uses Next.js routes while keeping its IndexedDB data in the browser.

## Why we need it

AskMe was built with Vite and React Router. The requested migration replaces those app-runtime tools with Next.js. Next.js also renders on a server, but AskMe's database and API keys must remain browser-only.

## The concept, simply

The `src/app/` folder describes URLs: `src/app/page.tsx` is `/`, while `src/app/set/[id]/page.tsx` matches `/set/<id>`. A layout wraps pages with shared document structure. The project maps the `@/*` import alias to `src/*`, so route files can import shared code as `@/components/...` instead of calculating a relative path.

Pages are Server Components by default. A Client Component starts with `'use client'` and is needed for state, event handlers, browser APIs, and Dexie. A client component may still be pre-rendered, so browser-only reads belong in effects, not render-time state initializers.

Next.js serves the app; it does not mean AskMe has a business backend. Quiz data stays in Dexie and API keys stay in browser storage.

## In our code

The root layout owns document metadata and shared CSS:

```tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "AskMe",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" data-theme="light">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
```

The library route renders a client component because it reads and updates local data:

```tsx
import { SetsPage } from "@/components/SetsPage";

export default function Page() {
  return <SetsPage />;
}
```

Keep browser-only database reads inside client-side effects. Do not read `window.localStorage` while a component is rendering.

## Route loading UI

An `loading.tsx` file creates a Suspense fallback for its route segment and the pages below it. AskMe uses route-level skeletons for roadmap and topic details, quizzes, resources, and question editing so navigation can show the shape of the screen being opened.

These do not replace components' `useLiveQuery` loading states. Those queries run in the browser after the page mounts, so each component still needs its own fallback. Keep route loading UI lightweight and shaped like the screen that follows.

## ❌ / ✅ examples

### ❌ Bad

```tsx
"use client";
const [sets] = useState(() => window.localStorage.getItem("sets"));
```

Next.js can render the client component on the server, where `window` does not exist.

### ✅ Good

```tsx
useEffect(() => {
  void listSets()
    .then(setSets)
    .catch((error: unknown) => {
      setLoadError(
        error instanceof Error ? error.message : "Could not load sets.",
      );
    });
}, []);
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
- `@/components/...` resolves to `src/components/...` through the `paths` mapping in `tsconfig.json`.
- Keep Dexie and per-device keys client-side.
- `npm run dev`, `npm run build`, and `npm start` run the Next.js app.

## Key Takeaways

- File paths in `src/app/` define route paths.
- The `@/*` path alias makes imports stable when files move between route folders.
- Server Components are the default; interactive and browser-dependent UI belongs in Client Components.
- Client Components may be pre-rendered, so browser APIs still need effect-time access.
- Next.js serving the UI does not require moving app data to a server.

## Links to related files

- [PLAN.md](../../PLAN.md)
- [src/app/layout.tsx](../../src/app/layout.tsx)
- [src/app/page.tsx](../../src/app/page.tsx)
- [src/hooks/useQuizSet.ts](../../src/hooks/useQuizSet.ts)
- [10-pwa-and-offline.md](./10-pwa-and-offline.md)
- [Next.js path aliases and imports](https://nextjs.org/docs/app/getting-started/installation#path-aliases-and-imports)
