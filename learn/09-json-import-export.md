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

The repository persists the validated set through `importSetFromJson`, ensuring only valid content is written.

On the library page, **Import set** accepts a full set export. On a set page, **Import questions** accepts one `Question`, an array of questions, or a full set export. It validates the question fields and appends copies to the open set; it does not replace the destination set or its existing questions. New question IDs prevent collisions when a file is imported more than once. Both flows show success or validation feedback.

## ❌ / ✅ examples

- ❌ Importing a file with `schemaVersion: 99` and expecting it to work.
- ✅ Rejecting it with a clear validation error.
- ❌ Saving a set without an `id` or `questions` array.
- ✅ Blocking unsafe input before it hits Dexie.
- ❌ Hiding a parse failure after the user selects a file.
- ✅ Showing the validation message next to the library actions.
- ❌ Replacing a destination set when the goal is to add questions.
- ✅ Extracting and validating questions, then appending them to the selected set.

## Try it yourself

1. Export a set from the app and import the JSON file from the library page.
2. Change the `schemaVersion` to a wrong value and re-import it.
3. On a set page, import a single Question object or a full set export; confirm only questions are appended.

## Quick Reference

- `schemaVersion` tells the app which data format the file is built for.
- `parseSetJson` validates and normalizes raw JSON.
- `exportSetJson` produces a portable, human-readable file.
- The library uses `importSetFromJson` to validate and save a selected file.
- `parseQuestionsJson` validates a Question, a question array, or questions inside a set export.
- `importQuestionsFromJson` gives imported questions fresh IDs and appends them to an existing set.

## Key Takeaways

- JSON exports are a backup and portability tool, not the database itself.
- Version checks prevent old or malformed files from being accepted.
- Validation should happen as early as possible.

## Links to related files

- `src/data/importExport.ts`
- `src/data/repository.ts`
- `src/types/quiz.ts`
