# Gemini client and error handling

## Goal

Talk to Gemini safely, with timeouts and user-friendly failures.

## Why we need it

The AI features are optional and might fail for many reasons: a bad key, a rate limit, a network outage, or malformed model output. A client that throws raw errors makes the app feel unstable.

## The concept, simply

A fetch wrapper sits between the UI and the Gemini API. It adds a timeout, checks the HTTP status, extracts text from the model response, and converts failure cases into clearer messages.

The important rule is: do not let API failures crash the app. Translate them into a readable message and keep the rest of the UI usable.

## In our code

```ts
const controller = new AbortController()
const timeout = window.setTimeout(() => controller.abort(), 30_000)

const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    signal: controller.signal,
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.6,
        responseMimeType: 'application/json',
      },
    }),
  },
)
```

This gives us a controlled request and a clear fail-fast path.
The key is sent in a request header rather than the URL to reduce exposure in URL-based logs.

## ✅ / ❌ examples

✅ Good: a timeout error becomes `Gemini timed out. Please try a smaller request.`
❌ Bad: a raw `TypeError` from `fetch` showing in the UI.

## Try it yourself

1. Remove the key and trigger a generation.
2. Confirm that the UI says to add a key.
3. Mock a rate-limit response and check the message shown to the user.

## Quick Reference

- `AbortController` gives you a timeout.
- `response.ok` checks for HTTP errors.
- `response.json()` is only safe after the response is verified.
- Convert transport problems into app-level messages.

## Key Takeaways

- AI requests should fail gracefully.
- User-friendly errors are part of product quality.
- A small wrapper keeps the app resilient while the core logic stays clean.

## Links to related files

- [src/features/ai.ts](../src/features/ai.ts)
- [src/components/SettingsPage.tsx](../src/components/SettingsPage.tsx)
