import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { generateQuestions } from '../../src/features/ai'
import {
  addQuestions,
  allTables,
  createRoadmap,
  createTopic,
  db,
  listQuestionsByTopic,
} from '../../src/lib/data'
import { questionSchema } from '../../src/lib/schemas'
import { saveGeminiApiKey } from '../../src/platform/secureStorage'

beforeEach(async () => {
  await db.transaction('rw', allTables(), async () => {
    for (const table of allTables()) await table.clear()
  })
  saveGeminiApiKey('test-key')
})

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

function stubAi(questions: unknown[]) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify({ questions }) }] } }],
      }),
    }),
  )
}

describe('generate → save', () => {
  it('stores generated questions on the topic with ids and the right roadmap', async () => {
    const roadmap = await createRoadmap({ title: 'React' })
    const topic = await createTopic({ roadmapId: roadmap.id, title: 'Hooks' })
    stubAi([
      { type: 'mcq', text: 'What does useState return?', options: ['A pair', 'A map', 'A string', 'Nothing'], answerIndex: 0 },
      { type: 'essay', text: 'When does useEffect run?', referenceAnswer: 'After render.' },
    ])

    const generated = await generateQuestions({ type: 'mcq', count: 2, topicTitle: topic.title, difficulty: 'easy' })
    await addQuestions(topic.id, generated)

    const saved = await listQuestionsByTopic(topic.id)
    expect(saved).toHaveLength(2)
    expect(saved.every((question) => question.roadmapId === roadmap.id && question.difficulty === 'easy')).toBe(true)
    for (const question of saved) expect(() => questionSchema.parse(question)).not.toThrow()
  })

  it('saves only the selected questions', async () => {
    const roadmap = await createRoadmap({ title: 'React' })
    const topic = await createTopic({ roadmapId: roadmap.id, title: 'Hooks' })
    stubAi([
      { type: 'essay', text: 'One?' },
      { type: 'essay', text: 'Two?' },
      { type: 'essay', text: 'Three?' },
    ])

    const generated = await generateQuestions({ type: 'essay', count: 3 })
    await addQuestions(topic.id, [generated[0], generated[2]])

    expect((await listQuestionsByTopic(topic.id)).map((question) => question.text).sort()).toEqual(['One?', 'Three?'])
  })
})
