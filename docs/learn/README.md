# Documentation and learning guides

Step-by-step notes about the tools, concepts, and patterns used in AskMe.

## Phase 1: Local app (web)

- [01 — Vite, React, and TypeScript](./01-vite-react-typescript.md): How the original Vite scaffold worked and how the current app is started with Next.js.
- [02 — Tailwind and themes](./02-tailwind-and-themes.md): How utility styles, CSS variables, and saved preference create light and dark modes.
- [03 — Domain types and Dexie](./03-domain-types-and-dexie.md): How TypeScript models quiz data and how Dexie stores it locally.
- [04 — Repository and tests](./04-repository-and-tests.md): How persistence rules are centralized and tested with IndexedDB in memory.
- [05 — Routing and sets](./05-routing-and-sets.md): How Next.js App Router pages connect URLs to set screens and repository-backed actions.
- [06 — Question editor](./06-question-editor.md): How a controlled form validates and saves MCQ and essay data before it reaches the repository.
- [07 — Quiz modes and shuffling](./07-quiz-modes-and-shuffling.md): How the app filters questions by mode and randomizes their order for each quiz.
- [08 — Quiz flow and scoring](./08-quiz-flow-and-scoring.md): How a quiz run tracks answers, reveals results, and totals the score.
- [09 — JSON import and export](./09-json-import-export.md): How sets are exported as JSON and re-imported with schema validation.
- [10 — PWA and offline (deferred)](./10-pwa-and-offline.md): What the former PWA setup did and how its service worker was removed while preserving local data.
- [11 — Responsive layout](./11-responsive-layout.md): How the UI starts phone-first and expands gracefully on larger screens.
- [phase-1-recap](./phase-1-recap.md): A summary of the Phase 1 app and its key decisions.

## Phase 2: AI features

- [12 — Browser storage and API keys](./12-secure-storage-and-api-keys.md): How provider API keys stay outside the database and why browser `localStorage` is not encrypted secure storage.
- [13 — Gemini client and errors](./13-gemini-client-and-errors.md): How the app calls Gemini with safeguards for timeouts, malformed JSON, and readable failure messages.
- [14 — AI question generation](./14-ai-question-generation.md): How generated MCQ and essay prompts are validated, previewed, and inserted into a set.
- [15 — AI essay grading](./15-ai-essay-grading.md): How essay answers get scored with a structured result object and shown in the quiz flow.
- [16 — Validating AI responses](./16-validating-ai-responses.md): How the app rejects malformed AI output before it reaches the app model or repository.
- [17 — AI provider abstraction](./17-ai-provider-abstraction.md): How the app keeps provider-specific API keys separate and lets the same AI flow run against Gemini or OpenAI.
- [phase-2-recap](./phase-2-recap.md): A summary of the Phase 2 Gemini integration and the key guardrails it introduced.

## Phase 3: Next.js and Google Drive sync

- [18 — Next.js App Router](./18-nextjs-app-router.md): How file-based routes, Server/Client Components, and browser-only data fit together in AskMe.
