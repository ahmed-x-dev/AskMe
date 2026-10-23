# Editing AI prompts

## Goal

Change the instructions AskMe sends to its AI provider without digging through the generation and grading logic.

## Why we need it

AI workflows need different instructions and output formats. Keeping their wording beside request handling makes small prompt edits harder to find and can mix content changes with application logic.

## The concept, simply

The app keeps default prompt wording in a TypeScript configuration object. Prompt-building code combines those strings with changing values such as question text, study notes, or the requested number of questions. This keeps the instructions easy to locate while preserving validation and data handling in the AI feature.

## In our code

Edit [AI_PROMPTS](../../src/features/ai/prompts.ts) to change the wording for question generation, coverage planning, essay grading, or answer explanations. Values containing `{name}` are templates; the prompt builder fills those placeholders with the current study data.

The configuration is part of the app source, so edits take effect after rebuilding or restarting the development server. It is not a prompt editor inside the app.

## Common mistake

Do not remove required JSON or schema instructions unless you also update the response validator and its tests. The AI output is validated before the app uses it.

## Try it yourself

1. Change a short instruction in `AI_PROMPTS.generation`.
2. Run the AI feature tests and verify the edited wording appears in the assembled prompt.
3. Confirm generated questions still pass schema validation.

## Key takeaways

- Prompt wording lives in `src/features/ai/prompts.ts`.
- Dynamic values are inserted by the AI workflow; do not remove their placeholders.
- Keep prompt output requirements aligned with the response validators.
