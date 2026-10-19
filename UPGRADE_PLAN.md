# AskMe → Study App: Plan

AskMe is still in development, so there is no old data or old logic to protect. This plan restructures the data model properly instead of working around the current one, and reuses only the parts that are already good.

---

## 1. What AskMe is today

| Area | Current state |
|---|---|
| Framework | Next.js App Router, TypeScript, Tailwind |
| Database | Dexie, one table `sets`, with questions embedded inside each set |
| Groups | Not a table, a `{ id, name }` copy stored on every set |
| Questions | `mcq` (4 options) and `essay` |
| Data loading | `useEffect` + `useState` (no `useLiveQuery`) |
| AI | Generate questions, grade essays, explain answers (Gemini / OpenAI) |
| Quiz results | Not saved (no attempts, mistakes, or review dates) |
| Offline / PWA | None yet |
| Big files | `QuizPage` 30 KB, `SetsPage` 25 KB, `SetDetailPage` 17 KB, `QuestionEditorPage` 13 KB |

## 2. Reuse or rewrite

| Part | Decision |
|---|---|
| `features/ai` (generate, grade, explain) | **Reuse**, adapt to the new question shape |
| `platform/secureStorage` (AI key and provider) | **Reuse** |
| `QuestionEditorPage`, `QuizPage` logic | **Reuse**, split into smaller parts while porting |
| `features/quiz` (`shuffle`, queue builder, timer) | **Reuse**, extend |
| `lib/libraryArchive` (ZIP with `fflate`) | **Reuse**, new file contents |
| `components/ui/*`, `globals.css`, layout | **Reuse**, restyle |
| `lib/db.ts` (version chain and migrations) | **Rewrite**, one clean schema |
| `lib/repository.ts` | **Rewrite**, one repository per table |
| `lib/importExport.ts` | **Rewrite**, Zod schemas, no v1–4 support |
| Group logic in `SetsPage` / `SetCard` | **Rewrite**, groups become a real table |
| `useQuizSet` | **Replace** with `useLiveQuery` |
| Legacy PWA cleanup in `AppShell` | **Remove** |

## 3. App structure

```
/                    Roadmap grid:  [React] [English] [Electronics] [+ New]
/roadmap/[id]        Topics page (ordered topics, optional groups)
/topic/[id]          Topic page (resources, notes, questions, quiz)
/topic/[id]/quiz     Topic quiz
/roadmap/[id]/quiz   Roadmap quiz (all topics, or one group)
/review              Daily review queue
/settings            AI key, backup, reset
```

"Set" is renamed to "topic" everywhere in code and UI.

### Topics page, without groups (default)

```
English                       [Quiz all topics]   [+ Add topic]
  1. Present tenses      done
  2. Past tenses         active
  3. Phrasal verbs       todo
```

### Topics page, with optional groups (any name the user types)

```
React                [Quiz all topics]  [+ Add topic]  [+ New group]
 ├─ Basics                 2 / 3    [Quiz group]
 │    1. JSX            done
 │    2. Props          done
 │    3. State          active
 ├─ Hooks                  0 / 2    [Quiz group]
 │    1. useEffect      todo
 │    2. useMemo        todo
 └─ Ungrouped
      Context API
```

- Groups are optional. The default view is a flat list.
- A group can have any name, and the UI only says "group".
- Topics are numbered inside their group (or across the list when there are no groups).
- Drag-to-reorder topics, and between groups. Per-group progress and collapse / expand.

## 4. Data model (new Dexie database, version 1)

```ts
Roadmap  { id, title, icon?, color?, order, createdAt, updatedAt }
Group    { id, roadmapId, title, order, createdAt, updatedAt }
Topic    { id, roadmapId, groupId?, title, order,
           status: 'todo' | 'active' | 'done' | 'known',
           notes?, createdAt, updatedAt }
Resource { id, topicId, title, url, kind: 'docs'|'video'|'article'|'other', done, order }
Question { id, topicId, roadmapId, type: 'mcq'|'essay', text,
           difficulty, tags, options?, answerIndex?, referenceAnswer?,
           createdAt, updatedAt }
Attempt  { id, questionId, topicId, roadmapId, correct, at }
Review   { questionId, topicId, ease, interval, due, lapses }
```

