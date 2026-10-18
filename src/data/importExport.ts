import type { Question, QuestionDifficulty, QuizSet, SetGroup } from '../types/quiz'

export const CURRENT_SCHEMA_VERSION = 4

const SUPPORTED_SCHEMA_VERSIONS = [1, 2, 3, CURRENT_SCHEMA_VERSION]
const QUESTION_DIFFICULTIES: QuestionDifficulty[] = ['easy', 'medium', 'hard']

function isQuestionDifficulty(value: unknown): value is QuestionDifficulty {
  return QUESTION_DIFFICULTIES.some((difficulty) => difficulty === value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeGroup(value: unknown): SetGroup | undefined {
  if (value === undefined) {
    return undefined
  }

  if (!isRecord(value) || typeof value.id !== 'string' || !value.id.trim() || typeof value.name !== 'string' || !value.name.trim()) {
    throw new Error('The set group must have a valid id and name.')
  }

  return { id: value.id.trim(), name: value.name.trim() }
}

function normalizeQuestion(question: unknown, index: number): Question {
  if (!isRecord(question)) {
    throw new Error(`Question ${index + 1} is not an object.`)
  }

  const {
    id,
    type,
    text,
    difficulty,
    tags,
    updatedAt,
    deleted,
    options,
    answerIndex,
    referenceAnswer,
  } = question

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

  if (
    difficulty !== undefined &&
    difficulty !== 'normal' &&
    !isQuestionDifficulty(difficulty)
  ) {
    throw new Error(`Question ${index + 1} has an unsupported difficulty.`)
  }

  if (tags !== undefined && (!Array.isArray(tags) || tags.some((tag) => typeof tag !== 'string'))) {
    throw new Error(`Question ${index + 1} tags must be an array of strings.`)
  }

  const normalizedDifficulty =
    difficulty === 'normal'
      ? 'medium'
      : isQuestionDifficulty(difficulty)
        ? difficulty
        : 'medium'
  const normalizedTags = [
    ...new Set(
      (Array.isArray(tags) ? tags : [])
        .filter((tag): tag is string => typeof tag === 'string')
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ]

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
      difficulty: normalizedDifficulty,
      tags: normalizedTags,
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
    difficulty: normalizedDifficulty,
    tags: normalizedTags,
    updatedAt,
    deleted: Boolean(deleted),
    ...(typeof referenceAnswer === 'string' ? { referenceAnswer } : {}),
  }
}

/** Parses a set JSON export and validates the portable schema before storing it. */
export function parseSetJson(rawJson: string): QuizSet {
  const parsed = JSON.parse(rawJson) as unknown

  if (!isRecord(parsed)) {
    throw new Error('The exported file must contain a JSON object.')
  }

  if (
    typeof parsed.schemaVersion !== 'number' ||
    !SUPPORTED_SCHEMA_VERSIONS.includes(parsed.schemaVersion)
  ) {
    throw new Error(`Unsupported schema version: ${String(parsed.schemaVersion ?? 'unknown')}.`)
  }

  const { id, title, updatedAt, deleted, group, questions } = parsed

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

  const normalizedGroup = normalizeGroup(group)

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    id: id.trim(),
    title: title.trim(),
    updatedAt,
    deleted: Boolean(deleted),
    ...(normalizedGroup ? { group: normalizedGroup } : {}),
    questions: normalizedQuestions,
  }
}

/** Parses one question, a question array, or an exported set and returns its active questions. */
export function parseQuestionsJson(rawJson: string): Question[] {
  const parsed: unknown = JSON.parse(rawJson)
  const questionValues = Array.isArray(parsed)
    ? parsed
    : isRecord(parsed) && 'questions' in parsed
      ? parsed.questions
      : [parsed]

  if (!Array.isArray(questionValues)) {
    throw new Error('The JSON file must contain a question or a questions array.')
  }

  const questions = questionValues
    .map((question, index) => normalizeQuestion(question, index))
    .filter((question) => !question.deleted)

  if (questions.length === 0) {
    throw new Error('The JSON file does not contain any active questions.')
  }

  return questions
}

/** Serializes a set to JSON for export. */
export function exportSetJson(set: QuizSet): string {
  return JSON.stringify(
    {
      ...set,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      questions: set.questions.filter((question) => !question.deleted),
    },
    null,
    2,
  )
}
