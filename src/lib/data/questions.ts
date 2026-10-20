import { db } from './db'
import { newId, nowIso } from './util'
import type { Question, QuestionDifficulty } from '../../types/study'

interface QuestionInputBase {
  text: string
  difficulty?: QuestionDifficulty
  tags?: string[]
}

export interface McqInput extends QuestionInputBase {
  type: 'mcq'
  options: [string, string, string, string]
  answerIndex: number
}

export interface EssayInput extends QuestionInputBase {
  type: 'essay'
  referenceAnswer?: string
}

export interface TrueFalseInput extends QuestionInputBase {
  type: 'true-false'
  answer: boolean | 'true' | 'false' | 'yes' | 'no' | 0 | 1
}

export interface FillBlankInput extends QuestionInputBase {
  type: 'fill-blank'
  answer: string
}

export interface FlashcardInput extends QuestionInputBase {
  type: 'flashcard'
  answer: string
}

/** Question content as entered by the user or produced by the AI generator. */
export type QuestionInput = McqInput | EssayInput | TrueFalseInput | FillBlankInput | FlashcardInput

function normalizeQuestionType(type: QuestionInput['type'] | string): QuestionInput['type'] {
  const normalized = type.trim().toLowerCase()

  if (normalized === 'true/false' || normalized === 'true_false' || normalized === 'truefalse') {
    return 'true-false'
  }

  if (
    normalized === 'fill in the blank' ||
    normalized === 'fill-in-the-blank' ||
    normalized === 'fill_in_blank' ||
    normalized === 'fillblank'
  ) {
    return 'fill-blank'
  }

  return normalized as QuestionInput['type']
}

/** Validates and normalizes question content, returning the fields shared by all variants. */
function normalize(input: QuestionInput) {
  const type = normalizeQuestionType(input.type)
  const text = input.text.trim()

  if (!text) {
    throw new Error('Question text cannot be empty.')
  }

  const tags = [...new Set((input.tags ?? []).map((tag) => tag.trim()).filter(Boolean))]
  const base = { text, difficulty: input.difficulty ?? 'medium', tags }

  if (type === 'essay') {
    const essayInput = input as EssayInput
    const referenceAnswer = essayInput.referenceAnswer?.trim()

    return { ...base, type: 'essay' as const, referenceAnswer: referenceAnswer || undefined }
  }

  if (type === 'true-false') {
    const trueFalseInput = input as TrueFalseInput
    const value = trueFalseInput.answer
    const answer =
      typeof value === 'boolean'
        ? value
        : typeof value === 'string'
          ? ['true', 'yes', 'y', '1'].includes(value.trim().toLowerCase())
          : value === 1

    if (value === undefined || value === null) {
      throw new Error('The true/false answer cannot be blank.')
    }

    return { ...base, type: 'true-false' as const, answer }
  }

  if (type === 'fill-blank' || type === 'flashcard') {
    const answerInput = input as FillBlankInput | FlashcardInput
    const answer = typeof answerInput.answer === 'string' ? answerInput.answer.trim() : ''

    if (!answer) {
      throw new Error('The answer cannot be blank.')
    }

    return {
      ...base,
      type,
      answer,
    }
  }

  const mcqInput = input as McqInput
  const options = mcqInput.options.map((option: string) => option.trim())

  if (options.length !== 4 || options.some((option: string) => !option)) {
    throw new Error('A multiple-choice question needs four non-empty options.')
  }

  if (new Set(options).size !== 4) {
    throw new Error('The four options must be different from each other.')
  }

  if (!Number.isInteger(mcqInput.answerIndex) || mcqInput.answerIndex < 0 || mcqInput.answerIndex > 3) {
    throw new Error('Choose which option is correct.')
  }

  return {
    ...base,
    type: 'mcq' as const,
    options: options as [string, string, string, string],
    answerIndex: mcqInput.answerIndex,
  }
}

/** Returns the questions of one topic. */
export async function listQuestionsByTopic(topicId: string): Promise<Question[]> {
  return (await db.questions.where('topicId').equals(topicId).toArray()).sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  )
}

/** Returns every question of a roadmap (used by the roadmap quiz). */
export async function listQuestionsByRoadmap(roadmapId: string): Promise<Question[]> {
  return db.questions.where('roadmapId').equals(roadmapId).toArray()
}

/** Returns the questions of several topics (used by group quizzes). */
export async function listQuestionsByTopics(topicIds: string[]): Promise<Question[]> {
  return db.questions.where('topicId').anyOf(topicIds).toArray()
}

/** Adds several questions to a topic at once, for example AI-generated ones. All or none are saved. */
export async function addQuestions(topicId: string, inputs: QuestionInput[]): Promise<Question[]> {
  return db.transaction('rw', db.topics, db.questions, async () => {
    const topic = await db.topics.get(topicId)

    if (!topic) {
      throw new Error('Topic not found.')
    }

    const timestamp = nowIso()
    const questions = inputs.map(
      (input): Question => ({
        ...normalize(input),
        id: newId(),
        topicId,
        roadmapId: topic.roadmapId,
        createdAt: timestamp,
        updatedAt: timestamp,
      }),
    )

    await db.questions.bulkAdd(questions)
    return questions
  })
}

/** Adds one question to a topic. */
export async function addQuestion(topicId: string, input: QuestionInput): Promise<Question> {
  const [question] = await addQuestions(topicId, [input])

  return question
}

/** Replaces the content of a question. Its id, topic and creation time are kept. */
export async function updateQuestion(id: string, input: QuestionInput): Promise<void> {
  await db.transaction('rw', db.questions, async () => {
    const existing = await db.questions.get(id)

    if (!existing) {
      throw new Error('Question not found.')
    }

    const next: Question = {
      ...normalize(input),
      id: existing.id,
      topicId: existing.topicId,
      roadmapId: existing.roadmapId,
      createdAt: existing.createdAt,
      updatedAt: nowIso(),
    }

    // `put` replaces the whole record, so switching between mcq and essay leaves no stale fields.
    await db.questions.put(next)
  })
}

/** Deletes a question with its attempts and review state. */
export async function deleteQuestion(id: string): Promise<void> {
  await db.transaction('rw', db.questions, db.attempts, db.reviews, async () => {
    await db.attempts.where('questionId').equals(id).delete()
    await db.reviews.delete(id)
    await db.questions.delete(id)
  })
}
