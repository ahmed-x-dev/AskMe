# AI provider abstraction

This note explains how AskMe stops assuming every AI key belongs to Gemini and instead treats the AI layer as a provider-aware feature.

## Why we need it

The project started with one provider: Gemini. That worked, but the app could not easily switch to another model or API without editing the storage layer and the request code. We needed a simple rule: one provider, one key, one request adapter.

## The concept, simply

A provider is just the service behind the AI call. In practice that means:

- the app selects a provider, such as `gemini` or `openai`
- the matching API key is stored separately
- the request code chooses the correct URL, headers, and response parsing
- the rest of the app still asks for `generateQuestions()` or `gradeEssayAnswer()` without caring which provider is underneath

This keeps the dependency on the AI vendor at the edge of the app instead of spread across the UI and data layer.

## In our code

The storage layer now keeps keys by provider instead of one global Gemini key:

```ts
export type AiProvider = 'gemini' | 'openai'

export function getAiApiKey(provider: AiProvider = getAiProvider()): string {
  return browserKeyStorage.getItem(`askme-${provider}-key`) ?? ''
}
```

The settings screen lets the user switch providers and save the matching key:

```tsx
const [provider, setProvider] = useState<AiProvider>(getAiProvider())

<select value={provider} onChange={(event) => handleProviderChange(event.target.value as AiProvider)}>
  <option value="gemini">Gemini</option>
  <option value="openai">OpenAI</option>
</select>
```

The AI request code then dispatches to the right adapter:

```ts
if (provider === 'openai') {
  response = await fetch('https://api.openai.com/v1/chat/completions', {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })
} else {
  response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      headers: { 'x-goog-api-key': apiKey },
    },
  )
}
```

The Gemini key is sent in a request header rather than the URL. This reduces the chance that it is copied into URL-based diagnostics or logs; browser storage itself remains readable to same-origin scripts.

## ✅ / ❌ examples

### ❌ Bad

```ts
const apiKey = localStorage.getItem('gemini-key')
```

This assumes the app only ever uses one AI provider.

### ✅ Good

```ts
const apiKey = getAiApiKey(selectedProvider)
```

This keeps each provider's key isolated and makes the rest of the app provider-agnostic.

## Try it yourself

1. Open Settings and switch from Gemini to OpenAI.
2. Save a key for the selected provider.
3. Generate a question or grade an essay with the same flow.
4. Confirm that the app uses the selected provider automatically.

## Quick reference

- `AiProvider = 'gemini' | 'openai'`
- `getAiProvider()` reads the selected provider
- `saveAiApiKey(provider, value)` stores a key for one provider only
- `generateQuestions({ provider })` and `gradeEssayAnswer({ provider })` can target either provider

## Key takeaways

- A provider abstraction keeps AI vendor details at the edge.
- Provider-specific keys are stored separately, which avoids collisions and accidental reuse.
- The app can support more providers without rewiring the business logic.

## Links to related files

- [src/platform/secureStorage.ts](../../src/platform/secureStorage.ts)
- [src/features/ai.ts](../../src/features/ai.ts)
- [src/components/SettingsPage.tsx](../../src/components/SettingsPage.tsx)
