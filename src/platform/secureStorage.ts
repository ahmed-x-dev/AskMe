export type AiProvider = 'gemini' | 'openai'

export const DEFAULT_AI_PROVIDER: AiProvider = 'gemini'
export const AI_PROVIDER_STORAGE_KEY = 'askme-ai-provider'

export type KeyStorageAdapter = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

export const browserKeyStorage: KeyStorageAdapter = {
  getItem(key: string) {
    return window.localStorage.getItem(key)
  },
  setItem(key: string, value: string) {
    window.localStorage.setItem(key, value)
  },
  removeItem(key: string) {
    window.localStorage.removeItem(key)
  },
}

function getProviderStorageKey(provider: AiProvider): string {
  return `askme-${provider}-key`
}

export function getAiProvider(): AiProvider {
  const value = browserKeyStorage.getItem(AI_PROVIDER_STORAGE_KEY)
  return value === 'openai' ? 'openai' : 'gemini'
}

export function setAiProvider(provider: AiProvider): void {
  browserKeyStorage.setItem(AI_PROVIDER_STORAGE_KEY, provider)
}

/** Reads a provider key from browser localStorage; this is not encrypted secure storage. */
export function getAiApiKey(provider: AiProvider = getAiProvider()): string {
  return browserKeyStorage.getItem(getProviderStorageKey(provider)) ?? ''
}

/** Saves a provider key in browser localStorage, where same-origin scripts can access it. */
export function saveAiApiKey(provider: AiProvider, value: string): void {
  const trimmed = value.trim()

  if (!trimmed) {
    browserKeyStorage.removeItem(getProviderStorageKey(provider))
    return
  }

  browserKeyStorage.setItem(getProviderStorageKey(provider), trimmed)
}

/** Removes the saved API key for a provider. */
export function clearAiApiKey(provider: AiProvider = getAiProvider()): void {
  browserKeyStorage.removeItem(getProviderStorageKey(provider))
}

/** Indicates whether a key is currently saved for the selected provider. */
export function hasAiApiKey(provider: AiProvider = getAiProvider()): boolean {
  return getAiApiKey(provider).length > 0
}

/** @deprecated Use the provider-aware APIs instead. */
export const GEMINI_API_KEY_STORAGE_KEY = getProviderStorageKey('gemini')

/** @deprecated Use `getAiApiKey('gemini')` instead. */
export function getGeminiApiKey(): string {
  return getAiApiKey('gemini')
}

/** @deprecated Use `saveAiApiKey('gemini', value)` instead. */
export function saveGeminiApiKey(value: string): void {
  saveAiApiKey('gemini', value)
}

/** @deprecated Use `clearAiApiKey('gemini')` instead. */
export function clearGeminiApiKey(): void {
  clearAiApiKey('gemini')
}

/** @deprecated Use `hasAiApiKey('gemini')` instead. */
export function hasGeminiApiKey(): boolean {
  return hasAiApiKey('gemini')
}
