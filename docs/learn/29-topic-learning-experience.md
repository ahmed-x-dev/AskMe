# Topic learning experience

**Goal:** Turn a topic page into a clear path from learning material to practice.

## Why we need it

A topic can contain notes, lessons, and questions. The page should show how those pieces fit together without adding duplicate saved fields or hiding familiar actions.

## The concept, simply

Start with context: what topic is open, which roadmap it belongs to, and what can be done next. Show progress only for something the app can measure, such as completed lessons. Keep long-form notes narrower than the full screen so they remain comfortable to read.

Progress must describe its numerator and denominator. A topic does not have one meaningful percentage today, so the overview should show lesson completion and question availability separately instead of inventing a blended score.

## In our code

In `src/components/topics/TopicPage.tsx`, the page loads the topic, roadmap, group, lessons, and questions:

```tsx
const { topic, roadmap, group, lessons, questions } = page;
const completedLessons = lessons.filter((lesson) => lesson.done).length;
```

- `topic` and `roadmap` provide the study context.
- `group` is optional context, not a separate navigation route.
- Lesson completion is directly measurable from `lesson.done`.
- Questions are counted independently; quiz availability follows whether any exist.
- Nothing new is written to storage for this overview.

`NotesSection` uses a bounded reading column for both Markdown preview and the editor. The surrounding page can remain full-width while paragraphs keep a readable measure.

## ❌ / ✅ examples

❌ Label the whole topic “60% complete” by blending lesson checks, question counts, and a manual status.

✅ Show “2 of 4 lessons completed” and “6 questions” as separate facts.

❌ Stretch every note line across a wide monitor.

✅ Keep the note preview and editor aligned to a readable text measure while other page content uses available width.

## Try it yourself

1. Add three lessons, mark one complete, and compare the summary with the lesson list.
2. Open a topic with a very long title and check it at phone width.
3. Add a long unbroken URL to a resource and verify the page does not scroll sideways.

## Quick Reference

- Read from existing data: topic status, `lesson.done`, and question count.
- Do not add a derived percentage that mixes unrelated measures.
- Use labeled form controls and connect validation with `aria-describedby`.
- Let long URLs break inside their own metadata area.
- Keep notes readable with a bounded text measure, not a narrow page layout.

## Key Takeaways

- The topic overview is a guide, not a second source of saved data.
- Clear study actions should be visible before the learner scrolls.
- Lesson progress and question availability answer different questions.
- Readable line length matters even when the layout is full-width.

## Links to related files

- Builds on [11 — Responsive layout](./11-responsive-layout.md) and [28 — Shared UI interactions](./28-shared-ui-interactions.md).
- See the topic-screen specification in [DESIGN.md](../../DESIGN.md).
