import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  generateQuestions,
  explainQuestionAnswer,
  gradeEssayAnswer,
  validateAnswerExplanation,
  validateEssayGradeResult,
  validateGeneratedQuestions,
  buildGenerationPrompt,
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

  it('accepts true/false and fill-blank questions', () => {
    const result = validateGeneratedQuestions({
      questions: [
        { type: 'true-false', text: 'The moon orbits Earth.', answer: true },
        { type: 'fill-blank', text: 'The capital of France is _____.', answer: 'Paris' },
      ],
    })

    expect(result).toEqual([
      { type: 'true-false', text: 'The moon orbits Earth.', difficulty: 'medium', tags: [], answer: true },
      { type: 'fill-blank', text: 'The capital of France is _____.', difficulty: 'medium', tags: [], answer: 'Paris' },
    ])
  })

  it('skips unusable questions and keeps the good ones', () => {
    const result = validateGeneratedQuestions({
      questions: [
        { type: 'mcq', text: 'Repeated options?', options: ['a', 'a', 'b', 'c'], answerIndex: 0 },
        { type: 'mcq', text: 'Bad answer index?', options: ['a', 'b', 'c', 'd'], answerIndex: 7 },
        { type: 'essay', text: 'Explain it.', referenceAnswer: ' Because. ', difficulty: 'hard' },
      ],
    })

    expect(result).toEqual([
      { type: 'essay', text: 'Explain it.', referenceAnswer: 'Because.', difficulty: 'hard', tags: [] },
    ])
  })

  it('throws the first problem when no question is usable', () => {
    expect(() =>
      validateGeneratedQuestions({
        questions: [{ type: 'mcq', text: 'Only three?', options: ['a', 'b', 'c'], answerIndex: 0 }],
      }),
    ).toThrow('must include four options')
    expect(() => validateGeneratedQuestions({ questions: [] })).toThrow('did not include any questions')
  })

  it('uses the requested difficulty unless the AI sets a valid one', () => {
    const [first, second] = validateGeneratedQuestions(
      {
        questions: [
          { type: 'essay', text: 'One?' },
          { type: 'essay', text: 'Two?', difficulty: 'nonsense' },
        ],
      },
      'easy',
    )

    expect(first.difficulty).toBe('easy')
    expect(second.difficulty).toBe('easy')
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

describe('generation prompt', () => {
  it('tells the AI about the topic, notes and existing questions', () => {
    const prompt = buildGenerationPrompt({
      type: 'mcq',
      count: 5,
      topicTitle: 'useEffect',
      groupTitle: 'Hooks',
      roadmapTitle: 'React',
      notes: 'Runs after render.',
      existingQuestions: ['What is the dependency array?'],
      difficulty: 'hard',
      prompt: 'Focus on cleanup.',
    })

    expect(prompt).toContain('Create exactly 5 multiple-choice questions')
    expect(prompt).toContain('Topic: useEffect')
    expect(prompt).toContain('Part of the group: Hooks')
    expect(prompt).toContain('In the subject: React')
    expect(prompt).toContain('Runs after render.')
    expect(prompt).toContain('- What is the dependency array?')
    expect(prompt).toContain('Make every question hard difficulty.')
    expect(prompt).toContain('Extra guidance: Focus on cleanup.')
  })

  it('leaves out sections that have no content and trims very long notes', () => {
    const prompt = buildGenerationPrompt({ type: 'essay', count: 3, notes: 'x'.repeat(9000) })

    expect(prompt).not.toContain('Topic:')
    expect(prompt).not.toContain('already has these questions')
    expect(prompt.length).toBeLessThan(6000)
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

    const result = await generateQuestions({ type: 'mcq', count: 1, topicTitle: 'Math' })

    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('mcq')
    expect(result[0].text).toBe('What is 2 + 2?')
    const [requestUrl, requestOptions] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(requestUrl).not.toContain('test-key')
    expect(requestOptions.headers).toMatchObject({ 'x-goog-api-key': 'test-key' })
  })

  it('supports generation counts up to 20 and caps larger requests at 20', async () => {
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
                        type: 'essay',
                        text: 'Explain a concept.',
                        referenceAnswer: 'An explanation.',
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
    vi.stubGlobal('fetch', fetchMock)

    await generateQuestions({ type: 'essay', count: 20 })
    await generateQuestions({ type: 'essay', count: 21 })

    for (const [, requestOptions] of fetchMock.mock.calls as [string, RequestInit][]) {
      const body = JSON.parse(String(requestOptions.body)) as {
        contents: { parts: { text: string }[] }[]
      }
      expect(body.contents[0].parts[0].text).toContain('Create exactly 20 essay questions')
    }
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
        type: 'mcq',
        text: 'Which planet is known as the Red Planet?',
        options: ['Venus', 'Mars', 'Jupiter', 'Mercury'],
        answerIndex: 1,
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

    const result = await generateQuestions({ type: 'mcq', count: 1, topicTitle: 'Animals' })

    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('mcq')
    if (result[0].type !== 'mcq') {
      throw new Error('Expected the generated question to be a multiple-choice question.')
    }
    expect(result[0].options[1]).toBe('Dolphin')
  })
})
