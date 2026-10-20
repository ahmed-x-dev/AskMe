# Optional question types

## Goal

Expand the question model beyond MCQ and essay so the app can handle true/false, fill-in-the-blank, and flashcard-style prompts without breaking the existing quiz flow.

## Why we need it

The quiz engine uses a shared question shape with five concrete variants. Keeping the storage and import schemas aligned lets the app grow without losing newer question types during export or backup restore.

## The concept, simply

A question is a record with a `type` discriminator and a small set of extra fields. MCQ adds `options` and `answerIndex`; essay adds `referenceAnswer`; true/false adds `answer`; short-answer prompts add `answer`. The UI and AI prompt builder only branch on the type they need, and the repository validates each variant before it is saved.

This is a good example of a discriminated union: one field chooses the shape, and TypeScript narrows it automatically once the app checks the type.

## In our code

```ts
export type QuestionType =
  | "mcq"
  | "essay"
  | "true-false"
  | "fill-blank"
  | "flashcard";

export interface TrueFalseQuestion extends BaseQuestion {
  type: "true-false";
  answer: boolean;
}

export interface FillBlankQuestion extends BaseQuestion {
  type: "fill-blank";
  answer: string;
}
```

The union in [src/types/study.ts](../../src/types/study.ts) is the source of truth. [src/lib/schemas.ts](../../src/lib/schemas.ts) validates those variants when roadmap files and backups are imported. The repository layer in [src/lib/data/questions.ts](../../src/lib/data/questions.ts) normalizes each input before writing it; the AI validator in [src/features/ai/index.ts](../../src/features/ai/index.ts) accepts the same data shapes, so generated questions behave like user-written ones.

## ✅ / ❌ examples

✅ Good: a true/false item with a boolean answer and a short answer item whose text is non-empty.
❌ Bad: a fill-in-the-blank item with an empty answer, or a generated record that claims to be `mcq` but has only three options.

## Try it yourself

1. Create a true/false question in the editor and save it.
2. Create a flashcard question and confirm the answer field stays visible in the quiz.
3. Generate a new question type from the AI dialog and check the preview shows the correct answer in the right format.

## Quick Reference

- Keep a single `QuestionType` union in the shared types file.
- Validate per variant before saving.
- Let the UI show only the controls that match the active type.
- Update the AI generator and explain flow to understand the new shapes.

## Key Takeaways

- The data model grows by adding “small, well-defined” variants rather than one giant free-form object.
- Type guards keep the code readable and safe.
- New question types are easy to add when the validation stays centralized.

## Links to related files

- [src/types/study.ts](../../src/types/study.ts)
- [src/lib/schemas.ts](../../src/lib/schemas.ts)
- [src/lib/data/questions.ts](../../src/lib/data/questions.ts)
- [src/features/ai/index.ts](../../src/features/ai/index.ts)
- [src/components/questions/QuestionEditorForm.tsx](../../src/components/questions/QuestionEditorForm.tsx)
