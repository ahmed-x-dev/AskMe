# Quiz flow and scoring: answer, reveal, and finish

The quiz screen turns a question list into a game loop with visible progress and a final score.

## Why we need it

Users need to see what they answered, whether they were right, and how far through the set they are. The quiz should feel immediate and easy to complete on a phone.

## The concept, simply

Each question is a turn. The app shows one question at a time, tracks the answer, reveals the outcome for MCQs, and moves to the next question until the set is done.

MCQ scoring is strict: the selected option must match `answerIndex`. Essay questions use a simple completion-based score stub for this phase, since the AI grading step is later.

## In our code

The page `src/components/QuizPage.tsx` stores answers in local state and computes the final tally at the end of the run.

```ts
const endScore = queue.reduce((total, question) => {
  const answer = answers[question.id]
  return total + (isCorrect(question, answer) ? 1 : 0)
}, 0)
```

This makes score calculation a simple derived value rather than something stored in the database.

## ❌ / ✅ examples

- ❌ Showing the next question before the last one is answered.
- ✅ The Next button is disabled until an answer is selected or typed.
- ❌ Counting every essay as wrong when the user typed a real answer.
- ✅ Essay responses count as a completed answer in this phase.

## Try it yourself

1. Start a quiz with one MCQ and one essay question.
2. Answer the MCQ incorrectly and confirm the red state appears.
3. Answer the essay and finish the quiz to view the total score.

## Quick Reference

- `useState` keeps the current answer map for the in-progress quiz.
- `currentIndex` controls which question is active.
- `queue.length` sets the total and completion bar width.

## Key Takeaways

- A quiz is stateful and ephemeral; it does not rewrite the source set.
- Derived scores are easy to reason about and easier to test.
- Small feedback states make the UX feel responsive and forgiving.

## Links to related files

- `src/components/QuizPage.tsx`
- `src/features/quiz.ts`
- `src/types/quiz.ts`
