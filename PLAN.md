# PLAN.md: Revision Quiz App

## Status

> Agents: update this block whenever a task changes state.

```yaml
current_phase: P3
current_task: P3-01
last_updated: 2026-10-12
phases:
  P1: { name: "Local app (web)", status: done }
  P2: { name: "AI features", status: done }
  P3: { name: "Google Drive sync", status: not_started }
  P4: { name: "Mobile (Capacitor) and store release", status: not_started }
  P5: { name: "Polish and extras", status: in_progress }
```

Phase status values: `not_started`, `in_progress`, `done`, `blocked`.
Task markers: `[ ]` todo, `[~]` in progress, `[x]` done, `[!]` blocked.

---

## 1. Vision

A simple, fast revision app for short study sessions on any device. The user builds question sets (MCQ and essay), practices them in different modes, and gets AI help generating questions and grading essays. Anything added on one device appears on the others, with no backend to run.

**Principles**

- Mobile first. Web and desktop come almost for free.
- One codebase for web, Android and iOS.
- No backend. Local storage plus sync through the user's own Google Drive.
- Simple UI with two themes only: light (white) and dark (black).
- The user owns their data. Each set is a plain JSON file that can be exported and imported.
- The project is also a learning exercise: everything new gets an explanation file in `learn/` (rules in `AGENTS.md`).

## 2. Requirements

**Question types**

- MCQ: checked against the correct answer stored in the set's JSON.
- Essay: evaluated by AI (Gemini), using an optional reference answer.

**Quiz modes:** random (mixed), MCQ only, essay only.

**AI (optional)**

- User supplies their own free Gemini API key.
- AI generates MCQ or essay questions; the user can add a liked one to the set.
- The key stays on the device and is never synced.

**Platforms and sync:** web, Android, iOS. Adds, edits and deletes sync across devices.

**Later ideas:** images in questions, English UI and content, spaced repetition, daily reminders and streaks, generating sets from notes or photos.

## 3. Tech Stack

| Concern        | Choice                                                     |
| -------------- | ---------------------------------------------------------- |
| Language       | TypeScript (strict)                                        |
| UI             | React 19 + Vite (React Compiler enabled)                   |
| Routing        | React Router v7 (library mode, import from `react-router`) |
| Styling        | Tailwind CSS v4, light/dark via CSS variables              |
| State          | Zustand                                                    |
| Local database | Dexie (IndexedDB) behind a repository layer                |
| Mobile wrapper | Capacitor (Android, iOS)                                   |
| Web            | PWA (installable, offline)                                 |
| Sync           | Google Drive `appDataFolder` (OAuth PKCE, client-side)     |
| AI             | Gemini API from the client, structured JSON output         |
| Secrets        | Gemini key in per-device secure storage                    |
| Tests          | Vitest                                                     |

## 4. Data Model

One JSON file per set; this is also the sync and export format.

```json
{
  "schemaVersion": 1,
  "id": "set_uuid",
  "title": "Biology Ch.3",
  "updatedAt": "2026-10-06T10:00:00Z",
  "deleted": false,
  "questions": [
    {
      "id": "q_uuid",
      "type": "mcq",
      "text": "...",
      "options": ["A", "B", "C", "D"],
      "answerIndex": 2,
      "updatedAt": "2026-10-06T10:00:00Z",
      "deleted": false
    },
    {
      "id": "q_uuid2",
      "type": "essay",
      "text": "...",
      "referenceAnswer": "...",
      "updatedAt": "2026-10-06T10:00:00Z",
      "deleted": false
    }
  ]
}
```

**Rules**

- UUID ids, `updatedAt` on every record, soft deletes via `deleted: true`.
- Purge tombstones older than about 30 days (Phase 3).
- Optional `image` field is added later (Phase 5) without breaking old data.

## 5. Sync Design (Phase 3 reference)

One file per set (`<setId>.json`) in Drive's `appDataFolder`.

Per set: pull remote and its revision, merge by question `id` keeping the newer `updatedAt`, save locally, push with the pulled revision, retry if the push is rejected.

On a new device, always pull before pushing. Sync on app start, on focus, a few seconds after edits (debounced), and via a manual button.

