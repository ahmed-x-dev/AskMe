# Vite, React, and TypeScript

**Goal:** Understand how AskMe starts in the browser and how its development tools fit together.

> Historical note: Phase 1 used Vite and React Router. The app now uses Next.js App Router; see [18 — Next.js App Router](./18-nextjs-app-router.md) for the current setup.

## Why we need it

The original Phase 1 app used Vite to serve and bundle the UI. React rendered the interface, and TypeScript checked the code before it ran. The requested migration replaced Vite with Next.js.

## The concept, simply

In the original Vite setup, the browser loaded `index.html`, which pointed to `src/main.tsx`. That entry file mounted React into the page. The current Next.js setup uses `app/` file-based routes and a shared root layout instead.

The package scripts still provide the same checks, but now run Next.js:

- `npm run dev` starts Next.js in development.
- `npm run build` creates the production build.
- `npm run typecheck` checks TypeScript without emitting files.
- `npm run lint` runs ESLint.
- `npm run test` runs Vitest once.

ESLint checks code patterns; TypeScript checks types. Vitest runs automated tests. These tools catch different classes of mistakes.

## In our code

This historical excerpt shows the original React mount:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- Imports brought in React's root API, global CSS, and the top-level `App`.
- `getElementById('root')` finds the mount point declared by the HTML page. `!` tells TypeScript it exists.
- `createRoot(...).render(...)` asked React to render the component tree there.
- `StrictMode` helps reveal certain mistakes during development; it is not a production UI wrapper.

Next.js now provides the page and document structure. The current entry route is `app/page.tsx`; `next.config.ts` enables the React Compiler.

## ❌ / ✅ examples

❌ Put UI startup code in an unrelated page component.

✅ Keep route definitions in `app/` and shared document structure in `app/layout.tsx`.

## Try it yourself

1. Run `npm run dev` and open `http://localhost:3000`.
2. Temporarily change a heading in `src/components/SetsPage.tsx`, then observe the browser update.
3. Run `npm run build` and inspect the generated `.next/` folder.

## Quick Reference

```sh
npm run dev
npm run build
npm run typecheck
npm run lint
npm run test
```

## Key Takeaways

- Vite was the original development server and bundler.
- Next.js now maps files in `app/` to routes and builds the web app.
- React renders the UI and TypeScript checks its types.
- Typecheck, lint, and tests are separate checks; use all relevant ones.

## Links to related files

- [02 — Tailwind and themes](./02-tailwind-and-themes.md)
- Project scripts: [package.json](../../package.json)
- Current entry route: [app/page.tsx](../../app/page.tsx)
- Current framework guide: [18 — Next.js App Router](./18-nextjs-app-router.md)
