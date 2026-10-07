import Dexie, { type Table } from 'dexie'

import type { QuizSet } from './types'

class AskMeDatabase extends Dexie {
  sets!: Table<QuizSet, string>

  constructor() {
    super('askme-local-db')

    this.version(1).stores({
      sets: '&id, title, updatedAt, deleted, schemaVersion',
    })
  }
}

export const db = new AskMeDatabase()

export async function openDatabase(): Promise<void> {
  await db.open()
}
