# Phase 1 recap: local revision app in the browser

Phase 1 built the core app in the browser: the set library, question editor, quiz flow, import/export, PWA shell, and the mobile-first layout.

## What we covered

- Vite, React, TypeScript, and the project scripts.
- Tailwind styling with a dark/light theme toggle.
- Quiz data types and IndexedDB-backed repository logic.
- Browser routes for sets and question editing.
- Question editing with validation for MCQ and essay fields.
- Randomized quiz modes and a score screen.
- JSON import/export and schema validation.
- Installable PWA behavior with a service worker.
- Responsive layout changes for small screens and larger displays.

## Quiz questions

1. What is the purpose of the repository layer in this project?
2. Why do MCQ questions validate answer options before saving?
3. What is the difference between a quiz queue and the original set data?
4. Why does a JSON import check `schemaVersion` before using the file?
5. What does the service worker add to the web app?

<details>
  <summary>Reveal answers</summary>

  1. It centralizes data access and keeps Dexie logic away from UI components.
  2. So invalid or duplicate choices do not corrupt the quiz data or confuse grading.
  3. The queue is a temporary, filtered, randomized list used for a session; the set remains the source of truth.
  4. It prevents incompatible or malformed exports from being accepted silently.
  5. It caches the app shell so the app can continue loading offline after the first successful visit.
</details>

## Related files

- `learn/README.md`
- `app/page.tsx`
- `app/set/[id]/page.tsx`
- `src/data/repository.ts`
- `src/components/QuizPage.tsx`
