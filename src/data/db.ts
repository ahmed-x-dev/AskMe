import Dexie, { type Table } from 'dexie'

import type { QuizSet } from '../types/quiz'

/** IndexedDB schema for locally stored quiz sets. */
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

/** Opens the local database and propagates any IndexedDB errors to the caller. */
export async function openDatabase(): Promise<void> {
  await db.open()
}
