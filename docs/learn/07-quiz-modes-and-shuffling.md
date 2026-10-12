# Quiz modes and shuffling: mix, filter, and randomize

The quiz engine decides which questions appear and in what order for each practice session.

## Why we need it

A revision app needs more than one way to study. The user may want all questions, only MCQs, or only essays, and the order should feel fresh each time.

## The concept, simply

A quiz queue is a filtered, randomized list. The app starts with all active questions, drops the ones that don't match the selected mode, and shuffles the rest using Fisher-Yates.

## In our code

The helper in `src/features/quiz.ts` builds the queue and shuffles it before the user starts.

```ts
const filteredQuestions =
  mode === 'random'
    ? activeQuestions
    : activeQuestions.filter((question) => question.type === mode)

return shuffle(filteredQuestions)
```

The shuffle step changes the ordering without mutating the original set, so every quiz is a fresh run rather than a permanent reordering.

## ❌ / ✅ examples

- ❌ Reusing the original order every time makes the app predictable.
- ✅ A random queue keeps revision sessions interesting.
- ❌ Mixing essay and MCQ questions when the user asked for MCQ-only.
- ✅ The filter restricts the queue to the selected mode.

## Try it yourself

1. Create one MCQ and one essay question, then run a quiz in `mcq` mode.
2. Run the same set in `random` mode and confirm the order changes.
3. Ensure deleted questions are ignored.

## Quick Reference

- `buildQuizQueue(set, 'random')` returns all active questions.
- `buildQuizQueue(set, 'mcq')` returns only MCQ questions.
- `shuffle` copies the array before reordering it.

## Key Takeaways

- Filtering and shuffling are separate decisions: one chooses the data, one changes the order.
- Keep the source set unchanged and build a new queue each time.
- Deleted questions should never enter a live quiz.

## Links to related files

- `src/features/quiz.ts`
- `src/components/QuizPage.tsx`
- `src/types/quiz.ts`