```ts
interface SyncProvider {
  list(): Promise<{ name: string; rev: string }[]>;
  get(name: string): Promise<{ data: SetFile; rev: string } | null>;
  put(name: string, data: SetFile, baseRev?: string): Promise<{ rev: string }>;
}
```

## 6. Project Structure

```
src/
  routes.tsx       all route definitions (React Router)
  ui/              components, pages, themes
  features/
    quiz/          modes, shuffling, scoring
    sets/          set and question editing
    ai/            Gemini generation and grading
    sync/          Drive provider, merge logic
  data/
    db.ts          Dexie schema
    repository.ts  getSets, addQuestion, softDelete, ...
    importExport.ts
  platform/        secure storage, share, notifications, OAuth wrappers
learn/             explanation files for everything we add (see AGENTS.md)
```

---

## 7. Phases and Tasks

### Phase P1: Local app (web)

**Goal:** a fully working offline quiz app in the browser with no AI and no sync.

- [x] **P1-01** Scaffold Vite + React + TypeScript project; add ESLint, Vitest, and the scripts listed in `AGENTS.md`.
  - Done when: `dev`, `build`, `lint`, `typecheck`, `test` all run successfully.
  - Learn: `learn/01-vite-react-typescript.md` (backfill).
- [x] **P1-02** Add Tailwind and light/dark theming with CSS variables; theme toggle persists the choice.
  - Done when: both themes render correctly and the choice survives a reload.
  - Learn: `learn/02-tailwind-and-themes.md` (backfill).
- [x] **P1-03** Define TypeScript types (`QuizSet`, `Question`, `McqQuestion`, `EssayQuestion`) and the Dexie schema.
  - Done when: types compile and the DB opens in the browser.
  - Learn: `learn/03-domain-types-and-dexie.md` (backfill).
- [x] **P1-04** Implement `repository.ts` (list, create, update, soft delete for sets and questions) with unit tests.
  - Done when: tests cover create, update, soft delete, and listing excludes deleted rows.
  - Learn: `learn/04-repository-and-tests.md` (backfill).
- [x] **P1-05** Install React Router and define the routes in `src/routes.tsx` (see DESIGN.md section 6); Sets screen: list, create, rename, delete sets. Start only after reviewing the P1-01 to P1-04 learning-file backfill.
  - Done when: routing works with placeholder screens, and all four set actions work and persist after reload.
  - Learn: `learn/05-routing-and-sets.md`.
- [x] **P1-06** Question editor: add, edit, delete MCQ and essay questions in a set.
  - Done when: both types can be created and edited, and invalid input is rejected.
  - Learn: `learn/06-question-editor.md`.
- [x] **P1-07** Quiz engine: build a question list for random, MCQ-only and essay-only modes; Fisher-Yates shuffle; unit tests.
  - Done when: each mode returns only the right question types and tests pass.
  - Learn: `learn/07-quiz-modes-and-shuffling.md`.
- [x] **P1-08** Quiz screens: MCQ answering with instant correct/incorrect feedback; essay answering with a text box (grading stub for now); end-of-quiz score.
  - Done when: a full quiz can be completed in each mode.
  - Learn: `learn/08-quiz-flow-and-scoring.md`.
- [x] **P1-09** JSON import and export per set, with `schemaVersion` validation.
  - Done when: an exported set re-imports without loss, and bad files show a clear error.
  - Learn: `learn/09-json-import-export.md`.
- [x] **P1-10** PWA setup: manifest, icons, service worker for offline use.
  - Done when: the app installs and works offline after the first load.
  - Learn: `learn/10-pwa-and-offline.md`.
- [x] **P1-11** Make the layout mobile-first and responsive (small screens first, safe areas, touch-sized controls).
  - Done when: all screens are usable at 360px width and on desktop.
  - Learn: `learn/11-responsive-layout.md`.
- [x] **P1-12** Final learning check: verify that each P1-01 to P1-11 task has its matching lesson, `learn/README.md` indexes them in order, and the Phase 1 recap is complete.
  - Done when: `learn/01-...md` through `learn/11-...md` all exist and are indexed, and `learn/phase-1-recap.md` summarizes Phase 1 with five quiz questions and answers hidden at the bottom.

**Exit criteria:** every P1 task is `[x]`; `typecheck`, `lint`, `test` and `build` pass; the app works offline in the browser; `learn/phase-1-recap.md` exists.

