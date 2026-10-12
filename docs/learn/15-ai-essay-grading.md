# AI essay grading

## Goal

Grade a user's essay answer with a score, guidance, and a short explanation.

## Why we need it

Essay questions are hard to judge without subjective feedback. The app saves the user from manually checking every answer, while still showing a clear, explainable result.

## The concept, simply

The model receives the question, the optional reference answer, and the learner's answer. It returns a small JSON object with a numeric score and feedback.

The app then shows this score in the quiz flow and keeps the existing self-assessment flow as a fallback for manual review.

## In our code

```ts
export async function gradeEssayAnswer({
  questionText,
  userAnswer,
  referenceAnswer,
}: {
  questionText: string
  userAnswer: string
  referenceAnswer?: string
}): Promise<EssayGradeResult> {
  return callGemini<EssayGradeResult>(prompt, (value) => validateEssayGradeResult(value))
}
```

The validation step makes sure the score and feedback are in a safe range before the UI displays them.

## ✅ / ❌ examples

✅ Good: `score: 8`, `feedback: 'You were close but missed the energy conversion idea.'`
❌ Bad: a score of `12` or a blank `feedback` string.

## Try it yourself

1. Start a set with an essay question.
2. Type an answer and click `AI grade`.
3. Review the returned score and feedback in the quiz card.

## Quick Reference

- Keep grading output small and structured.
- Always validate numeric ranges before showing the result.
- Use `missingPoints` to explain the gap without overcomplicating the UI.

## Key Takeaways

- AI-assisted grading supports learning, not replacement of the user's judgment.
- Clear scores are easier to trust than long free-form text.
- The app still respects the manual review path for essay questions.

## Links to related files

- [src/features/ai.ts](../../src/features/ai.ts)
- [src/components/QuizPage.tsx](../../src/components/QuizPage.tsx)
