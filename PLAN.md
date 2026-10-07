# PLAN.md: Revision Quiz App

## Status

> Agents: update this block whenever a task changes state.

```yaml
current_phase: P1
current_task: P1-03
last_updated: 2026-10-07
phases:
  P1: { name: "Local app (web)", status: in_progress }
  P2: { name: "AI features", status: not_started }
  P3: { name: "Google Drive sync", status: not_started }
  P4: { name: "Mobile (Capacitor) and store release", status: not_started }
  P5: { name: "Polish and extras", status: not_started }
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

| Concern        | Choice                                                 |
| -------------- | ------------------------------------------------------ |
| Language       | TypeScript (strict)                                    |
| UI             | React + Vite                                           |
| Styling        | Tailwind CSS, light/dark via CSS variables             |
| State          | Zustand                                                |
| Local database | Dexie (IndexedDB) behind a repository layer            |
| Mobile wrapper | Capacitor (Android, iOS)                               |
| Web            | PWA (installable, offline)                             |
| Sync           | Google Drive `appDataFolder` (OAuth PKCE, client-side) |
| AI             | Gemini API from the client, structured JSON output     |
| Secrets        | Gemini key in per-device secure storage                |
| Tests          | Vitest                                                 |

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
```

---

## 7. Phases and Tasks

### Phase P1: Local app (web)

**Goal:** a fully working offline quiz app in the browser with no AI and no sync.

- [x] **P1-01** Scaffold Vite + React + TypeScript project; add ESLint, Vitest, and the scripts listed in `AGENTS.md`.
  - Done when: `dev`, `build`, `lint`, `typecheck`, `test` all run successfully.
- [x] **P1-02** Add Tailwind and light/dark theming with CSS variables; theme toggle persists the choice.
  - Done when: both themes render correctly and the choice survives a reload.
- [ ] **P1-03** Define TypeScript types (`QuizSet`, `Question`, `McqQuestion`, `EssayQuestion`) and the Dexie schema.
  - Done when: types compile and the DB opens in the browser.
- [ ] **P1-04** Implement `repository.ts` (list, create, update, soft delete for sets and questions) with unit tests.
  - Done when: tests cover create, update, soft delete, and listing excludes deleted rows.
- [ ] **P1-05** Sets screen: list, create, rename, delete sets.
  - Done when: all four actions work and persist after reload.
- [ ] **P1-06** Question editor: add, edit, delete MCQ and essay questions in a set.
  - Done when: both types can be created and edited, and invalid input is rejected.
- [ ] **P1-07** Quiz engine: build a question list for random, MCQ-only and essay-only modes; Fisher-Yates shuffle; unit tests.
  - Done when: each mode returns only the right question types and tests pass.
- [ ] **P1-08** Quiz screens: MCQ answering with instant correct/incorrect feedback; essay answering with a text box (grading stub for now); end-of-quiz score.
  - Done when: a full quiz can be completed in each mode.
- [ ] **P1-09** JSON import and export per set, with `schemaVersion` validation.
  - Done when: an exported set re-imports without loss, and bad files show a clear error.
- [ ] **P1-10** PWA setup: manifest, icons, service worker for offline use.
  - Done when: the app installs and works offline after the first load.
- [ ] **P1-11** Make the layout mobile-first and responsive (small screens first, safe areas, touch-sized controls).
  - Done when: all screens are usable at 360px width and on desktop.

**Exit criteria:** every P1 task is `[x]`; `typecheck`, `lint`, `test` and `build` pass; the app works offline in the browser.

### Phase P2: AI features

**Goal:** Gemini-powered question generation and essay grading.

- [ ] **P2-01** `platform/secureStorage` abstraction (localStorage on web for now) and a settings screen to enter, replace and remove the Gemini key.
  - Done when: the key is saved, hidden in the UI by default, and never stored in the DB.
- [ ] **P2-02** Gemini client with structured JSON output, timeouts and clear error handling (bad key, rate limit, offline).
  - Done when: errors show readable messages and the app never crashes on API failure.
- [ ] **P2-03** Question generation: pick type and count, preview results, "Add to set" per question.
  - Done when: a generated MCQ or essay question can be added to a set and appears in quizzes.
- [ ] **P2-04** Essay grading: send question, reference answer and user answer; return `{score, feedback, missingPoints}`; show in the quiz screen.
  - Done when: grading works for essays with and without a reference answer, and results display clearly.
- [ ] **P2-05** Validate all AI responses against the schema before use; reject malformed output.
  - Done when: malformed responses are handled with a retry or a clear message.

**Exit criteria:** every P2 task is `[x]`; the key is never persisted outside secure storage; checks pass.

### Phase P3: Google Drive sync

