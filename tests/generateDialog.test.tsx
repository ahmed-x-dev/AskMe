import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'

import { GenerateQuestionsDialog } from '../src/components/topics/GenerateQuestionsDialog'
import { saveGeminiApiKey } from '../src/platform/secureStorage'

const context = {
  topicId: 't1',
  topicTitle: 'useEffect',
  roadmapTitle: 'React',
  existingQuestions: [],
}

afterEach(() => localStorage.clear())

describe('GenerateQuestionsDialog', () => {
  it('offers chatbot prompt generation when no AI key is saved', () => {
    const html = renderToStaticMarkup(<GenerateQuestionsDialog context={context} onClose={() => {}} />)

    expect(html).toContain('No API key is saved')
    expect(html).toContain('Prepare chatbot prompt')
    expect(html).toContain('Automatic coverage')
    expect(html).toContain('one question per distinct study point')
    expect(html).toContain('href="/settings"')
    expect(html).not.toContain('>Generate<')
  })

  it('shows the form with a Generate button when a key exists', () => {
    saveGeminiApiKey('test-key')
    const html = renderToStaticMarkup(<GenerateQuestionsDialog context={context} onClose={() => {}} />)

    expect(html).toContain('useEffect')
    expect(html).toContain('How many')
    expect(html).toContain('Generate')
    expect(html).toContain('Use a chatbot website')
    expect(html).not.toContain('Open settings')
  })
})
