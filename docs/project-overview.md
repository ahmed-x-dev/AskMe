# AskMe Project Overview

This document describes the product and code that exist today. Update it when the product scope or high-level architecture changes.

## Vision

AskMe is a personal, local-first study workspace. It helps a learner move from organizing material to practicing recall:

1. Organize a subject as a roadmap with topics and groups.
2. Keep notes, lessons, links, and local documents with the topic they support.
3. Build and take quizzes, then revisit questions through spaced review.
4. Use optional AI assistance for question generation and essay feedback.

The product should remain useful without an account or application server. The learner's study library and progress belong to the browser profile where they were created, with backup and restore available for portability.

## Current Product Boundaries

- **Web application:** Next.js App Router, React, TypeScript, and Tailwind CSS.
- **Local data:** Dexie stores study content and progress in browser IndexedDB. There is no remote database, user account, or automatic cross-device sync.
- **Backups:** users can export and restore local study data. Backup files are distinct from AI provider settings.
- **AI:** provider requests run from the browser. Provider keys are kept in browser `localStorage`; this is convenient but is not encrypted secure storage. Keys must not be written to study data, backups, or logs.
- **PWA:** the app has a manifest and service worker for installability and offline support. Dynamic routes and resources have offline limitations.

## Current Feature Areas

- Roadmap and topic management, including topic groups.
- Topic lessons, Markdown notes, links, and locally stored lesson documents.
- Question authoring, import/export, quiz setup and sessions, results, and saved attempts.
- Due-question review and progress summaries.
- Optional AI question generation and essay grading with validated provider responses.
- Appearance and AI settings, data backup and restore, and PWA installation/offline behavior.

## Code Structure

| Location | Responsibility |
|---|---|
| `src/app/` | Next.js routes and app-wide layout, manifest, service worker, and offline page. |
| `src/components/` | Reusable screens and UI grouped by feature (topics, quiz, review, settings, backup, and layout). |
| `src/features/ai/` and `src/features/quiz/` | Domain workflows that are shared by the UI and tests. |
| `src/lib/data/` | Dexie database, queries, mutations, and backup persistence. Keep database access within this layer. |
| `src/lib/` | Shared validation, formatting, progress, scheduling, file, and backup helpers. |
| `src/platform/` | Browser platform adapters, including secure-storage and backup-storage boundaries. |
| `src/types/study.ts` | Shared study-domain types. |
| `tests/` | Vitest coverage, organized around data, UI, platform, and feature behavior. |
| `docs/learn/` | Step-by-step explanations of the stack and project patterns, including historical lessons. |
| `DESIGN.md` | Authoritative visual tokens, component rules, and screen guidance. |

## Working From This Overview

Use this page for current product scope and architecture. Use `DESIGN.md` for interface decisions and `docs/learn/README.md` for learning material. The source code and tests are authoritative when a description here becomes stale. Do not treat removed roadmap or upgrade-plan files as active plans.