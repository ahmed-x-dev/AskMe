import Dexie, { type Table } from 'dexie'

import { CURRENT_SCHEMA_VERSION } from './importExport'
import type { QuizSet } from '../types/quiz'

/** IndexedDB schema for locally stored quiz sets. */
class AskMeDatabase extends Dexie {
  sets!: Table<QuizSet, string>

  constructor() {
    super('askme-local-db')

    this.version(1).stores({
      sets: '&id, title, updatedAt, deleted, schemaVersion',
    })

    this.version(2)
      .stores({
        sets: '&id, title, updatedAt, deleted, schemaVersion',
      })
      .upgrade((transaction) =>
        transaction.table('sets').toCollection().modify((set: QuizSet) => {
          set.schemaVersion = CURRENT_SCHEMA_VERSION
          set.questions = set.questions.map((question) => ({
            ...question,
            difficulty: question.difficulty ?? 'normal',
            tags: question.tags ?? [],
          }))
        }),
      )
  }
}

export const db = new AskMeDatabase()

/** Opens the local database and propagates any IndexedDB errors to the caller. */
export async function openDatabase(): Promise<void> {
  await db.open()
}
