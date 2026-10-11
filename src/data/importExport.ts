import type { Question, QuizSet } from '../types/quiz'

export const CURRENT_SCHEMA_VERSION = 1

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeQuestion(question: unknown, index: number): Question {
  if (!isRecord(question)) {
    throw new Error(`Question ${index + 1} is not an object.`)
  }

  const { id, type, text, updatedAt, deleted, options, answerIndex, referenceAnswer } = question

  if (typeof id !== 'string' || !id.trim()) {
    throw new Error(`Question ${index + 1} is missing a valid id.`)
  }

  if (!['mcq', 'essay'].includes(String(type))) {
    throw new Error(`Question ${index + 1} has an unsupported type.`)
  }

  const trimmedText = typeof text === 'string' ? text.trim() : ''
  if (!trimmedText) {
    throw new Error(`Question ${index + 1} is missing text.`)
  }

  if (typeof updatedAt !== 'string' || !updatedAt.trim()) {
    throw new Error(`Question ${index + 1} is missing an updatedAt value.`)
  }

  if (type === 'mcq') {
    if (!Array.isArray(options) || options.length !== 4) {
      throw new Error(`MCQ question ${index + 1} must have four options.`)
    }

    const sanitizedOptions = options.map((option) => String(option ?? '').trim())
    const validOptions = sanitizedOptions.every((option) => option.length > 0)

    if (!validOptions) {
      throw new Error(`MCQ question ${index + 1} must have four non-empty answers.`)
    }

    const parsedAnswerIndex = Number(answerIndex)
    if (!Number.isInteger(parsedAnswerIndex) || parsedAnswerIndex < 0 || parsedAnswerIndex > 3) {
      throw new Error(`MCQ question ${index + 1} has an invalid answerIndex.`)
    }

    return {
      id: id.trim(),
      type: 'mcq',
      text: trimmedText,
      updatedAt,
      deleted: Boolean(deleted),
      options: [
        sanitizedOptions[0],
        sanitizedOptions[1],
        sanitizedOptions[2],
        sanitizedOptions[3],
      ],
      answerIndex: parsedAnswerIndex,
    }
  }

  return {
    id: id.trim(),
    type: 'essay',
    text: trimmedText,
    updatedAt,
    deleted: Boolean(deleted),
    referenceAnswer: typeof referenceAnswer === 'string' ? referenceAnswer : undefined,
  }
}

/** Parses a set JSON export and validates the portable schema before storing it. */
export function parseSetJson(rawJson: string): QuizSet {
  const parsed = JSON.parse(rawJson) as unknown

  if (!isRecord(parsed)) {
    throw new Error('The exported file must contain a JSON object.')
  }

  if (parsed.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    throw new Error(`Unsupported schema version: ${String(parsed.schemaVersion ?? 'unknown')}.`)
  }

  const { id, title, updatedAt, deleted, questions } = parsed

  if (typeof id !== 'string' || !id.trim()) {
    throw new Error('The set is missing a valid id.')
  }

  if (typeof title !== 'string' || !title.trim()) {
    throw new Error('The set title cannot be empty.')
  }

  if (typeof updatedAt !== 'string' || !updatedAt.trim()) {
    throw new Error('The set is missing a valid updatedAt value.')
  }

  if (!Array.isArray(questions)) {
    throw new Error('The set is missing a questions array.')
  }

  const normalizedQuestions = questions.map((question, index) => normalizeQuestion(question, index))

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    id: id.trim(),
    title: title.trim(),
    updatedAt,
    deleted: Boolean(deleted),
    questions: normalizedQuestions,
  }
}

/** Serializes a set to JSON for export. */
export function exportSetJson(set: QuizSet): string {
  return JSON.stringify(
    {
      ...set,
      questions: set.questions.filter((question) => !question.deleted),
    },
    null,
    2,
  )
}
