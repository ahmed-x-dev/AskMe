# Importing and exporting roadmaps

**Goal:** Understand how AskMe validates portable roadmaps and bounds full-backup restores.

## Why we need it

AskMe stores study data in this browser. Roadmap JSON lets a learner share content, while a ZIP backup carries every roadmap and study progress to another browser. Imported files are untrusted input, so validation must finish before records are written.

## The concept, simply

A roadmap file is JSON with one roadmap and its groups, topics, resources, and questions. Zod checks each record's shape, including the question-specific fields. A second check verifies that linked records belong together, such as questions pointing to topics in the same roadmap.

A full backup is a ZIP with one JSON file per roadmap and a `progress.json` file. ZIP size alone is not enough: a small compressed file can expand dramatically. Restore therefore limits the selected ZIP to 25 MB, limits expanded content to 50 MiB, and streams it in 64 KiB chunks before parsing it. The database replacement happens in one transaction only after all files validate.

## In our code

`src/lib/schemas.ts` validates every stored question type and checks record relationships:

```ts
export const questionSchema: z.ZodType<Question> = z.discriminatedUnion(
  "type",
  [
    // MCQ, essay, true/false, fill-blank, and flashcard shapes
  ],
);

if (file.questions.some((question) => question.roadmapId !== file.roadmap.id)) {
  problems.push("A question belongs to a different roadmap.");
}
```

The `type` field selects the right question shape. The refinement rejects a question whose roadmap differs from the file's roadmap; the topic reference is checked separately.

`src/lib/libraryArchive.ts` uses `fflate`'s streaming `Unzip` API. It counts actual output bytes instead of trusting the ZIP's declared sizes, ignores entries that are not roadmap JSON or `progress.json`, and parses each relevant file before returning it. `src/components/settings/DataSection.tsx` checks `File.size` before calling `arrayBuffer()`, avoiding a large allocation for an oversized selection.

`src/lib/data/backup.ts` validates the backup, then replaces all tables in one Dexie transaction. A validation or write failure leaves the previous database contents intact. The AI key is not included in the archive.

## ❌ / ✅ examples

- Incorrect: accept only MCQ and essay after adding more question types.
- Correct: keep the import schema aligned with every stored `Question` variant.
- Incorrect: trust a question's `roadmapId` because its `topicId` exists.
- Correct: validate both the topic link and roadmap ownership before import.
- Incorrect: call `unzipSync` on an unbounded user-selected archive.
- Correct: reject oversized input before reading it, then cap actual expanded output while streaming.
- Incorrect: clear existing tables before validating a restore.
- Correct: validate first and perform the replacement in one transaction.

## Try it yourself

1. Export a roadmap containing all five question types, then import it and check each question is still present.
2. Change a question's `roadmapId` in an exported JSON file and confirm import rejects it.
3. Select a ZIP larger than 25 MB and confirm the app rejects it without reading its contents.

## Quick Reference

- `parseRoadmapFile` parses JSON and validates the roadmap schema.
- `questionSchema` must cover every member of the shared `Question` union.
- `readBackupArchive` caps input at 25 MB, expanded content at 50 MiB, and entries at 1,000.
- Full restore validates all data before its atomic Dexie transaction.
- The AI key is not included in a backup.

## Key Takeaways

- Validate imported shape and cross-record ownership, not just individual fields.
- Apply limits before file reads and while decompression produces output.
- Keep restore atomic so invalid backups cannot partially replace local data.

## Links to related files

- [src/lib/schemas.ts](../../src/lib/schemas.ts)
- [src/lib/importExport.ts](../../src/lib/importExport.ts)
- [src/lib/libraryArchive.ts](../../src/lib/libraryArchive.ts)
- [src/lib/data/backup.ts](../../src/lib/data/backup.ts)
- [tests/backup.test.ts](../../tests/backup.test.ts)
