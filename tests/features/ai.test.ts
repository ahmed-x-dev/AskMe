import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  generateQuestions,
  gradeEssayAnswer,
  validateEssayGradeResult,
  validateGeneratedQuestions,
} from '../../src/features/ai'
import { saveAiApiKey, saveGeminiApiKey, setAiProvider } from '../../src/platform/secureStorage'

describe('AI schema validation', () => {
  it('accepts valid generated MCQ questions', () => {
    const result = validateGeneratedQuestions({
      questions: [
        {
          type: 'mcq',
          text: 'Which planet is known as the Red Planet?',
          options: ['Venus', 'Mars', 'Jupiter', 'Mercury'],
          answerIndex: 1,
        },
      ],
    })

    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('mcq')
    if (result[0].type !== 'mcq') {
      throw new Error('Expected the generated question to be a multiple-choice question.')
    }
    expect(result[0].options).toEqual(['Venus', 'Mars', 'Jupiter', 'Mercury'])
  })

  it('rejects malformed essay grading payloads', () => {
    expect(() =>
      validateEssayGradeResult({
        score: 11,
        feedback: 'Nope',
        missingPoints: -1,
      }),
    ).toThrow('score between 0 and 10')
  })
})

describe('AI calls', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('generates questions using the Gemini API', async () => {
    saveGeminiApiKey('test-key')

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    questions: [
                      {
                        type: 'mcq',
                        text: 'What is 2 + 2?',
                        options: ['3', '4', '5', '6'],
                        answerIndex: 1,
                      },
                    ],
                  }),
                },
              ],
            },
          },
        ],
      }),
    })

    vi.stubGlobal(
      'fetch',
      fetchMock,
    )

    const result = await generateQuestions({ type: 'mcq', count: 1, setTitle: 'Math' })

    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('mcq')
    expect(result[0].text).toBe('What is 2 + 2?')
    const [requestUrl, requestOptions] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(requestUrl).not.toContain('test-key')
    expect(requestOptions.headers).toMatchObject({ 'x-goog-api-key': 'test-key' })
  })

  it('grades essay answers using the Gemini API', async () => {
    saveGeminiApiKey('test-key')

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      score: 8,
                      feedback: 'Strong answer with a few gaps.',
                      missingPoints: 2,
                    }),
                  },
                ],
              },
            },
          ],
        }),
      }),
    )

    const result = await gradeEssayAnswer({
      questionText: 'Explain photosynthesis.',
      userAnswer: 'Plants use sunlight to make food.',
      referenceAnswer: 'Plants convert light energy into chemical energy.',
    })

    expect(result.score).toBe(8)
    expect(result.feedback).toContain('Strong')
    expect(result.missingPoints).toBe(2)
  })

  it('uses the OpenAI provider when selected', async () => {
    setAiProvider('openai')
    saveAiApiKey('openai', 'test-openai-key')

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  questions: [
                    {
                      type: 'mcq',
                      text: 'Which is a mammal?',
                      options: ['Eagle', 'Dolphin', 'Lizard', 'Frog'],
                      answerIndex: 1,
                    },
                  ],
                }),
              },
            },
          ],
        }),
      }),
    )

    const result = await generateQuestions({ type: 'mcq', count: 1, setTitle: 'Animals' })

    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('mcq')
    if (result[0].type !== 'mcq') {
      throw new Error('Expected the generated question to be a multiple-choice question.')
    }
    expect(result[0].options[1]).toBe('Dolphin')
  })
})
