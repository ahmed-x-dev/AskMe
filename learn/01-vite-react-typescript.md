# Vite, React, and TypeScript

**Goal:** Understand how AskMe starts in the browser and how its development tools fit together.

## Why we need it

Vite serves the app while we work and builds optimized files for release. React renders the interface. TypeScript checks our code before it runs.

## The concept, simply

The browser loads `index.html`, which points to `src/main.tsx`. That entry file mounts the React app into the page. Vite handles this module entry in development and bundles it for production.

The package scripts are shortcuts:

- `npm run dev` starts Vite's development server.
- `npm run build` runs the TypeScript build check and creates the production bundle.
- `npm run typecheck` checks TypeScript without emitting files.
- `npm run lint` runs ESLint.
- `npm run test` runs Vitest once.

ESLint checks code patterns; TypeScript checks types. Vitest runs automated tests. These tools catch different classes of mistakes.

## In our code

From `src/main.tsx`:

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

- Imports bring in React's root API, global CSS, and the top-level `App`.
- `getElementById('root')` finds the mount point declared by the HTML page. `!` tells TypeScript it exists.
- `createRoot(...).render(...)` asks React to render the component tree there.
- `StrictMode` helps reveal certain mistakes during development; it is not a production UI wrapper.

`vite.config.ts` connects Vite to React, the React Compiler, Tailwind, and Vitest's jsdom test environment.

## ❌ / ✅ examples

❌ Put UI startup code in an unrelated page component.

✅ Keep one clear entry point in `src/main.tsx`; let `App` and its children describe the UI.

## Try it yourself

1. Run `npm run dev` and open the local URL Vite prints.
2. Temporarily change the heading in `src/App.tsx`, then observe the browser update.
3. Run `npm run build` and inspect the generated `dist/` folder.

## Quick Reference

```sh
npm run dev
npm run build
npm run typecheck
npm run lint
npm run test
```

## Key Takeaways

- `src/main.tsx` is the browser entry point.
- React renders the component tree into the HTML root element.
- Vite serves modules during development and bundles the production app.
- Typecheck, lint, and tests are separate checks; use all relevant ones.

## Links to related files

- [02 — Tailwind and themes](./02-tailwind-and-themes.md)
- Project scripts: [package.json](../package.json)
- Entry point: [src/main.tsx](../src/main.tsx)
- Vite and Vitest setup: [vite.config.ts](../vite.config.ts)