### Phase P2: AI features

**Goal:** Gemini-powered question generation and essay grading.

- [x] **P2-01** `platform/secureStorage` abstraction (localStorage on web for now) and a settings screen to enter, replace and remove the Gemini key.
  - Done when: the key is saved, hidden in the UI by default, and never stored in the DB.
  - Learn: `learn/12-secure-storage-and-api-keys.md`.
- [x] **P2-02** Gemini client with structured JSON output, timeouts and clear error handling (bad key, rate limit, offline).
  - Done when: errors show readable messages and the app never crashes on API failure.
  - Learn: `learn/13-gemini-client-and-errors.md`.
- [x] **P2-03** Question generation: pick type and count, preview results, "Add to set" per question.
  - Done when: a generated MCQ or essay question can be added to a set and appears in quizzes.
  - Learn: `learn/14-ai-question-generation.md`.
- [x] **P2-04** Essay grading: send question, reference answer and user answer; return `{score, feedback, missingPoints}`; show in the quiz screen.
  - Done when: grading works for essays with and without a reference answer, and results display clearly.
  - Learn: `learn/15-ai-essay-grading.md`.
- [x] **P2-05** Validate all AI responses against the schema before use; reject malformed output.
  - Done when: malformed responses are handled with a retry or a clear message.
  - Learn: `learn/16-validating-ai-responses.md`.

**Exit criteria:** every P2 task is `[x]`; the key is never persisted outside secure storage; checks pass; `learn/phase-2-recap.md` exists.

### Phase P3: Google Drive sync

**Goal:** changes on one device appear on all others.

- [ ] **P3-01** Merge function (per-question newest `updatedAt` wins, tombstones respected) with thorough unit tests.
  - Done when: tests cover add, edit, delete, and concurrent edits from two devices.
  - Learn: `learn/17-merging-synced-data.md`.
- [ ] **P3-02** Google OAuth (PKCE) with the `drive.appdata` scope; sign in and sign out.
  - Done when: the user can sign in on web and the token is stored securely.
  - Learn: `learn/18-google-oauth-and-pkce.md`.
- [ ] **P3-03** `SyncProvider` implementation for Drive `appDataFolder` (list, get, put with revision check).
  - Done when: files can be created, read, and updated, and stale writes are rejected.
  - Learn: `learn/19-google-drive-sync-provider.md`.
- [ ] **P3-04** Sync engine: pull, merge, save, push, retry on conflict; first sync on a new device pulls before pushing.
  - Done when: two browsers stay consistent after edits and deletes on either one.
  - Learn: `learn/20-sync-engine-and-conflicts.md`.
- [ ] **P3-05** Sync triggers (start, focus, debounced after edit) and a manual "Sync now" button with status and error display.
  - Done when: status shows idle, syncing, error, and last-synced time.
  - Learn: `learn/21-sync-triggers-and-status.md`.
- [ ] **P3-06** Tombstone purge for records older than 30 days.
  - Done when: old tombstones are removed locally and remotely without resurrecting data.
  - Learn: `learn/22-tombstone-retention.md`.

**Exit criteria:** every P3 task is `[x]`; manual test with two devices or browsers passes (add, edit, delete, offline edit, reconnect); `learn/phase-3-recap.md` exists.

### Phase P4: Mobile (Capacitor) and store release

**Goal:** Android and iOS apps, published.

- [ ] **P4-01** Add Capacitor; create Android and iOS projects; `cap sync` works in the build flow.
  - Done when: the app launches on an Android emulator or device.
  - Learn: `learn/23-capacitor-project-setup.md`.
- [ ] **P4-02** Replace web OAuth with a native or system-browser flow for Google sign-in.
  - Done when: sign-in works on a real Android device (and iOS when available).
  - Learn: `learn/24-native-google-sign-in.md`.
- [ ] **P4-03** Move the Gemini key to native secure storage via the `platform/` layer.
  - Done when: the key is stored in the keychain/keystore on device.
  - Learn: `learn/25-native-secure-storage.md`.
- [ ] **P4-04** Native touches: haptics, share sheet, safe areas, keyboard handling, local reminder notifications.
  - Done when: each works on a real device.
  - Learn: `learn/26-native-device-features.md`.
