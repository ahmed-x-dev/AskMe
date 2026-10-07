# Repository and Tests

**Goal:** Learn how data rules are centralized and how persistence code is tested.

## Why we need it

If screens talk directly to IndexedDB, persistence logic gets repeated and becomes difficult to test. A repository gives the rest of the app a focused API for reading and changing quiz data.

## The concept, simply

The repository is the boundary between application code and storage. It implements rules such as hiding deleted sets, refreshing timestamps, and marking records deleted instead of removing them.

Tests exercise that boundary with an in-memory IndexedDB implementation. They check observable behavior, such as a renamed set being returned with its new title.

## In our code

From `src/data/repository.ts`:

```ts
export async function softDeleteSet(id: string): Promise<QuizSet | null> {
  const set = await getSet(id)

  if (!set) {
    return null
  }

  const updated: QuizSet = {
    ...set,
    deleted: true,
    updatedAt: nowIso(),
  }

  await db.sets.put(updated)
  return updated
}
```

- `getSet` returns `null` if the set is absent or already deleted.
- The spread keeps the rest of the set unchanged.
- The function records a tombstone (`deleted: true`) and a fresh timestamp.
- `put` saves the changed row; it does not physically remove it.

The `listSets` function filters out deleted records and sorts active sets by newest `updatedAt`. Repository functions that cannot find an active record return `null`.

From `tests/setup.ts`:

```ts
import 'fake-indexeddb/auto'
```

This installs an IndexedDB-compatible implementation before tests run. In `tests/data/repository.test.ts`, `beforeEach` opens the database and clears rows; each test then calls the same repository functions the application uses.

## ❌ / ✅ examples

❌ Delete a set row directly from a screen.

✅ Call the repository's soft-delete function so the row and its deletion timestamp remain available for future sync.

## Try it yourself

1. Run `npm run test` and find the repository tests in the output.
2. Read the test that renames a set and note which behavior it asserts.
3. Add a test that deleting a missing set returns `null`.

## Quick Reference

```sh
npm run test
```

```ts
const set = await getSet(id)
if (!set) return
```

## Key Takeaways

- Use the repository API for application data access.
- Soft deletes preserve a tombstone rather than removing the record.
- Timestamps are refreshed when records change.
- `fake-indexeddb` lets tests exercise Dexie without a real browser database.

## Links to related files

- [03 — Domain types and Dexie](./03-domain-types-and-dexie.md)
- Repository implementation: [src/data/repository.ts](../src/data/repository.ts)
- Tests: [tests/data/repository.test.ts](../tests/data/repository.test.ts)
- Test setup: [tests/setup.ts](../tests/setup.ts)
