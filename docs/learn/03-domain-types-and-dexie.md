# Domain Types and Dexie

**Goal:** Understand the quiz data model and how it is stored in IndexedDB.

## Why we need it

Sets and questions need a predictable shape in the UI, repository, and exported data. The app also needs browser-local persistence without a server.

## The concept, simply

TypeScript interfaces describe the fields a record must have. A union type says that a question can be one of a few supported shapes. Since each shape has a distinct `type` value, TypeScript can narrow the question to the right variant.

IndexedDB is a database built into the browser. Dexie provides a typed API for defining and using it. AskMe stores each complete set as one row; that row includes its question array.

## In our code

From `src/types/quiz.ts`:

```ts
export type Question = McqQuestion | EssayQuestion

export interface McqQuestion extends BaseQuestion {
  type: 'mcq'
  options: [string, string, string, string]
  answerIndex: number
}
```

- `Question` allows either supported question shape.
- The literal `type: 'mcq'` distinguishes MCQs from essays.
- `options` is a tuple, so it has exactly four string positions.
- `answerIndex` is zero-based: `0` is the first option.

From `src/data/db.ts`:

```ts
class AskMeDatabase extends Dexie {
  sets!: Table<QuizSet, string>

  constructor() {
    super('askme-local-db')
    this.version(1).stores({
      sets: '&id, title, updatedAt, deleted, schemaVersion',
    })
  }
}
```

- `sets` is a typed table of `QuizSet` rows with string primary keys.
- `&id` makes `id` the unique primary key; the other listed fields are indexes.
- `version(1)` records the current database schema version.
- `openDatabase()` awaits Dexie's open operation and lets failures reach its caller.

These TypeScript types describe data to the compiler; they do not validate arbitrary data at runtime. Importing JSON will need explicit validation when that feature is added.

## ❌ / ✅ examples

❌ Treat every question as if it always has `options`; essay questions do not.

✅ Check `question.type === 'mcq'` before using MCQ-only fields.

## Try it yourself

1. Find the essay variant in `src/types/quiz.ts`; compare it with `McqQuestion`.
2. Trace how `QuizSet` contains a `Question[]`.
3. Identify the primary key and indexes in the Dexie schema.

## Quick Reference

```ts
if (question.type === 'mcq') {
  console.log(question.options[question.answerIndex])
}
```

```ts
await db.open()
```

## Key Takeaways

- A discriminated union represents different question variants safely.
- MCQ answer indexes start at zero.
- Dexie wraps browser IndexedDB with a typed table API.
- The database stores a set and its questions together as one row.

## Links to related files

- [02 — Tailwind and themes](./02-tailwind-and-themes.md)
- [04 — Repository and tests](./04-repository-and-tests.md)
- Domain model: [src/types/quiz.ts](../../src/types/quiz.ts)
- Database definition: [src/data/db.ts](../../src/data/db.ts)
