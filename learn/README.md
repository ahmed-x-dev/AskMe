# Learn

Step-by-step notes about the tools, concepts, and patterns used in AskMe.

## Phase 1: Local app (web)

- [01 — Vite, React, and TypeScript](./01-vite-react-typescript.md): How the app starts and how its tooling checks the project.
- [02 — Tailwind and themes](./02-tailwind-and-themes.md): How utility styles, CSS variables, and saved preference create light and dark modes.
- [03 — Domain types and Dexie](./03-domain-types-and-dexie.md): How TypeScript models quiz data and how Dexie stores it locally.
- [04 — Repository and tests](./04-repository-and-tests.md): How persistence rules are centralized and tested with IndexedDB in memory.
- [05 — Routing and sets](./05-routing-and-sets.md): How browser routes are defined and how set CRUD flows are kept in sync with the local repository.
- [06 — Question editor](./06-question-editor.md): How a controlled form validates and saves MCQ and essay data before it reaches the repository.
- [07 — Quiz modes and shuffling](./07-quiz-modes-and-shuffling.md): How the app filters questions by mode and randomizes their order for each quiz.
- [08 — Quiz flow and scoring](./08-quiz-flow-and-scoring.md): How a quiz run tracks answers, reveals results, and totals the score.
- [09 — JSON import and export](./09-json-import-export.md): How sets are exported as JSON and re-imported with schema validation.
- [10 — PWA and offline](./10-pwa-and-offline.md): How the web app installs as a standalone app and caches its shell for offline use.
- [11 — Responsive layout](./11-responsive-layout.md): How the UI starts phone-first and expands gracefully on larger screens.
- [phase-1-recap](./phase-1-recap.md): A summary of the Phase 1 app and its key decisions.
