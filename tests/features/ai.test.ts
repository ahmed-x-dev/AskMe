import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  generateQuestions,
  explainQuestionAnswer,
  gradeEssayAnswer,
  validateAnswerExplanation,
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
    expect(result[0].difficulty).toBe('medium')
    expect(result[0].tags).toEqual([])
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

  it('validates a non-empty answer explanation', () => {
    expect(validateAnswerExplanation({ explanation: '  Because it is correct.  ' })).toEqual({
      explanation: 'Because it is correct.',
    })
    expect(() => validateAnswerExplanation({ explanation: '' })).toThrow(/answer explanation/)
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

  it('explains a question answer using the configured AI provider', async () => {
    saveGeminiApiKey('test-key')

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify({ explanation: 'Mars appears red because of iron oxide.' }) }],
            },
          },
        ],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const explanation = await explainQuestionAnswer({
      question: {
        id: 'q1',
        type: 'mcq',
        text: 'Which planet is known as the Red Planet?',
        difficulty: 'medium',
        tags: [],
        options: ['Venus', 'Mars', 'Jupiter', 'Mercury'],
        answerIndex: 1,
        updatedAt: '2026-10-17T00:00:00.000Z',
        deleted: false,
      },
      userAnswer: 0,
    })

    expect(explanation).toBe('Mars appears red because of iron oxide.')
    const [, requestOptions] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(JSON.stringify(requestOptions.body)).toContain('Correct answer: Mars')
    expect(JSON.stringify(requestOptions.body)).toContain('Learner selected: Venus')
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
