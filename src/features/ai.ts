import { getAiApiKey, getAiProvider, type AiProvider } from '../platform/secureStorage'
import type { EssayQuestion, McqQuestion, QuestionType } from '../types/quiz'

const GEMINI_MODEL = 'gemini-2.0-flash'
const OPENAI_MODEL = 'gpt-4o-mini'
const DEFAULT_TIMEOUT_MS = 30_000

export type GeneratedQuestion = McqQuestion | EssayQuestion

export type GeneratedQuestionPayload = {
  questions: GeneratedQuestion[]
}

export type EssayGradeResult = {
  score: number
  feedback: string
  missingPoints: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function nowIso(): string {
  return new Date().toISOString()
}

function normalizeJsonText(rawText: string): string {
  return rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim()
}

function ensureValidText(value: unknown, fieldLabel: string): string {
  const text = typeof value === 'string' ? value.trim() : ''

  if (!text) {
    throw new Error(`The AI response is missing a valid ${fieldLabel}.`)
  }

  return text
}

function getGeminiJsonTextFromResponse(data: unknown): string {
  if (!isRecord(data)) {
    throw new Error('The Gemini response format was unexpected.')
  }

  const candidates = Array.isArray(data.candidates) ? data.candidates : []

  for (const candidate of candidates) {
    if (!isRecord(candidate)) {
      continue
    }

    const content = isRecord(candidate.content) ? candidate.content : null
    const parts = Array.isArray(content?.parts) ? content.parts : []

    for (const part of parts) {
      if (isRecord(part) && typeof part.text === 'string' && part.text.trim()) {
        return part.text.trim()
      }
    }
  }

  const text = typeof data.text === 'string' ? data.text.trim() : ''

  if (!text) {
    throw new Error('The Gemini response did not include any usable content.')
  }

  return text
}

function getOpenAiJsonTextFromResponse(data: unknown): string {
  if (!isRecord(data)) {
    throw new Error('The OpenAI response format was unexpected.')
  }

  const choices = Array.isArray(data.choices) ? data.choices : []

  for (const choice of choices) {
    if (!isRecord(choice)) {
      continue
    }

    const message = isRecord(choice.message) ? choice.message : null
    const content = typeof message?.content === 'string' ? message.content : ''
    if (content.trim()) {
      return content.trim()
    }
  }

  throw new Error('The OpenAI response did not include any usable content.')
}

function getJsonTextFromResponse(data: unknown, provider: AiProvider): string {
  return provider === 'openai' ? getOpenAiJsonTextFromResponse(data) : getGeminiJsonTextFromResponse(data)
}

export function validateGeneratedQuestions(payload: unknown): GeneratedQuestion[] {
  const source = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray(payload.questions)
      ? payload.questions
      : []

  if (source.length === 0) {
    throw new Error('The AI response did not include any questions.')
  }

  return source.map((rawQuestion, questionIndex) => {
    if (!isRecord(rawQuestion)) {
      throw new Error(`Generated question ${questionIndex + 1} is not an object.`)
    }

    const type = rawQuestion.type

    if (type === 'mcq') {
      const options = Array.isArray(rawQuestion.options) ? rawQuestion.options : []
      const answerIndex = Number(rawQuestion.answerIndex)
      const text = ensureValidText(rawQuestion.text, 'question text')

      if (options.length !== 4) {
        throw new Error(`MCQ question ${questionIndex + 1} must include four options.`)
      }

      const cleanOptions = options.map((option) => String(option ?? '').trim())
      if (cleanOptions.some((option) => !option)) {
        throw new Error(`MCQ question ${questionIndex + 1} contains an empty option.`)
      }

      if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex > 3) {
        throw new Error(`MCQ question ${questionIndex + 1} has an invalid answerIndex.`)
      }

      return {
        id: crypto.randomUUID(),
        type: 'mcq',
        text,
        options: [cleanOptions[0], cleanOptions[1], cleanOptions[2], cleanOptions[3]],
        answerIndex,
        updatedAt: nowIso(),
        deleted: false,
      }
    }

    if (type === 'essay') {
      const text = ensureValidText(rawQuestion.text, 'essay prompt')
      const referenceAnswer = typeof rawQuestion.referenceAnswer === 'string'
        ? rawQuestion.referenceAnswer.trim()
        : ''

      return {
        id: crypto.randomUUID(),
        type: 'essay',
        text,
        referenceAnswer: referenceAnswer || undefined,
        updatedAt: nowIso(),
        deleted: false,
      }
    }

    throw new Error(`Question ${questionIndex + 1} has an unsupported type.`)
  })
}