- [ ] **P4-05** App icon, splash screen, store screenshots, privacy policy (mention Gemini and Drive).
  - Done when: all store assets exist.
  - Learn: `learn/27-app-branding-and-privacy.md`.
- [ ] **P4-06** Google Play: developer account, signed AAB, testing track, production release.
  - Done when: the app is live or in review on Google Play.
  - Learn: `learn/28-google-play-release.md`.
- [ ] **P4-07** App Store (optional): Apple developer account, Xcode archive or cloud build, TestFlight, submission.
  - Done when: the app is in review or live on the App Store.
  - Learn: `learn/29-app-store-release.md`.

**Exit criteria:** P4-01 to P4-06 are `[x]` (P4-07 is optional); the app installs and syncs on a real device; `learn/phase-4-recap.md` exists.

### Phase P5: Polish and extras

**Goal:** improvements after the core is stable. Pick in any order.

- [ ] **P5-01** Images in questions (stored as hashed files, synced alongside sets).
  - Learn: `learn/30-question-images-and-file-sync.md`.
- [ ] **P5-02** Spaced repetition: track results and resurface wrong answers.
  - Learn: `learn/31-spaced-repetition.md`.
- [ ] **P5-03** Daily reminders and streak counter.
  - Learn: `learn/32-reminders-and-streaks.md`.
- [ ] **P5-04** Generate question sets from pasted notes or a photo.
  - Learn: `learn/33-generating-from-notes-and-photos.md`.
- [ ] **P5-05** Full English UI and content pass (and optional i18n for Arabic).
  - Learn: `learn/34-localization-and-language.md`.
- [ ] **P5-06** Desktop wrapper with Tauri, only if needed.
  - Learn: `learn/35-tauri-desktop-wrapper.md`.
- [x] **P5-07** Improve the front-page theme control and responsive layout; add a set-import action.
  - Done when: the theme switch is icon-only and accessible, the library works on mobile and desktop, and valid/invalid JSON imports provide visible feedback.
  - Learn: `learn/02-tailwind-and-themes.md`, `learn/09-json-import-export.md`, `learn/11-responsive-layout.md`.
- [x] **P5-08** Replace set-detail whole-set import with additive question import; remove the All sets shortcut.
  - Done when: the set screen no longer shows All sets or Import JSON, imported Question JSON is validated and appended to the active set without overwriting its metadata/questions, and import errors are visible.
  - Learn: `learn/09-json-import-export.md`.
- [x] **P5-09** Replace the inner-page brand header with a back-to-library button.
  - Done when: the front page retains its AskMe logo, and every inner route has an accessible back link to the library with the theme control preserved.
  - Learn: `learn/11-responsive-layout.md`.
- [x] **P5-10** Make library set cards open on click and replace rename/delete labels with icon buttons.
  - Done when: the card navigates to its set, separate open button is gone, and rename/delete remain accessible 44px icon actions.
  - Learn: `learn/05-routing-and-sets.md`.
- [x] **P5-11** Add reference-answer reveal and self-assessment controls for essay quiz questions.
  - Done when: essay questions reveal their optional reference answer, let users mark themselves right or wrong, and count that mark in the final score without changing MCQ scoring.
  - Learn: `learn/08-quiz-flow-and-scoring.md`.

**Exit criteria:** none; this phase is ongoing.

---

## 8. Decisions Log

| Date       | Decision                                                     | Reason                                                                       |
| ---------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| 2026-10-06 | Vite + React + TS with Capacitor, not React Native           | Reuses existing web skills; UI is simple enough for a WebView                |
| 2026-10-06 | Mobile first, PWA first                                      | Revision happens in short sessions on phones                                 |
| 2026-10-06 | Sync through Google Drive, no backend                        | No server to build, host or pay for                                          |
| 2026-10-06 | Dexie (IndexedDB) for local storage                          | Same on web and Capacitor with no plugins; data is small and document-shaped |
| 2026-10-06 | Soft deletes with tombstones                                 | Required so deletes sync correctly                                           |
| 2026-10-06 | Gemini key never synced                                      | Per-device secret                                                            |
| 2026-10-07 | React Router v7, library mode, `react-router` only           | Most documented; no server needed; avoids the old `react-router-dom` habit   |
| 2026-10-07 | Start with browser routing                                   | Fine for PWA; revisit hash routing in P4-01 if Capacitor deep links break    |
| 2026-10-07 | Check docs for installed major versions                      | Agent training data is older than the libraries in use                       |
| 2026-10-07 | No manual memoization by default                             | React Compiler is enabled                                                    |
| 2026-10-07 | Keep tests under root `tests/`, mirroring `src/`             | Keeps production modules uncluttered and tests easy to locate                |
| 2026-10-07 | Keep shared domain types under `src/types/`                  | Groups reusable models by domain, separate from persistence implementation   |
| 2026-10-07 | Document API contracts with concise JSDoc                    | Clarifies non-obvious behavior without duplicating self-explanatory code     |
| 2026-10-07 | Maintain a `learn/` folder; owner writes code, agent reviews | The project is also a learning exercise                                      |

