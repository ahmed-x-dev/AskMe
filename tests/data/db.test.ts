import { afterEach, describe, expect, it } from 'vitest'
import Dexie from 'dexie'

import { db } from '../../src/data/db'

afterEach(async () => {
  if (db.isOpen()) {
    db.close()
  }
})

describe('AskMeDatabase', () => {
  it('opens the local Dexie database', async () => {
    await db.open()

    expect(db.isOpen()).toBe(true)
  })

  it('upgrades stored version 1 questions with default metadata', async () => {
    db.close()
    await db.delete()

    const legacyDb = new Dexie('askme-local-db')
    legacyDb.version(1).stores({
      sets: '&id, title, updatedAt, deleted, schemaVersion',
    })
    await legacyDb.open()
    await legacyDb.table('sets').put({
      schemaVersion: 1,
      id: 'legacy-set',
      title: 'Legacy set',
      updatedAt: '2026-10-16T00:00:00.000Z',
      deleted: false,
      questions: [
        {
          id: 'legacy-question',
          type: 'essay',
          text: 'An older question',
          updatedAt: '2026-10-16T00:00:00.000Z',
          deleted: false,
        },
      ],
    })
    legacyDb.close()

    await db.open()

    expect(await db.sets.get('legacy-set')).toMatchObject({
      schemaVersion: 2,
      questions: [{ difficulty: 'normal', tags: [] }],
    })
  })
})
