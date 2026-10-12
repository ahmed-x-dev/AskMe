# Quiz flow and scoring: answer, reveal, and finish

The quiz screen turns a question list into a game loop with visible progress and a final score.

## Why we need it

Users need to see what they answered, whether they were right, and how far through the set they are. The quiz should feel immediate and easy to complete on a phone.

## The concept, simply

Each question is a turn. The app shows one question at a time, tracks the answer, reveals the outcome for MCQs, and moves to the next question until the set is done. For essays, the learner reveals the optional reference answer and self-marks the response right or wrong.

MCQ scoring is strict: the selected option must match `answerIndex`. Essay questions are self-assessed: after revealing the reference answer, the learner chooses whether they got it right. The app uses that choice in the final score; it does not grade essay text automatically.

## In our code

The page `src/components/QuizPage.tsx` stores answers in local state and computes the final tally at the end of the run.

```ts
const endScore = queue.reduce((total, question) => {
  const answer = answers[question.id]
  return total + (isCorrect(question, answer, essayResults[question.id]) ? 1 : 0)
}, 0)
```

For MCQs, `isCorrect` compares the selected option with the answer key. For essays, it uses the separate `essayResults` self-mark. Keeping that mark separate from the typed answer lets the learner compare their work before deciding. The score is derived for the current run and is not stored in the database.

## ❌ / ✅ examples

- ❌ Showing the next question before the last one is answered.
- ✅ MCQs continue after an option is selected; essays continue after the reference is revealed and the response is self-marked.
- ❌ Counting an essay as correct just because the learner typed something.
- ✅ Reveal the reference answer and require an explicit right/wrong self-mark before continuing.

## Try it yourself

1. Start a quiz with one MCQ and one essay question.
2. Answer the MCQ incorrectly and confirm the red state appears.
3. Reveal an essay's reference answer, mark it wrong, and confirm the final score reflects that choice.

## Quick Reference

- `useState` keeps typed answers, revealed references, and self-assessed essay results for the in-progress quiz.
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
