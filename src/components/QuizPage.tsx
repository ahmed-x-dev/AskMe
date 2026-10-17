'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'

import {
  describeError,
  explainQuestionAnswer,
  gradeEssayAnswer,
} from '../features/ai'
import {
  buildQuizQueue,
  formatElapsedTime,
  type QuizMode,
  type QuizQuestionType,
} from '../features/quiz'
import { getAiProvider, hasAiApiKey } from '../platform/secureStorage'
import type { Question, QuestionDifficulty } from '../types/quiz'
import { useQuizSet } from '../hooks/useQuizSet'

function hasAnswered(
  question: Question,
  answer: string | number | undefined,
  essayResult: boolean | undefined,
): boolean {
  if (question.type === 'mcq') {
    return typeof answer === 'number'
  }

  return essayResult !== undefined
}

function isCorrect(
  question: Question,
  answer: string | number | undefined,
  essayResult: boolean | undefined,
): boolean {
  if (question.type === 'mcq') {
    return typeof answer === 'number' && answer === question.answerIndex
  }

  return essayResult === true
}

export function QuizPage({ setId, mode }: { setId: string; mode: QuizMode }) {
  const { set, isLoading, errorMessage } = useQuizSet(setId)
  const [questionType, setQuestionType] = useState<QuizQuestionType>(
    mode === 'random' ? 'all' : mode,
  )
  const [difficulty, setDifficulty] = useState<QuestionDifficulty | 'all'>('all')
  const [countMode, setCountMode] = useState<'all' | 'limited'>('all')
  const [questionLimit, setQuestionLimit] = useState(2)
  const queue = useMemo(
    () => buildQuizQueue(set, 'random', {
      questionType,
      difficulty,
      limit: countMode === 'limited' ? questionLimit : undefined,
    }),
    [set, questionType, difficulty, countMode, questionLimit],
  )
  const matchingQuestionCount =
    set?.questions.filter(
      (question) =>
        !question.deleted &&
        (questionType === 'all' || question.type === questionType) &&
        (difficulty === 'all' || question.difficulty === difficulty),
    ).length ?? 0
  const activeQuestionCount =
    set?.questions.filter((question) => !question.deleted).length ?? 0

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isQuizStarted, setIsQuizStarted] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | number>>({})
  const [essayResults, setEssayResults] = useState<Record<string, boolean>>({})
  const [revealedReferences, setRevealedReferences] = useState<Record<string, boolean>>({})
  const [aiGrade, setAiGrade] = useState<{
    questionId: string
    answer: string
    score: number
    feedback: string
    missingPoints: number
  } | null>(null)
  const [aiMessage, setAiMessage] = useState<{ kind: 'error' | 'success'; message: string } | null>(null)
  const [aiExplanation, setAiExplanation] = useState<{ questionId: string; text: string } | null>(null)
  const [aiExplanationMessage, setAiExplanationMessage] = useState<string | null>(null)
  const [isAiGrading, setIsAiGrading] = useState(false)
  const [isAiExplaining, setIsAiExplaining] = useState(false)
  const startedAt = useRef<number | null>(null)
  const aiGradingRequestId = useRef(0)
  const aiExplanationRequestId = useRef(0)

  useEffect(() => {
    if (!isQuizStarted || currentIndex >= queue.length || startedAt.current === null) {
      return
    }

    const startTime = startedAt.current
    const updateElapsedTime = () => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000))
    }
    updateElapsedTime()
    const intervalId = window.setInterval(updateElapsedTime, 1000)

    return () => window.clearInterval(intervalId)
  }, [isQuizStarted, currentIndex, queue.length])

  const startQuiz = () => {
    if (queue.length === 0) {
      return
    }

    setCurrentIndex(0)
    setAnswers({})
    setEssayResults({})
    setRevealedReferences({})
    setAiGrade(null)
    setAiMessage(null)
    setAiExplanation(null)
    setAiExplanationMessage(null)
    setElapsedSeconds(0)
    startedAt.current = Date.now()
    setIsQuizStarted(true)
  }

  const handleGradeEssay = async () => {
    const currentQuestion = queue[currentIndex]
    if (!currentQuestion || currentQuestion.type !== 'essay') {
      return
    }

    const rawAnswer = answers[currentQuestion.id]
    const answerText = typeof rawAnswer === 'string' ? rawAnswer : ''
    if (!answerText.trim()) {
      setAiMessage({
        kind: 'error',
        message: 'Write an answer before asking the AI to grade it.',
      })
      return
    }

    const activeProvider = getAiProvider()

    if (!hasAiApiKey(activeProvider)) {
      setAiMessage({
        kind: 'error',
        message: `Add a ${activeProvider === 'openai' ? 'OpenAI' : 'Gemini'} API key in Settings before grading essays.`,
      })
      return
    }

    setIsAiGrading(true)
    setAiMessage(null)
    const requestId = ++aiGradingRequestId.current

    try {
      const grade = await gradeEssayAnswer({
        questionText: currentQuestion.text,
        userAnswer: answerText,
        referenceAnswer: currentQuestion.referenceAnswer,
        provider: activeProvider,
      })

      if (aiGradingRequestId.current === requestId) {
        setAiGrade({ ...grade, questionId: currentQuestion.id, answer: answerText })
        setAiMessage({
          kind: 'success',
          message: `AI score: ${grade.score}/10 — ${grade.feedback}`,
        })
      }
    } catch (error) {
      if (aiGradingRequestId.current === requestId) {
        setAiMessage({
          kind: 'error',
          message: describeError(error),
        })
      }
    } finally {
      if (aiGradingRequestId.current === requestId) {
        setIsAiGrading(false)
      }
    }
  }

  const handleExplainAnswer = async () => {
    const currentQuestion = queue[currentIndex]
    if (!currentQuestion) {
      return
    }

    const activeProvider = getAiProvider()
    if (!hasAiApiKey(activeProvider)) {
      setAiExplanationMessage(
        `Add a ${activeProvider === 'openai' ? 'OpenAI' : 'Gemini'} API key in Settings before requesting an explanation.`,
      )
      return
    }

    setIsAiExplaining(true)
    setAiExplanationMessage(null)
    const requestId = ++aiExplanationRequestId.current

    try {
      const explanation = await explainQuestionAnswer({
        question: currentQuestion,
        userAnswer: answers[currentQuestion.id],
        provider: activeProvider,
      })

      if (aiExplanationRequestId.current === requestId) {
        setAiExplanation({ questionId: currentQuestion.id, text: explanation })
      }
    } catch (error) {
      if (aiExplanationRequestId.current === requestId) {
        setAiExplanationMessage(describeError(error))
      }
    } finally {
      if (aiExplanationRequestId.current === requestId) {
        setIsAiExplaining(false)
      }
    }
  }

  const advanceToNextQuestion = () => {
    aiGradingRequestId.current += 1
    aiExplanationRequestId.current += 1
    setIsAiGrading(false)
    setIsAiExplaining(false)
    setAiGrade(null)
    setAiMessage(null)
    setAiExplanation(null)
    setAiExplanationMessage(null)
    if (currentIndex === queue.length - 1 && startedAt.current !== null) {
      setElapsedSeconds(Math.floor((Date.now() - startedAt.current) / 1000))
    }
    setCurrentIndex((previous) => Math.min(previous + 1, queue.length))
  }

  if (!set) {
    if (isLoading) {
      return <p role="status" className="text-[16px] leading-6 text-muted">Loading quiz…</p>
    }

    return (
      <section className="rounded-2xl bg-card p-5">
        <h2 className="text-[18px] font-medium leading-7 text-fg">
          {errorMessage ? 'Could not load set' : 'Set not found'}
        </h2>
        <p role={errorMessage ? 'alert' : undefined} className="mt-2 text-[16px] leading-6 text-muted">
          {errorMessage ?? 'This quiz cannot be opened.'}
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex min-h-12 items-center rounded-2xl bg-accent px-4 text-[16px] font-medium text-on-accent"
        >
          Back to sets
        </Link>
      </section>
    )
  }

  if (activeQuestionCount === 0) {
    return (
      <section className="rounded-2xl bg-card p-5 text-center">
        <h2 className="text-[18px] font-medium leading-7 text-fg">No questions available</h2>
        <p className="mt-2 text-[16px] leading-6 text-muted">
          Add at least one active question before starting a quiz.
        </p>
        <Link
          href={`/set/${set.id}`}
          className="mt-4 inline-flex min-h-12 items-center rounded-2xl bg-accent px-4 text-[16px] font-medium text-on-accent"
        >
          Return to set
        </Link>
      </section>
    )
  }

  if (!isQuizStarted) {
    const questionTypes: { value: QuizQuestionType; label: string }[] = [
      { value: 'all', label: 'MCQ + Essay' },
      { value: 'mcq', label: 'MCQ only' },
      { value: 'essay', label: 'Essay only' },
    ]
    const difficulties: { value: QuestionDifficulty | 'all'; label: string }[] = [
      { value: 'all', label: 'All' },
      { value: 'easy', label: 'Easy' },
      { value: 'medium', label: 'Medium' },
      { value: 'hard', label: 'Hard' },
    ]

    return (
      <section className="rounded-2xl bg-card p-4">
        <h2 className="text-[22px] font-medium leading-7 text-fg">Set up your quiz</h2>

        <fieldset className="mt-5">
          <legend className="text-[13px] font-medium leading-[18px] text-muted">Question type</legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {questionTypes.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={questionType === option.value}
                onClick={() => setQuestionType(option.value)}
                className={`min-h-12 rounded-[14px] px-2 text-[13px] font-medium transition-colors ${
                  questionType === option.value ? 'bg-accent text-on-accent' : 'bg-bg text-muted'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-5">
          <legend className="text-[13px] font-medium leading-[18px] text-muted">Difficulty</legend>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {difficulties.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={difficulty === option.value}
                onClick={() => setDifficulty(option.value)}
                className={`min-h-12 rounded-[14px] px-2 text-[13px] font-medium transition-colors ${
                  difficulty === option.value ? 'bg-accent text-on-accent' : 'bg-bg text-muted'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-5">
          <legend className="text-[13px] font-medium leading-[18px] text-muted">Question count</legend>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              aria-pressed={countMode === 'all'}
              onClick={() => setCountMode('all')}
              className={`min-h-12 flex-1 rounded-[14px] px-3 text-[13px] font-medium ${
                countMode === 'all' ? 'bg-accent text-on-accent' : 'bg-bg text-muted'
              }`}
            >
              All ({matchingQuestionCount})
            </button>
            <button
              type="button"
              aria-pressed={countMode === 'limited'}
              onClick={() => setCountMode('limited')}
              className={`min-h-12 flex-1 rounded-[14px] px-3 text-[13px] font-medium ${
                countMode === 'limited' ? 'bg-accent text-on-accent' : 'bg-bg text-muted'
              }`}
            >
              Choose a number
            </button>
          </div>
          {countMode === 'limited' ? (
            <label className="mt-3 flex min-h-12 items-center justify-between gap-3 rounded-[14px] bg-bg px-3 text-[13px] text-muted">
              Number of questions
              <input
                type="number"
                min={1}
                value={questionLimit}
                onChange={(event) => {
                  const nextLimit = Number(event.target.value)
                  setQuestionLimit(Number.isFinite(nextLimit) ? Math.max(1, Math.floor(nextLimit)) : 1)
                }}
                className="w-20 rounded-[14px] bg-card px-3 py-2 text-center text-[16px] text-fg"
              />
            </label>
          ) : null}
        </fieldset>

        {matchingQuestionCount === 0 ? (
          <p role="status" className="mt-4 text-[13px] leading-[18px] text-muted">
            No questions match these filters. Choose another type or difficulty.
          </p>
        ) : countMode === 'limited' ? (
          <p className="mt-3 text-[13px] leading-[18px] text-muted">
            This quiz will include {queue.length} of {matchingQuestionCount} matching questions.
          </p>
        ) : null}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled={queue.length === 0}
            onClick={startQuiz}
            className="min-h-12 flex-1 rounded-2xl bg-accent px-4 text-[16px] font-medium text-on-accent transition duration-200 ease-out hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Start quiz
          </button>
          <Link
            href={`/set/${set.id}`}
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-bg px-4 text-[16px] font-medium text-fg transition-colors hover:bg-card"
          >
            Back to set
          </Link>
        </div>
      </section>
    )
  }

  const endScore = queue.reduce((total, question) => {
    const answer = answers[question.id]
    return total + (isCorrect(question, answer, essayResults[question.id]) ? 1 : 0)
  }, 0)

  if (currentIndex >= queue.length) {
    const scorePercent = Math.round((endScore / queue.length) * 100)

    return (
      <section className="rounded-2xl bg-card p-5">
        <div className="text-center">
          <p className="text-[13px] leading-[18px] text-muted">Quiz complete</p>
          <h2 className="mt-2 text-[22px] font-medium leading-[28px] text-fg">Your score</h2>
          <div className="mt-5 rounded-2xl bg-bg px-4 py-6">
            <p className="text-[40px] font-medium leading-[44px] text-accent-text tabular-nums">
              {endScore} / {queue.length}
            </p>
            <p className="mt-2 text-[16px] leading-6 text-muted">{scorePercent}% correct</p>
            <p className="mt-2 text-[16px] leading-6 text-muted">
              Time taken: <span className="tabular-nums">{formatElapsedTime(elapsedSeconds)}</span>
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => {
              aiGradingRequestId.current += 1
              aiExplanationRequestId.current += 1
              startedAt.current = Date.now()
              setElapsedSeconds(0)
              setCurrentIndex(0)
              setAnswers({})
              setEssayResults({})
              setRevealedReferences({})
              setAiGrade(null)
              setAiMessage(null)
              setAiExplanation(null)
              setAiExplanationMessage(null)
            }}
            className="min-h-12 flex-1 rounded-2xl bg-accent px-4 text-[16px] font-medium text-on-accent transition duration-200 ease-out hover:opacity-90 active:scale-[0.98]"
          >
            Restart
          </button>
          <Link
            href={`/set/${setId}`}
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-bg px-4 text-[16px] font-medium text-fg transition-colors hover:bg-card"
          >
            Back to set
          </Link>
        </div>
      </section>
    )
  }

  const progress = ((currentIndex + 1) / queue.length) * 100
  const currentQuestion = queue[currentIndex]
  const currentAnswer = answers[currentQuestion.id]
  const currentEssayResult = essayResults[currentQuestion.id]
  const isAnswered = hasAnswered(currentQuestion, currentAnswer, currentEssayResult)
  const hasRevealedReference =
    currentQuestion.type === 'essay' && revealedReferences[currentQuestion.id] === true
  const modeLabel =
    questionType === 'all'
      ? 'MCQ + Essay'
      : questionType === 'mcq'
        ? 'MCQ only'
        : 'Essay only'

  return (
    <section className="rounded-2xl bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] leading-[18px] text-muted">Question</p>
          <p className="mt-1 text-[16px] font-medium leading-6 text-fg tabular-nums">
            {currentIndex + 1} of {queue.length}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <span className="rounded-full bg-bg px-3 py-1 text-[13px] leading-[18px] text-muted">
            {modeLabel}
          </span>
          <span
            role="timer"
            aria-label={`Elapsed time ${formatElapsedTime(elapsedSeconds)}`}
            className="rounded-full bg-bg px-3 py-1 text-[13px] leading-[18px] text-muted tabular-nums"
          >
            {formatElapsedTime(elapsedSeconds)}
          </span>
        </div>
      </div>

      <div
        role="progressbar"
        aria-label="Quiz progress"
        aria-valuemin={0}
        aria-valuemax={queue.length}
        aria-valuenow={currentIndex + 1}
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-bg"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-5 rounded-2xl bg-bg p-4">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[13px] font-medium ${
            currentQuestion.type === 'mcq' ? 'bg-ok-bg text-ok-fg' : 'bg-essay-bg text-essay-fg'
          }`}
        >
          {currentQuestion.type === 'mcq' ? 'MCQ' : 'Essay'}
        </span>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="rounded-full bg-card px-2.5 py-1 text-[13px] font-medium text-muted">
            Difficulty: {currentQuestion.difficulty[0].toUpperCase() + currentQuestion.difficulty.slice(1)}
          </span>
          {currentQuestion.tags.map((tag) => (
            <span
              key={`${currentQuestion.id}-${tag}`}
              className="rounded-full bg-card px-2.5 py-1 text-[13px] font-medium text-muted"
            >
              {tag}
            </span>
          ))}
        </div>
        <p className="mt-3 break-words text-[18px] font-medium leading-7 text-fg">{currentQuestion.text}</p>
      </div>

      {currentQuestion.type === 'mcq' ? (
        <div className="mt-5 grid gap-3">
          {currentQuestion.options.map((option, optionIndex) => {
            const selected = currentAnswer === optionIndex
            const revealRightAnswer = isAnswered && optionIndex === currentQuestion.answerIndex
            const revealWrongAnswer = isAnswered && selected && optionIndex !== currentQuestion.answerIndex

            return (
              <button
                key={`${currentQuestion.id}-${optionIndex}`}
                type="button"
                disabled={isAnswered}
                onClick={() => {
                  if (isAnswered) {
                    return
                  }
                  aiExplanationRequestId.current += 1
                  setIsAiExplaining(false)
                  setAiExplanation(null)
                  setAiExplanationMessage(null)
                  setAnswers((previous) => ({ ...previous, [currentQuestion.id]: optionIndex }))
                }}
                className={`flex min-h-12 items-center gap-3 rounded-[14px] px-3 py-3 text-left text-[16px] leading-6 transition-colors ${
                  revealRightAnswer
                    ? 'bg-ok-bg text-ok-fg'
                    : revealWrongAnswer
                      ? 'bg-bad-bg text-bad-fg'
                      : selected
                        ? 'border-2 border-accent bg-card text-fg'
                        : 'bg-card text-fg'
                }`}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-bg text-[13px] font-medium text-muted">
                  {String.fromCharCode(65 + optionIndex)}
                </span>
                <span className="flex-1">{option}</span>
                {revealRightAnswer && <span aria-hidden="true">✓</span>}
                {revealWrongAnswer && <span aria-hidden="true">✕</span>}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="mt-5">
          <textarea
            value={typeof currentAnswer === 'string' ? currentAnswer : ''}
            onChange={(event) => {
              if (hasRevealedReference || isAnswered) {
                return
              }
              aiGradingRequestId.current += 1
              aiExplanationRequestId.current += 1
              setIsAiGrading(false)
              setIsAiExplaining(false)
              setAnswers((previous) => ({ ...previous, [currentQuestion.id]: event.target.value }))
              setAiGrade(null)
              setAiMessage(null)
              setAiExplanation(null)
              setAiExplanationMessage(null)
            }}
            disabled={hasRevealedReference}
            rows={5}
            placeholder="Write your answer here, or think it through…"
            className="min-h-[120px] w-full resize-y rounded-[14px] bg-bg px-3 py-3 text-[16px] leading-6 text-fg placeholder:text-muted"
          />

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => void handleGradeEssay()}
              disabled={isAiGrading || !String(currentAnswer ?? '').trim()}
              className="min-h-12 flex-1 rounded-2xl bg-bg px-3 text-[13px] font-medium text-fg transition-colors hover:bg-card disabled:cursor-wait disabled:opacity-70"
            >
              {isAiGrading ? 'Grading…' : 'AI grade'}
            </button>
            <button
              type="button"
              onClick={() =>
                setRevealedReferences((previous) => ({ ...previous, [currentQuestion.id]: true }))
              }
              className="min-h-12 flex-1 rounded-2xl bg-accent px-3 text-[13px] font-medium text-on-accent transition duration-200 ease-out hover:opacity-90"
            >
              Reveal reference
            </button>
          </div>

          {aiGrade?.questionId === currentQuestion.id && aiGrade.answer === currentAnswer ? (
            <div className="mt-3 rounded-[14px] bg-bg p-3" aria-live="polite">
              <p className="text-[13px] font-medium leading-[18px] text-muted">AI grading</p>
              <p className="mt-1 text-[16px] font-medium leading-6 text-fg">
                {aiGrade.score}/10 • missing points: {aiGrade.missingPoints}
              </p>
              <p className="mt-1 text-[15px] leading-5 text-muted">{aiGrade.feedback}</p>
            </div>
          ) : null}

          {aiMessage ? (
            <p
              role={aiMessage.kind === 'error' ? 'alert' : 'status'}
              className={`mt-3 text-[13px] leading-[18px] ${
                aiMessage.kind === 'error' ? 'text-bad-fg' : 'text-accent-text'
              }`}
            >
              {aiMessage.message}
            </p>
          ) : null}

          <p className="mt-2 text-[13px] leading-[18px] text-muted">
            Compare your answer with the reference, then mark yourself right or wrong.
          </p>
        </div>
      )}

      <div className="mt-4">
        <button
          type="button"
          onClick={() => void handleExplainAnswer()}
          disabled={isAiExplaining}
          className="min-h-12 w-full rounded-2xl bg-bg px-4 text-[16px] font-medium text-fg transition-colors hover:bg-card disabled:cursor-wait disabled:opacity-70"
        >
          {isAiExplaining ? 'Explaining…' : 'Explain answer with AI'}
        </button>
        {aiExplanationMessage ? (
          <p role="alert" className="mt-2 text-[13px] leading-[18px] text-bad-fg">
            {aiExplanationMessage}
          </p>
        ) : null}
        {aiExplanation?.questionId === currentQuestion.id ? (
          <div className="mt-3 rounded-[14px] bg-bg p-3" aria-live="polite">
            <p className="text-[13px] font-medium leading-[18px] text-muted">AI explanation</p>
            <p className="mt-1 whitespace-pre-wrap text-[16px] leading-6 text-fg">
              {aiExplanation.text}
            </p>
          </div>
        ) : null}
      </div>

      {hasRevealedReference && currentQuestion.type === 'essay' ? (
        <>
          <div className="mt-4 rounded-[14px] bg-bg p-4" aria-live="polite">
            <p className="text-[13px] font-medium leading-[18px] text-muted">Reference answer</p>
            <p className="mt-2 whitespace-pre-wrap break-words text-[16px] leading-6 text-fg">
              {currentQuestion.referenceAnswer?.trim() ||
                'No reference answer was added for this question.'}
            </p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={isAnswered}
              onClick={() =>
                setEssayResults((previous) => ({ ...previous, [currentQuestion.id]: true }))
              }
              className={`min-h-12 rounded-[14px] px-3 text-[15px] font-medium leading-5 transition duration-200 ease-out active:scale-[0.98] disabled:cursor-not-allowed ${
                isAnswered && currentEssayResult !== true
                  ? 'bg-card text-muted opacity-60'
                  : 'bg-ok-bg text-ok-fg'
              }`}
            >
              <span aria-hidden="true">✓ </span>I got it right
            </button>
            <button
              type="button"
              disabled={isAnswered}
              onClick={() =>
                setEssayResults((previous) => ({ ...previous, [currentQuestion.id]: false }))
              }
              className={`min-h-12 rounded-[14px] px-3 text-[15px] font-medium leading-5 transition duration-200 ease-out active:scale-[0.98] disabled:cursor-not-allowed ${
                isAnswered && currentEssayResult !== false
                  ? 'bg-card text-muted opacity-60'
                  : 'bg-bad-bg text-bad-fg'
              }`}
            >
              <span aria-hidden="true">✕ </span>I got it wrong
            </button>
          </div>
        </>
      ) : null}

      {!isAnswered ? (
        <p className="mt-3 text-[13px] leading-[18px] text-muted">
          {currentQuestion.type === 'mcq'
            ? 'Choose an option to continue.'
            : hasRevealedReference
              ? 'Mark your answer to continue.'
              : 'Think through your answer, then reveal the reference.'}
        </p>
      ) : null}

      <div className="mt-6 flex gap-3">
        {currentQuestion.type === 'essay' && !hasRevealedReference ? (
          <button
            type="button"
            onClick={() =>
              setRevealedReferences((previous) => ({ ...previous, [currentQuestion.id]: true }))
            }
            className="min-h-12 flex-1 rounded-2xl bg-accent px-4 text-[16px] font-medium text-on-accent transition duration-200 ease-out hover:opacity-90 active:scale-[0.98]"
          >
            Reveal reference
          </button>
        ) : currentQuestion.type === 'mcq' || isAnswered ? (
          <button
            type="button"
            onClick={advanceToNextQuestion}
            className="min-h-12 flex-1 rounded-2xl bg-accent px-4 text-[16px] font-medium text-on-accent transition duration-200 ease-out hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!isAnswered}
          >
            {currentIndex === queue.length - 1 ? 'Finish' : 'Next'}
          </button>
        ) : null}
        <Link
          href={`/set/${set.id}`}
          className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-bg px-4 text-[16px] font-medium text-fg transition-colors hover:bg-card"
        >
          Exit
        </Link>
      </div>
    </section>
  )
}
