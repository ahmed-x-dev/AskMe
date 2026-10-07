# AGENTS.md

Instructions for AI coding agents working on this repo. Read this file first, then `PLAN.md`.

## What this project is

A mobile-first revision quiz app (MCQ and essay questions) built with Vite + React + TypeScript, wrapped with Capacitor for Android and iOS. Data is stored locally in Dexie (IndexedDB) and synced through the user's Google Drive. There is no backend. Full details are in `PLAN.md`.

## Start-of-session checklist

1. Read `PLAN.md`, starting with the **Status** block at the top.
2. Find the current phase and the first task that is not `[x]`.
3. If a task is `[~]` (in progress), continue it. Do not start another task.
4. Read the **Decisions Log** so you do not reverse a decision without cause.
5. Run `npm outdated` and note any new major versions in the Changelog. Do not upgrade without asking.

## How to track progress

`PLAN.md` is the single source of truth for progress. Keep it up to date as you work.

**Task markers**

| Marker | Meaning |
|---|---|
| `[ ]` | Not started |
| `[~]` | In progress (only one task at a time) |
| `[x]` | Done and verified against its "Done when" line |
| `[!]` | Blocked (add a reason on the line below) |

**Rules**
- Mark a task `[~]` before you start it and `[x]` only after its **Done when** condition is met.
- Update the **Status** block (`current_phase`, `current_task`, `last_updated`) every time a task changes state.
- When all tasks in a phase are `[x]` and its **Exit criteria** pass, set the phase status to `done` and move `current_phase` to the next phase.
- Never skip ahead to a later phase while an earlier phase is not `done`, unless the user says so.
- Add a line to the **Changelog** at the end of each session: date, what was done, what is next.
- If you make a technical decision (library, schema change, trade-off), add it to the **Decisions Log** with a reason.
- If you find a new needed task, add it to the right phase with the next free ID. Do not delete tasks; mark them `[!]` or note why they were dropped.

## Conventions

- **Language:** TypeScript with `strict: true`. No `any` unless commented with a reason.
- **Data access:** only through `src/data/repository.ts`. UI code never imports Dexie directly.
- **Domain types:** shared domain models live under `src/types/`, grouped by domain.
- **Platform APIs** (secure storage, share, notifications, OAuth): only through `src/platform/`.
- **IDs:** UUIDs (`crypto.randomUUID()`). Never auto-increment.
- **Deletes:** soft delete only (`deleted: true` and a new `updatedAt`). Never remove rows during normal use.
- **Timestamps:** ISO 8601 UTC strings.
- **Secrets:** the Gemini API key lives in per-device secure storage and must never be written to the database, the sync files, logs, or git.
- **Themes:** light and dark only, using CSS variables. No third theme.
- **Dependencies:** prefer few, well-maintained packages. Mention any new dependency in the Decisions Log.
- **Routing:** React Router v7 in library mode. Install `react-router` only (not `react-router-dom`) and import everything from `"react-router"` (`createBrowserRouter`, `RouterProvider`, `Link`, `useParams`, `useNavigate`). Do not use framework mode (no `react-router.config.ts`, no SSR, no file-based routes). Define all routes in `src/routes.tsx`.
- **React:** function components only. No `React.FC`, no `forwardRef` (`ref` is a normal prop in React 19). The React Compiler is enabled, so do not add `useMemo`, `useCallback` or `React.memo` unless you have measured a problem.
- **Tooling:** ESLint uses flat config (`eslint.config.js`). Tailwind v4 has no `tailwind.config.js` and no PostCSS config; theme tokens live in CSS (`@theme`) as described in `DESIGN.md`. Do not swap or "fix" the Vite/Babel React setup (`@vitejs/plugin-react` with the React Compiler preset).
- **Tests:** keep tests under `tests/`, mirroring the relevant `src/` area (for example, `tests/data/repository.test.ts` for `src/data/repository.ts`). Put shared test setup in `tests/setup.ts`.
- **Comments and docs:** add concise JSDoc to exported functions, classes, and public types when it clarifies purpose, behavior, or contracts (especially null/error behavior, units, indexing, and persistence rules). Add inline comments only for non-obvious reasoning. Do not write comments that merely repeat the code.

## Keeping code up to date

Your training data is older than the libraries in this repo. Do not rely on memory for library APIs.

- The installed versions in `package.json` are the source of truth. If a doc, example or your memory disagrees, follow the installed version.
- Before using an API from React, React Router, Zustand, Dexie, Tailwind, Vite, Vitest, ESLint, TypeScript, Capacitor or vite-plugin-pwa, check the official docs for the installed major version (docs tools, Context7 or web search if available).
- Install packages with `npm install <pkg>@latest`. Never copy a version number from memory.
- When you add Zustand, Dexie or any other new package, read its current docs first and do not assume patterns from older major versions.
- Treat deprecation warnings, ESLint warnings and TypeScript deprecation hints as bugs. Fix them before marking a task `[x]`.
- If you are unsure whether an API still exists, verify it, and note the uncertainty in the Changelog.

## Commands

These scripts were set up in task P1-01:

```
npm run dev        # start dev server
npm run build      # production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm run test       # unit tests
```

Before marking a task `[x]`, run `typecheck`, `lint` and `test` (when they exist) and make sure they pass.

## Do not

- Do not add a backend or a server dependency.
- Do not sync or log the Gemini key.
- Do not hard-delete synced data.
- Do not change the JSON set format without bumping a `schemaVersion` and adding a migration.
- Do not rewrite or delete `PLAN.md` sections to hide unfinished work.