**Goal:** changes on one device appear on all others.

- [ ] **P3-01** Merge function (per-question newest `updatedAt` wins, tombstones respected) with thorough unit tests.
  - Done when: tests cover add, edit, delete, and concurrent edits from two devices.
- [ ] **P3-02** Google OAuth (PKCE) with the `drive.appdata` scope; sign in and sign out.
  - Done when: the user can sign in on web and the token is stored securely.
- [ ] **P3-03** `SyncProvider` implementation for Drive `appDataFolder` (list, get, put with revision check).
  - Done when: files can be created, read, and updated, and stale writes are rejected.
- [ ] **P3-04** Sync engine: pull, merge, save, push, retry on conflict; first sync on a new device pulls before pushing.
  - Done when: two browsers stay consistent after edits and deletes on either one.
- [ ] **P3-05** Sync triggers (start, focus, debounced after edit) and a manual "Sync now" button with status and error display.
  - Done when: status shows idle, syncing, error, and last-synced time.
- [ ] **P3-06** Tombstone purge for records older than 30 days.
  - Done when: old tombstones are removed locally and remotely without resurrecting data.

**Exit criteria:** every P3 task is `[x]`; manual test with two devices or browsers passes (add, edit, delete, offline edit, reconnect).

### Phase P4: Mobile (Capacitor) and store release

**Goal:** Android and iOS apps, published.

- [ ] **P4-01** Add Capacitor; create Android and iOS projects; `cap sync` works in the build flow.
  - Done when: the app launches on an Android emulator or device.
- [ ] **P4-02** Replace web OAuth with a native or system-browser flow for Google sign-in.
  - Done when: sign-in works on a real Android device (and iOS when available).
- [ ] **P4-03** Move the Gemini key to native secure storage via the `platform/` layer.
  - Done when: the key is stored in the keychain/keystore on device.
- [ ] **P4-04** Native touches: haptics, share sheet, safe areas, keyboard handling, local reminder notifications.
  - Done when: each works on a real device.
- [ ] **P4-05** App icon, splash screen, store screenshots, privacy policy (mention Gemini and Drive).
  - Done when: all store assets exist.
- [ ] **P4-06** Google Play: developer account, signed AAB, testing track, production release.
  - Done when: the app is live or in review on Google Play.
- [ ] **P4-07** App Store (optional): Apple developer account, Xcode archive or cloud build, TestFlight, submission.
  - Done when: the app is in review or live on the App Store.

**Exit criteria:** P4-01 to P4-06 are `[x]` (P4-07 is optional); the app installs and syncs on a real device.

### Phase P5: Polish and extras

**Goal:** improvements after the core is stable. Pick in any order.

- [ ] **P5-01** Images in questions (stored as hashed files, synced alongside sets).
- [ ] **P5-02** Spaced repetition: track results and resurface wrong answers.
- [ ] **P5-03** Daily reminders and streak counter.
- [ ] **P5-04** Generate question sets from pasted notes or a photo.
- [ ] **P5-05** Full English UI and content pass (and optional i18n for Arabic).
- [ ] **P5-06** Desktop wrapper with Tauri, only if needed.

**Exit criteria:** none; this phase is ongoing.

---

## 8. Decisions Log

| Date       | Decision                                           | Reason                                                                       |
| ---------- | -------------------------------------------------- | ---------------------------------------------------------------------------- |
| 2026-10-06 | Vite + React + TS with Capacitor, not React Native | Reuses existing web skills; UI is simple enough for a WebView                |
| 2026-10-06 | Mobile first, PWA first                            | Revision happens in short sessions on phones                                 |
| 2026-10-06 | Sync through Google Drive, no backend              | No server to build, host or pay for                                          |
| 2026-10-06 | Dexie (IndexedDB) for local storage                | Same on web and Capacitor with no plugins; data is small and document-shaped |
| 2026-10-06 | Soft deletes with tombstones                       | Required so deletes sync correctly                                           |
| 2026-10-06 | Gemini key never synced                            | Per-device secret                                                            |

## 9. Open Questions

- Keep Dexie, or move to SQLite later if heavy queries are needed?
- Publish to the stores, or keep the PWA for personal use?
- Is an iOS build needed (requires a Mac or a cloud Mac build service)?
- Should essay questions require a reference answer?

## 10. Changelog

Add the newest entry at the top. Format: `YYYY-MM-DD: done / next`.

- 2026-10-07: P1-01 and P1-02 complete. The project is scaffolded with Vite + React + TS, Tailwind is configured, and the theme toggle persists correctly; `dev`, `build`, `lint`, `typecheck`, and `test` all pass. Next: P1-03 (types + Dexie schema).
- 2026-10-06: Plan created. Next: P1-01 (scaffold project).
