# PLAN.md: Revision Quiz App

## Status

> Agents: update this block whenever a task changes state.

```yaml
current_phase: P3
current_task: P3-01
last_updated: 2026-10-19
phases:
  P1: { name: "Local app (web)", status: done }
  P2: { name: "AI features", status: done }
  P3: { name: "Google Drive sync", status: in_progress }
  P4: { name: "Desktop and mobile delivery", status: not_started }
  P5: { name: "Polish and extras", status: in_progress }
```

Phase status values: `not_started`, `in_progress`, `done`, `blocked`.
Task markers: `[ ]` todo, `[~]` in progress, `[x]` done, `[!]` blocked.

---

## 1. Vision

A simple, fast revision app for short study sessions on any device. The user builds question sets (MCQ and essay), practices them in different modes, and gets AI help generating questions and grading essays. Anything added on one device appears on the others, with no backend to run.

**Platform delivery order:** build and stabilize the web app first, package for desktop second, then revisit mobile delivery. PWA installation and offline caching are currently deferred. Native Capacitor apps and app-store releases are not part of the current roadmap.

**Principles**

- Web first, desktop second, then revisit mobile delivery.
- One responsive web app across desktop and mobile browsers.
- No backend. Local storage plus sync through the user's own Google Drive.
- Simple UI with two themes only: light (white) and dark (black).
- The user owns their data. Each set is a plain JSON file that can be exported and imported.
- The project is also a learning exercise: everything new gets an explanation file in `docs/` (rules in `AGENTS.md`).

## 2. Requirements

**Question types**

- MCQ: checked against the correct answer stored in the set's JSON.
- Essay: evaluated by AI (Gemini), using an optional reference answer.

**Quiz modes:** random (mixed), MCQ only, essay only.

Quiz setup also filters by question type and difficulty, and includes all matches or a chosen count. The active session shows elapsed time from its start; the learner can request an AI explanation at any time.

**AI (optional)**

- User supplies their own free Gemini API key.
- AI generates MCQ or essay questions; the user can add a liked one to the set.
- The key stays on the device and is never synced.

**Platforms and sync:** web first, then desktop, then revisit mobile delivery. Adds, edits and deletes sync across devices.

**Later ideas:** images in questions, English UI and content, spaced repetition, daily reminders and streaks, generating sets from notes or photos.

## 3. Tech Stack

| Concern        | Choice                                                     |
| -------------- | ---------------------------------------------------------- |
| Language       | TypeScript (strict)                                        |
| UI             | React 19 + Next.js App Router (React Compiler enabled)     |
| Routing        | Next.js App Router file-based routes                       |
| Styling        | Tailwind CSS v4 via PostCSS, light/dark via CSS variables  |
| State          | React component state (no external state library)          |
| Local database | Dexie (IndexedDB) behind a repository layer                |
| Desktop        | Desktop packaging after the web app is stable (approach TBD) |
| Mobile         | Deferred; no native wrapper planned                         |
| Web            | Next.js-served web app                                       |
| Sync           | Google Drive `appDataFolder` (OAuth PKCE, client-side)     |
| AI             | Gemini and OpenAI APIs from the client, structured JSON    |
| Secrets        | Provider keys in browser `localStorage` (not encrypted)     |
| Tests          | Vitest                                                     |

## 4. Data Model

One JSON file per set; this is also the sync and export format.

```json
{
  "schemaVersion": 4,
  "id": "set_uuid",
  "title": "Biology Ch.3",
  "updatedAt": "2026-10-06T10:00:00Z",
  "deleted": false,
  "group": { "id": "group_uuid", "name": "Biology revision" },
  "questions": [
    {
      "id": "q_uuid",
      "type": "mcq",
      "text": "...",
      "difficulty": "medium",
      "tags": [],
      "options": ["A", "B", "C", "D"],
      "answerIndex": 2,
      "updatedAt": "2026-10-06T10:00:00Z",
      "deleted": false
    },
    {
      "id": "q_uuid2",
      "type": "essay",
      "text": "...",
      "difficulty": "hard",
      "tags": ["deprecated", "html"],
      "referenceAnswer": "...",
      "updatedAt": "2026-10-06T10:00:00Z",
      "deleted": false
    }
  ]
}
```

**Rules**

- UUID ids, `updatedAt` on every record, soft deletes via `deleted: true`.
- Questions have an `easy`, `medium`, or `hard` difficulty and optional free-form tags. The `deprecated` tag is informational and does not exclude a question from quizzes.
- JSON schema version 2 migrated version 1 questions to `difficulty: "normal"` and `tags: []`; schema version 3 migrates `normal` to `medium`; schema version 4 adds optional `{ id, name }` set-group metadata and accepts version 1–3 imports as ungrouped.
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
app/
  layout.tsx       document shell, metadata, and global styles
  page.tsx         library route
  settings/        settings route
  set/[id]/        set detail, quiz, and question editor routes