## 9. Open Questions

- Keep Dexie, or move to SQLite later if heavy queries are needed?
- Publish to the stores, or keep the PWA for personal use?
- Is an iOS build needed (requires a Mac or a cloud Mac build service)?
- Should essay questions require a reference answer?
- Browser history router or hash router once Capacitor is added (check in P4-01)?

## 10. Changelog

Add the newest entry at the top. Format: `YYYY-MM-DD: done / next`.

- 2026-10-12: Investigated the reported white screen. The app renders in a fresh browser; found the service worker served cached HTML indefinitely and returned HTML for failed asset requests. Updated it to use network-first navigation with an offline shell fallback, cache successful same-origin assets only, and bumped the cache version so old caches are removed. Next: confirm whether the user's installed/deployed app recovers after its service worker updates.
- 2026-10-12: Fixed three AI-provider review findings: documented that browser `localStorage` is not encrypted secure storage, moved Gemini key authentication from the URL to `x-goog-api-key`, and invalidated stale essay-grading responses when answers or quiz questions change. Added a request-header regression assertion and updated the related lessons. `typecheck`, `lint`, `test`, and `build` pass. Next: P3-01 (merge logic and sync design).
- 2026-10-12: Added provider-aware AI key storage and request routing so the app can use Gemini or OpenAI with a separate saved key per provider, while keeping the rest of the generation and grading flow the same. `typecheck`, `lint`, `test`, and `build` all pass. Next: P3-01 (merge logic and sync design).
- 2026-10-12: Phase 2 complete. Added browser secure storage for the Gemini key, a settings screen, the Gemini API client with timeout and validation guards, generated-question previews that can be inserted into a set, AI essay grading with a visible score and feedback, and the required phase recap and lesson index updates. `typecheck`, `lint`, `test`, and `build` pass. Next: P3-01 (merge logic and sync design).
- 2026-10-12: Added a reveal-reference and self-assessment flow for essay quiz questions; quiz scores now use the learner's right/wrong mark for essays while MCQs retain answer-key scoring. `typecheck`, `lint`, `test`, `build`, and manual quiz-flow checks pass. `npm outdated` reports newer majors for @babel/core (8), @types/node (26), and TypeScript (7), plus a Vite patch update; none upgraded. Next: P2-01 (secure storage and Gemini API key settings).
- 2026-10-12: Made the entire set card a link, removed its separate Open button, and replaced Rename/Delete text with accessible 44px icon buttons. Verified card navigation, delete action, and 44px controls at 360px. `typecheck`, `lint`, all 13 tests, and `build` pass. Next: continue the UI/UX iterations; P2-01 remains the next roadmap task.
- 2026-10-12: Kept the AskMe brand in the library header and replaced it on inner routes with a touch-sized “Back to sets” link; the theme toggle remains in place. Verified on a 360px viewport and confirmed the link returns to the library. `typecheck`, `lint`, all 13 tests, and `build` pass. Next: continue the UI/UX iterations; P2-01 remains the next roadmap task.
- 2026-10-12: Removed the set-detail “All sets” shortcut and replaced whole-set import there with question import. It accepts a Question, Question array, or set export, validates the questions, assigns fresh IDs, and appends them without replacing the destination set; failures and success are visible. `typecheck`, `lint`, all 13 tests, `build`, and a browser single-question import check pass. Next: continue the UI/UX iterations; P2-01 remains the next roadmap task.
- 2026-10-12: Made the theme switch icon-only and accessible, improved library layouts on phone and desktop, and added front-page JSON import with visible success/error feedback. `typecheck`, `lint`, `test` (9 tests), `build`, browser import checks, and 360px/1440px overflow checks pass. `npm outdated` reports newer majors for @babel/core (8), @types/node (26), and TypeScript (7); none upgraded. Next: continue the requested UI/UX iterations; P2-01 remains the next roadmap task.
- 2026-10-11: Refined the library, set details, question editor, quiz, and shared header using the existing design tokens; fixed the library's desktop two-column width and improved touch targets and progress feedback. No dependencies or theme tokens added. Next: P2-01 (secure storage and Gemini API key settings).
- 2026-10-11: Phase 1 complete. Added question editing with validation, quiz mode shuffling and scoring, JSON import/export with schema checks, a service-worker-based offline shell, and a responsive layout; the phase 1 lessons and recap are all indexed and present. `typecheck`, `lint`, `test`, and `build` all pass. Next: P2-01 (secure storage and Gemini API key settings).
- 2026-10-09: P1-05 complete. Installed React Router v7, defined the browser route tree, and added a set library screen with working create, rename, delete, and list actions that persist to IndexedDB and survive reloads. The app renders a set detail screen and a placeholder question editor route as required. `typecheck`, `lint`, `test`, and `build` all pass. Next: P1-06 (question editor).
- 2026-10-07: Reviewed P1-01 to P1-05 and the P1-01 to P1-04 backfill; corrected the repository example and clarified that TypeScript types do not validate runtime data. `typecheck`, `lint`, `test` (5 tests), and `build` pass. P1-05 remains not started. Next: begin P1-05 only when requested.
- 2026-10-07: Made `DESIGN.md` authoritative in `AGENTS.md` and aligned the current app theme tokens and placeholder screen with its colors, typography, card, button, focus, and motion rules. Updated the matching learn note. Next: keep using DESIGN.md for all UI work; P1-05 remains not started.
- 2026-10-07: Added a matching sequential learn-file reference to every P2-P5 task as well as P1-01 to P1-11; phase recap files remain required by each phase's exit criteria. Backfilled and indexed P1-01 to P1-04; no later task started. Next: review the backfill before beginning P1-05.
- 2026-10-07: Added the `learn/` folder rules to AGENTS.md and a new task P1-12 (set up `learn/`, backfill P1-01 to P1-04, propose Phase 1 files, write the P1-01 to P1-04 backfill first, before P1-05); phase exit criteria now require a recap file. Next: P1-12, then P1-05.
- 2026-10-07: Added concise JSDoc for exported data APIs and domain types, plus a comment policy in AGENTS.md. No runtime behavior changed. Next: P1-05 (routes and sets screen).
- 2026-10-07: Moved tests into a root `tests/` tree mirroring `src/`, centralized IndexedDB setup, and added tests to TypeScript checking. `npm outdated` reports newer majors for Babel (8), `@types/node` (26), and TypeScript (7); left installed versions unchanged. Next: P1-05 (routes and sets screen).
- 2026-10-07: Moved quiz domain models from `src/data/types.ts` into `src/types/quiz.ts` and documented the shared-types convention. Next: P1-05 (routes and sets screen).
- 2026-10-07: Updated AGENTS.md (up-to-date code rules, routing, React 19 and tooling conventions) and PLAN.md (React Router decision, Tailwind v4, routing folded into P1-05). Next: P1-03 (types + Dexie schema).
- 2026-10-07: P1-04 complete. Added the repository layer for set and question CRUD plus soft deletes, with tests covering creation, updates, deletion, and hidden deleted rows. Next: P1-05 (routes and sets screen).
- 2026-10-07: P1-03 complete. Added the strict `QuizSet`/`Question` model types and a Dexie database schema; the DB opens successfully in the test environment. Next: P1-04 (repository layer and unit tests).
- 2026-10-07: P1-01 and P1-02 complete. The project is scaffolded with Vite + React + TS, Tailwind is configured, and the theme toggle persists correctly; `dev`, `build`, `lint`, `typecheck`, and `test` all pass. Next: P1-03 (types + Dexie schema).
- 2026-10-06: Plan created. Next: P1-01 (scaffold project).
