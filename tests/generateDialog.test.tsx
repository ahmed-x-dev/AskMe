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
  it('sends the learner to Settings when no AI key is saved', () => {
    const html = renderToStaticMarkup(<GenerateQuestionsDialog context={context} onClose={() => {}} />)

    expect(html).toContain('Add an AI key in Settings')
    expect(html).toContain('href="/settings"')
    expect(html).not.toContain('>Generate<')
  })

  it('shows the form with a Generate button when a key exists', () => {
    saveGeminiApiKey('test-key')
    const html = renderToStaticMarkup(<GenerateQuestionsDialog context={context} onClose={() => {}} />)

    expect(html).toContain('useEffect')
    expect(html).toContain('How many')
    expect(html).toContain('Generate')
    expect(html).not.toContain('Open settings')
  })
})
