# Focused quiz and review

**Goal:** Understand how a learner moves from quiz setup to an answer, saved attempt, result, or spaced-repetition review.

## Why we need it

Quiz screens combine settings, a timed question, answer feedback, and navigation. Review adds a due queue. A clear hierarchy helps the learner focus without changing how questions are selected or scored.

## The concept, simply

The setup screen selects a question queue by type, difficulty, mistakes, and count. The runner shows one item at a time. Each answer records whether it was correct and updates the review schedule. Results summarize those same per-question correctness values. During a quiz (not a daily Review session), the learner can delete a question after confirmation; its saved history is removed and it is omitted from the active queue and results.

MCQs are checked immediately. Essay answers are self-assessed after the reference answer is revealed. AI grading and explanations remain optional helpers; they do not replace the learner's MCQ answer or essay self-assessment.

Leaving a session is different from finishing it. Attempts already recorded remain in review history, but leaving does not produce a quiz score.

## In our code

`src/components/quiz/QuizRunner.tsx` owns the active queue index and correctness map:

```tsx
const question = queue[index];
const result = results[question.id];
```

- `question` is the only active question shown.
- `result` is undefined until it is answered, then true or false.
- Each answer is recorded with `recordAttempt`; that also schedules the next review.
- Finishing maps the queue back to its recorded correctness values, in queue order.

`src/components/quiz/QuizResults.tsx` counts `answer.correct` values and divides by the number of queued questions. `src/features/quiz/index.ts` defines the 80% topic-completion threshold. Neither rule depends on AI feedback.

## ❌ / ✅ examples

❌ Let a second click record another attempt or start another finish operation.

✅ Lock the current answer/finish operation while it is in progress.

❌ Hide a persistence error when transitioning to the results screen.

✅ Keep the score visible and tell the learner which history/completion update could not be saved.

❌ Force long prompts onto one phone screen by clipping or shrinking the text.

✅ Let long prompts wrap and scroll naturally while keeping one question visually dominant.

## Try it yourself

1. Answer one MCQ correctly and one incorrectly; verify the results and missed-question retry queue.
2. Exit a quiz after answering and confirm the warning distinguishes saved review attempts from the unfinished score.
3. Open Review with more than 20 due questions and verify the session limit is explained.

## Quick Reference

- `buildQuizQueue` filters, shuffles, and limits the session queue.
- `recordAttempt` saves an answer and updates spaced-repetition state.
- `QuizRunner` associates each remaining queue entry with its correctness value; quiz-only deletion also removes the question and its saved history.
- `QuizResults` displays the derived score and missed questions.
- `PASS_MARK` is 0.8; topic completion requires all topic questions and the threshold.
- Due review sessions include up to `REVIEW_SESSION_SIZE` cards.
- Question records contain text and (for MCQs) text options; embedded images are not part of the current data model.

## Key Takeaways

- Presentation changes must not alter question selection or answer semantics.
- Every answer in the runner maps to one question in the results queue.
- A saved attempt updates review scheduling independently from the final quiz score.
- Keep recovery feedback visible without obscuring the active question or result.

## Links to related files

- Builds on [08 — Quiz flow and scoring](./08-quiz-flow-and-scoring.md), [15 — AI essay grading](./15-ai-essay-grading.md), and [25 — Quiz session options](./25-quiz-session-options.md).
- See the interaction rules in [DESIGN.md](../../DESIGN.md).
