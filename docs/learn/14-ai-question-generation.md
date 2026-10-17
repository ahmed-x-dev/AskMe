# AI question generation

## Goal

Turn a prompt into ready-to-use MCQ or essay questions in the user's set.

## Why we need it

The app needs reusable content, not a model output dumped onto the page. Questions must be valid records and fit the same schema as hand-written ones.

## The concept, simply

The generator prompts the selected AI provider for JSON, validates the payload, and reshapes each item into a real `Question` record. The requested count is rounded and bounded to 1–20 before it is sent, so the model gets a clear limit and does not receive an unbounded request.

A nice UX is to preview the generated items before saving them. That keeps the user in control and makes it obvious what is being added.

## In our code

```ts
export async function generateQuestions({
  type,
  count,
  setTitle,
  prompt,
}: {
  type: QuestionType
  count: number
  setTitle?: string
  prompt?: string
}): Promise<GeneratedQuestion[]> {
  const safeCount = Math.max(1, Math.min(20, Number.isFinite(count) ? Math.round(count) : 1))

  return callAi<GeneratedQuestion[]>(provider, basePrompt, (value) => validateGeneratedQuestions(value))
}
```

The count control on the set screen also allows values up to 20. A settings gear beside the generator title links to provider setup without taking space with a key-status button. The preview is inserted into the set by `addQuestion`, which uses the same repository flow as manual edits.

## ✅ / ❌ examples

✅ Good: MCQ output with four non-empty options and a valid answer index.
❌ Bad: a model returning a question with only three options or a missing text field.

## Try it yourself

1. Generate a couple of MCQ questions for a set.
2. Add one to the active set.
3. Open the set and verify it appears in the quiz queue.
4. Request 20 questions, then enter a count above 20 and verify the app caps the request at 20.

## Quick Reference

- Use a strict schema for AI output.
- Keep generation count between 1 and 20.
- Assign IDs and timestamps before saving to Dexie.
- Validate before writing to the repository.

## Key Takeaways

- AI generation is content creation, not a shortcut around validation.
- Users should preview generated items before accepting them.
- Generated items should behave exactly like manual questions once added.

## Links to related files

- [src/features/ai.ts](../../src/features/ai.ts)
- [src/components/SetDetailPage.tsx](../../src/components/SetDetailPage.tsx)