src/
  components/      app shell and client-side screens
  hooks/           shared client-side data loading
  features/        quiz logic and AI generation/grading
  data/
    db.ts          Dexie schema
    repository.ts  set and question persistence
    importExport.ts
  platform/        browser storage and platform adapters
  types/           shared domain models
tests/              tests grouped by source area
public/             browser icon
docs/              project documentation
  learn/           learning guides and phase recaps (see AGENTS.md)
```

This tree describes the current app. Add future sync or desktop-platform modules when those roadmap tasks are implemented.

---

## 7. Phases and Tasks

### Phase P1: Local app (web)

**Goal:** a fully working offline quiz app in the browser with no AI and no sync.

- [x] **P1-01** Scaffold Vite + React + TypeScript project; add ESLint, Vitest, and the scripts listed in `AGENTS.md`.
  - Done when: `dev`, `build`, `lint`, `typecheck`, `test` all run successfully.
  - Learn: `docs/learn/01-vite-react-typescript.md` (backfill).
- [x] **P1-02** Add Tailwind and light/dark theming with CSS variables; theme toggle persists the choice.
  - Done when: both themes render correctly and the choice survives a reload.
  - Learn: `docs/learn/02-tailwind-and-themes.md` (backfill).
- [x] **P1-03** Define TypeScript types (`QuizSet`, `Question`, `McqQuestion`, `EssayQuestion`) and the Dexie schema.
  - Done when: types compile and the DB opens in the browser.
  - Learn: `docs/learn/03-domain-types-and-dexie.md` (backfill).
- [x] **P1-04** Implement `repository.ts` (list, create, update, soft delete for sets and questions) with unit tests.
  - Done when: tests cover create, update, soft delete, and listing excludes deleted rows.
  - Learn: `docs/learn/04-repository-and-tests.md` (backfill).
- [x] **P1-05** Install React Router and define the routes in `src/routes.tsx` (see DESIGN.md section 6); Sets screen: list, create, rename, delete sets. Start only after reviewing the P1-01 to P1-04 learning-file backfill.
  - Done when: routing works with placeholder screens, and all four set actions work and persist after reload.
  - Learn: `docs/learn/05-routing-and-sets.md`.
- [x] **P1-06** Question editor: add, edit, delete MCQ and essay questions in a set.
  - Done when: both types can be created and edited, and invalid input is rejected.
  - Learn: `docs/learn/06-question-editor.md`.
- [x] **P1-07** Quiz engine: build a question list for random, MCQ-only and essay-only modes; Fisher-Yates shuffle; unit tests.
  - Done when: each mode returns only the right question types and tests pass.
  - Learn: `docs/learn/07-quiz-modes-and-shuffling.md`.
- [x] **P1-08** Quiz screens: MCQ answering with instant correct/incorrect feedback; essay answering with a text box (grading stub for now); end-of-quiz score.
  - Done when: a full quiz can be completed in each mode.
  - Learn: `docs/learn/08-quiz-flow-and-scoring.md`.
- [x] **P1-09** JSON import and export per set, with `schemaVersion` validation.
  - Done when: an exported set re-imports without loss, and bad files show a clear error.
  - Learn: `docs/learn/09-json-import-export.md`.
- [x] **P1-10** PWA setup: manifest, icons, service worker for offline use (historical; now disabled).
  - Done when: the app installs and works offline after the first load.
  - Learn: `docs/learn/10-pwa-and-offline.md`.
- [x] **P1-11** Make the layout mobile-first and responsive (small screens first, safe areas, touch-sized controls).
  - Done when: all screens are usable at 360px width and on desktop.
  - Learn: `docs/learn/11-responsive-layout.md`.
- [x] **P1-12** Final learning check: verify that each P1-01 to P1-11 task has its matching lesson, `docs/learn/README.md` indexes them in order, and the Phase 1 recap is complete.
  - Done when: `docs/learn/01-...md` through `docs/learn/11-...md` all exist and are indexed, and `docs/learn/phase-1-recap.md` summarizes Phase 1 with five quiz questions and answers hidden at the bottom.

**Exit criteria:** every P1 task is `[x]`; `typecheck`, `lint`, `test` and `build` pass; the app worked offline at the end of P1 (PWA support was later disabled); `docs/learn/phase-1-recap.md` exists.

### Phase P2: AI features

**Goal:** Gemini-powered question generation and essay grading.

- [x] **P2-01** `platform/secureStorage` abstraction (localStorage on web for now) and a settings screen to enter, replace and remove the Gemini key.
  - Done when: the key is saved, hidden in the UI by default, and never stored in the DB.
  - Learn: `docs/learn/12-secure-storage-and-api-keys.md`.
- [x] **P2-02** Gemini client with structured JSON output, timeouts and clear error handling (bad key, rate limit, offline).
  - Done when: errors show readable messages and the app never crashes on API failure.
  - Learn: `docs/learn/13-gemini-client-and-errors.md`.
- [x] **P2-03** Question generation: pick type and count, preview results, "Add to set" per question.
  - Done when: a generated MCQ or essay question can be added to a set and appears in quizzes.
  - Learn: `docs/learn/14-ai-question-generation.md`.
- [x] **P2-04** Essay grading: send question, reference answer and user answer; return `{score, feedback, missingPoints}`; show in the quiz screen.
  - Done when: grading works for essays with and without a reference answer, and results display clearly.
  - Learn: `docs/learn/15-ai-essay-grading.md`.
- [x] **P2-05** Validate all AI responses against the schema before use; reject malformed output.
  - Done when: malformed responses are handled with a retry or a clear message.
  - Learn: `docs/learn/16-validating-ai-responses.md`.

**Exit criteria:** every P2 task is `[x]`; provider keys stay out of Dexie and sync data (browser `localStorage` is not encrypted); checks pass; `docs/learn/phase-2-recap.md` exists.

### Phase P3: Google Drive sync

**Goal:** changes on one device appear on all others.

- [x] **P3-07** Migrate the web app from Vite and React Router to Next.js App Router without moving Dexie data or AI keys off the browser.
  - Done when: all app routes work under Next.js, checks pass, and Vite/React Router are no longer the app runtime. PWA behavior was subsequently deferred.
  - Learn: `docs/learn/18-nextjs-app-router.md`.
- [ ] **P3-01** Merge function (per-question newest `updatedAt` wins, tombstones respected) with thorough unit tests.
  - Done when: tests cover add, edit, delete, and concurrent edits from two devices.
  - Learn: `docs/learn/19-merging-synced-data.md`.
- [ ] **P3-02** Google OAuth (PKCE) with the `drive.appdata` scope; sign in and sign out.
  - Done when: the user can sign in on web and the token is stored securely.
  - Learn: `docs/learn/20-google-oauth-and-pkce.md`.
- [ ] **P3-03** `SyncProvider` implementation for Drive `appDataFolder` (list, get, put with revision check).
  - Done when: files can be created, read, and updated, and stale writes are rejected.
  - Learn: `docs/learn/21-google-drive-sync-provider.md`.
- [ ] **P3-04** Sync engine: pull, merge, save, push, retry on conflict; first sync on a new device pulls before pushing.
  - Done when: two browsers stay consistent after edits and deletes on either one.
  - Learn: `docs/learn/22-sync-engine-and-conflicts.md`.
- [ ] **P3-05** Sync triggers (start, focus, debounced after edit) and a manual "Sync now" button with status and error display.
  - Done when: status shows idle, syncing, error, and last-synced time.
  - Learn: `docs/learn/23-sync-triggers-and-status.md`.
- [ ] **P3-06** Tombstone purge for records older than 30 days.
  - Done when: old tombstones are removed locally and remotely without resurrecting data.
  - Learn: `docs/learn/24-tombstone-retention.md`.

**Exit criteria:** every P3 task is `[x]`; manual test with two devices or browsers passes (add, edit, delete, offline edit, reconnect); `docs/learn/phase-3-recap.md` exists.

### Phase P4: Desktop and mobile delivery

**Goal:** deliver a desktop app after the web app is stable, then revisit mobile delivery. PWA installation and offline behavior are currently deferred; do not add a native wrapper or app-store release flow under the current roadmap.

- [!] **P4-01** Add Capacitor; create Android and iOS projects; `cap sync` works in the build flow.
  - Not in current scope: mobile delivery is deferred; no native app is planned.
- [!] **P4-02** Replace web OAuth with a native or system-browser flow for Google sign-in.
  - Not in current scope: no native app is planned.
- [!] **P4-03** Move AI provider keys to native secure storage via the `platform/` layer.
  - Not in current scope: no native app is planned.
- [!] **P4-04** Add native haptics, share sheet, and local reminder notifications.
  - Not in current scope: no native app is planned.
- [!] **P4-05** Prepare native app-store assets and privacy policy.
  - Not in current scope: native app-store releases are not planned.
- [!] **P4-06** Publish a Google Play native app.
  - Not in current scope: native app-store releases are not planned.
- [!] **P4-07** Publish an iOS App Store native app.
  - Not in current scope: native app-store releases are not planned.
- [ ] **P4-08** Package the stable web app for desktop; choose a desktop wrapper only if browser installation is insufficient.
  - Done when: the desktop delivery approach is documented and the app launches with its routes and local data working.
  - Learn: `docs/learn/37-tauri-desktop-wrapper.md`.
- [!] **P4-09** Verify mobile PWA installation and core workflows on supported mobile browsers.
  - Deferred at the owner's request: install and offline PWA behavior are not currently needed.
  - Done when: users can install/open the PWA, use core quiz flows, retain local data, and load the app offline after a successful visit.
  - Learn: `docs/learn/10-pwa-and-offline.md`.
- [ ] **P4-10** Revisit desktop and mobile delivery after testing real devices and browsers.
  - Done when: supported platforms, known PWA limitations, and any future native-app need are documented.
  - Learn: `docs/learn/10-pwa-and-offline.md`, `docs/learn/37-tauri-desktop-wrapper.md`.

**Exit criteria:** P4-08 and P4-10 are `[x]`; P4-09 remains deferred unless mobile PWA support is re-scoped; `docs/learn/phase-4-recap.md` exists.

### Phase P5: Polish and extras

**Goal:** improvements after the core is stable. Pick in any order.

- [ ] **P5-01** Images in questions (stored as hashed files, synced alongside sets).
  - Learn: `docs/learn/32-question-images-and-file-sync.md`.
- [ ] **P5-02** Spaced repetition: track results and resurface wrong answers.
  - Learn: `docs/learn/33-spaced-repetition.md`.
- [ ] **P5-03** Daily reminders and streak counter.
  - Learn: `docs/learn/34-reminders-and-streaks.md`.
- [ ] **P5-04** Generate question sets from pasted notes or a photo.
  - Learn: `docs/learn/35-generating-from-notes-and-photos.md`.
- [ ] **P5-05** Full English UI and content pass (and optional i18n for Arabic).
  - Learn: `docs/learn/36-localization-and-language.md`.
- [!] **P5-06** Desktop wrapper with Tauri, only if needed.
  - Moved to P4-08 to match the web-first, desktop-second delivery order.
- [x] **P5-07** Improve the front-page theme control and responsive layout; add a set-import action.
  - Done when: the theme switch is icon-only and accessible, the library works on mobile and desktop, and valid/invalid JSON imports provide visible feedback.
  - Learn: `docs/learn/02-tailwind-and-themes.md`, `docs/learn/09-json-import-export.md`, `docs/learn/11-responsive-layout.md`.
- [x] **P5-08** Replace set-detail whole-set import with additive question import; remove the All sets shortcut.
  - Done when: the set screen no longer shows All sets or Import JSON, imported Question JSON is validated and appended to the active set without overwriting its metadata/questions, and import errors are visible.
  - Learn: `docs/learn/09-json-import-export.md`.
- [x] **P5-09** Replace the inner-page brand header with a back-to-library button.
  - Done when: the front page retains its AskMe logo, and every inner route has an accessible back link to the library with the theme control preserved.
  - Learn: `docs/learn/11-responsive-layout.md`.
- [x] **P5-10** Make library set cards open on click and replace rename/delete labels with icon buttons.
  - Done when: the card navigates to its set and its 44px ellipsis menu keeps rename/delete as accessible separate actions.
  - Learn: `docs/learn/05-routing-and-sets.md`.
- [x] **P5-11** Add reference-answer reveal and self-assessment controls for essay quiz questions.
  - Done when: essay questions reveal their optional reference answer, let users mark themselves right or wrong, and count that mark in the final score without changing MCQ scoring.
  - Learn: `docs/learn/08-quiz-flow-and-scoring.md`.
- [x] **P5-12** Refresh the library home page and add whole-library ZIP export/import and multi-JSON import; repair relocated App Router imports.
  - Done when: the library is responsive and easier to navigate; active sets can be exported to one ZIP; ZIP archives and multiple JSON files are validated before any sets are saved; success and failure feedback is visible.
  - Learn: `docs/learn/09-json-import-export.md`, `docs/learn/11-responsive-layout.md`, `docs/learn/18-nextjs-app-router.md`.
- [x] **P5-13** Add difficulty and free-form tags to question records, editing, and JSON import/export.
  - Done when: questions support easy/normal/hard difficulty and tags; deprecated tags remain informational; old local data and version 1 JSON migrate to normal difficulty and no tags; all checks pass.
  - Learn: `docs/learn/06-question-editor.md`, `docs/learn/09-json-import-export.md`.
- [x] **P5-14** Add quiz setup filters for question type, difficulty, and question count; add an elapsed session timer and on-demand AI answer explanations; migrate normal difficulty to medium.
  - Done when: users can configure quiz type/difficulty/count before starting; the timer counts up from 00 for the full session; AI explanations can be requested for MCQ and essay questions; version 2 local data and JSON migrate normal difficulty to medium; checks pass.
  - Learn: `docs/learn/25-quiz-session-options.md`.
- [x] **P5-15** Replace the question generator's key link label with a settings gear and raise its question count limit to 20.
  - Done when: the AI helper shows an accessible settings gear link and both its count control and generation request accept 1–20 questions; tests and checks pass.
  - Learn: `docs/learn/14-ai-question-generation.md`.
- [x] **P5-16** Align the app with the revised soft-cards design system.
  - Done when: the revised tokens are available to every component, interaction surfaces use `--card-hover`, and the light and dark themes render without raw color values in UI components.
  - Learn: `docs/learn/02-tailwind-and-themes.md`.
- [x] **P5-17** Add documented subtle borders to form controls and neutral buttons.
  - Done when: inputs, text areas, selects, and neutral buttons have a `--card-hover` boundary while cards remain borderless.
  - Learn: `docs/learn/02-tailwind-and-themes.md`.
- [x] **P5-18** Complete the design-system interaction-state guidance.
  - Done when: the spec and shared CSS cover invalid, disabled, loading, overlay, and future choice-control states; route and font guidance match the app.
  - Learn: `docs/learn/02-tailwind-and-themes.md`.
- [x] **P5-19** Organize sets into editable groups with manual creation, editable names, removal controls, and a groups-only library view.
  - Done when: a set belongs to at most one persistent group; users can manually create one-set or multi-set groups, rename, remove groups without deleting their sets, remove a set from a group, and toggle between normal and groups-only views; version 1–3 imports migrate without a group; checks pass.
  - Learn: `docs/learn/27-set-groups-and-touch-dragging.md`.
- [x] **P5-20** Refresh the library layout to match the supplied compact desktop reference.
  - Done when: the library has its summary heading, inline tools, group filter chips, and two-column set cards with clear quiz and open actions; ungrouped sets can be added to an existing group; checks pass.
  - Learn: `docs/learn/11-responsive-layout.md`.
- [x] **P5-21** UI/UX audit pass: consistent design tokens, dark-theme layering, wide-screen layouts, and shared button/field constants across every screen.
  - Done when: `--line` gives controls a visible boundary in both themes; dark surfaces are layered (page/card/hover) instead of flat black; buttons, fields, dialogs, menus, empty/loading/error states use the shared constants in `src/components/ui/styles.ts`; every route is usable from mobile to large desktop; no behavioral or data change; checks pass.
  - Learn: `docs/learn/02-tailwind-and-themes.md`, `docs/learn/11-responsive-layout.md`.
  - UI-only: presentational changes to CSS, tokens, layout, and markup. No business logic, schema, repository, validation, or route behavior was changed.

**Exit criteria:** none; this phase is ongoing.

---

## 8. Decisions Log

| Date       | Decision                                                     | Reason                                                                       |
| ---------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| 2026-10-06 | Vite + React + TS for the initial web app                    | Reuses existing web skills and keeps the first release browser-based          |
| 2026-10-06 | Sync through Google Drive, no backend                        | No server to build, host or pay for                                          |
| 2026-10-06 | Dexie (IndexedDB) for local storage                          | Browser-native persistence fits the web app and PWA; data is document-shaped |
| 2026-10-06 | Soft deletes with tombstones                                 | Required so deletes sync correctly                                           |
| 2026-10-06 | Gemini key never synced                                      | Per-device secret                                                            |
| 2026-10-07 | React Router v7, library mode, `react-router` only           | Most documented; no server needed; avoids the old `react-router-dom` habit   |
| 2026-10-07 | Start with browser routing                                   | The initial web release was also installable; PWA support is now deferred   |
| 2026-10-12 | Next.js App Router for the web app; browser remains data owner | Requested migration; Dexie and keys stay client-side; hosting needs Next.js |
| 2026-10-12 | Web first, desktop second, mobile through PWA                 | Avoid native wrappers and store releases; reuse the responsive web app        |
| 2026-10-12 | Native Capacitor work is out of scope for now                 | Avoid native-app complexity; mobile delivery is currently deferred          |
| 2026-10-16 | Use ZIP for whole-library export and import                    | Browsers can create and read ZIP archives locally; genuine RAR creation is not built in and would require a different toolchain |
| 2026-10-16 | Use fflate for client-side ZIP handling                        | Keeps library backup and restore local without a backend                   |
| 2026-10-16 | Map the Next.js `@/*` alias to `src/*`                         | Keeps App Router imports stable and readable after moving routes into `src/app` |
| 2026-10-17 | Store question difficulty and free-form informational tags in schema version 2 | Adds helpful labels without changing quiz eligibility; version 1 data migrates to normal difficulty and no tags |
| 2026-10-17 | Use a session-level elapsed timer and keep quiz filters in quiz state; rename normal difficulty to medium in schema version 3 | The timer measures the whole run without interrupting answers; filters don't alter saved sets; the schema migration uses the user-facing difficulty label consistently |
| 2026-10-17 | Use Lucide React components for interface icons instead of hand-written SVGs | Named icon components are easier to maintain while preserving control labels, sizing, and stroke styles |
| 2026-10-17 | Defer PWA installation and offline caching for now | Prevent stale service-worker assets during current web development; remove old registrations and cache without touching local quiz data |
| 2026-10-17 | Expand the app shell and use content-specific layouts at large breakpoints | Use wide desktop space for related panels and cards while retaining readable widths for forms and quiz content |
| 2026-10-17 | Use ARIA state attributes with shared CSS for control states | Keeps loading and invalid feedback consistent, accessible, and free of per-screen styling drift |
| 2026-10-18 | Store optional group metadata in each set's schema-version-4 JSON record | One set can belong to one editable group, and membership survives export and future per-set sync without a separate library file |
| 2026-10-19 | Split control boundaries into a dedicated `--line` token and add inverse-surface constants (`fieldOnCardClassName`, `buttonSecondaryOnCard`) in `src/components/ui/styles.ts` | A control needs a visible 1px edge in both themes while cards stay borderless; a `bg-card` control is invisible on a `bg-card` panel, so those variants use `bg-bg` |
| 2026-10-19 | Fix the wide-screen rules: shell `max-w-[1440px]`, roadmap grid `1→2→3→4` columns, settings pairs its panels above 1024px, reading/quiz screens stay bounded at 768–1024px, and reorderable (drag-and-drop) lists stay single column | Uses large desktops without stretching forms into unreadable line lengths, and keeps drag ordering unambiguous |
| 2026-10-07 | Check docs for installed major versions                      | Agent training data is older than the libraries in use                       |
| 2026-10-07 | No manual memoization by default                             | React Compiler is enabled                                                    |
| 2026-10-07 | Keep tests under root `tests/`, mirroring `src/`             | Keeps production modules uncluttered and tests easy to locate                |
| 2026-10-07 | Keep shared domain types under `src/types/`                  | Groups reusable models by domain, separate from persistence implementation   |
| 2026-10-07 | Document API contracts with concise JSDoc                    | Clarifies non-obvious behavior without duplicating self-explanatory code     |
| 2026-10-07 | Maintain learning guides in `docs/`; owner writes code, agent reviews | The project is also a learning exercise                              |

## 9. Open Questions

- Keep Dexie, or move to SQLite later if heavy queries are needed?
- Is a desktop wrapper needed, or is installing the web app sufficient?
- Which mobile browsers and PWA capabilities should be supported?
- Should essay questions require a reference answer?
- Which Next.js-compatible host should serve the web app in production?

## 10. Changelog

Add the newest entry at the top. Format: `YYYY-MM-DD: done / next`.

- 2026-10-19: Completed P5-21: a UI/UX pass with no behavioral change. `DESIGN.md` now documents every shared constant; `src/app/globals.css` gained the `--line` control-boundary token and refreshed light/dark token tables (dark page `#131917`, card `#24312D`, hover `#303E39`, overlay 55%); `src/components/ui/styles.ts` became the single source of button/field class strings and gained `buttonSecondaryOnCard`, `buttonSecondaryCompact`, `buttonDestructive`, and `fieldOnCardClassName`. Layout rules were fixed for wide screens (shell `max-w-[1440px]`, roadmap grid `1→2→3→4`, settings two panels above 1024px, bounded reading/quiz screens, single-column reorderable lists). Cards stayed borderless while controls, dialogs, menus, and empty/loading/error states were unified; screen titles were rescaled (only the home app title exceeds 22px). Updated the themes and responsive-layout guides. `npm outdated` still reports major versions for `@types/node` (26.6.5) and TypeScript (7.0.2); neither was upgraded. `typecheck`, `lint`, all 117 tests, and production build pass. Next: resume P3-01.
- 2026-10-18: Completed P5-20: refreshed the library and home header to match the supplied compact desktop reference, retaining import, export, grouping, rename, delete, and navigation flows. Group chips filter the library directly; the compact add-group control sits alongside them; one-set groups are valid, and ungrouped sets can be selected and added to an existing group. Group-selection mode shows Apply and Cancel controls and excludes already grouped sets. Each group's Add, Rename, and Delete controls, and each set's management controls, are now in accessible ellipsis menus. Roomy two-column cards provide Start quiz and Open actions. Updated the responsive-layout, routing, and set-groups guides. `npm outdated` reports major updates for `@types/node` (26.6.5) and TypeScript (7.0.2); neither was upgraded. `typecheck`, `lint`, all 42 tests, and production build pass. Next: resume P3-01.
- 2026-10-18: Completed P5-19: added schema-version-4 set groups with manual selection, editable names, non-destructive whole-group and per-set removal, and a groups-only library view with an explicit Ungrouped section. Version 1–3 imports migrate as ungrouped; groups persist in exports. Removed the long-press/drag interaction at the owner's request and updated the set-groups learning guide. `typecheck`, `lint`, all 40 tests, and production build pass. `npm outdated` reports major updates for `@types/node` (26.6.5) and TypeScript (7.0.2); neither was upgraded. Next: resume P3-01.
- 2026-10-17: Completed P5-18: added documented overlay, disabled, loading, invalid, and future choice-control states; corrected font and quiz-route guidance; wired `aria-busy` into existing request actions and `aria-invalid` into question-editor validation. Updated the themes learning guide. `typecheck`, `lint`, all 37 tests, and production build pass. Next: resume P3-01.
- 2026-10-17: Completed P5-17: documented the borderless-card/control-boundary distinction in `DESIGN.md` and added a 1px `--card-hover` boundary to inputs, text areas, selects, and neutral buttons while retaining the accent focus ring. Updated the themes learning guide. `typecheck`, `lint`, all 37 tests, and production build pass. Next: resume P3-01.
- 2026-10-17: Completed P5-16: aligned the global CSS tokens with the revised soft-cards design, exposed `bg-card-hover` to Tailwind, and applied the neutral hover/input/selected-option rules across the UI. Updated the themes learning guide. `npm outdated` reports major versions for `@types/node` (26.6.5) and TypeScript (7.0.2); neither was upgraded. Static audit confirms raw hex values appear only in the theme-token stylesheet; `typecheck`, `lint`, all 37 tests, and production build pass. Next: resume P3-01.
- 2026-10-17: Extended the large-screen responsive treatment to every inner route. Set detail now uses a two-column overview/AI layout and question grid; quiz setup filters and MCQ answers use columns; settings, editors, quiz content, and error states use centered content widths within the expanded shell. Updated `DESIGN.md` and the responsive-layout guide. Browser checks at 390, 768, 1024, 1440, and 1920px found no horizontal overflow; settings and error panels remain readable at 768px. `typecheck`, `lint`, all 37 tests, and production build pass. Next: resume P3-01.
- 2026-10-17: Improved large-screen library layout: widened the shell to 1280px at `lg` and 1536px at `2xl`, expanded the set grid from 2 to 3/4 columns, and balanced the intro and empty state proportions. Updated `DESIGN.md` and the responsive-layout learning guide. `typecheck`, `lint`, all 37 tests, production build, and 1440px/1920px browser checks pass. `npm outdated` still reports major versions for `@types/node` (26.6.5) and TypeScript (7.0.2); none upgraded. Next: resume P3-01.
- 2026-10-17: Replaced hand-written UI SVG icons with Lucide React components in the shared header, library, and set-detail settings link; kept existing labels, sizes, and stroke widths. Added and unignored the icon-components learning guide. `typecheck`, `lint`, all 37 tests, and production build pass. `npm outdated` still reports major versions for `@types/node` (26.6.5) and TypeScript (7.0.2); none upgraded. Next: resume P3-01.
- 2026-10-17: Completed P5-15: replaced the question generator's key-status link with a labeled settings gear and raised the count range to 1–20 in both the UI and AI request. Targeted AI tests (8), typecheck, and lint pass; browser check confirmed count 20 is accepted, larger values clamp to 20, and the settings gear replaces the old link. Next: resume P3-01.
- 2026-10-17: Completed P5-14: added quiz type/difficulty/count setup, a session stopwatch, and on-demand AI explanations; migrated stored and imported `normal` difficulty to `medium` with schema version 3. `typecheck`, `lint`, all 36 tests, and production `build` pass; browser smoke check verified filters, elapsed time, completion time, and missing-key feedback, then removed the test set. `npm outdated` still reports major versions for `@types/node` (26.6.5) and TypeScript (7.0.2); none upgraded. Next: resume P3-01.
- 2026-10-17: Removed active PWA installation and offline behavior: deleted the manifest, service worker, and offline fallback route; stopped linking the manifest; and added one-time cleanup of the old worker and cache without touching IndexedDB data. Updated the PWA learning note and deferred P4-09. Next: continue P3-01.
- 2026-10-17: Completed P5-13: added easy/normal/hard and free-form tags to question editing, set/quiz views, and JSON schema v2; version 1 JSON and local IndexedDB records migrate to normal difficulty with no tags. Browser smoke check confirmed a deprecated-tagged question still appears in a quiz. `typecheck`, `lint`, all 31 tests, and production `build` pass. `npm outdated` reports major updates for `@types/node` and TypeScript; none upgraded. Next: return to P3-01.
- 2026-10-16: Refreshed the responsive library with ZIP backup/restore and atomic multi-JSON import; fixed relocated App Router imports using Next.js's `@/*` alias mapped to `src/*`; regenerated stale route types with `next typegen`. `typecheck`, `lint`, all 28 tests, and production `build` pass. Next: continue P3-01.
- 2026-10-12: Moved the learning guides into `docs/learn/`, preserving other docs directory contents and updating links and contributor guidance. Next: continue P3-01.
- 2026-10-12: Set platform direction to web first, desktop second, and mobile through the installable PWA; marked native Capacitor and store-release tasks out of scope, promoted desktop packaging, and added mobile PWA verification. Next: continue P3-01, then desktop delivery before mobile PWA validation.
- 2026-10-12: Migrated the app from Vite/React Router to Next.js 16 App Router, retaining client-side Dexie storage, browser-only AI keys, theme controls, and offline routes. Removed the stale Vite build output and corrected the documented project structure and route lesson. `typecheck`, `lint`, all 22 tests, production build, route/editor/quiz/settings smoke checks, 404 handling, and offline service-worker checks pass. `npm outdated` shows major updates available for `@types/node` and TypeScript plus a Vitest patch; none upgraded. Vite remains only as a transitive Vitest dependency, not a direct app dependency. Next: P3-01 (sync merge logic).
- 2026-10-12: Investigated the reported white screen. The app renders in a fresh browser; found the service worker served cached HTML indefinitely and returned HTML for failed asset requests. Updated it to use network-first navigation with an offline shell fallback, cache successful same-origin assets only, and bumped the cache version so old caches are removed. Next: confirm whether the user's installed/deployed app recovers after its service worker updates.
- 2026-10-12: Fixed three AI-provider review findings: documented that browser `localStorage` is not encrypted secure storage, moved Gemini key authentication from the URL to `x-goog-api-key`, and invalidated stale essay-grading responses when answers or quiz questions change. Added a request-header regression assertion and updated the related lessons. `typecheck`, `lint`, `test`, and `build` pass. Next: P3-01 (merge logic and sync design).
- 2026-10-12: Added provider-aware AI key storage and request routing so the app can use Gemini or OpenAI with a separate saved key per provider, while keeping the rest of the generation and grading flow the same. `typecheck`, `lint`, `test`, and `build` all pass. Next: P3-01 (merge logic and sync design).
- 2026-10-12: Phase 2 complete. Added browser `localStorage` storage for the Gemini key (not encrypted secure storage), a settings screen, the Gemini API client with timeout and validation guards, generated-question previews that can be inserted into a set, AI essay grading with a visible score and feedback, and the required phase recap and lesson index updates. `typecheck`, `lint`, `test`, and `build` pass. Next: P3-01 (merge logic and sync design).
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
- 2026-10-07: Added the `docs/` folder rules to AGENTS.md and a new task P1-12 (set up `docs/`, backfill P1-01 to P1-04, propose Phase 1 files, write the P1-01 to P1-04 backfill first, before P1-05); phase exit criteria now require a recap file. Next: P1-12, then P1-05.
- 2026-10-07: Added concise JSDoc for exported data APIs and domain types, plus a comment policy in AGENTS.md. No runtime behavior changed. Next: P1-05 (routes and sets screen).
- 2026-10-07: Moved tests into a root `tests/` tree mirroring `src/`, centralized IndexedDB setup, and added tests to TypeScript checking. `npm outdated` reports newer majors for Babel (8), `@types/node` (26), and TypeScript (7); left installed versions unchanged. Next: P1-05 (routes and sets screen).
- 2026-10-07: Moved quiz domain models from `src/data/types.ts` into `src/types/quiz.ts` and documented the shared-types convention. Next: P1-05 (routes and sets screen).
- 2026-10-07: Updated AGENTS.md (up-to-date code rules, routing, React 19 and tooling conventions) and PLAN.md (React Router decision, Tailwind v4, routing folded into P1-05). Next: P1-03 (types + Dexie schema).
- 2026-10-07: P1-04 complete. Added the repository layer for set and question CRUD plus soft deletes, with tests covering creation, updates, deletion, and hidden deleted rows. Next: P1-05 (routes and sets screen).
- 2026-10-07: P1-03 complete. Added the strict `QuizSet`/`Question` model types and a Dexie database schema; the DB opens successfully in the test environment. Next: P1-04 (repository layer and unit tests).
- 2026-10-07: P1-01 and P1-02 complete. The project is scaffolded with Vite + React + TS, Tailwind is configured, and the theme toggle persists correctly; `dev`, `build`, `lint`, `typecheck`, and `test` all pass. Next: P1-03 (types + Dexie schema).
- 2026-10-06: Plan created. Next: P1-01 (scaffold project).
