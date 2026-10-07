import { db } from './db'
import type { Question, QuizSet } from './types'

const SCHEMA_VERSION = 1

function nowIso(): string {
  return new Date().toISOString()
}

function sanitizeTitle(input: string): string {
  return input.trim() || 'Untitled set'
}

export async function listSets(): Promise<QuizSet[]> {
  return db.sets
    .orderBy('updatedAt')
    .reverse()
    .filter((set) => !set.deleted)
    .toArray()
}

export const getSets = listSets

export async function getSet(id: string): Promise<QuizSet | null> {
  const set = await db.sets.get(id)
  return set && !set.deleted ? set : null
}

export async function createSet(title: string): Promise<QuizSet> {
  const now = nowIso()
  const set: QuizSet = {
    schemaVersion: SCHEMA_VERSION,
    id: crypto.randomUUID(),
    title: sanitizeTitle(title),
    updatedAt: now,
    deleted: false,
    questions: [],
  }

  await db.sets.put(set)
  return set
}

export async function updateSetTitle(id: string, title: string): Promise<QuizSet | null> {
  const set = await getSet(id)

  if (!set) {
    return null
  }

  const updated: QuizSet = {
    ...set,
    title: sanitizeTitle(title),
    updatedAt: nowIso(),
  }

  await db.sets.put(updated)
  return updated
}

export async function softDeleteSet(id: string): Promise<QuizSet | null> {
  const set = await getSet(id)

  if (!set) {
    return null
  }

  const updated: QuizSet = {
    ...set,
    deleted: true,
    updatedAt: nowIso(),
  }

  await db.sets.put(updated)
  return updated
}

export async function addQuestion(setId: string, question: Question): Promise<QuizSet | null> {
  const set = await getSet(setId)

  if (!set) {
    return null
  }

  const updatedQuestion: Question = {
    ...question,
    id: question.id || crypto.randomUUID(),
    deleted: false,
    updatedAt: nowIso(),
  }

  const updated: QuizSet = {
    ...set,
    questions: [...set.questions, updatedQuestion],
    updatedAt: nowIso(),
  }

  await db.sets.put(updated)
  return updated
}

export async function updateQuestion(
  setId: string,
  questionId: string,
  nextQuestion: Question,
): Promise<QuizSet | null> {
  const set = await getSet(setId)

  if (!set) {
    return null
  }

  const foundQuestion = set.questions.some((question) => question.id === questionId)

  if (!foundQuestion) {
    return null
  }

  const updated: QuizSet = {
    ...set,
    questions: set.questions.map((question) =>
      question.id === questionId
        ? {
            ...nextQuestion,
            id: questionId,
            deleted: false,
            updatedAt: nowIso(),
          }
        : question,
    ),
    updatedAt: nowIso(),
  }

  await db.sets.put(updated)
  return updated
}

export async function softDeleteQuestion(setId: string, questionId: string): Promise<QuizSet | null> {
  const set = await getSet(setId)

  if (!set) {
    return null
  }

  const questionExists = set.questions.some((question) => question.id === questionId)

  if (!questionExists) {
    return null
  }

  const updated: QuizSet = {
    ...set,
    questions: set.questions.map((question) =>
      question.id === questionId
        ? {
            ...question,
            deleted: true,
            updatedAt: nowIso(),
          }
        : question,
    ),
    updatedAt: nowIso(),
  }

  await db.sets.put(updated)
  return updated
}
