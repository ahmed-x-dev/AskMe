# Documentation and learning guides

Step-by-step notes about the tools, concepts, and patterns used in AskMe.

Some early guides describe previous implementations. For the current product scope and architecture, see [the project overview](../project-overview.md).

## Phase 1: Local app (web)

- [01 — Vite, React, and TypeScript](./01-vite-react-typescript.md): How the original Vite scaffold worked and how the current app is started with Next.js.
- [02 — Tailwind and themes](./02-tailwind-and-themes.md): How utility styles, CSS variables, and saved preference create light and dark modes.
- [03 — Domain types and Dexie](./03-domain-types-and-dexie.md): How TypeScript models quiz data and how Dexie stores it locally.
- [04 — Repository and tests](./04-repository-and-tests.md): How persistence rules are centralized and tested with IndexedDB in memory.
- [05 — Routing and sets](./05-routing-and-sets.md): How Next.js App Router pages connect URLs to set screens and repository-backed actions.
- [06 — Question editor](./06-question-editor.md): How a controlled form validates and saves MCQ and essay data before it reaches the repository.
- [07 — Quiz modes and shuffling](./07-quiz-modes-and-shuffling.md): How the app filters questions by mode and randomizes their order for each quiz.
- [08 — Quiz flow and scoring](./08-quiz-flow-and-scoring.md): How a quiz run tracks answers, reveals results, and totals the score.
- [09 — Roadmap import and export](./09-json-import-export.md): How roadmap files and full backups are validated, size-limited, and restored atomically.
- [10 — PWA installation and offline support](./10-pwa-and-offline.md): The original PWA setup, later disabled and reintroduced in P4-09.
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

## Phase 3: Next.js architecture

- [18 — Next.js App Router](./18-nextjs-app-router.md): How file-based routes, Server/Client Components, and browser-only data fit together in AskMe.

## Phase 4: PWA and offline use

- [10 — PWA installation and offline support](./10-pwa-and-offline.md): Installability, service-worker behavior, and current dynamic-route offline limits.

## Phase 5: Polish and extras

- [25 — Quiz session options](./25-quiz-session-options.md): How quiz filters, an elapsed timer, AI explanations, and a local-data migration work together.
- [26 — Icon components](./26-icon-components.md): How Lucide React replaces hand-written UI SVGs with accessible, tree-shakeable icon components.
- [27 — Set groups](./27-set-groups-and-touch-dragging.md): How persistent one-group-per-set metadata supports manual grouping.
- [28 — Shared UI interactions](./28-shared-ui-interactions.md): How menus, dialogs, forms, and feedback states stay accessible and consistent.
- [29 — Topic learning experience](./29-topic-learning-experience.md): How a topic overview guides study through notes, resources, progress, and practice.
- [30 — Focused quiz and review](./30-focused-quiz-and-review.md): How setup, question feedback, attempt saving, results, and due reviews work together without changing scoring rules.
- [31 — Settings and data management](./31-settings-and-data-management.md): How appearance and AI preferences share app state, and how backup/restore actions explain their effects.
- [32 — Optional question types](./32-question-types.md): How new question variants extend the shared schema without breaking the quiz or AI pipelines.
- [33 — Topic lessons and local documents](./33-topic-lessons-and-local-documents.md): How lessons group materials and questions, store local documents, and preview/edit Markdown files in the app.
- [34 — Editing AI prompts](./34-ai-prompt-configuration.md): How AI instruction wording is kept in one editable configuration file.
