# AI question generation

## Goal

Turn a prompt into ready-to-use MCQ or essay questions in the user's set.

## Why we need it

The app needs reusable content, not a model output dumped onto the page. Questions must be valid records and fit the same schema as hand-written ones.

## The concept, simply

The generator prompts Gemini for JSON, validates the payload, and reshapes each item into a real `Question` record. This is where the app turns a rough model answer into a set item with an ID, timestamp, and deletion flag.

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
  const safeCount = Math.max(1, Math.min(5, Number.isFinite(count) ? Math.round(count) : 1))

  return callGemini<GeneratedQuestion[]>(basePrompt, (value) => validateGeneratedQuestions(value))
}
```

The preview is inserted into the set by `addQuestion`, which uses the same repository flow as manual edits.

## ✅ / ❌ examples

✅ Good: MCQ output with four non-empty options and a valid answer index.
❌ Bad: a model returning a question with only three options or a missing text field.

## Try it yourself

1. Generate a couple of MCQ questions for a set.
2. Add one to the active set.
3. Open the set and verify it appears in the quiz queue.

## Quick Reference

- Use a strict schema for AI output.
- Assign IDs and timestamps before saving to Dexie.
- Validate before writing to the repository.

## Key Takeaways

- AI generation is content creation, not a shortcut around validation.
- Users should preview generated items before accepting them.
- Generated items should behave exactly like manual questions once added.

## Links to related files

- [src/features/ai.ts](../../src/features/ai.ts)
- [src/components/SetDetailPage.tsx](../../src/components/SetDetailPage.tsx)
