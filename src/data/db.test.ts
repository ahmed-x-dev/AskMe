import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'

import { db } from './db'

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
})
