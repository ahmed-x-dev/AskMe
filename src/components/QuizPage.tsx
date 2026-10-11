import { useMemo, useState } from 'react'
import { Link, useLoaderData, useParams, useSearchParams } from 'react-router'

import { buildQuizQueue, type QuizMode } from '../features/quiz'
import type { Question, QuizSet } from '../types/quiz'

function hasAnswered(question: Question, answer: string | number | undefined): boolean {
  if (answer === undefined) {
    return false
  }

  if (question.type === 'mcq') {
    return typeof answer === 'number'
  }

  return typeof answer === 'string' && answer.trim().length > 0
}

function isCorrect(question: Question, answer: string | number | undefined): boolean {
  if (question.type === 'mcq') {
    return typeof answer === 'number' && answer === question.answerIndex
  }

  return typeof answer === 'string' && answer.trim().length > 0
}

export function QuizPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const set = useLoaderData() as QuizSet | null
  const mode: QuizMode = (searchParams.get('mode') as QuizMode) ?? 'random'
  const queue = useMemo(() => buildQuizQueue(set, mode), [set, mode])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | number>>({})

  if (!set) {
    return (
      <section className="rounded-2xl bg-card p-5">
        <h2 className="text-[18px] font-medium leading-7 text-fg">Set not found</h2>
        <p className="mt-2 text-[16px] leading-6 text-muted">This quiz cannot be opened.</p>
        <Link
          to="/"
          className="mt-4 inline-flex min-h-12 items-center rounded-2xl bg-accent px-4 text-[16px] font-medium text-on-accent"
        >
          Back to sets
        </Link>
      </section>
    )
  }

  if (queue.length === 0) {
    return (
      <section className="rounded-2xl bg-card p-5 text-center">
        <h2 className="text-[18px] font-medium leading-7 text-fg">No questions available</h2>
        <p className="mt-2 text-[16px] leading-6 text-muted">
          Add at least one active question before starting a quiz.
        </p>
        <Link
          to={`/set/${set.id}`}
          className="mt-4 inline-flex min-h-12 items-center rounded-2xl bg-accent px-4 text-[16px] font-medium text-on-accent"
        >
          Return to set
        </Link>
      </section>
    )
  }

  const endScore = queue.reduce((total, question) => {
    const answer = answers[question.id]
    return total + (isCorrect(question, answer) ? 1 : 0)
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
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => {
              setCurrentIndex(0)
              setAnswers({})
            }}
            className="min-h-12 flex-1 rounded-2xl bg-accent px-4 text-[16px] font-medium text-on-accent transition duration-200 ease-out hover:opacity-90 active:scale-[0.98]"
          >
            Restart
          </button>
          <Link
            to={`/set/${id ?? set.id}`}
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
  const isAnswered = hasAnswered(currentQuestion, currentAnswer)
  const modeLabel = mode === 'mcq' ? 'MCQ only' : mode === 'essay' ? 'Essay only' : 'Random mix'

  return (
    <section className="rounded-2xl bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] leading-[18px] text-muted">Question</p>
          <p className="mt-1 text-[16px] font-medium leading-6 text-fg tabular-nums">
            {currentIndex + 1} of {queue.length}
          </p>
        </div>
        <span className="rounded-full bg-bg px-3 py-1 text-[13px] leading-[18px] text-muted">
          {modeLabel}
        </span>
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
              if (isAnswered) {
                return
              }
              setAnswers((previous) => ({ ...previous, [currentQuestion.id]: event.target.value }))
            }}
            rows={5}
            placeholder="Write your answer here…"
            className="min-h-[120px] w-full resize-y rounded-[14px] bg-bg px-3 py-3 text-[16px] leading-6 text-fg placeholder:text-muted"
          />
          <p className="mt-2 text-[13px] leading-[18px] text-muted">
            Essay grading is a stub for now; the score is based on having a response.
          </p>
        </div>
      )}

      {!isAnswered ? (
        <p className="mt-3 text-[13px] leading-[18px] text-muted">
          {currentQuestion.type === 'mcq'
            ? 'Choose an option to continue.'
            : 'Write an answer to continue.'}
        </p>
      ) : null}

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => setCurrentIndex((previous) => Math.min(previous + 1, queue.length))}
          className="min-h-12 flex-1 rounded-2xl bg-accent px-4 text-[16px] font-medium text-on-accent transition duration-200 ease-out hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!isAnswered}
        >
          {currentIndex === queue.length - 1 ? 'Finish' : 'Next'}
        </button>
        <Link
          to={`/set/${set.id}`}
          className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-bg px-4 text-[16px] font-medium text-fg transition-colors hover:bg-card"
        >
          Exit
        </Link>
      </div>
    </section>
  )
}
