import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { db } from '../../src/data/db'
import {
  addQuestion,
  createSet,
  importQuestionsFromJson,
  importSetsFromJson,
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
      difficulty: 'normal',
      tags: [],
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
      difficulty: 'normal',
      tags: [],
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

  it('appends imported questions with fresh IDs and leaves existing set data intact', async () => {
    const set = await createSet('Question import target')
    const existingQuestion: McqQuestion = {
      id: 'existing-question',
      type: 'mcq',
      text: 'Existing question',
      difficulty: 'normal',
      tags: [],
      options: ['A', 'B', 'C', 'D'],
      answerIndex: 0,
      updatedAt: new Date().toISOString(),
      deleted: false,
    }
    await addQuestion(set.id, existingQuestion)

    const importedQuestion: McqQuestion = {
      ...existingQuestion,
      id: 'source-question',
      text: 'Imported question',
    }
    const updated = await importQuestionsFromJson(set.id, JSON.stringify(importedQuestion))

    expect(updated?.title).toBe(set.title)
    expect(updated?.questions).toHaveLength(2)
    expect(updated?.questions[0].id).toBe(existingQuestion.id)
    expect(updated?.questions[1].text).toBe(importedQuestion.text)
    expect(updated?.questions[1].id).not.toBe(importedQuestion.id)
    expect((await db.sets.get(set.id))?.questions).toEqual(updated?.questions)
  })

  it('imports multiple sets in one transaction and reports replaced sets', async () => {
    const existing = await createSet('Old title')
    const toJson = (id: string, title: string) =>
      JSON.stringify({
        schemaVersion: 1,
        id,
        title,
        updatedAt: '2026-10-16T00:00:00.000Z',
        deleted: false,
        questions: [],
      })

    const result = await importSetsFromJson([
      toJson(existing.id, 'Restored title'),
      toJson('new-set-id', 'New set'),
    ])

    expect(result.sets.map((set) => set.title)).toEqual(['Restored title', 'New set'])
    expect(result.updatedCount).toBe(1)
    const savedSets = await listSets()
    expect(savedSets).toHaveLength(2)
    expect(savedSets.find((set) => set.id === existing.id)?.title).toBe('Restored title')
    expect(savedSets.find((set) => set.id === 'new-set-id')?.title).toBe('New set')
  })

  it('does not import any sets when one JSON file is invalid', async () => {
    const validSet = JSON.stringify({
      schemaVersion: 1,
      id: 'valid-set-id',
      title: 'Valid set',
      updatedAt: '2026-10-16T00:00:00.000Z',
      deleted: false,
      questions: [],
    })

    await expect(importSetsFromJson([validSet, '{invalid json'])).rejects.toThrow()
    expect(await listSets()).toEqual([])
  })
})
