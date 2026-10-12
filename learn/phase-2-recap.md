# Phase 2 recap

This phase added the optional Gemini-powered AI flow without changing the app's local-first design. The main idea was simple: the user supplies a key on the device, the app validates the AI output before using it, and any failed request is surfaced as a human-readable message instead of a crash.

## What we added

- A secure-storage wrapper for the Gemini key under the platform layer.
- A settings screen to save, hide, show, and clear the key.
- A Gemini client with timeout handling and structured JSON parsing.
- AI question generation that previews results and lets the user add them to a set.
- AI essay grading that returns a numeric score, missing-points total, and feedback.
- Validation guards so malformed responses are rejected before they reach the quiz or repository.

## Key decisions

- The API key is stored outside Dexie and outside exported set JSON to keep secrets off the sync pipeline.
- The app does not trust raw Gemini output. It validates schema and trims strings before converting to app question models.
- Failures are translated into clear user-facing messages such as rate limits, timeouts, or malformed JSON.
- The AI flows stay optional: if no key is present, the UI tells the user exactly how to fix that.

## Quiz

1. Why is the Gemini key kept outside the database?
2. What does the Gemini client validate before using an AI response?
3. What does the `gradeEssayAnswer` result object include?
4. Why is JSON validation important in this app?
5. What should happen if the API key is missing?

<details>
<summary>Answers</summary>

1. So the secret is never synced or exported with the user's sets.
2. It validates the expected structure, required fields, and value ranges before converting the output.
3. It includes `score`, `feedback`, and `missingPoints`.
4. It prevents malformed or incomplete responses from breaking the app or inserting bad data.
5. The UI should show a clear message telling the user to add the key in Settings before grading or generating questions.

</details>
