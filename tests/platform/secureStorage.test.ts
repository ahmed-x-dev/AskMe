import { beforeEach, describe, expect, it } from 'vitest'

import {
  clearAiApiKey,
  clearGeminiApiKey,
  getAiApiKey,
  getAiProvider,
  getGeminiApiKey,
  hasAiApiKey,
  hasGeminiApiKey,
  saveAiApiKey,
  saveGeminiApiKey,
  setAiProvider,
} from '../../src/platform/secureStorage'

describe('secureStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('stores and reads the Gemini key', () => {
    saveGeminiApiKey('test-key')

    expect(getGeminiApiKey()).toBe('test-key')
    expect(hasGeminiApiKey()).toBe(true)
  })

  it('stores separate keys for each provider', () => {
    saveAiApiKey('openai', 'openai-key')
    setAiProvider('openai')

    expect(getAiProvider()).toBe('openai')
    expect(getAiApiKey()).toBe('openai-key')
    expect(hasAiApiKey()).toBe(true)
  })

  it('clears the stored Gemini key', () => {
    saveGeminiApiKey('test-key')
    clearGeminiApiKey()

    expect(getGeminiApiKey()).toBe('')
    expect(hasGeminiApiKey()).toBe(false)
  })

  it('clears the selected provider key', () => {
    setAiProvider('openai')
    saveAiApiKey('openai', 'openai-key')
    clearAiApiKey('openai')

    expect(getAiApiKey('openai')).toBe('')
    expect(hasAiApiKey('openai')).toBe(false)
  })
})
