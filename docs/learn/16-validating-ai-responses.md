# Validating AI responses

## Goal

Reject malformed Gemini output before it reaches the app or the database.

## Why we need it

Model output is probabilistic. The same prompt can produce a different structure, empty values, or a totally different schema. If we trust it blindly, the UI will break or generate invalid records.

## The concept, simply

Validation is the safety net between the model and your repository. It checks that the response shape is correct before it is used.

This matters for both question generation and essay grading. The app should show a clear message and let the user retry instead of crashing.

## In our code

```ts
export function validateGeneratedQuestions(payload: unknown): GeneratedQuestion[] {
  const source = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray(payload.questions)
      ? payload.questions
      : []

  if (source.length === 0) {
    throw new Error('The AI response did not include any questions.')
  }

  return source.map((rawQuestion, questionIndex) => {
    if (!isRecord(rawQuestion)) {
      throw new Error(`Generated question ${questionIndex + 1} is not an object.`)
    }
    // ...
  })
}
```

The same idea is used for `score`, `feedback`, and `missingPoints` in the grading response.

## ✅ / ❌ examples

✅ Good: reject invalid MCQ answers before they reach the repository.
❌ Bad: accept a question with missing text or a score outside the valid range.

## Try it yourself

1. Send a malformed model output to `validateGeneratedQuestions`.
2. Confirm it throws a readable error.
3. Make the output valid again and verify the result is accepted.

## Quick Reference

- Validate before saving or rendering.
- Keep error messages specific and readable.
- Treat malformed output as a recoverable problem, not a crash.

## Key Takeaways

- Validation is a product feature, not a backend detail.
- It reduces user-facing surprises when the model is inconsistent.
- Clear error text is better than silent bad data.

## Links to related files

- [src/features/ai.ts](../../src/features/ai.ts)
- [src/data/importExport.ts](../../src/data/importExport.ts)