```ts
db.version(1).stores({
  roadmaps:  '&id, order',
  groups:    '&id, roadmapId, [roadmapId+order]',
  topics:    '&id, roadmapId, groupId, [roadmapId+order]',
  resources: '&id, topicId',
  questions: '&id, topicId, roadmapId',
  attempts:  '&id, questionId, topicId, roadmapId, at',
  reviews:   '&questionId, topicId, due',
})
```

Why questions get their own table: the roadmap quiz, mistakes bank and "due today" queue all need to query questions across topics, and attempts and reviews need to point at a single question. Embedded arrays make all of that slow and awkward.

Other choices:
- **Hard delete with cascades** inside transactions (deleting a roadmap removes its groups, topics, resources, questions, attempts, reviews). Soft delete flags are only needed for sync, which can be added later.
- **Use a new database name** (e.g. `askme-db`) so the old `askme-local-db` is simply ignored. Clear it from DevTools whenever you like.
- `roadmapId` is stored on questions too, so a roadmap quiz is one indexed query.
- Progress (`attempts`, `reviews`) stays on the device and is not part of the portable roadmap export, only the full backup.

## 5. Build steps

1. Commit the current project to git.
2. Install: `dexie-react-hooks`, `zod`, `@dnd-kit/core`, `@dnd-kit/sortable`.
3. Types and Zod schemas for the new model (`types/`, `lib/schemas.ts`).
4. New `lib/db.ts` (schema above, new database name).
5. Repositories: roadmaps, groups, topics, resources, questions, attempts, reviews. Hard delete with cascade, reorder helpers, `moveTopic`.
6. **Roadmap grid** (home page): cards with icon, title, topic count, progress. New, rename, icon / color, delete.
7. **Topics page** (`/roadmap/[id]`): flat list by default, optional groups, drag-to-reorder, status badges, per-group progress, move topic to another roadmap.
8. **Topic page** (`/topic/[id]`): resources and links (with "done" checkbox), notes (Markdown), question list, reuse of the question editor.
9. Port the **AI generator** to the new topic and question shapes.
10. **Quiz:** topic quiz, group quiz, roadmap quiz. Save an attempt per answer, add a mistakes-only mode, and mark the topic `done` when the pass mark is reached.
11. **Spaced repetition:** `lib/srs.ts` (SM-2) and the `/review` page.
12. **Progress:** step counts per roadmap, due-today count, weak topics, streak.
13. **Import / export:** one roadmap as JSON (no progress), a full backup ZIP (everything), and a backup reminder. Add a "Reset all data" button in Settings.
14. **Redesign and refactor:** apply the new UI / UX per screen while building it, and keep components small instead of repeating the 30 KB pages.
15. **Optional:** new question types (true/false, fill in the blank, flashcard), then update the AI generator for them.
16. **PWA / offline (last):** Serwist, manifest, icons, `navigator.storage.persist()`. Decide the route approach first (see risks).

## 6. Risks and things to watch

- **API key in `localStorage`** is readable by any script on the page. Fine for personal use, but never put it in exports or backups.
- **Dynamic routes and offline.** `/topic/[id]` cannot be statically exported because ids are unknown at build time. Before step 16, choose between a normal Next deployment with the service worker caching the app shell, or query-param routes (`/topic?id=`).
- **Until step 16, the app needs internet to load.** Data is stored locally, but the app files come from the server or dev server.
- **Browsers can clear IndexedDB** (especially Safari on iOS), so keep the backup feature (step 13) even without sync.
- **Large components** get harder to change as features pile up, so split them as you port them.
