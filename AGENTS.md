# AGENTS.md

Instructions for AI coding agents working on this repository. Read this file first, then `README.md` and `docs/project-overview.md`.

## Project

AskMe is a local-first study app built with Next.js App Router, React, and TypeScript. Study content and progress are stored in browser IndexedDB through Dexie. There is no application backend or automatic cloud sync. The current product scope and architecture are described in `docs/project-overview.md`.

## Start of a task

1. Read `docs/project-overview.md` for current product scope and architecture.
2. Read `DESIGN.md` before changing interface styles.
3. Read `docs/learn/README.md` before adding a learning guide.
4. Inspect the relevant implementation and tests before editing.
5. For dependency work, check installed versions and `npm outdated`; do not upgrade without asking.

There is no active milestone plan in this repository. Work from the user's current request and relevant code/tests; do not infer unfinished work from old phase numbers or historical learning guides. Keep `docs/project-overview.md` accurate when product scope or high-level structure changes. Record technical decisions in relevant documentation when they affect future work.

## Engineering conventions

- **Language:** TypeScript with `strict: true`. Avoid `any` unless there is a documented reason.
- **Data access:** persistence lives under `src/lib/data/`. UI code uses exported data functions and never imports Dexie directly.
- **Domain types:** shared study models live in `src/types/`.
- **Platform APIs:** browser platform adapters live under `src/platform/`.
- **IDs:** use UUIDs (`crypto.randomUUID()`), never auto-incrementing IDs.
- **Data lifecycle:** preserve existing soft-delete and timestamp behavior. Timestamps are ISO 8601 UTC strings.
- **Secrets:** AI provider keys are stored in browser `localStorage`, which is not encrypted secure storage. Never write keys to study data, backups, logs, or git.
- **Themes:** light and dark only, using CSS variables.
- **Dependencies:** prefer few, well-maintained packages. Do not upgrade or add a dependency without the user's approval; record approved dependency decisions in documentation.
- **Routing:** use Next.js App Router under `src/app/`, `Link` from `next/link`, and navigation hooks from `next/navigation`. Keep browser-only UI and IndexedDB access in Client Components. Do not move user data or API keys to server storage.
- **React:** function components only. No `React.FC` or `forwardRef`; React 19 accepts `ref` as a normal prop. The React Compiler is enabled, so do not add `useMemo`, `useCallback`, or `React.memo` unless a measured problem justifies it.
- **Tooling:** ESLint uses flat config. Tailwind v4 uses its PostCSS plugin; theme tokens are in CSS and documented in `DESIGN.md`. Keep the React Compiler enabled through `next.config.ts`.
- **Design:** `DESIGN.md` is authoritative for app styling, including colors, typography, spacing, shape, motion, and component states. Use its tokens. If a required style is missing, update the design guide and implementation together.
- **Tests:** keep tests under `tests/`, grouped by the behavior or feature they cover. Shared test setup is in `tests/setup.ts`.
- **Documentation:** add concise JSDoc to exported functions, classes, and public types when it clarifies behavior or contracts. Add inline comments only for non-obvious reasoning.

## Keeping code current

The installed versions in `package.json` are authoritative. Before using APIs from React, Next.js, Dexie, Tailwind, Vitest, ESLint, or TypeScript, check the official documentation for the installed major version. Do not rely on examples for older major versions. Treat deprecation warnings and type-check hints as issues to resolve.

## Learning guides

The owner is building this project to learn. Keep general project documentation in `docs/` and step-by-step explanations in `docs/learn/`.

- When introducing a library, concept, logic pattern, or configuration in code, create or update a matching learning guide before or alongside that code change.
- Keep `docs/learn/README.md` as the index. Add guides at the end; do not renumber existing lessons.
- Keep each guide focused and practical, normally under 150 lines. Explain the problem, the concept, how it appears in this project, a common mistake, a small exercise, and key takeaways.
- Keep old guides as learning history. They may explain earlier implementations; current architecture belongs in `docs/project-overview.md`.
- At the end of a learning phase, add a recap with five quiz questions and answers hidden at the bottom.

## Commands

```sh
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
```

Run relevant checks for code changes. Documentation-only changes do not require application test suites, but should be checked for stale statements, broken links, and whitespace issues.

## Do not

- Add a backend or server dependency.
- Sync or log AI provider keys.
- Change the JSON set format without bumping `schemaVersion` and adding a migration.
- Put a new library, concept, pattern, or config decision into code without a matching learning guide.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes -- APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` -- verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
