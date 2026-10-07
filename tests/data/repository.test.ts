import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { db } from '../../src/data/db'
import {
  addQuestion,
  createSet,
  listSets,
  softDeleteQuestion,
  softDeleteSet,
  updateQuestion,
  updateSetTitle,
} from '../../src/data/repository'
import type { EssayQuestion, McqQuestion } from '../../src/types/quiz'

beforeEach(async () => {
  if (!db.isOpen()) {
    await db.open()
  }

  await db.sets.clear()
})

afterEach(() => {
  db.close()
})

describe('repository', () => {
  it('creates a set and lists only active sets', async () => {
    const created = await createSet('Biology')

    expect(created.id).toBeTruthy()
    expect(created.title).toBe('Biology')
    expect(created.questions).toHaveLength(0)
    expect(created.deleted).toBe(false)

    const sets = await listSets()
    expect(sets).toHaveLength(1)
    expect(sets[0].id).toBe(created.id)
  })

  it('updates the title and preserves the active set data', async () => {
    const created = await createSet('Old title')
    const updated = await updateSetTitle(created.id, 'New title')

    expect(updated).not.toBeNull()
    expect(updated?.title).toBe('New title')
    expect(updated?.updatedAt).not.toBe(created.updatedAt)

    const sets = await listSets()
    expect(sets).toHaveLength(1)
    expect(sets[0].title).toBe('New title')
  })

  it('soft deletes a set and hides it from the active list', async () => {
    const first = await createSet('Visible set')
    const second = await createSet('Hidden set')

    const deleted = await softDeleteSet(second.id)

    expect(deleted?.deleted).toBe(true)

    const sets = await listSets()
    expect(sets.map((set) => set.id)).toEqual([first.id])
  })

  it('adds, updates, and soft deletes questions within a set', async () => {
    const set = await createSet('Question set')
    const mcqQuestion: McqQuestion = {
      id: 'mcq-1',
      type: 'mcq',
      text: 'Which planet is known as the Red Planet?',
      options: ['Venus', 'Mars', 'Jupiter', 'Mercury'],
      answerIndex: 1,
      updatedAt: new Date().toISOString(),
      deleted: false,
    }

    const afterCreate = await addQuestion(set.id, mcqQuestion)
    expect(afterCreate?.questions).toHaveLength(1)
    expect(afterCreate?.questions[0].text).toBe(mcqQuestion.text)

    const essayQuestion: EssayQuestion = {
      id: 'essay-1',
      type: 'essay',
      text: 'Explain photosynthesis.',
      referenceAnswer: 'Plants convert light energy into chemical energy.',
      updatedAt: new Date().toISOString(),
      deleted: false,
    }

    const withEssay = await addQuestion(set.id, essayQuestion)
    expect(withEssay?.questions).toHaveLength(2)

    const updatedEssay = {
      ...essayQuestion,
      text: 'Explain photosynthesis in one paragraph.',
      referenceAnswer: 'Plants convert light energy to glucose and oxygen.',
      updatedAt: new Date().toISOString(),
    }

    const afterUpdate = await updateQuestion(set.id, essayQuestion.id, updatedEssay)
    expect(afterUpdate?.questions.find((question) => question.id === essayQuestion.id)?.text).toBe(
      'Explain photosynthesis in one paragraph.',
    )

    const afterDelete = await softDeleteQuestion(set.id, essayQuestion.id)
    expect(afterDelete?.questions.find((question) => question.id === essayQuestion.id)?.deleted).toBe(true)
  })
})
