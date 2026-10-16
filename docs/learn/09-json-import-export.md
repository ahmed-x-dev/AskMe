# JSON import and export: a portable set format

The app stores each quiz set as a single JSON document, which makes backup, transfer, and validation straightforward.

## Why we need it

A local database is great for app use, but users also need a way to move a set out of the app or restore it later. Plain JSON files give per-set portability; a ZIP archive gives users one backup containing the whole library without needing a backend.

## The concept, simply

A set export is just a snapshot of a valid quiz set. When the app imports it later, it validates the shape before saving the new record. A library backup is a ZIP file containing one set JSON document per entry. The app can also import several selected JSON files together.

This is important because an invalid file should fail clearly instead of silently corrupting the database. The library validates every selected set before writing any of them, then saves the batch in one IndexedDB transaction. A bad file therefore does not leave a half-imported library.

## In our code

`src/data/importExport.ts` validates the structure and converts raw JSON into the app's `QuizSet` type.

```ts
if (parsed.schemaVersion !== CURRENT_SCHEMA_VERSION) {
  throw new Error(`Unsupported schema version: ${String(parsed.schemaVersion ?? 'unknown')}.`)
}
```

The repository persists the validated set through `importSetFromJson`, ensuring only valid content is written.

`src/data/libraryArchive.ts` uses the small `fflate` library to collect the per-set JSON documents into a ZIP and read JSON documents back out of one. Archive entries are treated as file contents only; their paths are never written to the device. The library action can import one ZIP or multiple JSON files, and asks for confirmation when imported IDs would replace existing sets.

On the library page, **Export library** downloads every active set in a ZIP archive. **Import library** accepts a ZIP or multiple full-set JSON files. On a set page, **Import questions** accepts one `Question`, an array of questions, or a full set export. It validates the question fields and appends copies to the open set; it does not replace the destination set or its existing questions. New question IDs prevent collisions when a file is imported more than once. Both flows show success or validation feedback.

The browser does not create genuine RAR archives. ZIP is used for whole-library backups because it is a standard archive format that can be generated locally in the browser.

## ❌ / ✅ examples

- ❌ Importing a file with `schemaVersion: 99` and expecting it to work.
- ✅ Rejecting it with a clear validation error.
- ❌ Saving valid files from a multi-file selection before discovering a later invalid file.
- ✅ Validating the whole batch first and writing all sets in one transaction.
- ❌ Trusting the file paths inside an uploaded ZIP.
- ✅ Reading JSON entry contents without extracting paths to the filesystem.
- ❌ Saving a set without an `id` or `questions` array.
- ✅ Blocking unsafe input before it hits Dexie.
- ❌ Hiding a parse failure after the user selects a file.
- ✅ Showing the validation message next to the library actions.
- ❌ Replacing a destination set when the goal is to add questions.
- ✅ Extracting and validating questions, then appending them to the selected set.

## Try it yourself

1. Export the library and inspect the ZIP: it contains one JSON file per active set.
2. Import several set JSON files together, then try again with one invalid file and confirm none are imported.
3. Change a set's `schemaVersion` to a wrong value and re-import it.
4. On a set page, import a single Question object or a full set export; confirm only questions are appended.

## Quick Reference

- `schemaVersion` tells the app which data format the file is built for.
- `parseSetJson` validates and normalizes raw JSON.
- `exportSetJson` produces a portable, human-readable file.
- `createLibraryArchive` and `readLibraryArchive` write and read ZIP backups.
- `importSetsFromJson` validates a batch, then commits it atomically.
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
