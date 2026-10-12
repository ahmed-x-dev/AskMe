# Question editor: create and validate set questions

A practical editor for short question records with strict input checks before they hit local storage.

## Why we need it

A quiz set is only useful when it can hold real questions. The app must support both MCQ and essay questions without saving broken records.

## The concept, simply

A form is just a controlled way to turn user input into a typed object. In this app, that means taking text, options, and a correct answer and converting it into a `Question` object before calling the repository.

We also validate before saving: no empty text, no empty MCQ answers, no duplicate answers, and a valid answer index.

## In our code

The editor in `src/components/QuestionEditorPage.tsx` controls `text`, `options`, and `answerIndex` state. It switches between the MCQ and essay layouts and calls `addQuestion` or `updateQuestion` when the user saves.

```ts
const cleanedText = sanitizeText(text)

if (activeType === 'mcq') {
  const trimmedOptions = options.map((option) => option.trim())
  if (trimmedOptions.some((option) => !option)) {
    setErrorMessage('All four options must be filled in.')
    return
  }
}
```

This saves the record only after validation passes, which keeps bad data out of IndexedDB.

## ❌ / ✅ examples

- ❌ Empty question text is saved as a blank record.
- ✅ The editor blocks blank questions and duplicate MCQ options.
- ❌ An answer index of `9` is allowed by accident.
- ✅ The app accepts only `0` to `3` for MCQ answers.

## Try it yourself

1. Add a new MCQ and save it with duplicate options.
2. Try changing the correct answer index from `0` to `3`.
3. Add an essay question with a reference answer and save it.

## Quick Reference

- `crypto.randomUUID()` gives each question a unique id.
- Use `trim()` before checking user input.
- `addQuestion` creates a new record; `updateQuestion` replaces an existing one.

## Key Takeaways

- Validation should happen before the repository writes to storage.
- A single editor can handle multiple question types by switching on `type`.
- Good form state makes mistakes visible before data is persisted.

## Links to related files

- `src/components/QuestionEditorPage.tsx`
- `src/data/repository.ts`
- `src/types/quiz.ts`
