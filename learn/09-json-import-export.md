# JSON import and export: a portable set format

The app stores each quiz set as a single JSON document, which makes backup, transfer, and validation straightforward.

## Why we need it

A local database is great for app use, but users also need a way to move a set out of the app or restore it later. A plain JSON file gives that portability without needing a backend.

## The concept, simply

A set export is just a snapshot of a valid quiz set. When the app imports it later, it validates the shape before saving the new record.

This is important because an invalid file should fail clearly instead of silently corrupting the database.

## In our code

`src/data/importExport.ts` validates the structure and converts raw JSON into the app's `QuizSet` type.

```ts
if (parsed.schemaVersion !== CURRENT_SCHEMA_VERSION) {
  throw new Error(`Unsupported schema version: ${String(parsed.schemaVersion ?? 'unknown')}.`)
}
```

The repository then persists the imported set through `replaceSet` and `importSetFromJson`, ensuring only valid content is written.

## ❌ / ✅ examples

- ❌ Importing a file with `schemaVersion: 99` and expecting it to work.
- ✅ Rejecting it with a clear validation error.
- ❌ Saving a set without an `id` or `questions` array.
- ✅ Blocking unsafe input before it hits Dexie.

## Try it yourself

1. Export a set from the app and open the JSON file.
2. Change the `schemaVersion` to a wrong value and re-import it.
3. Confirm the app throws the validation message instead of crashing.

## Quick Reference

- `schemaVersion` tells the app which data format the file is built for.
- `parseSetJson` validates and normalizes raw JSON.
- `exportSetJson` produces a portable, human-readable file.

## Key Takeaways

- JSON exports are a backup and portability tool, not the database itself.
- Version checks prevent old or malformed files from being accepted.
- Validation should happen as early as possible.

## Links to related files

- `src/data/importExport.ts`
- `src/data/repository.ts`
- `src/types/quiz.ts`