export function validateEssayGradeResult(payload: unknown): EssayGradeResult {
  if (!isRecord(payload)) {
    throw new Error('The AI grader returned malformed JSON.')
  }

  const score = Number(payload.score)
  const missingPoints = Number(payload.missingPoints)
  const feedback = typeof payload.feedback === 'string' ? payload.feedback.trim() : ''

  if (!Number.isFinite(score) || score < 0 || score > 10) {
    throw new Error('The AI grading result must include a score between 0 and 10.')
  }

  if (!Number.isFinite(missingPoints) || missingPoints < 0 || missingPoints > 10) {
    throw new Error('The AI grading result must include a valid missingPoints value.')
  }

  if (!feedback) {
    throw new Error('The AI grading result is missing feedback.')
  }

  return {
    score,
    feedback,
    missingPoints,
  }
}

async function callAi<T>(
  provider: AiProvider,
  prompt: string,
  validator: (value: unknown) => T,
): Promise<T> {
  const apiKey = getAiApiKey(provider)
  const providerName = provider === 'openai' ? 'OpenAI' : 'Gemini'

  if (!apiKey) {
    throw new Error(`Add a ${providerName} API key in Settings before requesting AI help.`)
  }

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

  try {
    let response: Response

    if (provider === 'openai') {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        }),
      })
    } else {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.6,
              responseMimeType: 'application/json',
            },
          }),
        },
      )
    }

    if (!response.ok) {
      let message = 'The AI request failed.'

      try {
        const payload = (await response.json()) as Record<string, unknown>
        const errorPayload = isRecord(payload.error) ? payload.error : null
        const details = typeof errorPayload?.message === 'string'
          ? errorPayload.message
          : typeof payload.message === 'string'
            ? payload.message
            : null
        message = details ?? message
      } catch {
        // Intentionally ignore JSON parse failures and keep the generic API message.
      }

      if (response.status === 429) {
        throw new Error(`${providerName} is rate-limited right now. Please try again in a moment.`)
      }

      if (response.status >= 500) {
        throw new Error(`${providerName} is temporarily unavailable. Please try again later.`)
      }

      throw new Error(message)
    }

    const payload = await response.json()
    const rawText = getJsonTextFromResponse(payload, provider)
    const parsed = JSON.parse(normalizeJsonText(rawText)) as unknown
    return validator(parsed)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`${providerName} timed out. Please try a smaller request.`, { cause: error })
    }

    const message = error instanceof Error ? error.message : 'The AI request failed.'

    if (message.includes('Unexpected token') || message.includes('malformed')) {
      throw new Error('The AI returned malformed JSON. Please try again with a simpler prompt.', {
        cause: error,
      })
    }

    throw new Error(message, { cause: error })
  } finally {
    window.clearTimeout(timeout)
  }
}

export async function generateQuestions({
  type,
  count,
  setTitle,
  prompt,
  provider = getAiProvider(),
}: {
  type: QuestionType
  count: number
  setTitle?: string
  prompt?: string
  provider?: AiProvider
}): Promise<GeneratedQuestion[]> {
  const safeCount = Math.max(1, Math.min(5, Number.isFinite(count) ? Math.round(count) : 1))
  const basePrompt = [
    'Return valid JSON only. Do not add markdown fences or prose.',
    `Create exactly ${safeCount} ${type === 'mcq' ? 'multiple-choice' : 'essay'} questions`,
    setTitle ? `for the study set: “${setTitle}”` : 'for a revision quiz',
    'Each item must use this shape:',
    type === 'mcq'
      ? '{"type":"mcq","text":"...","options":["...","...","...","..."],"answerIndex":0}'
      : '{"type":"essay","text":"...","referenceAnswer":"..."}',
    'Keep the questions clear and suitable for short revision study.',
    prompt ? `Extra guidance: ${prompt}` : '',
    'Return a top-level object with a "questions" array.',
  ].join('\n')

  return callAi<GeneratedQuestion[]>(provider, basePrompt, (value) => validateGeneratedQuestions(value))
}

export async function gradeEssayAnswer({
  questionText,
  userAnswer,
  referenceAnswer,
  provider = getAiProvider(),
}: {
  questionText: string
  userAnswer: string
  referenceAnswer?: string
  provider?: AiProvider
}): Promise<EssayGradeResult> {
  const safeQuestion = ensureValidText(questionText, 'question text')
  const safeAnswer = ensureValidText(userAnswer, 'user answer')

  const prompt = [
    'Return valid JSON only. Do not add markdown fences or prose.',
    'Grade the learner answer against the question and optional reference answer.',
    `Question: ${safeQuestion}`,
    `Reference answer: ${referenceAnswer?.trim() || 'No reference answer was supplied.'}`,
    `Learner answer: ${safeAnswer}`,
    'Assess how complete and accurate the answer is.',
    'Return a top-level object with score, feedback, and missingPoints.',
    'score must be a number from 0 to 10, missingPoints should be max(0, 10 - score).',
  ].join('\n')

  return callAi<EssayGradeResult>(provider, prompt, (value) => validateEssayGradeResult(value))
}

export function describeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong while using AI.'
}
