'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { addQuestion, softDeleteQuestion, updateQuestion } from '../data/repository'
import type { Question, QuestionType, QuizSet } from '../types/quiz'
import { useQuizSet } from '../hooks/useQuizSet'

const EMPTY_OPTIONS = ['', '', '', '']

function sanitizeText(value: string): string {
  return value.trim()
}

function QuestionEditorForm({
  set,
  existingQuestion,
}: {
  set: QuizSet
  existingQuestion?: Question
}) {
  const [activeType, setActiveType] = useState<QuestionType>(existingQuestion?.type ?? 'mcq')
  const [text, setText] = useState(existingQuestion?.text ?? '')
  const [options, setOptions] = useState<string[]>(
    existingQuestion?.type === 'mcq' ? existingQuestion.options : EMPTY_OPTIONS,
  )
  const [answerIndex, setAnswerIndex] = useState<number>(
    existingQuestion?.type === 'mcq' ? existingQuestion.answerIndex : 0,
  )
  const [referenceAnswer, setReferenceAnswer] = useState(
    existingQuestion?.type === 'essay' ? existingQuestion.referenceAnswer ?? '' : '',
  )
  const [errorMessage, setErrorMessage] = useState('')
  const router = useRouter()

  const handleOptionChange = (index: number, nextValue: string) => {
    setOptions((current) => {
      const nextOptions = [...current]
      nextOptions[index] = nextValue
      return nextOptions
    })
  }

  const handleSave = async () => {
    const cleanedText = sanitizeText(text)

    if (!cleanedText) {
      setErrorMessage('Question text is required.')
      return
    }

    if (activeType === 'mcq') {
      const trimmedOptions = options.map((option) => option.trim())
      const uniqueOptions = new Set(trimmedOptions)

      if (trimmedOptions.some((option) => !option)) {
        setErrorMessage('All four options must be filled in.')
        return
      }

      if (uniqueOptions.size !== trimmedOptions.length) {
        setErrorMessage('Options must be unique.')
        return
      }

      if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex > 3) {
        setErrorMessage('Pick the correct answer index.')
        return
      }

      const nextQuestion: Question = {
        id: existingQuestion?.id ?? crypto.randomUUID(),
        type: 'mcq',
        text: cleanedText,
        updatedAt: new Date().toISOString(),
        deleted: false,
        options: [trimmedOptions[0], trimmedOptions[1], trimmedOptions[2], trimmedOptions[3]] as [
          string,
          string,
          string,
          string,
        ],
        answerIndex,
      }

      const savedSet = existingQuestion
        ? await updateQuestion(set.id, existingQuestion.id, nextQuestion)
        : await addQuestion(set.id, nextQuestion)

      if (savedSet) {
        router.push(`/set/${set.id}`)
      }
      return
    }

    const nextQuestion: Question = {
      id: existingQuestion?.id ?? crypto.randomUUID(),
      type: 'essay',
      text: cleanedText,
      updatedAt: new Date().toISOString(),
      deleted: false,
      referenceAnswer: sanitizeText(referenceAnswer) || undefined,
    }

    const savedSet = existingQuestion
      ? await updateQuestion(set.id, existingQuestion.id, nextQuestion)
      : await addQuestion(set.id, nextQuestion)

    if (savedSet) {
      router.push(`/set/${set.id}`)
    }
  }

  const handleDelete = async () => {
    if (!existingQuestion) {
      return
    }

    const confirmed = window.confirm(`Delete “${existingQuestion.text}”?`)
    if (!confirmed) {
      return
    }

    const updatedSet = await softDeleteQuestion(set.id, existingQuestion.id)
    if (updatedSet) {
      router.push(`/set/${set.id}`)
    }
  }

  return (
    <section className="rounded-2xl bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] leading-[18px] text-muted">
            {existingQuestion ? 'Edit question' : 'New question'}
          </p>
          <h2 className="mt-1 break-words text-[18px] font-medium leading-7 text-fg">{set.title}</h2>
        </div>
        <button
          type="button"
          onClick={() => router.push(`/set/${set.id}`)}
          className="min-h-12 shrink-0 rounded-2xl bg-bg px-3 text-[13px] font-medium text-fg transition-colors hover:bg-card"
        >
          Cancel
        </button>
      </div>

      <div className="mt-5 flex rounded-[14px] bg-bg p-1">
        <button
          type="button"
          onClick={() => setActiveType('mcq')}
          className={`min-h-12 flex-1 rounded-[14px] px-3 text-[16px] font-medium transition-colors ${
            activeType === 'mcq' ? 'bg-accent text-on-accent' : 'text-muted'
          }`}
        >
          MCQ
        </button>
        <button
          type="button"
          onClick={() => setActiveType('essay')}
          className={`min-h-12 flex-1 rounded-[14px] px-3 text-[16px] font-medium transition-colors ${
            activeType === 'essay' ? 'bg-accent text-on-accent' : 'text-muted'
          }`}
        >
          Essay
        </button>
      </div>

      <label htmlFor="question-text" className="mt-5 block text-[13px] font-medium leading-[18px] text-muted">
        Question
      </label>
      <textarea
        id="question-text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Type the question here…"
        className="mt-2 min-h-[120px] w-full resize-y rounded-[14px] bg-bg px-3 py-3 text-[16px] leading-6 text-fg placeholder:text-muted"
      />

      {activeType === 'mcq' ? (
        <div className="mt-5">
          <p className="mb-2 text-[13px] leading-[18px] text-muted">
            Select the correct answer from the options.
          </p>
          <div className="grid gap-3">
            {['A', 'B', 'C', 'D'].map((option, index) => (
              <div key={option} className="flex min-h-12 items-center gap-3 rounded-[14px] bg-bg px-3 py-2">
                <button
                  type="button"
                  onClick={() => setAnswerIndex(index)}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-[13px] font-medium ${
                    answerIndex === index ? 'bg-accent text-on-accent' : 'bg-card text-muted'
                  }`}
                  aria-label={`Mark option ${index + 1} as correct answer`}
                  aria-pressed={answerIndex === index}
                >
                  {option}
                </button>
                <input
                  type="text"
                  aria-label={`Option ${index + 1}`}
                  value={options[index] ?? ''}
                  onChange={(event) => handleOptionChange(index, event.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="w-full bg-transparent text-[16px] text-fg placeholder:text-muted"
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <label htmlFor="reference-answer" className="block text-[13px] font-medium leading-[18px] text-muted">
            Reference answer (optional)
          </label>
          <textarea
            id="reference-answer"
            value={referenceAnswer}
            onChange={(event) => setReferenceAnswer(event.target.value)}
            placeholder="Add a model answer…"
            className="mt-2 min-h-[96px] w-full resize-y rounded-[14px] bg-bg px-3 py-3 text-[16px] leading-6 text-fg placeholder:text-muted"
          />
        </div>
      )}

      {errorMessage ? (
        <p role="alert" className="mt-4 flex items-start gap-2 text-[13px] leading-[18px] text-bad-fg">
          <span aria-hidden="true" className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-bad-bg font-medium">
            !
          </span>
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => void handleSave()}
          className="min-h-12 flex-1 rounded-2xl bg-accent px-4 text-[16px] font-medium text-on-accent transition duration-200 ease-out hover:opacity-90 active:scale-[0.98]"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => router.push(`/set/${set.id}`)}
          className="min-h-12 flex-1 rounded-2xl bg-bg px-4 text-[16px] font-medium text-fg transition-colors hover:bg-card"
        >
          Back
        </button>
      </div>

      {existingQuestion ? (
        <button
          type="button"
          onClick={() => void handleDelete()}
          className="mt-4 min-h-12 w-full rounded-2xl bg-bg px-4 text-[16px] font-medium text-bad-fg transition-colors hover:bg-bad-bg"
        >
          Delete question
        </button>
      ) : null}
    </section>
  )
}

export function QuestionEditorPage({ setId, qid }: { setId: string; qid?: string }) {
  const router = useRouter()
  const { set, isLoading, errorMessage } = useQuizSet(setId)
  const existingQuestion = useMemo(
    () => set?.questions.find((question) => question.id === qid && !question.deleted),
    [qid, set],
  )

  if (!set) {
    if (isLoading) {
      return <p role="status" className="text-[16px] leading-6 text-muted">Loading question…</p>
    }

    return (
      <section className="rounded-2xl bg-card p-4">
        <h2 className="text-[18px] font-medium leading-7 text-fg">
          {errorMessage ? 'Could not load set' : 'Set not found'}
        </h2>
        <p role={errorMessage ? 'alert' : undefined} className="mt-2 text-[16px] leading-6 text-muted">
          {errorMessage ?? 'This question cannot be edited.'}
        </p>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="mt-4 min-h-12 rounded-2xl bg-accent px-4 text-[16px] font-medium text-on-accent"
        >
          Back to sets
        </button>
      </section>
    )
  }

  return <QuestionEditorForm key={qid ?? 'new'} set={set} existingQuestion={existingQuestion} />
}
