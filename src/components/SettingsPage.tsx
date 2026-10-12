import { useState } from 'react'
import { Link } from 'react-router'

import {
  clearAiApiKey,
  getAiApiKey,
  getAiProvider,
  saveAiApiKey,
  setAiProvider,
  type AiProvider,
} from '../platform/secureStorage'

const providerOptions: { value: AiProvider; label: string }[] = [
  { value: 'gemini', label: 'Gemini' },
  { value: 'openai', label: 'OpenAI' },
]

export function SettingsPage() {
  const [provider, setProvider] = useState<AiProvider>(getAiProvider())
  const [apiKey, setApiKey] = useState(getAiApiKey(provider))
  const [isVisible, setIsVisible] = useState(false)
  const [status, setStatus] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)

  const handleProviderChange = (nextProvider: AiProvider) => {
    setProvider(nextProvider)
    setAiProvider(nextProvider)
    setApiKey(getAiApiKey(nextProvider))
    setStatus(null)
  }

  const handleSave = () => {
    const trimmed = apiKey.trim()

    if (!trimmed) {
      clearAiApiKey(provider)
      setStatus({ kind: 'success', message: `${provider === 'openai' ? 'OpenAI' : 'Gemini'} key cleared.` })
      return
    }

    saveAiApiKey(provider, trimmed)
    setStatus({ kind: 'success', message: `${provider === 'openai' ? 'OpenAI' : 'Gemini'} key saved in this browser.` })
  }

  const handleRemove = () => {
    clearAiApiKey(provider)
    setApiKey('')
    setStatus({ kind: 'success', message: `The ${provider === 'openai' ? 'OpenAI' : 'Gemini'} key was removed.` })
  }

  return (
    <section className="rounded-2xl bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] leading-[18px] text-muted">Settings</p>
          <h2 className="mt-1 text-[22px] font-medium leading-[28px] text-fg">AI key</h2>
        </div>
        <Link
          to="/"
          className="inline-flex min-h-11 items-center rounded-2xl bg-bg px-3 text-[13px] font-medium text-fg transition-colors hover:bg-accent hover:text-on-accent"
        >
          Back to sets
        </Link>
      </div>

      <p className="mt-4 text-[16px] leading-6 text-muted">
        The key is stored in this browser, outside the app database and sync files. Browser storage is not encrypted and can be read by scripts running on this site.
      </p>

      <label className="mt-5 block text-[13px] font-medium leading-[18px] text-muted" htmlFor="ai-provider">
        AI provider
      </label>
      <select
        id="ai-provider"
        value={provider}
        onChange={(event) => handleProviderChange(event.target.value as AiProvider)}
        className="mt-2 min-h-12 w-full rounded-2xl border border-transparent bg-bg px-3 text-[16px] leading-6 text-fg focus:border-accent"
      >
        {providerOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <label className="mt-5 block text-[13px] font-medium leading-[18px] text-muted" htmlFor="ai-key">
        API key
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="ai-key"
          type={isVisible ? 'text' : 'password'}
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          placeholder={`Enter your ${provider === 'openai' ? 'OpenAI' : 'Gemini'} key`}
          className="min-h-12 flex-1 rounded-2xl border border-transparent bg-bg px-3 text-[16px] leading-6 text-fg placeholder:text-muted focus:border-accent"
        />
        <button
          type="button"
          onClick={() => setIsVisible((current) => !current)}
          className="min-h-12 rounded-2xl bg-bg px-3 text-[13px] font-medium text-fg transition-colors hover:bg-card"
        >
          {isVisible ? 'Hide' : 'Show'}
        </button>
      </div>

      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="min-h-12 flex-1 rounded-2xl bg-accent px-4 text-[16px] font-medium text-on-accent"
        >
          Save key
        </button>
        <button
          type="button"
          onClick={handleRemove}
          className="min-h-12 flex-1 rounded-2xl bg-bg px-4 text-[16px] font-medium text-fg transition-colors hover:bg-card"
        >
          Remove
        </button>
      </div>

      {status ? (
        <p
          role={status.kind === 'error' ? 'alert' : 'status'}
          className={`mt-4 text-[13px] leading-[18px] ${
            status.kind === 'error' ? 'text-bad-fg' : 'text-accent-text'
          }`}
        >
          {status.message}
        </p>
      ) : null}
    </section>
  )
}
